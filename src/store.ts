import {collection,doc,getDocs,setDoc,writeBatch} from 'firebase/firestore';
import {db} from './firebase';
import type {RecordItem} from './data';
export async function listRecords():Promise<RecordItem[]>{const snapshot=await getDocs(collection(db,'records'));return snapshot.docs.map(d=>d.data() as RecordItem)}
export async function putRecord(item:RecordItem){await setDoc(doc(db,'records',item.id),item)}
export async function deleteProjectRecords(projectId:string,linked:{id:string,kind:string}[],contacts:RecordItem[]){const batch=writeBatch(db);for(const item of [{id:projectId,kind:'project'},...linked])batch.set(doc(db,'records',item.id),{...item,deleted:true});for(const contact of contacts)batch.set(doc(db,'records',contact.id),contact);await batch.commit()}
export async function importRecords(items:RecordItem[]){for(let i=0;i<items.length;i+=400){const batch=writeBatch(db);for(const item of items.slice(i,i+400))batch.set(doc(db,'records',item.id),item);await batch.commit()}}
