import {randomBytes,createHash} from 'node:crypto';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
export class Tasks {
 constructor(db){this.db=db;db.exec("CREATE TABLE IF NOT EXISTS workflow_tasks(id TEXT PRIMARY KEY,ui_id TEXT NOT NULL,created TEXT NOT NULL,json TEXT NOT NULL);CREATE INDEX IF NOT EXISTS workflow_tasks_ui_version ON workflow_tasks(ui_id,json_extract(json,'$.version'))");}
 make(input){return {id:'SPLIT-'+randomBytes(8).toString('hex'),created:new Date().toISOString(),status:'queued',...input};}
 save(task){if(!/^(?:SPLIT|AI)-[a-f0-9]{16}$/.test(task.id)||!/^UI-[a-f0-9]{8}$/.test(task.uiId))throw fail('任务 ID 或 UI ID 不合法');const next={...task,updated:new Date().toISOString()};this.db.prepare('INSERT INTO workflow_tasks VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(next.id,next.uiId,next.created,JSON.stringify(next));return next;}
 create(input){return this.save(this.make(input));}
 get(id){if(!/^(?:SPLIT|AI)-[a-f0-9]{16}$/.test(id||''))throw fail('拆分任务 ID 不合法');const row=this.db.prepare('SELECT json FROM workflow_tasks WHERE id=?').get(id);if(!row)throw fail('找不到这个拆分任务 ID',404);return JSON.parse(row.json);}
 forUI(id,uiId,baseVersion,targetId){const task=this.get(id);if(task.uiId!==uiId||task.baseVersion!==baseVersion||targetId!==undefined&&task.targetId!==targetId)throw fail('任务 ID 与原 UI、素材或版本不一致',409);return task;}
 list(uiId){return this.db.prepare('SELECT json FROM workflow_tasks WHERE ui_id=? ORDER BY created DESC,rowid DESC LIMIT 100').all(uiId).map(row=>JSON.parse(row.json));}
 forVersion(uiId,version){const row=this.db.prepare("SELECT json FROM workflow_tasks WHERE ui_id=? AND json_extract(json,'$.version')=? ORDER BY created DESC LIMIT 1").get(uiId,Number(version));return row?JSON.parse(row.json):null;}
 indexHistory(){for(const row of this.db.prepare('SELECT json FROM versions').all()){const m=JSON.parse(row.json),id=m.taskId||'SPLIT-'+createHash('sha256').update(m.id+':'+m.version).digest('hex').slice(0,16);if(this.db.prepare('SELECT id FROM workflow_tasks WHERE id=?').get(id))continue;this.save({id,uiId:m.id,baseVersion:m.version-1,version:m.version,created:m.created,status:'completed',kind:m.version===1?'upload':'version',title:m.note,source:m.source,historical:!m.taskId,assets:m.elements.map(e=>({id:e.id,name:e.name,role:e.role}))});}}
}
