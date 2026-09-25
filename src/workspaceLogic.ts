import type {RecordItem} from './data';

export type ProjectWindow='All'|'Due today'|'Due this week'|'Due this month'|'Active today'|'Active this week'|'Active this month';
export type SortKey='None'|'Title'|'Importance'|'Due date';
export const projectWindows:ProjectWindow[]=['All','Due today','Due this week','Due this month','Active today','Active this week','Active this month'];
export const sortKeys:SortKey[]=['None','Title','Importance','Due date'];
const iso=(d:Date)=>d.toISOString().slice(0,10);
export function addDays(day:string,count:number){const d=new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+count);return iso(d)}
export function period(day:string,unit:'day'|'week'|'month'):{start:string,end:string}{
 if(unit==='day')return {start:day,end:day};
 const d=new Date(`${day}T12:00:00Z`);
 if(unit==='week'){const offset=(d.getUTCDay()+6)%7;return {start:addDays(day,-offset),end:addDays(day,6-offset)}}
 return {start:`${day.slice(0,7)}-01`,end:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0,12)))};
}
export function matchesProjectWindow(project:RecordItem,view:ProjectWindow,day:string):boolean{
 if(view==='All')return true;
 const unit=view.endsWith('week')?'week':view.endsWith('month')?'month':'day';
 const {start,end}=period(day,unit);
 if(view.startsWith('Due'))return Boolean(project.due&&project.due>=start&&project.due<=end);
 return Boolean(project.start&&project.due&&project.start<=end&&project.due>=start);
}
const importance=(p?:string)=>{const index=['Critical','High','Medium','Low'].indexOf(p||'');return index<0?4:index};
export function sortProjects(projects:RecordItem[],criteria:SortKey[]):RecordItem[]{
 const keys=[...new Set(criteria.filter((key):key is Exclude<SortKey,'None'>=>key!=='None'))];
 return [...projects].sort((a,b)=>{
  for(const key of keys){let n=0;
   if(key==='Title')n=(a.name||'').localeCompare(b.name||'',undefined,{sensitivity:'base'});
   if(key==='Importance')n=importance(a.priority)-importance(b.priority);
   if(key==='Due date')n=(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31');
   if(n)return n;
  }
  return (a.name||'').localeCompare(b.name||'',undefined,{sensitivity:'base'})||a.id.localeCompare(b.id);
 });
}
export function nextDailyTask(task:RecordItem,completedOn:string):RecordItem|null{
 if(task.kind!=='task'||task.recurrence!=='daily'||!task.recurrenceEnd)return null;
 const nextDue=addDays(completedOn,1);
 if(nextDue>task.recurrenceEnd)return null;
 const seriesId=task.seriesId||task.id;
 return {...task,id:`RCR_${seriesId}_${nextDue.replaceAll('-','')}`,seriesId,due:nextDue,created:completedOn,status:'To Do',completed:undefined,archived:false,deleted:false,updatedAt:new Date().toISOString()};
}
