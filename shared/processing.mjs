export const DEFAULT_PROCESSING=Object.freeze({removeBackground:true,transparentComponents:true,inpaintOccluded:true,saveLocal:true,openLocal:true});
export const ROLES=['component','background','reference'];
export const METHODS=['original','cutout','ai-extraction','ai-inpainting','geometry','unknown'];
export function processingOptions(value={}){const result={...DEFAULT_PROCESSING};for(const key of Object.keys(result)){if(value[key]!==undefined){if(typeof value[key]!=='boolean')throw new Error(`处理选项 ${key} 必须为布尔值`);result[key]=value[key]}}return result;}
export function materialRole(name,role){if(role!==undefined){if(!ROLES.includes(role))throw new Error('素材类型只能是 component、background 或 reference');return role;}const label=String(name||'').replace(/\.(png|jpe?g|webp)$/i,'');if(/背景|底图|background|(?:^|[_-])bg(?:[_-]|$)/i.test(label))return 'background';if(/参考|reference/i.test(label))return 'reference';return 'component';}
export function materialMethod(method){if(method===undefined)return 'unknown';if(!METHODS.includes(method))throw new Error('不支持的素材处理方式');return method;}
export function processingReport(value={}){const inpainting=value.inpainting||'unverified';if(!['completed','not-needed','pending','unverified'].includes(inpainting))throw new Error('补绘状态不合法');return {inpainting,notes:String(value.notes||'').slice(0,3000)};}
export function splitInstructions(options=DEFAULT_PROCESSING){const p=processingOptions(options);return [
  p.removeBackground?'去除每个组件外部的场景背景，不能把带底色矩形裁切冒充抠图。':'按指定选区提取素材。',
  p.transparentComponents?'组件必须输出有实际透明像素的 RGBA PNG；背景层可不透明，但必须标记 role=background。':'按素材用途保留原有透明度。',
  p.inpaintOccluded?'补绘被文字、图标或其他组件遮挡的区域，并生成完整干净底图。使用可用图像工具执行；原图提取与 AI 补绘分别标记。低清细节推断需说明。':'保留可见部分，不补绘未显示的区域。',
  '重复奖品可复用主体与边框；记录原图坐标和处理方式。原图像素优先保留，生成补绘不可冒充原始分层。',
  p.saveLocal?'回传后必须保存到独立本地文件夹，保留 PNG、原图、manifest、素材清单和预览，不覆盖已有目录。':'保留服务中的版本快照。',
  p.openLocal?'本地保存完成后打开素材文件夹，并返回实际路径。':'返回实际本地保存路径。'
].join('\n');}
