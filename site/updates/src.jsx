import brandIcon from '../../public/brand/ui-studio-logo-96.png';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OverlayScrollbars} from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';
import {createChangelogPro} from './ChangelogPro.mjs';
import {changelogReleases} from './releases.mjs';
import './fonts.css';
import './changelog-pro.css';
import './page.css';
const Changelog=createChangelogPro(React,OverlayScrollbars),latest=changelogReleases[0];
function App(){const [theme,setTheme]=useState(document.documentElement.dataset.theme||'light');
  useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('opsu-theme',theme)}catch{}},[theme]);
  useEffect(()=>{const os=OverlayScrollbars(document.body,{overflow:{x:'hidden',y:'scroll'},scrollbars:{theme:'os-theme-updates',autoHide:'leave',autoHideSuspend:true}});return()=>os.destroy()},[]);
  return <><header className="updates-header"><a className="updates-brand" href="/"><img src={brandIcon} alt="" width="42" height="42"/>UI Studio</a><nav aria-label="页面导航"><a href="/">返回首页</a><button type="button" onClick={()=>setTheme(v=>v==='light'?'dark':'light')} aria-label={theme==='light'?'切换为深色模式':'切换为浅色模式'}>{theme==='light'?'深色':'浅色'}</button></nav></header><main className="updates-main"><div className="updates-heading"><span>工具与站点 · 持续迭代</span><h1>每一版，都更进一步。</h1><p>记录具体改动，保留版本来路。</p></div><section className="updates-current" aria-label="当前工具版本"><div><span className="updates-beta">预览版</span><strong>UI Studio <code>v{latest.version}</code></strong><p>使用者自行配置 OpenAI API。真实模型效果尚未验收。</p></div><a className="updates-download" href={latest.releaseUrl} target="_blank" rel="noopener noreferrer">下载最新工具 ↗</a></section><div className="release-board"><Changelog releases={changelogReleases} theme={theme} eyebrow="RELEASE NOTES" title="版本更新" subtitle="按版本查看新增、改进、修复和安全调整。" showImages={false} showSubscribe={false} storageKey="opsu-release-read-v1" titleSize={32} padding={26}/></div><div className="updates-footer"><span>© 2026 UI Studio</span><a href="https://github.com/spacesu851/ui-studio" target="_blank" rel="noopener noreferrer">GitHub 源码 ↗</a></div></main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
