import {BrandLogo} from './BrandLogo.jsx';
import React,{useEffect} from 'react';
import {ArrowLeft,Download,ExternalLink,History} from 'lucide-react';
import {OverlayScrollbars} from 'overlayscrollbars';
import {createChangelogPro} from '../site/updates/ChangelogPro.mjs';
import {releaseInfo} from '../shared/releases.mjs';
import packageInfo from '../package.json';
import '../site/updates/changelog-pro.css';
import './updates.css';
const Changelog=createChangelogPro(React,OverlayScrollbars),info=releaseInfo(packageInfo.version);
export function UpdatesPage(){
  useEffect(()=>{document.title='版本与下载 · UI Studio';const os=OverlayScrollbars(document.body,{overflow:{x:'hidden',y:'scroll'},scrollbars:{theme:'os-theme-studio',autoHide:'leave',autoHideSuspend:true}});return()=>os.destroy()},[]);
  return <div className="studio-updates"><header className="header"><a className="brand" href="/"><BrandLogo/></a><a className="button" href="/"><ArrowLeft size={15}/>返回工作台</a></header><main className="studio-updates-main"><span className="eyebrow">UI STUDIO · RELEASE NOTES</span><h1>版本与下载</h1><p className="studio-updates-intro">查看当前工具的更新内容，下载对应版本。</p><section className="studio-release-card" aria-label="当前安装版本"><div><span className="studio-release-label">当前安装版本 · 预览版</span><strong>UI Studio <code>v{info.version}</code></strong><p>{info.current.title.replace('UI Studio · ','')}</p><small>更新说明随工具包提供，离线可查看；下载安装包需要联网。</small></div><div className="studio-downloads"><a className="button primary" href={info.packageUrl} target="_blank" rel="noopener noreferrer"><Download size={16}/>下载此版本工具包</a><a className="text-button" href={info.allReleasesUrl} target="_blank" rel="noopener noreferrer">所有发布版本 <ExternalLink size={13}/></a></div></section><div className="studio-release-board"><Changelog releases={info.releases} theme="dark" eyebrow="CHANGELOG" title="更新说明" subtitle="按版本查看新增、改进、修复和安全调整。" showImages={false} showSubscribe={false} storageKey="ui-studio-release-read-v1" titleSize={28} padding={24}/></div><div className="studio-updates-foot"><span><History size={13}/> 此页记录工具版本；素材修改记录请在工作台查看“版本历史”。</span><a href={info.sourceUrl} target="_blank" rel="noopener noreferrer">GitHub 源码 <ExternalLink size={12}/></a></div></main><footer><span>UI Studio v{info.version}</span><a href="/">返回工作台</a></footer></div>;
}
