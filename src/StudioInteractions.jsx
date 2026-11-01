import {useEffect,useState} from 'react';
import {gsap} from 'gsap';
import {useGSAP} from '@gsap/react';
gsap.registerPlugin(useGSAP);
const cards='.ui-card,.material-card,.upload-card,.add-material';
const controls='.button,.icon-button,.project-steps a,.tabs button,.review-statebar button';
const preferences=()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,fine:matchMedia('(hover:hover) and (pointer:fine)').matches});
export default function StudioInteractions({scope}){
 const [prefs,setPrefs]=useState(preferences);
 useEffect(()=>{
  const queries=[matchMedia('(prefers-reduced-motion: reduce)'),matchMedia('(hover:hover) and (pointer:fine)')],update=()=>setPrefs(preferences());
  queries.forEach(q=>q.addEventListener('change',update));
  return()=>queries.forEach(q=>q.removeEventListener('change',update));
 },[]);
 useGSAP((context,contextSafe)=>{
  const root=scope.current;
  if(!root||prefs.reduced)return;
  let active=null,bounds=null,pressed=null,frame=0;
  const tracking=new WeakMap(),seen=new WeakSet(),pending=new Set();
  const enabled=node=>node&&root.contains(node)&&!node.matches(':disabled,[aria-disabled="true"]');
  const reset=()=>{active=null;bounds=null};
  const move=contextSafe(event=>{
   if(!prefs.fine||event.pointerType==='touch')return;
   const card=event.target.closest?.(cards);
   if(!enabled(card)){reset();return}
   if(card!==active){active=card;bounds=null}
   // Geometry is read on entry / after scrolling, never on every animation frame.
   bounds??=card.getBoundingClientRect();
   let follow=tracking.get(card);
   if(!follow){
    gsap.set(card,{'--spot-x':`${event.clientX-bounds.left}px`,'--spot-y':`${event.clientY-bounds.top}px`});
    follow={x:gsap.quickTo(card,'--spot-x',{duration:.18,ease:'power2.out'}),y:gsap.quickTo(card,'--spot-y',{duration:.18,ease:'power2.out'})};
    tracking.set(card,follow);
   }
   follow.x(event.clientX-bounds.left);follow.y(event.clientY-bounds.top);
  });
  const invalidate=()=>{bounds=null};
  const release=contextSafe(()=>{
   if(pressed?.isConnected)gsap.to(pressed,{scale:1,y:0,duration:.24,ease:'back.out(1.8)',overwrite:'auto',clearProps:'transform'});
   pressed=null;
  });
  const press=contextSafe(event=>{
   if(event.type==='keydown'&&(!['Enter',' '].includes(event.key)||event.repeat))return;
   if(event.type==='pointerdown'&&event.button!==0)return;
   const control=event.target.closest?.(controls);
   if(!enabled(control))return;
   const icon=control.querySelector(':scope > svg:not(.spin)');
   if(!icon)return;
   release();pressed=icon;
   gsap.to(icon,{scale:.83,y:1,duration:.09,ease:'power2.out',overwrite:'auto'});
  });
  // A visible card gets one short reveal. Unobserved content is never hidden.
  const reveal=contextSafe(()=>{
   frame=0;
   const targets=[...pending].filter(node=>node.isConnected);pending.clear();
   if(targets.length)gsap.fromTo(targets,{opacity:.72,y:6},{opacity:1,y:0,duration:.24,stagger:{amount:Math.min(.12,targets.length*.018)},ease:'power2.out',overwrite:'auto',clearProps:'transform,opacity'});
  });
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);if(!seen.has(entry.target)){seen.add(entry.target);if(pending.size<12)pending.add(entry.target)}}
   if(pending.size&&!frame)frame=requestAnimationFrame(reveal);
  },{threshold:.08}):null;
  const observe=node=>{if(!observer||node.nodeType!==1)return;if(node.matches(cards)&&!seen.has(node))observer.observe(node);node.querySelectorAll(cards).forEach(card=>{if(!seen.has(card))observer.observe(card)})};
  observe(root);
  const mutations=new MutationObserver(records=>{for(const record of records){record.addedNodes.forEach(observe);record.removedNodes.forEach(node=>{if(node.nodeType!==1)return;observer?.unobserve(node);node.querySelectorAll(cards).forEach(card=>observer?.unobserve(card))})}});
  mutations.observe(root,{childList:true,subtree:true});
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',reset);
  root.addEventListener('pointerdown',press);root.addEventListener('keydown',press);
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('keyup',release);window.addEventListener('blur',release);
  root.addEventListener('scroll',invalidate,true);window.addEventListener('resize',invalidate);
  return()=>{
   observer?.disconnect();mutations.disconnect();cancelAnimationFrame(frame);pending.clear();
   root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',reset);root.removeEventListener('pointerdown',press);root.removeEventListener('keydown',press);
   window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('keyup',release);window.removeEventListener('blur',release);
   root.removeEventListener('scroll',invalidate,true);window.removeEventListener('resize',invalidate);
  };
 },{scope,dependencies:[prefs.reduced,prefs.fine],revertOnUpdate:true});
 return null;
}
