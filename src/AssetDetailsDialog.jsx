import React,{useEffect,useRef} from 'react';
import {OverlayScrollbarsComponent} from 'overlayscrollbars-react';
import {Check,Code2,Copy,Download,Split,X} from 'lucide-react';
import {MotionBackdrop} from './StudioMotion.jsx';
import {roleLabels,methodLabels} from './ProcessingPanel.jsx';
import './asset-details.css';
export function AssetDetailsDialog({ui,asset,taskId,children,preview,onClose,onCopy,onRefine,onReplica,onSave,dirty,isOld,busy}){
 const dialog=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement,root=dialog.current;
  root.querySelector('button')?.focus({preventScroll:true});
  const keyboard=e=>{
   if([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].at(-1)!==root)return;
   if(e.key==='Escape'&&!busy){e.preventDefault();e.stopPropagation();onClose()}
   if(e.key==='Tab'){
    const controls=[...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(node=>node.getClientRects().length),first=controls[0],last=controls.at(-1);
    if(!first){e.preventDefault();return}
    if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){e.preventDefault();first.focus()}
   }
  };
  document.addEventListener('keydown',keyboard);
  return()=>{document.removeEventListener('keydown',keyboard);if(previous?.isConnected&&!document.querySelector('[role="dialog"][aria-modal="true"]'))previous.focus({preventScroll:true})};
 },[onClose,busy]);
 const blocked=busy||dirty||isOld||!asset.url;
 const copyLine=(label,value)=><div className="asset-id-row"><span>{label}</span><code>{value}</code><button className="icon-button" aria-label={'复制'+label} onClick={()=>onCopy(value)}><Copy size={13}/></button></div>;
 return <MotionBackdrop onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><section ref={dialog} className="modal asset-details-dialog" role="dialog" aria-modal="true" aria-labelledby="asset-details-title">
  <header className="asset-details-head"><div><span className="eyebrow">MATERIAL DETAILS</span><h2 id="asset-details-title">素材详情</h2><p>{asset.name}</p></div><button className="icon-button" aria-label="关闭素材详情" disabled={busy} onClick={onClose}><X size={18}/></button></header>
  <OverlayScrollbarsComponent element="div" className="asset-details-body" options={{overflow:{x:'hidden',y:'scroll'},scrollbars:{theme:'os-theme-studio',autoHide:'leave',autoHideSuspend:true}}} defer><div className="asset-details-content"><div className="asset-details-visual"><div className="asset-detail-preview checker">{preview||<span>素材预览</span>}</div><div className="asset-detail-tags"><span>{roleLabels[asset.role]||'素材'}</span><span>{methodLabels[asset.method]||'处理方式未标记'}</span><span>{asset.pixelWidth||asset.rect.width} × {asset.pixelHeight||asset.rect.height} px</span></div><div className="asset-detail-ids">{copyLine('素材 ID',asset.id)}{copyLine('UI ID',ui.id)}{taskId&&copyLine('版本任务 ID',taskId)}<div className="asset-id-row"><span>UI 版本</span><code>v{ui.version}{isOld?' · 历史快照':''}</code></div></div></div><div className="asset-details-properties">{children}</div></div></OverlayScrollbarsComponent>
  <footer className="asset-details-foot"><div className="asset-detail-notice" role="status">{busy?'正在处理，请稍候…':isOld?'历史版本仅供查看；同步最新版本后可继续处理。':dirty?'修改尚未保存，请先保存新版本。':!asset.url?'先保存选区生成 PNG，再继续拆分或复刻。':'选择接下来要对这张素材进行的操作。'}</div><div className="asset-detail-actions"><button className="button" onClick={onClose} disabled={busy}>关闭</button>{asset.url&&!dirty&&<a className="button" href={asset.url} download={asset.name+'.png'}><Download size={14}/>下载 PNG</a>}{dirty&&<button className="button primary" disabled={busy||isOld} onClick={onSave}><Check size={14}/>保存新版本</button>}<button className="button" disabled={blocked} onClick={onRefine}><Split size={14}/>再次拆分</button><button className="button primary" disabled={blocked} onClick={onReplica}><Code2 size={14}/>复刻 HTML5 + CSS</button></div></footer>
 </section></MotionBackdrop>;
}
