export const WORKFLOW=[
 {id:'split',title:'拆分素材',description:'确认原图，开始拆分。完成后由你检查素材。'},
 {id:'components',title:'检查素材',description:'由设计师查看拆分结果；不满意的素材按 ID 交给 Codex 修正，也可复刻网页组件。'},
 {id:'review',title:'验收效果',description:'对照原图，检查文字、外观与实际交互。'},
 {id:'delivery',title:'本地交付',description:'保存独立文件夹，交付 PNG、HTML、CSS 与任务清单。'}
];
export function initialStage(ui,search=''){const requested=new URLSearchParams(search).get('stage'),stage=requested==='prepare'?'split':requested;return WORKFLOW.some(s=>s.id===stage)?stage:ui?.elements?.length?'components':'split';}
export function workflowUrl(id,stage,version){const query=new URLSearchParams({stage:stage==='prepare'?'split':stage});if(version)query.set('version',version);return '/ui/'+id+'?'+query;}
export function workflowNavigation(stage,hasHtml=false){const index=WORKFLOW.findIndex(s=>s.id===stage);return {previous:WORKFLOW[index-1],next:stage==='components'&&!hasHtml?WORKFLOW.find(s=>s.id==='delivery'):WORKFLOW[index+1]};}
export function legacyPrepareUrl(pathname,search=''){if(!/^\/ui\/UI-[a-f0-9]{8}\/?$/.test(pathname))return null;const query=new URLSearchParams(search);if(query.get('stage')!=='prepare')return null;query.set('stage','split');return pathname+'?'+query;}
export function legacyReviewUrl(pathname,search=''){const match=pathname.match(/^\/review\/(UI-[a-f0-9]{8})\/?$/);if(!match)return null;const query=new URLSearchParams({stage:'review'});for(const [key,value] of new URLSearchParams(search))if(key!=='stage')query.append(key,value);return '/ui/'+match[1]+'?'+query;}
export const TASK_STATUS={queued:'准备中',analyzing:'分析中','awaiting-approval':'待确认',generating:'生成中',reviewing:'检查中',publishing:'保存中','preview-ready':'预览已生成','awaiting-designer':'待设计师处理',completed:'已保存',failed:'未完成',cancelled:'已取消',interrupted:'已中断'};
