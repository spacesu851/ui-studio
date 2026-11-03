import {codexFollowup} from '../shared/codex-followup.mjs';
import {elapsedLabel} from '../shared/ai-progress.mjs';
import {SettingsDialog,GeneratedCandidatesDialog} from './DeferredFeatures.jsx';
import {LazyImage} from './LazyImage.jsx';
import {MotionBackdrop} from './StudioMotion.jsx';
import React,{useState,useEffect,useRef} from 'react';
import {Sparkles,Settings2,Square,RotateCcw,Check,X,LoaderCircle,Split,Copy} from 'lucide-react';
import {OverlayScrollbarsComponent} from 'overlayscrollbars-react';

const terminal=new Set(['completed','failed','cancelled','interrupted','awaiting-designer']);
const labels={'awaiting-approval':'等待设计师确认',queued:'准备中',analyzing:'识别完整组件',generating:'抠图与补绘',reviewing:'透明与视觉检查',publishing:'保存版本与文件',completed:'已保存候选','awaiting-designer':'待设计师处理',failed:'生成中断',cancelled:'已取消',interrupted:'已中断'};
async function request(route,body){const response=await fetch('/api'+route,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'AI 请求失败');return data;}

export function AiPanel({open=false,onClose,onStarted,requirementsPanel,ui,disabled,onComplete,refineTarget,onRefineClose,onCopyRefine,externalJob,onJobChange,onSettingsChange}){
  const [showCandidates,setShowCandidates]=useState(false),[copyNotice,setCopyNotice]=useState('');
  const [settings,setSettings]=useState(null),[job,setJob]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false),[showSettings,setShowSettings]=useState(false);
  const [instructions,setInstructions]=useState(''),[refineError,setRefineError]=useState(''),[candidates,setCandidates]=useState([]);
  useEffect(()=>{if(job?.status==='awaiting-approval')setCandidates(job.assets.map(a=>({...a,selected:true})))},[job?.id,job?.status]);const panel=useRef(null),candidatePanel=useRef(null);
  useEffect(()=>{setInstructions('');setRefineError('')},[refineTarget?.id,ui?.id]);
  const complete=useRef(onComplete),scope=useRef(ui?.id),notified=useRef('');complete.current=onComplete;scope.current=ui?.id;
  const active=job&&!terminal.has(job.status)&&job.status!=='awaiting-approval';
  useEffect(()=>setCopyNotice(''),[job?.id]);
  const [clock,setClock]=useState(Date.now);
  useEffect(()=>{if(!active)return;setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer)},[active,job?.id]);
  useEffect(()=>{let cancelled=false;setJob(null);setError('');Promise.all([request('/ai/settings'),ui?request(`/ui/${ui.id}/ai`):Promise.resolve(null)]).then(([config,task])=>{if(cancelled)return;setSettings(config);setJob(task);notified.current=task?.status==='completed'?task.id:'';}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[ui?.id]);
  useEffect(()=>{if(!active)return;let cancelled=false,timer;const id=job.id,uiId=ui?.id;
    const poll=async()=>{try{const task=await request('/ai/jobs/'+id);if(cancelled||scope.current!==uiId)return;setJob(task);setError('');if(task.status==='completed'&&notified.current!==id){notified.current=id;await complete.current?.(task);}if(!terminal.has(task.status)&&task.status!=='awaiting-approval')timer=setTimeout(poll,1600);}catch(e){if(cancelled)return;setError(`读取进度失败：${e.message}。任务在服务端继续运行。`);timer=setTimeout(poll,4000)}};
    timer=setTimeout(poll,800);return()=>{cancelled=true;clearTimeout(timer)};
  },[active,job?.id,ui?.id]);
  useEffect(()=>{if(externalJob?.uiId===ui?.id){setJob(externalJob);request('/ai/settings').then(setSettings).catch(()=>{});panel.current?.scrollIntoView({block:'start',behavior:'smooth'})}},[externalJob]);
  useEffect(()=>{onJobChange?.(job)},[job,onJobChange]);
  useEffect(()=>{onSettingsChange?.(settings)},[settings,onSettingsChange]);
  async function act(fn){if(pending)return;setPending(true);setError('');try{await fn()}catch(e){setError(e.message)}finally{setPending(false)}}
  async function start(){if(!settings?.configured){setShowSettings(true);return;}await act(async()=>setJob(await request(`/ui/${ui.id}/ai`,{expectedVersion:ui.version})));}
  async function refine(){if(pending||active||disabled)return;if(!settings?.configured){setShowSettings(true);return;}setPending(true);setRefineError('');try{setJob(await request(`/ui/${ui.id}/ai`,{expectedVersion:ui.version,targetId:refineTarget.id,instructions}));onRefineClose();onStarted?.();panel.current?.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){setRefineError(e.message)}finally{setPending(false)}}
  const available=job?.assets.filter(a=>a.previewAvailable||a.file).length||0;
  const stopped=job&&['failed','cancelled','interrupted','awaiting-designer'].includes(job.status);
  const resumable=stopped&&!disabled&&settings?.configured;
  async function copyTask(instructions=false){try{await navigator.clipboard.writeText(instructions?codexFollowup({origin:location.origin,uiId:job.uiId,version:job.resultVersion||job.baseVersion,taskId:job.id,assetId:job.targetId}):job.id);setCopyNotice(instructions?'修改指令已复制，补充意见后粘贴给 Codex。':'任务 ID 已复制。')}catch{setError('复制失败，请选中 ID 复制。')}}
  const content=<section ref={panel} id="ui-studio-ai-panel" className="ai-panel ai-panel-simple" aria-label="拆分操作">{requirementsPanel}
    <div className="ai-simple-heading"><strong><Sparkles size={16}/>交给 Codex</strong><button className="text-button" onClick={()=>setShowSettings(true)} disabled={pending||active}><Settings2 size={14}/>设置</button></div>
    <p className={'ai-connection '+(settings?.configured?'connected':'')}>{settings?settings.configured?(settings.engine==='codex'?'本地 Codex 已连接':'API 已连接'):'尚未连接处理引擎':'正在检查连接…'}</p>
    {job&&<div className="ai-simple-progress" role="status"><div><strong>{stopped?(job.status==='cancelled'?'任务已停止':'拆分中断'):job.status==='completed'?'结果已保存':labels[job.status]||job.status}</strong>{available>0&&<span>{available} 张可查看</span>}</div>
      <p>{active?'正在处理，完成后会进入素材检查。':stopped?(available?'已有结果已保留，可先查看或继续拆分。':'尚未生成图片，可以继续拆分。'):job.status==='completed'?'回到工作台检查素材，不满意时按 ID 修改。':job.message}</p>
      {active&&<><progress aria-label="拆分进度" {...(job.assets.length?{value:available,max:job.assets.length}:{})}/><small>{elapsedLabel(job.phaseStartedAt||job.updated||job.created,clock)}{job.activity?.message?' · '+job.activity.message:''}</small></>}
    </div>}
    <div className="ai-simple-actions">
      {active?<button className="button" disabled={pending||job.status==='publishing'} onClick={()=>act(async()=>setJob(await request('/ai/jobs/'+job.id+'/cancel',{})))}><Square size={13}/>停止任务</button>
      :job?.status==='completed'?<button className="button primary" disabled={pending||disabled} onClick={()=>act(()=>complete.current?.(job))}>查看素材</button>
      :job?.status==='awaiting-approval'?<button className="button primary" onClick={()=>candidatePanel.current?.scrollIntoView({block:'start',behavior:'smooth'})}>确认拆分方案</button>
      :stopped&&available?<><button className="button primary" disabled={pending||disabled} onClick={()=>setShowCandidates(true)}>查看已有结果（{available}）</button><button className="text-button" disabled={pending||!resumable} onClick={()=>act(async()=>setJob(await request('/ai/jobs/'+job.id+'/resume',{})))}><RotateCcw size={13}/>{pending?'正在提交…':'继续拆分'}</button></>
      :<button className="button primary" disabled={!ui||disabled||pending||active} onClick={stopped?()=>act(async()=>setJob(await request('/ai/jobs/'+job.id+'/resume',{}))):start}><Sparkles size={15}/>{pending?'正在提交…':stopped?'继续拆分':ui?.elements.length?'再次拆分':'开始拆分'}</button>}
    </div>
    {job?.status==='awaiting-approval'&&<section ref={candidatePanel} className="refine-plan"><strong>由设计师决定拆哪些、边界在哪</strong><p>取消勾选不需要的候选，调整名称、要求及原素材像素坐标；确认前不会去背景或补绘。原素材保留。</p>{candidates.map((a,i)=><details key={a.index} className="refine-candidate"><summary><label><input type="checkbox" checked={a.selected} onChange={e=>setCandidates(v=>v.map((x,n)=>n===i?{...x,selected:e.target.checked}:x))}/>{a.name}</label><span>调整边界与要求</span></summary><div className="refine-plan-row"><input aria-label={'候选名称 '+(i+1)} value={a.name} maxLength={100} onChange={e=>setCandidates(v=>v.map((x,n)=>n===i?{...x,name:e.target.value}:x))}/><textarea aria-label={'候选要求 '+(i+1)} value={a.description} maxLength={4000} onChange={e=>setCandidates(v=>v.map((x,n)=>n===i?{...x,description:e.target.value}:x))}/><div className="html-fields">{['x','y','width','height'].map(k=><label key={k}>{k} px<input aria-label={'候选 '+(i+1)+' '+k} type="number" value={a.rect[k]} onChange={e=>setCandidates(v=>v.map((x,n)=>n===i?{...x,rect:{...x.rect,[k]:Number(e.target.value)}}:x))}/></label>)}</div></div></details>)}<button className="button primary" disabled={pending||disabled||!candidates.some(a=>a.selected)} onClick={()=>act(async()=>setJob(await request('/ai/jobs/'+job.id+'/approve',{expectedVersion:ui.version,designerConfirmed:true,assets:candidates.filter(a=>a.selected).map(({index,name,description,rect})=>({index,name,description,rect}))})))}>确认所选方案并生成</button><button className="button" disabled={pending} onClick={()=>act(async()=>setJob(await request('/ai/jobs/'+job.id+'/cancel',{})))}>放弃方案</button></section>}
    {error&&<p className="ai-error" role="alert">操作未完成，请展开下方详情查看原因。</p>}
    {copyNotice&&<p className="ai-copy-notice" role="status">{copyNotice}</p>}
    <details className="ai-more"><summary>{job?'任务详情与更多操作':'处理说明'}</summary><div className="ai-more-content">
      {job&&<><div className="split-task-id"><span>任务 ID</span><code>{job.id}</code><button className="text-button" onClick={()=>copyTask()}><Copy size={13}/>复制</button></div>
        <div className="ai-more-actions"><button className="button" onClick={()=>copyTask(true)}><Copy size={14}/>复制给 Codex 修改</button>{!active&&job.status!=='awaiting-approval'&&<button className="button" disabled={pending||disabled} onClick={start}>重新拆分整图</button>}</div>
        {job.mode==='refine'&&<p>来源素材：{job.targetName}，原素材保留。</p>}
        {job.error&&<p className="ai-error">{job.error.includes('质检')?'历史记录，仅供参考：':''}{job.error}</p>}
        {job.summary&&<details><summary>处理记录与素材清单</summary><p>{job.summary}</p><ul className="ai-detail-assets">{job.assets.map(a=><li key={a.index}>{(a.previewAvailable||a.file)&&<LazyImage className="ai-result-thumb checker" src={'/api/ai/jobs/'+job.id+'/assets/'+a.index} alt={a.name}/>}<span>{a.name}</span><small>{a.previewAvailable||a.file?'已有图像':'尚未生成'}</small></li>)}</ul></details>}
        {job.codexIssues?.length>0&&<details><summary>Codex 处理说明</summary><ul>{job.codexIssues.map((issue,i)=><li key={i}>{issue}</li>)}</ul></details>}
        {job.localExport?.error&&<p className="ai-error">本地保存失败：{job.localExport.error}。版本已保留，可在交付页重新保存。</p>}
        {job.localExport?.openError&&<p className="ai-error">文件已保存，打开失败：{job.localExport.openError}</p>}
      </>}
      {error&&<p className="ai-error">{error}</p>}
      <p>{settings?.engine==='api'?'原图会发送到已配置的 API，并产生服务费用。':'使用本机已登录的 Codex 处理图片。'}结果由设计师检查，不满意时按素材 ID 继续修改。补绘属于生成还原。</p>
      <small>{settings?.engine==='codex'?settings.localCodex?.version:[settings?.visionModel,settings?.imageModel].filter(Boolean).join(' + ')}</small>
    </div></details>
  </section>;
  return <>{open&&!refineTarget&&!showCandidates&&!showSettings&&<SplitDialogFrame onClose={onClose}>{content}</SplitDialogFrame>}
    {refineTarget&&!showSettings&&<MotionBackdrop onClick={e=>{if(e.target===e.currentTarget&&!pending)onRefineClose()}}><OverlayScrollbarsComponent element="section" role="dialog" aria-modal="true" aria-labelledby="refine-title" className="modal refine-dialog" options={{overflow:{x:'hidden',y:'scroll'},scrollbars:{theme:'os-theme-studio',autoHide:'leave',autoHideSuspend:true}}} defer><button className="icon-button modal-close" aria-label="关闭二次拆分" disabled={pending} onClick={onRefineClose}><X size={18}/></button><span className="eyebrow">SUBCOMPONENTS</span><h2 id="refine-title">再次拆分组件</h2><div className="refine-source"><div className="checker"><img src={refineTarget.url} alt={`来源素材：${refineTarget.name}`}/></div><div><strong>{refineTarget.name}</strong><code>{refineTarget.id}</code><span>只处理这一张素材，原素材和其他素材保留。</span></div></div><label className="field">具体拆分要求<textarea aria-label="具体拆分要求" value={instructions} onChange={e=>setInstructions(e.target.value)} disabled={pending} maxLength={2000} placeholder="例如：把头像、金色边框、皇冠分别拆开；边框中间透明，补齐被皇冠遮住的边缘。留空则由 Codex 自主细分，生成后由设计师检查。"/></label><p>继续拆出主体、边框、装饰、文字等独立透明 PNG；补绘相互遮挡的区域，生成后新增候选版本，并按偏好保存到本地。子组件也可以继续拆。</p><p className="ai-key-note">{settings?.engine==='codex'?'选中素材将直接交给本地 Codex 自主细分，结果保存后由你检查。':'AI 会将选中素材发送到已配置的模型服务并产生 API 费用。'}也可复制指令交给本地 Codex 处理。{disabled?' 请先保存修改并同步到最新版本。':''}</p>{refineError&&<p className="ai-error" role="alert">{refineError}</p>}{active&&<p className="ai-error">已有 AI 任务进行中，请等待或取消后再开始。</p>}<div className="modal-foot"><button className="button" disabled={pending||disabled} onClick={()=>onCopyRefine(refineTarget,instructions)}><Copy size={14}/>复制 Codex 二次拆分指令</button><button className="button primary" disabled={pending||active||disabled} onClick={refine}><Split size={14}/>{pending?'正在创建任务…':settings?.configured?(settings.engine==='codex'?'交给 Codex 再次拆分':'分析候选拆分方案'):'连接处理引擎'}</button></div></OverlayScrollbarsComponent></MotionBackdrop>}
    {showCandidates&&job&&<GeneratedCandidatesDialog job={job} onClose={()=>setShowCandidates(false)} onConfirm={async indices=>{const result=await request('/ai/jobs/'+job.id+'/deliver',{expectedVersion:ui.version,designerConfirmed:true,indices});setJob(result);await complete.current?.(result)}}/>}
    {showSettings&&settings&&<SettingsDialog value={settings} onClose={()=>setShowSettings(false)} onSave={value=>{setSettings(value);setShowSettings(false)}}/>}
  </>;
}

export {SettingsDialog};

function SplitDialogFrame({children,onClose}){const frame=useRef(null);useEffect(()=>{const before=document.activeElement,root=frame.current;root.focus();const handler=e=>{if(e.key==='Escape'){e.preventDefault();onClose()}if(e.key==='Tab'){const controls=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),summary,a[href]')].filter(node=>node.getClientRects().length),first=controls[0],last=controls.at(-1);if(!first){e.preventDefault();return}if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first.focus()}}};document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);if(before?.isConnected)before.focus()}},[onClose]);return <MotionBackdrop onClick={e=>{if(e.target===e.currentTarget)onClose()}}><section ref={frame} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="split-action-title" className="modal split-action-dialog"><header><h2 id="split-action-title">拆分素材</h2><button className="icon-button" aria-label="关闭拆分窗口" onClick={onClose}><X size={18}/></button></header><OverlayScrollbarsComponent className="split-action-scroll" options={{overflow:{x:'hidden',y:'scroll'},scrollbars:{theme:'os-theme-studio',autoHide:'leave',autoHideSuspend:true}}} defer>{children}</OverlayScrollbarsComponent></section></MotionBackdrop>}
