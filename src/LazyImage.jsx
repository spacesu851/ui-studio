import React,{useEffect,useRef,useState} from 'react';
import {observeVisible} from './visible-media.mjs';
export function LazyImage(props){return <DeferredImage key={props.src} {...props}/>}
function DeferredImage({src,alt='',className='',onLoad,onError,...props}){
 const ref=useRef(null),[visible,setVisible]=useState(false),[state,setState]=useState('waiting');
 useEffect(()=>observeVisible(ref.current,()=>setVisible(true)),[]);
 return <img {...props} ref={ref} alt={alt} className={'deferred-image '+className} src={visible?src:undefined} data-loading={state} aria-busy={state==='waiting'} decoding="async" onLoad={e=>{setState('ready');onLoad?.(e)}} onError={e=>{setState('error');onError?.(e)}}/>;
}
