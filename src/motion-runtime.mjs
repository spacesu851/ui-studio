import {gsap} from 'gsap';
export function createEnterTimeline(root,selector,direction=1,kind='stage'){
 // Finish all geometry reads before creating tweens. Only animate visible regions.
 const targets=[...root.querySelectorAll(selector)].filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&!node.closest('[hidden]')}).slice(0,10);
 if(!targets.length)return;
 const timeline=gsap.timeline({defaults:{duration:.22,ease:'power2.out',overwrite:'auto',clearProps:'transform,opacity'}});
 if(kind==='dialog'){
  timeline.addLabel('scrim',0).fromTo(root,{opacity:.5},{opacity:1,duration:.12,clearProps:'opacity'},'scrim');
  timeline.addLabel('surface',.02).fromTo(targets,{opacity:.6,y:10,scale:.985},{opacity:1,y:0,scale:1},'surface');
 }else{
  timeline.addLabel('heading',0).fromTo(targets[0],{opacity:.5,y:direction*8},{opacity:1,y:0},'heading');
  if(targets.length>1)timeline.addLabel('content',.035).fromTo(targets.slice(1),{opacity:.5,y:direction*8},{opacity:1,y:0,stagger:{each:.018,amount:Math.min(.1,(targets.length-2)*.018)}},'content');
 }
 return timeline;
}
