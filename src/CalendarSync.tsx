import {useState} from 'react';
import {GoogleAuthProvider,reauthenticateWithPopup} from 'firebase/auth';
import {auth} from './firebase';
import type {RecordItem} from './data';
import {calendarEvent} from './calendarEvent';

type Label={id:string;name?:string;backgroundColor?:string};
type Calendar={id:string;summary:string;accessRole?:string};
const api='https://www.googleapis.com/calendar/v3';
async function request<T>(url:string,token:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,...(init?.body?{'Content-Type':'application/json'}:{})}});
 if(!response.ok){let detail='';try{detail=(await response.json()).error?.message||''}catch{}throw new Error(detail||`Google Calendar returned ${response.status}.`)}
 if(response.status===204)return undefined as T;
 return response.json() as Promise<T>;
}
export default function CalendarSync({item,onSynced}:{item:RecordItem;onSynced:(change:Partial<RecordItem>)=>Promise<void>}){
 const [token,setToken]=useState(''),[localEventId,setLocalEventId]=useState(''),[calendar,setCalendar]=useState<Calendar|null>(null),[labels,setLabels]=useState<Label[]>([]),[labelId,setLabelId]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const date=item.kind==='task'&&item.status==='Waiting'?item.followUp||item.due:item.due;
 if(!date)return null;
 const connect=async()=>{
  if(!auth.currentUser)throw new Error('Sign in with Google first.');
  const provider=new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
  const result=await reauthenticateWithPopup(auth.currentUser,provider);
  const accessToken=GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if(!accessToken)throw new Error('Google did not grant Calendar access.');
  const list=await request<{items?:Calendar[]}>(`${api}/users/me/calendarList?maxResults=250`,accessToken);
  const found=list.items?.find(c=>c.summary==='WorkspaceDashboard'&&['owner','writer'].includes(c.accessRole||''));
  if(!found)throw new Error('No writable calendar named “WorkspaceDashboard” was found in this Google account.');
  const details=await request<{labelProperties?:{eventLabels?:Label[]}}>(`${api}/calendars/${encodeURIComponent(found.id)}`,accessToken);
  setToken(accessToken);setCalendar(found);setLabels(details.labelProperties?.eventLabels||[]);setLabelId(item.calendarLabelId||'');
  setMessage('Calendar connected. Choose a label, then save the event.');
 };
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await action()}catch(e){setMessage(e instanceof Error?e.message:'Calendar request failed.')}finally{setBusy(false)}};
 const save=async()=>{
  if(!calendar||!token||!date)return;
  const body=calendarEvent(item,date,labelId);
  const eventId=localEventId||(item.calendarId===calendar.id?item.calendarEventId:'');
  const existing=Boolean(eventId);
  const url=`${api}/calendars/${encodeURIComponent(calendar.id)}/events${existing?`/${encodeURIComponent(eventId!)}`:''}?eventLabelVersion=1&sendUpdates=none`;
  const event=await request<{id:string;htmlLink?:string}>(url,token,{method:existing?'PATCH':'POST',body:JSON.stringify(body)});
  setLocalEventId(event.id);
  await onSynced({calendarId:calendar.id,calendarEventId:event.id,calendarLabelId:labelId||undefined,calendarUrl:event.htmlLink});
  setMessage('Saved to WorkspaceDashboard calendar with notifications and reminders off.');
 };
 const remove=async()=>{if(!calendar||!token||!item.calendarEventId||item.calendarId!==calendar.id)return;await request<void>(`${api}/calendars/${encodeURIComponent(calendar.id)}/events/${encodeURIComponent(item.calendarEventId)}?sendUpdates=none`,token,{method:'DELETE'});await onSynced({calendarId:undefined,calendarEventId:undefined,calendarLabelId:undefined,calendarUrl:undefined});setLocalEventId('');setMessage('Calendar event removed.');};
 return <div className="calendar-sync"><strong>Google Calendar</strong><span>{item.calendarEventId?'Event linked · ':'Add this date to the '}WorkspaceDashboard calendar. No reminders or event notifications.</span>{!calendar?<button className="outline" disabled={busy} onClick={()=>run(connect)}>{busy?'Connecting…':'Connect calendar'}</button>:<><label>Event label <select aria-label={`Calendar label for ${item.name}`} value={labelId} onChange={e=>setLabelId(e.target.value)}><option value="">No label</option>{labels.map((l,i)=><option key={l.id} value={l.id}>{l.name||`Unnamed label ${i+1} · ${l.backgroundColor||'no color'}`}</option>)}</select>{labelId&&labels.find(l=>l.id===labelId)?.backgroundColor&&<span className="calendar-label-preview"><i style={{background:labels.find(l=>l.id===labelId)?.backgroundColor}}/>Selected label</span>}</label><button className="outline" disabled={busy} onClick={()=>run(save)}>{busy?'Saving…':item.calendarEventId?'Update calendar event':'Add to calendar'}</button></>}{item.calendarUrl&&<a className="textlink" href={item.calendarUrl} target="_blank" rel="noreferrer">Open event ↗</a>}{calendar&&item.calendarEventId&&item.calendarId===calendar.id&&<button className="outline" disabled={busy} onClick={()=>run(remove)}>Remove event</button>}{calendar&&<button className="outline" disabled={busy} onClick={()=>run(connect)}>Reconnect</button>}{message&&<span role="status" className="calendar-message">{message}</span>}</div>;
}
