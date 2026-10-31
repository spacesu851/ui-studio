#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {readFile} from 'node:fs/promises';
import {api,getUI,getContext,pull,publishFiles,parseId,saveLocal,openLocal,getTask} from './client.mjs';
const {values,positionals}=parseArgs({allowPositionals:true,options:{id:{type:'string'},out:{type:'string'},version:{type:'string'},base:{type:'string'},note:{type:'string'},file:{type:'string',multiple:true},spec:{type:'string'},image:{type:'string'},inpainting:{type:'string'},'report-notes':{type:'string'},'no-open':{type:'boolean'},task:{type:'string'}}});
try{const action=positionals[0],id=values.id||positionals[1];let result;
  if(action==='task')result=await getTask(id);
  else if(action==='tasks')result=await api('/ui/'+parseId(id)+'/tasks');
  else if(action==='get'){if(parseId(id).startsWith('GROUP'))result=await api(`/folders/${parseId(id)}`);else {const m=await getUI(id,values.version);result={...m,context:await getContext(id,m.version)}}}
  else if(action==='pull')result=await pull(id,values.out||'.',values.version);
  else if(action==='history')result=await api(`/ui/${parseId(id)}/history`);
  else if(action==='save')result=await saveLocal(id,values.version,values['no-open']?false:undefined);
  else if(action==='open')result=await openLocal(id,values.version);
  else if(action==='publish'){
    const files=values.spec?JSON.parse(await readFile(values.spec,'utf8')):(values.file||[]);
    if(!files.length||!Number.isInteger(Number(values.base)))throw new Error('publish 需要 --base 版本号以及 --file PNG 或 --spec JSON');
    result=await publishFiles(id,{files,base:Number(values.base),note:values.note,inpainting:values.inpainting,reportNotes:values['report-notes'],taskId:values.task});
  }else if(action==='update'){
    if(!values.image||!Number.isInteger(Number(values.base)))throw new Error('update 需要 --image 图片与 --base 版本号');
    result=await api(`/ui/${parseId(id)}/versions`,{expectedVersion:Number(values.base),image:(await readFile(values.image)).toString('base64'),elements:[],note:values.note||'Codex 更新原图',source:'本地 Codex'});
  }else throw new Error('用法：node bridge/cli.mjs get|task|tasks|pull|history|publish|update|save|open --id UI链接 [--out 目录] [--base 1 --spec 素材清单.json --inpainting completed --note 说明]');
  console.log(JSON.stringify(result,null,2));
  if(result?.localExport?.status==='failed'||result?.localExport?.openError)process.exitCode=2;
}catch(e){console.error(e.message);process.exitCode=1;}
