import {doc,runTransaction} from 'firebase/firestore';
import {db} from './firebase';
import {FAVORITES_ID,upsertFavorite,removeFavorite,type FavoriteView} from './favorites';

// A single Firestore document enforces the five-view limit across devices.
const location=(workspaceUid:string|null)=>workspaceUid?doc(db,'workspaces',workspaceUid,'records',FAVORITES_ID):doc(db,'records',FAVORITES_ID);
async function update(workspaceUid:string|null,change:(views:FavoriteView[])=>FavoriteView[]):Promise<FavoriteView[]>{
 return runTransaction(db,async tx=>{
  const ref=location(workspaceUid);
  const snapshot=await tx.get(ref);
  const current=snapshot.data()?.favoriteViews;
  const views=Array.isArray(current)?current as FavoriteView[]:[];
  const next=change(views);
  tx.set(ref,{id:FAVORITES_ID,kind:'settings',favoriteViews:next,updatedAt:new Date().toISOString()});
  return next;
 });
}
export const saveFavorite=(workspaceUid:string|null,favorite:FavoriteView,replaceId?:string)=>update(workspaceUid,views=>upsertFavorite(views,favorite,replaceId));
export const deleteFavorite=(workspaceUid:string|null,id:string)=>update(workspaceUid,views=>removeFavorite(views,id));
