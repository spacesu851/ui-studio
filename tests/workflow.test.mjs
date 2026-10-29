import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {createApp} from '../server/index.mjs';
import {extract,detect} from '../server/image.mjs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const work=path.resolve(root,'../../work');await mkdir(work,{recursive:true});
const dir=await mkdtemp(path.join(work,'ui-studio-test-'));
const rgb=Buffer.alloc(300*420*4,255);
for(let y=60;y<150;y++)for(let x=50;x<250;x++){const p=(y*300+x)*4;rgb[p]=40;rgb[p+1]=120;rgb[p+2]=210;}
for(let y=240;y<320;y++)for(let x=80;x<220;x++){const p=(y*300+x)*4;rgb[p]=220;rgb[p+1]=60;rgb[p+2]=90;}
const image=await sharp(rgb,{raw:{width:300,height:420,channels:4}}).png().toBuffer();
await test('UI lifecycle, local Codex round trip, immutable history, conflicts and boundaries',async t=>{
  const app=await createApp({dataDir:path.join(dir,'data'),exportRoot:path.join(dir,'exports'),openDirectory:async()=>{},production:true});const http=app.listen(0,'127.0.0.1');await new Promise(r=>http.once('listening',r));
  const url=`http://127.0.0.1:${http.address().port}`;
  const call=async(route,body)=>{const r=await fetch(url+route,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:r.status,data:await r.json()};};
  let id,v1,v2,v3;
  try{
    await t.test('upload original and discover two real components',async()=>{
      const {data:folders}=await call('/api/folders');const c=await call('/api/ui',{folder:folders[0].id,title:'测试 UI',image:image.toString('base64')});assert.equal(c.status,201);v1=c.data;id=v1.id;assert.equal(v1.version,1);assert.equal(v1.elements.length,0);
      const {data:d}=await call(`/api/ui/${id}/detect`,{version:1});assert.equal(d.elements.length,2);assert.ok(d.elements.every(e=>e.rect.width>130));
      const p=await call(`/api/ui/${id}/versions`,{expectedVersion:1,elements:d.elements,note:'拆分两个按钮'});assert.equal(p.status,201);v2=p.data;assert.equal(v2.version,2);assert.equal(v2.elements.length,2);
      const bytes=Buffer.from(await (await fetch(url+v2.elements[0].url)).arrayBuffer());const meta=await sharp(bytes).metadata();assert.equal(meta.width,v2.elements[0].rect.width);
    });
    await t.test('reject stale writes and invalid selections without changing head',async()=>{
      assert.equal((await call(`/api/ui/${id}/versions`,{expectedVersion:1,elements:[]})).status,409);
      assert.equal((await call(`/api/ui/${id}/versions`,{expectedVersion:2,elements:[{id:'EL-12345678',rect:{x:-1,y:0,width:5,height:5}}]})).status,400);
      assert.equal((await call(`/api/ui/${id}`)).data.version,2);
    });
    await t.test('CLI pulls immutable image and publishes transparent material',async()=>{
      const file=path.join(dir,'transparent.png');const png=await sharp({create:{width:32,height:24,channels:4,background:{r:12,g:80,b:220,alpha:.4}}}).png().toBuffer();await writeFile(file,png);
      const command=promisify(execFile),env={...process.env,UI_STUDIO_URL:url};
      const p=await command(process.execPath,[path.join(root,'bridge/cli.mjs'),'pull','--id',url+'/ui/'+id,'--out',dir],{env});const pulled=JSON.parse(p.stdout);assert.ok((await readFile(path.join(pulled.directory,'original.png'))).equals(image));
      await command(process.execPath,[path.join(root,'bridge/cli.mjs'),'publish','--id',id,'--base','2','--file',file,'--note','Codex 回传透明 PNG'],{env});
      v3=(await call(`/api/ui/${id}`)).data;assert.equal(v3.version,3);assert.equal(v3.elements[0].kind,'imported');
      assert.ok(Buffer.from(await (await fetch(url+v3.elements[0].url)).arrayBuffer()).equals(png));
      const re=await call(`/api/ui/${id}/versions`,{expectedVersion:3,elements:v3.elements,note:'更改素材名'});assert.equal(re.data.elements[0].pixelWidth,32);
      assert.ok(Buffer.from(await (await fetch(url+re.data.elements[0].url)).arrayBuffer()).equals(png));
    });
    await t.test('restore appends history and leaves original snapshots unchanged',async()=>{
      const r=await call(`/api/ui/${id}/restore`,{version:2,expectedVersion:4});assert.equal(r.status,201);assert.equal(r.data.version,5);assert.equal(r.data.elements.length,2);
      assert.deepEqual((await call(`/api/ui/${id}?version=1`)).data,v1);assert.deepEqual((await call(`/api/ui/${id}?version=2`)).data,v2);
      assert.equal((await call(`/api/ui/${id}/history`)).data.length,5);
      const zip=await fetch(url+`/api/ui/${id}/export?version=3`);assert.equal(zip.status,200);const bytes=Buffer.from(await zip.arrayBuffer());assert.equal(bytes.subarray(0,2).toString(),'PK');
    });
    await t.test('MCP lists tools and retrieves same UI ID',async()=>{
      const client=new Client({name:'ui-studio-test',version:'1.0.0'});const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'bridge/mcp.mjs')],env:{...process.env,UI_STUDIO_URL:url}});
      try{await client.connect(transport);const list=await client.listTools();assert.equal(list.tools.length,7);const res=await client.callTool({name:'get_ui',arguments:{id}});const value=JSON.parse(res.content[0].text);assert.equal(value.version,5);assert.equal(value.context.requirements.inpaintOccluded,true);assert.equal(value.context.localExport.status,'saved');}finally{await client.close()}
    });
    await t.test('database stays private and off-origin browser writes fail',async()=>{
      assert.equal((await fetch(url+'/media/studio.sqlite')).status,404);
      assert.equal((await fetch(url+'/api/folders',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://outside.example'},body:JSON.stringify({title:'bad'})})).status,403);
    });
    await t.test('records survive reopening store',async()=>{app.locals.store.db.close();const {Store}=await import('../server/store.mjs');const s=await new Store(path.join(dir,'data')).init();assert.equal(s.version(id).version,5);s.db.close()});
  }finally{await new Promise(resolve=>http.close(resolve));}
});
await test('background removal preserves foreground and yields real alpha',async()=>{
  const png=await extract(image,{x:40,y:50,width:220,height:110},true,30);const {data,info}=await sharp(png).raw().toBuffer({resolveWithObject:true});assert.equal(info.channels,4);assert.equal(data[3],0);assert.equal(data[(30*220+30)*4+3],255);
});
