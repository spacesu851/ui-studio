import {gsap} from 'gsap';
export function enterMotion(root,selector,direction=1){
 const media=gsap.matchMedia();
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  const targets=[...root.querySelectorAll(selector)].filter(node=>node.getClientRects().length&&!node.closest('[hidden]')).slice(0,10);
  if(!targets.length)return;
  const context=gsap.context(()=>{gsap.fromTo(targets,{opacity:.4,y:direction*8},{opacity:1,y:0,duration:.22,stagger:.016,ease:'power2.out',overwrite:'auto',clearProps:'transform,opacity'})},root);
  return()=>context.revert();
 });
 return()=>media.revert();
}
