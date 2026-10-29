import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import archiver from 'archiver';
import {Store} from './store.mjs';
import {detect,extract,validateElements} from './image.mjs';
import {LocalExports} from './local-exports.mjs';
import {inspectMaterials} from './materials.mjs';
import {AiSettings,OpenAiProvider} from './ai-provider.mjs';
import {AiJobs} from './ai-jobs.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
export async function createApp({dataDir=process.env.UI_STUDIO_DATA||path.join(root,'data'),exportRoot=process.env.UI_STUDIO_EXPORT_ROOT||path.join(root,'../ui-studio-exports'),openDirectory,production=false,aiEnvironment=process.env,aiProviderFactory=config=>new OpenAiProvider(config)}={}){
  const store=await new Store(dataDir).init(),app=express();
  const local=new LocalExports(store,exportRoot,openDirectory);
  const aiSettings=new AiSettings(store.db,aiEnvironment),aiJobs=new AiJobs(store,aiSettings,local,{providerFactory:aiProviderFactory});
  async function finishVersion(m){if(m.elements.length&&m.processing?.saveLocal)await local.create(m,{open:m.processing.openLocal});return m;}
  app.disable('x-powered-by');
  app.use((req,res,next)=>{const host=req.hostname;if(!['127.0.0.1','localhost','[::1]','::1'].includes(host))return res.status(403).json({error:'仅允许本机访问'});
    if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return res.status(403).json({error:'请求来源不匹配'});
    res.setHeader('X-Content-Type-Options','nosniff');next();});
  app.use('/api',express.json({limit:'32mb'}));
  app.get('/api/health',(req,res)=>res.json({ok:true,engine:'独立 AI 识别 + 透明提取 + 补绘 + 视觉质检',storage:'local',bridgeVersion:'3',aiConfigured:aiSettings.public().configured}));
  app.get('/api/ai/settings',(req,res)=>res.json(aiSettings.public()));
  app.post('/api/ai/settings',(req,res)=>res.json(aiSettings.update(req.body)));
  app.post('/api/ai/test',async(req,res)=>res.json(await aiProviderFactory(aiSettings.snapshot()).test()));
  app.get('/api/ui/:id/ai',(req,res)=>res.json(aiJobs.latest(req.params.id)));
  app.post('/api/ui/:id/ai',async(req,res)=>res.status(202).json(aiJobs.start(req.params.id,req.body)));
  app.get('/api/ai/jobs/:job',(req,res)=>res.json(aiJobs.get(req.params.job)));
  app.post('/api/ai/jobs/:job/cancel',(req,res)=>res.json(aiJobs.cancel(req.params.job)));
  app.post('/api/ai/jobs/:job/resume',(req,res)=>res.status(202).json(aiJobs.resume(req.params.job)));
  app.get('/api/connection',(req,res)=>res.json({projectPath:root,cliPath:path.join(root,'bridge','cli.mjs'),mcpPath:path.join(root,'bridge','mcp.mjs'),nodePath:process.execPath,exportRoot:local.root}));
  app.get('/api/folders',(req,res)=>res.json(store.folders()));
  app.post('/api/folders',(req,res)=>res.status(201).json(store.createFolder(req.body.title)));
  app.get('/api/folders/:id',(req,res)=>res.json({folder:store.folders().find(f=>f.id===req.params.id),items:store.list(req.params.id)}));
  app.post('/api/ui',async(req,res)=>res.status(201).json(await store.create(req.body)));
  app.get('/api/ui/:id',(req,res)=>res.json(store.version(req.params.id,req.query.version)));
  app.get('/api/ui/:id/history',(req,res)=>res.json(store.history(req.params.id)));
  app.get('/api/ui/:id/context',async(req,res)=>{const m=store.version(req.params.id,req.query.version);res.json({requirements:store.preferences(m.id),inspection:await inspectMaterials(m,url=>store.file(url)),localExport:local.latest(m.id,m.version)});});
  app.post('/api/ui/:id/preferences',(req,res)=>res.json(store.setPreferences(req.params.id,req.body)));
  app.get('/api/ui/:id/local',(req,res)=>{const m=store.version(req.params.id,req.query.version);res.json(local.latest(m.id,m.version));});
  app.post('/api/ui/:id/local',async(req,res)=>{const m=store.version(req.params.id,req.body.version),result=await local.create(m,{open:req.body.open??store.preferences(m.id).openLocal});res.status(result.status==='saved'?201:500).json(result);});
  app.post('/api/ui/:id/local/open',async(req,res)=>{const m=store.version(req.params.id,req.body.version);res.json(await local.open(m.id,m.version,req.body.exportId));});
  app.post('/api/ui/:id/versions',async(req,res)=>res.status(201).json(await finishVersion(await store.publish(req.params.id,req.body))));
  app.post('/api/ui/:id/restore',async(req,res)=>res.status(201).json(await finishVersion(await store.restore(req.params.id,req.body.version,req.body.expectedVersion))));
  app.post('/api/ui/:id/detect',async(req,res)=>{const m=store.version(req.params.id,req.body.version);res.json({elements:await detect(await readFile(store.file(m.original)),Number(req.body.sensitivity)||35),method:'轮廓检测，复杂背景建议交给 Codex 处理'});});
  app.post('/api/ui/:id/preview',async(req,res)=>{const m=store.version(req.params.id,req.body.version),[e]=validateElements([req.body.element],m.width,m.height);res.type('png').send(await extract(await readFile(store.file(m.original)),e.rect,e.removeBackground,e.tolerance));});
  app.get('/api/ui/:id/export',async(req,res)=>{const m=store.version(req.params.id,req.query.version),inspection=await inspectMaterials(m,url=>store.file(url));res.attachment(`${m.id}-v${m.version}.zip`);const zip=archiver('zip',{zlib:{level:6}});zip.on('error',e=>res.destroy(e));zip.pipe(res);
    const elements=m.elements.map((e,i)=>({...e,...inspection[i],file:`assets/${e.id}.png`}));zip.append(JSON.stringify({...m,originalFile:'original.png',elements},null,2),{name:'manifest.json'});zip.append(JSON.stringify({processing:m.processing,processingReport:m.processingReport,assets:elements},null,2),{name:'catalog.json'});zip.file(store.file(m.original),{name:'original.png'});for(const e of elements)zip.file(store.file(e.url),{name:e.file});
    zip.append(`# ${m.title}\n\nUI ID: ${m.id}\nVersion: ${m.version}\n\n素材命名、原图坐标和本地文件位置见 manifest.json。catalog.json 含真实 Alpha 检查与补绘／提取方式。背景层可不透明；补绘是生成还原，不等于原始 PSD 分层。\n`,{name:'README.md'});zip.finalize();});
  app.use('/media',(req,res,next)=>{if(!/^\/UI-[a-f0-9]{8}\/v\d+-[a-f0-9]{10}\/(?:original|EL-[a-f0-9]{8})\.png$/.test(req.path))return res.status(404).end();next();},express.static(store.root,{index:false,immutable:true,maxAge:'1y',dotfiles:'deny'}));
  // Never expose the database or other data files through the media route.
  app.use('/api',(req,res)=>res.status(404).json({error:'接口不存在'}));
  app.get('/ui/:id',(req,res,next)=>{if(!/^UI-[a-f0-9]{8}$/.test(req.params.id))return next();res.setHeader('Link',`</api/ui/${req.params.id}>; rel="describedby"; type="application/json"`);if(req.headers.accept?.includes('application/json'))return res.json(store.version(req.params.id,req.query.version));next();});
  if(production){app.use(express.static(path.join(root,'dist')));app.get('/{*splat}',(req,res)=>res.sendFile(path.join(root,'dist','index.html')));}
  else{const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'spa'});app.use(vite.middlewares);app.locals.vite=vite;}
  app.use((e,req,res,next)=>{console.error(e.message);res.status(e.status||400).json({error:e.type==='entity.too.large'?'文件过大，最多 20 MB':e.message||'操作失败'});});app.locals.store=store;app.locals.localExports=local;app.locals.aiJobs=aiJobs;app.locals.aiSettings=aiSettings;return app;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT)||4763;const app=await createApp({production:process.argv.includes('--production')});
  app.listen(port,'127.0.0.1',async error=>{if(error){console.error(`无法启动 UI Studio：${error.message}`);await app.locals.vite?.close();app.locals.store.db.close();process.exitCode=1;return;}console.log(`UI Studio: http://127.0.0.1:${port}`)});
}
