import sharp from 'sharp';
import {randomBytes} from 'node:crypto';
import {materialDetails} from './materials.mjs';
export const elementId=()=>`EL-${randomBytes(4).toString('hex')}`;
export async function decodeImage(encoded){
  if(typeof encoded!=='string' || encoded.length>28_000_000) throw new Error('图片需小于 20 MB');
  const raw=Buffer.from(encoded.replace(/^data:image\/[\w.+-]+;base64,/,''),'base64');
  const instance=sharp(raw,{limitInputPixels:24_000_000,failOn:'error'}).rotate();
  const png=await instance.png().toBuffer();
  const meta=await sharp(png).metadata();
  if(!meta.width || !meta.height || meta.width>12000 || meta.height>12000) throw new Error('不支持的图片尺寸');
  return {png,width:meta.width,height:meta.height};
}
function dominant(data,w,h){
  const bins=new Map();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(x>2&&y>2&&x<w-3&&y<h-3)continue;
    const p=(y*w+x)*4;if(data[p+3]<50)continue;
    const key=(data[p]>>4)*256+(data[p+1]>>4)*16+(data[p+2]>>4);
    const v=bins.get(key)||[0,0,0,0]; v[0]++;for(let c=0;c<3;c++)v[c+1]+=data[p+c];bins.set(key,v);
  }
  const v=[...bins.values()].sort((a,b)=>b[0]-a[0])[0]||[1,0,0,0];
  return v.slice(1).map(c=>c/v[0]);
}
// Background-connected color removal preserves interior pixels and existing alpha.
// It is deliberately not described as semantic segmentation or occlusion recovery.
export async function extract(png,rect,removeBackground=false,tolerance=30){
  const img=sharp(png).extract({left:rect.x,top:rect.y,width:rect.width,height:rect.height}).ensureAlpha();
  if(!removeBackground)return img.png().toBuffer();
  const {data,info}=await img.raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info, bg=dominant(data,w,h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0;
  const accept=(i)=>{if(seen[i])return;seen[i]=1;const p=i*4;
    const dist=Math.hypot(data[p]-bg[0],data[p+1]-bg[1],data[p+2]-bg[2]);
    if(data[p+3]<30||dist<tolerance){queue[tail++]=i;data[p+3]=0;}};
  for(let x=0;x<w;x++){accept(x);accept((h-1)*w+x);}for(let y=0;y<h;y++){accept(y*w);accept(y*w+w-1);}
  for(let head=0;head<tail;head++){const i=queue[head],x=i%w;if(x)accept(i-1);if(x<w-1)accept(i+1);if(i>=w)accept(i-w);if(i<w*(h-1))accept(i+w);}
  return sharp(data,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
}
export async function detect(png,sensitivity=35){
  const {data,info}=await sharp(png).resize({width:1100,height:1100,fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,meta=await sharp(png).metadata(),bg=dominant(data,w,h),mask=new Uint8Array(w*h),seen=new Uint8Array(w*h),q=new Int32Array(w*h),boxes=[];
  for(let i=0;i<mask.length;i++){const p=i*4;mask[i]=data[p+3]>40&&Math.hypot(data[p]-bg[0],data[p+1]-bg[1],data[p+2]-bg[2])>sensitivity?1:0;}
  for(let i=0;i<mask.length;i++){
    if(!mask[i]||seen[i])continue;let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0; q[0]=i;seen[i]=1;
    while(head<tail){const p=q[head++],x=p%w,y=Math.floor(p/w);minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);
      const add=(n)=>{if(mask[n]&&!seen[n]){seen[n]=1;q[tail++]=n;}};
      if(x)add(p-1);if(x<w-1)add(p+1);if(y)add(p-w);if(y<h-1)add(p+w);
    }
    const bw=maxX-minX+1,bh=maxY-minY+1;
    if(tail<30||bw<8||bh<8||bw*bh>w*h*.88)continue;
    const x=Math.max(0,Math.floor((minX-2)*meta.width/w)),y=Math.max(0,Math.floor((minY-2)*meta.height/h));
    const right=Math.min(meta.width,Math.ceil((maxX+3)*meta.width/w)),bottom=Math.min(meta.height,Math.ceil((maxY+3)*meta.height/h));
    boxes.push({x,y,width:right-x,height:bottom-y,area:tail});
  }
  return boxes.sort((a,b)=>b.area-a.area).slice(0,100).sort((a,b)=>a.y-b.y||a.x-b.x).map(({area,...rect},i)=>({id:elementId(),name:`素材 ${String(i+1).padStart(2,'0')}`,rect,role:'component',method:'cutout',removeBackground:true,tolerance:30}));
}
export function validateElements(items,width,height){
  if(!Array.isArray(items)||items.length>200)throw new Error('素材数量需在 0–200 之间');
  const ids=new Set();return items.map((e,i)=>{
    const id=e.id||elementId();if(!/^EL-[a-f0-9]{8}$/.test(id)||ids.has(id))throw new Error('素材 ID 不合法或重复');ids.add(id);
    const r=e.rect||{};for(const k of ['x','y','width','height'])if(!Number.isInteger(r[k]))throw new Error('选区坐标必须为整数');
    if(r.x<0||r.y<0||r.width<1||r.height<1||r.x+r.width>width||r.y+r.height>height)throw new Error(`素材 ${i+1} 的选区超出图片范围`);
    return {id,name:String(e.name||`素材 ${i+1}`).slice(0,100),...materialDetails(e),rect:{x:r.x,y:r.y,width:r.width,height:r.height},removeBackground:!!e.removeBackground,tolerance:Math.max(5,Math.min(120,Number(e.tolerance)||30))};
  });
}
