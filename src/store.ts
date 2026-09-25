import {collection,doc,getDocs,setDoc,writeBatch} from 'firebase/firestore';
import {db} from './firebase';
import type {RecordItem} from './data';
// Firestore rejects undefined values; optional form fields are omitted on save.
const clean=(item:RecordItem):RecordItem=>Object.fromEntries(Object.entries(item).filter(([,value])=>value!==undefined)) as RecordItem;
export async function listRecords():Promise<RecordItem[]>{const snapshot=await getDocs(collection(db,'records'));return snapshot.docs.map(d=>d.data() as RecordItem)}
export async function putRecord(item:RecordItem){await setDoc(doc(db,'records',item.id),clean(item))}
export async function deleteProjectRecords(projectId:string,linked:{id:string,kind:string}[],contacts:RecordItem[]){const batch=writeBatch(db);for(const item of [{id:projectId,kind:'project'},...linked])batch.set(doc(db,'records',item.id),{...item,deleted:true});for(const contact of contacts)batch.set(doc(db,'records',contact.id),clean(contact));await batch.commit()}
export async function importRecords(items:RecordItem[]){for(let i=0;i<items.length;i+=400){const batch=writeBatch(db);for(const item of items.slice(i,i+400))batch.set(doc(db,'records',item.id),clean(item));await batch.commit()}}
