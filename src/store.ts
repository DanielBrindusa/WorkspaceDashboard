import {collection,doc,getDocs,runTransaction,setDoc,writeBatch} from 'firebase/firestore';
import {db} from './firebase';
import type {RecordItem} from './data';
import {nextDailyTask} from './workspaceLogic';
// Firestore rejects undefined values; optional form fields are omitted on save.
const clean=(item:RecordItem):RecordItem=>Object.fromEntries(Object.entries(item).filter(([,value])=>value!==undefined)) as RecordItem;
export async function listRecords():Promise<RecordItem[]>{const snapshot=await getDocs(collection(db,'records'));return snapshot.docs.map(d=>d.data() as RecordItem)}
export async function putRecord(item:RecordItem){await setDoc(doc(db,'records',item.id),clean(item))}
export async function deleteProjectRecords(projectId:string,linked:{id:string,kind:string}[],contacts:RecordItem[]){const batch=writeBatch(db);for(const item of [{id:projectId,kind:'project'},...linked])batch.set(doc(db,'records',item.id),{...item,deleted:true});for(const contact of contacts)batch.set(doc(db,'records',contact.id),clean(contact));await batch.commit()}
export async function importRecords(items:RecordItem[]){for(let i=0;i<items.length;i+=400){const batch=writeBatch(db);for(const item of items.slice(i,i+400))batch.set(doc(db,'records',item.id),clean(item));await batch.commit()}}
export async function completeTask(task:RecordItem,completedOn:string):Promise<RecordItem|null>{
 const done=clean({...task,status:'Done',completed:completedOn,updatedAt:new Date().toISOString()});
 const next=nextDailyTask(task,completedOn);
 return runTransaction(db,async tx=>{
  const currentRef=doc(db,'records',task.id);
  const current=await tx.get(currentRef);
  if(!current.exists())throw new Error('The task no longer exists. Refresh and try again.');
  if(current.data().status==='Done')throw new Error('This task was already completed. Refresh to see the latest changes.');
  const nextRef=next?doc(db,'records',next.id):null;
  const existing=nextRef?await tx.get(nextRef):null;
  tx.set(currentRef,done);
  if(next&&nextRef&&!existing?.exists())tx.set(nextRef,clean(next));
  return next&&!existing?.exists()?next:null;
 });
}
export async function deleteFolderRecords(folderId:string,projects:RecordItem[]){
 for(let i=0;i<projects.length;i+=400){const batch=writeBatch(db);for(const project of projects.slice(i,i+400))batch.set(doc(db,'records',project.id),clean({...project,groupId:undefined}));await batch.commit()}
 await setDoc(doc(db,'records',folderId),{id:folderId,kind:'folder',deleted:true});
}
