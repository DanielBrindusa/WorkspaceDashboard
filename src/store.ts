import {collection,doc,getDoc,getDocs,runTransaction,serverTimestamp,setDoc,writeBatch} from 'firebase/firestore';
import {db} from './firebase';
import type {RecordItem} from './data';
import {nextDailyTask} from './workspaceLogic';
const clean=(item:RecordItem):RecordItem=>Object.fromEntries(Object.entries(item).filter(([,value])=>value!==undefined)) as RecordItem;
const record=(workspaceUid:string,id:string)=>doc(db,'workspaces',workspaceUid,'records',id);
export async function listRecords(workspaceUid:string):Promise<RecordItem[]>{const snapshot=await getDocs(collection(db,'workspaces',workspaceUid,'records'));return snapshot.docs.map(d=>d.data() as RecordItem)}
export async function putRecord(workspaceUid:string,item:RecordItem){await setDoc(record(workspaceUid,item.id),clean(item))}
export async function deleteProjectRecords(workspaceUid:string,projectId:string,linked:{id:string,kind:string}[],contacts:RecordItem[]){const batch=writeBatch(db);for(const item of [{id:projectId,kind:'project'},...linked])batch.set(record(workspaceUid,item.id),{...item,deleted:true});for(const contact of contacts)batch.set(record(workspaceUid,contact.id),clean(contact));await batch.commit()}
export async function importRecords(workspaceUid:string,items:RecordItem[]){for(let i=0;i<items.length;i+=400){const batch=writeBatch(db);for(const item of items.slice(i,i+400))batch.set(record(workspaceUid,item.id),clean(item));await batch.commit()}}
export async function completeTask(workspaceUid:string,task:RecordItem,completedOn:string):Promise<RecordItem|null>{
 const done=clean({...task,status:'Done',completed:completedOn,updatedAt:new Date().toISOString()});
 const next=nextDailyTask(task,completedOn);
 return runTransaction(db,async tx=>{
  const currentRef=record(workspaceUid,task.id);
  const current=await tx.get(currentRef);
  if(!current.exists())throw new Error('The task no longer exists. Refresh and try again.');
  if(current.data().status==='Done')throw new Error('This task was already completed. Refresh to see the latest changes.');
  const nextRef=next?record(workspaceUid,next.id):null;
  const existing=nextRef?await tx.get(nextRef):null;
  tx.set(currentRef,done);
  if(next&&nextRef&&!existing?.exists())tx.set(nextRef,clean(next));
  return next&&!existing?.exists()?next:null;
 });
}
export async function deleteFolderRecords(workspaceUid:string,folderId:string,projects:RecordItem[]){
 for(let i=0;i<projects.length;i+=400){const batch=writeBatch(db);for(const project of projects.slice(i,i+400))batch.set(record(workspaceUid,project.id),clean({...project,groupId:undefined}));await batch.commit()}
 await setDoc(record(workspaceUid,folderId),{id:folderId,kind:'folder',deleted:true});
}
export async function migrateLegacyOwnerRecords(ownerUid:string):Promise<number>{
 const marker=doc(db,'workspaces',ownerUid,'meta','legacyMigration');
 if((await getDoc(marker)).exists())return 0;
 const existing=await getDocs(collection(db,'records'));
 const items=existing.docs.map(d=>d.data() as RecordItem);
 await importRecords(ownerUid,items);
 await setDoc(marker,{doneAt:serverTimestamp(),recordCount:items.length});
 return items.length;
}
