import type {ProjectWindow,SortKey} from './workspaceLogic';
export type FavoriteView={
 id:string;
 name:string;
 scope:'projects'|'tasks';
 settings:{
  windowFilter:ProjectWindow;
  folderFilter:string;
  projectFilter:string;
  sortLevels:[SortKey,SortKey,SortKey];
  taskView?:string;
  search?:string;
  status?:string;
  area?:string;
  priority?:string;
 };
};
export const FAVORITES_ID='SETTINGS_FAVORITES';
export function upsertFavorite(views:FavoriteView[],favorite:FavoriteView,replaceId?:string):FavoriteView[]{
 if(!favorite.name.trim())throw new Error('Name this saved view.');
 if(views.length>5)throw new Error('Saved view limit exceeded.');
 if(replaceId){
  if(!views.some(v=>v.id===replaceId))throw new Error('The view to replace is no longer available. Refresh and try again.');
  return views.map(v=>v.id===replaceId?favorite:v);
 }
 if(views.length>=5)throw new Error('Five views are saved. Choose one to replace.');
 return [...views,favorite];
}
export function removeFavorite(views:FavoriteView[],id:string):FavoriteView[]{return views.filter(v=>v.id!==id)}
