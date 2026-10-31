// One observer covers document and nested scrollports; unmounted images release callbacks.
let observer;
const pending=new Map();
export function observeVisible(element,show){
 if(typeof IntersectionObserver==='undefined'){show();return()=>{}}
 observer??=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const callback=pending.get(entry.target);if(callback){pending.delete(entry.target);observer.unobserve(entry.target);callback()}}},{rootMargin:'120px',threshold:0});
 pending.set(element,show);observer.observe(element);
 return()=>{pending.delete(element);observer.unobserve(element)};
}
