import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {decodeImage,extract,validateElements,elementId} from './image.mjs';
import {processingOptions,processingReport} from '../shared/processing.mjs';
import {alphaInfo,materialDetails} from './materials.mjs';
export class Store {
  constructor(root){this.root=path.resolve(root);}
  async init(){await mkdir(this.root,{recursive:true});this.db=new DatabaseSync(path.join(this.root,'studio.sqlite'));this.db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS folders(id TEXT PRIMARY KEY,title TEXT NOT NULL,created TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS uis(id TEXT PRIMARY KEY,folder_id TEXT NOT NULL,title TEXT NOT NULL,latest INTEGER NOT NULL,updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS versions(ui_id TEXT NOT NULL,number INTEGER NOT NULL,json TEXT NOT NULL,PRIMARY KEY(ui_id,number));
    CREATE TABLE IF NOT EXISTS ui_preferences(ui_id TEXT PRIMARY KEY,json TEXT NOT NULL);`);
    if(!this.db.prepare('SELECT id FROM folders LIMIT 1').get())this.createFolder('我的 UI 合集');return this;}
  createFolder(title){const id=`GROUP-${randomBytes(4).toString('hex')}`;this.db.prepare('INSERT INTO folders VALUES(?,?,?)').run(id,String(title||'新合集').slice(0,100),new Date().toISOString());return {id};}
  folders(){return this.db.prepare('SELECT f.*,COUNT(u.id) AS count FROM folders f LEFT JOIN uis u ON u.folder_id=f.id AND u.latest>0 GROUP BY f.id ORDER BY f.created').all();}
  list(folder){return this.db.prepare('SELECT * FROM uis WHERE folder_id=? AND latest>0 ORDER BY updated DESC').all(folder).map(u=>({...u,...this.version(u.id)}));}
  ui(id){const u=this.db.prepare('SELECT * FROM uis WHERE id=?').get(id);if(!u)throw Object.assign(new Error('找不到这个 UI ID'),{status:404});return u;}
  preferences(id){this.ui(id);const row=this.db.prepare('SELECT json FROM ui_preferences WHERE ui_id=?').get(id);return processingOptions(row?JSON.parse(row.json):{});}
  setPreferences(id,value){const next=processingOptions({...this.preferences(id),...value});this.db.prepare('INSERT INTO ui_preferences VALUES(?,?) ON CONFLICT(ui_id) DO UPDATE SET json=excluded.json').run(id,JSON.stringify(next));return next;}
  version(id,number){const u=this.ui(id),n=number?Number(number):u.latest;const v=this.db.prepare('SELECT json FROM versions WHERE ui_id=? AND number=?').get(id,n);if(!v)throw Object.assign(new Error('版本不存在'),{status:404});return JSON.parse(v.json);}
  history(id){this.ui(id);return this.db.prepare('SELECT json FROM versions WHERE ui_id=? ORDER BY number DESC').all(id).map(v=>{const m=JSON.parse(v.json);return {version:m.version,note:m.note,created:m.created,source:m.source,count:m.elements.length,original:m.original};});}
  file(url){const rel=String(url).replace(/^\/media\//,'');const p=path.resolve(this.root,rel);if(!p.startsWith(this.root+path.sep))throw new Error('文件路径不合法');return p;}
  async create({folder,title,image}){if(!this.db.prepare('SELECT id FROM folders WHERE id=?').get(folder))throw new Error('合集不存在');const id=`UI-${randomBytes(4).toString('hex')}`;
    const decoded=await decodeImage(image);this.db.prepare('INSERT INTO uis VALUES(?,?,?,?,?)').run(id,folder,String(title||'未命名 UI').slice(0,100),0,new Date().toISOString());
    try{return await this.publish(id,{expectedVersion:0,note:'上传原始 UI',source:'网页上传',elements:[]},decoded);}catch(e){this.db.prepare('DELETE FROM uis WHERE id=? AND latest=0').run(id);throw e;}}
  async publish(id,input,decoded){const ui=this.ui(id);if(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==ui.latest)throw Object.assign(new Error('已有新版本，请先同步后再提交'),{status:409});
    const prev=ui.latest?this.version(id):null,processing=processingOptions({...this.preferences(id),...input.processing});
    if(!decoded)decoded=input.image?await decodeImage(input.image):{png:await readFile(this.file(prev.original)),width:prev.width,height:prev.height};
    const incoming=input.elements===undefined?(prev?.elements||[]):input.elements;
    const clean=validateElements(incoming,decoded.width,decoded.height);
    const imported=input.materials||[];if(!Array.isArray(imported)||imported.length>100)throw new Error('一次最多导入 100 个素材');
    const unchangedPixels=!input.image&&!imported.length&&clean.every(e=>{const old=prev?.elements.find(p=>p.id===e.id);return old&&(old.kind==='imported'||JSON.stringify(old.rect)===JSON.stringify(e.rect)&&old.removeBackground===e.removeBackground&&old.tolerance===e.tolerance)});
    const report=processingReport(input.processingReport??(unchangedPixels?prev?.processingReport:undefined));
    const number=ui.latest+1,token=`v${number}-${randomBytes(5).toString('hex')}`,directory=path.join(this.root,id,token),base=`/media/${id}/${token}`;
    await mkdir(directory,{recursive:true});await writeFile(path.join(directory,'original.png'),decoded.png);
    const elements=[];
    for(const e of clean){
      const old=prev?.elements.find(v=>v.id===e.id);
      // Imported transparent assets have no crop recipe. Carry their bytes forward.
      const png=old?.kind==='imported'&&!input.image?await readFile(this.file(old.url)):await extract(decoded.png,e.rect,e.removeBackground,e.tolerance);
      const details=materialDetails(e,old),alpha=await alphaInfo(png);
      if(details.role==='component'&&processing.transparentComponents&&!alpha.hasTransparency)throw new Error(`素材“${e.name}”没有实际透明像素，请先去背景；完整底图应标记为背景层。`);
      if(details.role==='component'&&!alpha.hasVisiblePixels)throw new Error(`素材“${e.name}”完全透明，请调整选区或去背景容差。`);
      await writeFile(path.join(directory,`${e.id}.png`),png);elements.push({...e,...details,alpha,...(old?.kind==='imported'&&!input.image?{kind:'imported',pixelWidth:old.pixelWidth,pixelHeight:old.pixelHeight}:{kind:'crop'}),url:`${base}/${e.id}.png`});
    }
    for(const m of imported){const asset=await decodeImage(m.image),eid=m.id||elementId();if(!/^EL-[a-f0-9]{8}$/.test(eid)||elements.some(e=>e.id===eid))throw new Error('导入素材 ID 不合法或重复');
      const rect=m.rect||{x:0,y:0,width:Math.min(asset.width,decoded.width),height:Math.min(asset.height,decoded.height)};validateElements([{id:eid,rect}],decoded.width,decoded.height);
      const details=materialDetails(m),alpha=await alphaInfo(asset.png);
      if(details.role==='component'&&processing.transparentComponents&&!alpha.hasTransparency)throw new Error(`素材“${m.name||eid}”没有实际透明像素。请先去背景；完整底图需明确标记 role=background。`);
      if(details.role==='component'&&!alpha.hasVisiblePixels)throw new Error(`素材“${m.name||eid}”完全透明，没有可见内容`);
      await writeFile(path.join(directory,`${eid}.png`),asset.png);elements.push({id:eid,name:String(m.name||'导入素材').slice(0,100),rect,kind:'imported',...details,alpha,removeBackground:false,tolerance:30,pixelWidth:asset.width,pixelHeight:asset.height,url:`${base}/${eid}.png`});}
    const manifest={schema:'imageos.ui/v1',id,title:ui.title,folder:ui.folder_id,version:number,created:new Date().toISOString(),note:String(input.note||'更新素材').slice(0,1000),source:String(input.source||'本地 Codex').slice(0,50),processing,processingReport:report,width:decoded.width,height:decoded.height,original:`${base}/original.png`,elements};
    this.db.exec('BEGIN IMMEDIATE');try{if(this.ui(id).latest!==input.expectedVersion)throw Object.assign(new Error('提交冲突，请先同步最新版本'),{status:409});
      this.db.prepare('INSERT INTO versions VALUES(?,?,?)').run(id,number,JSON.stringify(manifest));this.db.prepare('UPDATE uis SET latest=?,updated=? WHERE id=?').run(number,manifest.created,id);this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}return manifest;
  }
  async restore(id,version,expectedVersion){const m=this.version(id,version),png=await readFile(this.file(m.original));
    const materials=await Promise.all(m.elements.filter(e=>e.kind==='imported').map(async e=>({...e,image:(await readFile(this.file(e.url))).toString('base64')})));
    return this.publish(id,{expectedVersion,note:`恢复自 v${m.version}`,source:'版本恢复',processing:m.processing||{},processingReport:m.processingReport,elements:m.elements.filter(e=>e.kind!=='imported'),materials},{png,width:m.width,height:m.height});}
}
