import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesProjectWindow,matchesTaskWindow,nextDailyTask,period,sortProjects,sortTasks} from './workspaceLogic.ts';
import {upsertFavorite,removeFavorite} from './favorites.ts';

test('weeks begin Monday and months include their last day',()=>{
 assert.deepEqual(period('2026-09-25','week'),{start:'2026-09-21',end:'2026-09-27'});
 assert.deepEqual(period('2026-09-25','month'),{start:'2026-09-01',end:'2026-09-30'});
 assert.deepEqual(period('2026-02-12','month'),{start:'2026-02-01',end:'2026-02-28'});
});
test('active project windows use interval overlap and due windows use due date',()=>{
 const project={id:'PRJ001',kind:'project',start:'2026-08-01',due:'2026-09-21'};
 assert.equal(matchesProjectWindow(project,'Active this week','2026-09-25'),true);
 assert.equal(matchesProjectWindow(project,'Active today','2026-09-25'),false);
 assert.equal(matchesProjectWindow(project,'Due this month','2026-09-25'),true);
 assert.equal(matchesProjectWindow(project,'Due today','2026-09-25'),false);
 assert.equal(matchesProjectWindow({id:'x',kind:'project',due:'2026-09-25'},'Active today','2026-09-25'),false);
});
test('sort levels break ties in order, with undated projects last',()=>{
 const rows=[{id:'a',kind:'project',name:'Beta',priority:'High',due:'2026-09-26'},{id:'b',kind:'project',name:'Alpha',priority:'Critical',due:'2026-09-26'},{id:'c',kind:'project',name:'Gamma',priority:'Critical',due:'2026-09-27'},{id:'d',kind:'project',name:'None',priority:'Low'}];
 assert.deepEqual(sortProjects(rows,['Due date','Importance','Title']).map(p=>p.id),['b','a','c','d']);
});
test('task due and active windows share calendar boundaries and support older creation dates',()=>{
 const task={id:'T1',kind:'task',created:'2026-09-01',due:'2026-09-27'};
 assert.equal(matchesTaskWindow(task,'Active today','2026-09-25'),true);
 assert.equal(matchesTaskWindow(task,'Due this week','2026-09-25'),true);
 assert.equal(matchesTaskWindow(task,'Due today','2026-09-25'),false);
 assert.equal(matchesTaskWindow({...task,start:'2026-09-28'},'Active this week','2026-09-25'),false);
 assert.equal(matchesTaskWindow({...task,due:undefined},'Active today','2026-09-25'),false);
 assert.equal(matchesTaskWindow({...task,due:'2026-10-01'},'Due this month','2026-09-25'),false);
});
test('task main, second and third sort criteria apply in order',()=>{
 const tasks=[{id:'t1',kind:'task',name:'Beta',priority:'High',due:'2026-09-26'},{id:'t2',kind:'task',name:'Alpha',priority:'Critical',due:'2026-09-26'},{id:'t3',kind:'task',name:'Later',priority:'Critical',due:'2026-09-27'}];
 assert.deepEqual(sortTasks(tasks,['Due date','Importance','Title']).map(t=>t.id),['t2','t1','t3']);
 assert.deepEqual(sortTasks(tasks,['Importance','Title','Due date']).map(t=>t.id),['t2','t3','t1']);
});
test('daily tasks generate once for next day through inclusive end date',()=>{
 const item={id:'TSK001',kind:'task',name:'Check inbox',status:'To Do',due:'2026-09-25',recurrence:'daily',recurrenceEnd:'2026-09-27'};
 const next=nextDailyTask(item,'2026-09-25');
 assert.equal(next?.due,'2026-09-26');
 assert.equal(next?.id,'RCR_TSK001_20260926');
 assert.equal(next?.status,'To Do');
 assert.equal(nextDailyTask({...item,due:'2026-09-27'},'2026-09-27'),null);
});
test('saved views never exceed five and replacement targets the selected view',()=>{
 const views=Array.from({length:5},(_,i)=>({id:`v${i}`,name:`View ${i}`,scope:'tasks',settings:{windowFilter:'All',folderFilter:'All',projectFilter:'All',sortLevels:['Due date','Importance','Title']}}));
 const replacement={...views[0],id:'new',name:'Work deadlines'};
 assert.throws(()=>upsertFavorite(views,replacement),/Five views/);
 assert.throws(()=>upsertFavorite(views,replacement,'missing'),/no longer available/);
 const updated=upsertFavorite(views,replacement,'v2');
 assert.equal(updated.length,5);
 assert.equal(updated[2].id,'new');
 assert.equal(updated[0].id,'v0');
 assert.equal(removeFavorite(updated,'new').length,4);
});

