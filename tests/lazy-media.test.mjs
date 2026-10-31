import test from 'node:test';
import assert from 'node:assert/strict';
test('offscreen media shares one observer, loads once and releases unmounted callbacks',async()=>{
 const previous=globalThis.IntersectionObserver,instances=[];
 globalThis.IntersectionObserver=class {constructor(callback,options){this.callback=callback;this.options=options;this.targets=new Set();instances.push(this)}observe(target){this.targets.add(target)}unobserve(target){this.targets.delete(target)}};
 try{
  const {observeVisible}=await import('../src/visible-media.mjs?observer-test'),first={},second={},calls=[];
  const stopFirst=observeVisible(first,()=>calls.push('first')),stopSecond=observeVisible(second,()=>calls.push('second'));
  assert.equal(instances.length,1);const observer=instances[0];assert.equal(observer.options.rootMargin,'120px');assert.deepEqual(calls,[]);
  observer.callback([{target:first,isIntersecting:false}]);assert.deepEqual(calls,[]);
  stopSecond();observer.callback([{target:second,isIntersecting:true}]);assert.deepEqual(calls,[]);
  observer.callback([{target:first,isIntersecting:true},{target:first,isIntersecting:true}]);assert.deepEqual(calls,['first']);assert.equal(observer.targets.size,0);stopFirst();
 }finally{globalThis.IntersectionObserver=previous}
});
test('media remains accessible when IntersectionObserver is unavailable',async()=>{
 const previous=globalThis.IntersectionObserver;delete globalThis.IntersectionObserver;
 try{const {observeVisible}=await import('../src/visible-media.mjs?fallback-test');let calls=0;const stop=observeVisible({},()=>calls++);assert.equal(calls,1);assert.doesNotThrow(stop)}finally{globalThis.IntersectionObserver=previous}
});
