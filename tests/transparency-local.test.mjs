import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {createApp} from '../server/index.mjs';
import {DEFAULT_PROCESSING,splitInstructions} from '../shared/processing.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),work=path.resolve(root,'../../work');await mkdir(work,{recursive:true});
const opaque=await sharp({create:{width:80,height:80,channels:4,background:'#3678c8'}}).png().toBuffer();
const pixels=Buffer.alloc(20*20*4);for(let y=5;y<15;y++)for(let x=5;x<15;x++){const i=(y*20+x)*4;pixels[i]=200;pixels[i+1]=50;pixels[i+2]=100;pixels[i+3]=255;}
const transparent=await sharp(pixels,{raw:{width:20,height:20,channels:4}}).png().toBuffer();
async function fixture(options={}){const dir=await mkdtemp(path.join(work,'ui-requirements-test-')),opened=[];const app=await createApp({dataDir:path.join(dir,'data'),exportRoot:path.join(dir,'exports'),openDirectory:async p=>opened.push(p),production:true,...options});const http=app.listen(0,'127.0.0.1');await new Promise(r=>http.once('listening',r));const url=`http://127.0.0.1:${http.address().port}`;const call=async(route,body)=>{const res=await fetch(url+'/api'+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:res.status,data:await res.json()}};const folders=(await call('/folders')).data;const original=(await call('/ui',{folder:folders[0].id,title:'真实透明与本地保存',image:opaque.toString('base64')})).data;
  return {dir,app,opened,url,call,id:original.id,original,close:async()=>{await new Promise(r=>http.close(r));app.locals.store.db.close()}};}
const material={name:'透明奖品',image:transparent.toString('base64'),role:'component',method:'ai-inpainting',generatedBy:'test-fixture',prompt:'透明测试素材，不调用生成服务'};
test('default requirements, true alpha validation and automatic independent local folder',async()=>{const f=await fixture();try{
  const context=(await f.call(`/ui/${f.id}/context`)).data;assert.deepEqual(context.requirements,DEFAULT_PROCESSING);assert.equal(context.localExport,null);assert.match(splitInstructions(context.requirements),/补绘被文字/);assert.match(splitInstructions(context.requirements),/打开素材文件夹/);
  const bad=await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,materials:[{name:'伪透明PNG',image:opaque.toString('base64'),role:'component'}],elements:[]});assert.equal(bad.status,400);assert.match(bad.data.error,/没有实际透明像素/);assert.equal((await f.call(`/ui/${f.id}`)).data.version,1);
  const empty=await sharp({create:{width:10,height:10,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();assert.equal((await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,elements:[],materials:[{name:'空图',image:empty.toString('base64')}]})).status,400);
  const res=await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,elements:[],materials:[material,{name:'完整底图',role:'background',method:'ai-inpainting',image:opaque.toString('base64')}],processingReport:{inpainting:'completed',notes:'补绘状态由处理方明确提交'}});assert.equal(res.status,201);const m=res.data;assert.equal(m.version,2);assert.equal(m.elements[0].alpha.transparentPixels,300);assert.equal(m.elements[0].alpha.opaquePixels,100);assert.equal(m.elements[1].role,'background');assert.equal(m.elements[1].alpha.hasTransparency,false);assert.equal(m.processingReport.inpainting,'completed');
  const delivery=(await f.call(`/ui/${f.id}/local?version=2`)).data;assert.equal(delivery.status,'saved');assert.equal(delivery.opened,true);assert.equal(f.opened[0],delivery.directory);assert.equal(delivery.assetCount,2);
  for(const file of ['manifest.json','catalog.json','preview.png','original.png','README.md'])assert.ok((await stat(path.join(delivery.directory,file))).isFile());
  const manifest=JSON.parse(await readFile(path.join(delivery.directory,'manifest.json'),'utf8'));assert.equal(manifest.elements[0].generatedBy,'test-fixture');assert.equal(manifest.elements[0].method,'ai-inpainting');assert.ok((await sharp(await readFile(path.join(delivery.directory,manifest.elements[0].file))).ensureAlpha().raw().toBuffer()).equals(pixels));
  await writeFile(path.join(delivery.directory,'用户备注.txt'),'保留我');const another=(await f.call(`/ui/${f.id}/local`,{version:2,open:false})).data;assert.notEqual(another.directory,delivery.directory);assert.equal(f.opened.length,1);assert.equal(await readFile(path.join(delivery.directory,'用户备注.txt'),'utf8'),'保留我');
  assert.equal((await f.call(`/ui/${f.id}/local/open`,{version:2,exportId:'does-not-exist',directory:'C:/Windows'})).status,404);assert.equal(f.opened.length,1);
  const opened=(await f.call(`/ui/${f.id}/local/open`,{version:2})).data;assert.equal(opened.opened,true);assert.equal(f.opened.at(-1),another.directory);
  assert.deepEqual((await f.call(`/ui/${f.id}?version=1`)).data,f.original);
  const renamed=await f.call(`/ui/${f.id}/versions`,{expectedVersion:2,elements:m.elements.map(e=>({...e,name:e.name+' 已命名'})),note:'只调整名称'});assert.equal(renamed.status,201);assert.equal(renamed.data.processingReport.inpainting,'completed');assert.equal(renamed.data.elements[0].method,'ai-inpainting');
}finally{await f.close()}});
test('processing preferences persist independently of historical snapshots',async()=>{const f=await fixture();try{
  const prefs=(await f.call(`/ui/${f.id}/preferences`,{inpaintOccluded:false,openLocal:false})).data;assert.equal(prefs.inpaintOccluded,false);assert.equal(prefs.openLocal,false);assert.equal(prefs.removeBackground,true);
  const res=await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,elements:[],materials:[material]});assert.equal(res.status,201);assert.equal(res.data.processing.inpaintOccluded,false);assert.equal(res.data.processingReport.inpainting,'unverified');assert.equal((await f.call(`/ui/${f.id}/local`)).data.status,'saved');assert.equal(f.opened.length,0);
  assert.equal((await f.call(`/ui/${f.id}?version=1`)).data.processing.inpaintOccluded,true);assert.equal((await f.call(`/ui/${f.id}/preferences`,{openLocal:'yes'})).status,400);
}finally{await f.close()}});
test('open failure preserves successful local output and reports the failure',async()=>{const f=await fixture({openDirectory:async()=>{throw new Error('测试：系统未能打开文件夹')}});try{
  const res=await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,elements:[],materials:[material]});assert.equal(res.status,201);const delivery=(await f.call(`/ui/${f.id}/local`)).data;assert.equal(delivery.status,'saved');assert.equal(delivery.opened,false);assert.match(delivery.openError,/系统未能打开/);assert.ok((await stat(delivery.directory)).isDirectory());
  f.app.locals.localExports.opener=async()=>{};const retried=(await f.call(`/ui/${f.id}/local/open`,{version:2})).data;assert.equal(retried.opened,true);assert.equal(retried.openError,undefined);assert.equal((await f.call(`/ui/${f.id}/local`)).data.opened,true);
}finally{await f.close()}});
test('local save failure is explicit and does not roll back committed version',async()=>{const f=await fixture();try{
  const blocked=path.join(f.dir,'not-a-directory');await writeFile(blocked,'occupied');f.app.locals.localExports.root=blocked;
  const res=await f.call(`/ui/${f.id}/versions`,{expectedVersion:1,elements:[],materials:[material]});assert.equal(res.status,201);const delivery=(await f.call(`/ui/${f.id}/local`)).data;assert.equal(delivery.status,'failed');assert.ok(delivery.error);assert.equal((await f.call(`/ui/${f.id}`)).data.version,2);assert.equal(f.opened.length,0);
}finally{await f.close()}});
