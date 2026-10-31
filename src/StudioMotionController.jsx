import {useRef} from 'react';
import {gsap} from 'gsap';
import {useGSAP} from '@gsap/react';
import {createEnterTimeline} from './motion-runtime.mjs';
gsap.registerPlugin(useGSAP);
export default function StudioMotionController({scope,motionKey,selector,order,kind,started}){
 const previous=useRef(order);
 useGSAP(()=>{
  const root=scope.current,direction=order<previous.current?-1:1;previous.current=order;
  if(!root||!root.isConnected||performance.now()-started>180)return;
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{createEnterTimeline(root,selector,direction,kind)});
  return()=>media.revert();
 },{scope,dependencies:[motionKey,selector,order,kind],revertOnUpdate:true});
 return null;
}
