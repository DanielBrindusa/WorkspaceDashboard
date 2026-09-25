import type {RecordItem} from './data';
export const nextCalendarDay=(date:string)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)};
export function calendarEvent(item:RecordItem,date:string,labelId:string){
 return {
  summary:`${item.kind==='followup'||item.status==='Waiting'?'Follow up':'Deadline'}: ${item.name||'Untitled'}`,
  description:[item.projectId?`Project ID: ${item.projectId}`:'',(item.kind==='followup'||item.status==='Waiting')&&item.waitingFor?`Waiting for: ${item.waitingFor}`:'',`WorkspaceDashboard item: ${item.id}`].filter(Boolean).join('\n'),
  start:{date},end:{date:nextCalendarDay(date)},
  reminders:{useDefault:false,overrides:[]},
  eventLabelId:labelId,
  extendedProperties:{private:{workspaceRecordId:item.id}}
 };
}
