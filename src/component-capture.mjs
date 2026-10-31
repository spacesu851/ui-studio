import {renderHtmlComponent,validateHtmlComponent} from '../shared/html-component.mjs';
export async function captureComponent(recipe,options={}){
 const r=validateHtmlComponent(recipe),{html,css}=renderHtmlComponent(r,options),ratio=2,width=Math.ceil(r.width*ratio),height=Math.ceil(r.height*ratio);
 // Serialize HTML void elements (input/img) as valid XML inside foreignObject.
 const wrapper=document.createElement('div');wrapper.style.cssText=`width:${r.width}px;height:${r.height}px;margin:0;background:transparent;-webkit-font-smoothing:antialiased`;const style=document.createElement('style');style.textContent=css;wrapper.append(style);const content=document.createElement('div');content.innerHTML=html;wrapper.append(...content.childNodes);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${r.width} ${r.height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`;
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);
 try{return canvas.toDataURL('image/png')}catch{throw Error('当前浏览器不支持组件截图比对，可下载 HTML 后在浏览器中人工对照；未标记为通过')}
}
