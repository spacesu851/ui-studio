import {useEffect,useRef} from 'react';
// Decorative work is optional: content never waits for the animation chunk.
export function useStudioMotion(scope,key,selector,order=0){
 const previous=useRef(order);
 useEffect(()=>{
  const root=scope.current,direction=order<previous.current?-1:1;previous.current=order;
  if(!root||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let cancelled=false,dispose;const started=performance.now();
  import('./motion-runtime.mjs').then(({enterMotion})=>{if(!cancelled&&root.isConnected&&performance.now()-started<180)dispose=enterMotion(root,selector,direction)}).catch(()=>{});
  return()=>{cancelled=true;dispose?.()};
 },[scope,key,selector,order]);
}
