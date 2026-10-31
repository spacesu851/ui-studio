import {MotionBackdrop} from './StudioMotion.jsx';
import React,{Component,Suspense,lazy,useMemo,useState} from 'react';
class FeatureError extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?this.props.wrap(<div role="alert" className="feature-loading"><p>功能加载失败，请检查本地服务连接。</p><button className="button" onClick={this.props.onRetry}>重新加载此功能</button>{this.props.onClose&&<button className="button" onClick={this.props.onClose}>关闭</button>}</div>):this.props.children}
}
function deferred(load,name,{dialog=false}={}){
 return function DeferredFeature(props){
  const [attempt,setAttempt]=useState(0),Loaded=useMemo(()=>lazy(()=>load().then(module=>({default:module[name]}))),[attempt]);
  const wrap=content=>dialog?<MotionBackdrop><section className="modal" role="dialog" aria-modal="true" aria-label="正在加载功能">{content}</section></MotionBackdrop>:content;
  return <FeatureError key={attempt} wrap={wrap} onRetry={()=>setAttempt(v=>v+1)} onClose={props.onClose}><Suspense fallback={wrap(<div className="feature-loading" role="status">正在加载{name==='SettingsDialog'?'处理引擎设置':name==='HtmlComponentDialog'?'组件复刻工具':name==='AssetDetailsDialog'?'素材详情':'页面'}…{props.onClose&&<button className="button" onClick={props.onClose}>取消</button>}</div>)}><Loaded {...props}/></Suspense></FeatureError>;
 }
}
export const SettingsDialog=deferred(()=>import('./EngineSettings.jsx'),'SettingsDialog',{dialog:true});
export const HtmlComponentDialog=deferred(()=>import('./HtmlComponentDialog.jsx'),'HtmlComponentDialog',{dialog:true});
export const ReviewPage=deferred(()=>import('./ReviewPage.jsx'),'ReviewPage');
export const UpdatesPage=deferred(()=>import('./UpdatesPage.jsx'),'UpdatesPage');

export const AssetDetailsDialog=deferred(()=>import('./AssetDetailsDialog.jsx'),'AssetDetailsDialog',{dialog:true});
