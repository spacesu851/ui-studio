export const WORKFLOW=[
 {id:'prepare',title:'准备原图',description:'检查原图、处理要求与本地引擎。'},
 {id:'split',title:'拆分素材',description:'识别候选、透明提取与遮挡补绘，查看本次任务和结果。'},
 {id:'components',title:'复刻组件',description:'挑选素材，继续细分或复刻为可编辑网页组件。'},
 {id:'review',title:'验收效果',description:'对照原图，检查文字、外观与实际交互。'},
 {id:'delivery',title:'本地交付',description:'保存独立文件夹，交付 PNG、HTML、CSS 与任务清单。'}
];
export function initialStage(ui,search=''){const stage=new URLSearchParams(search).get('stage');return WORKFLOW.some(s=>s.id===stage)&&stage!=='review'?stage:ui?.elements?.length?'components':'prepare';}
export function workflowUrl(id,stage,version){if(stage==='review')return '/review/'+id;const query=new URLSearchParams({stage});if(version)query.set('version',version);return '/ui/'+id+'?'+query;}
export const TASK_STATUS={queued:'准备中',analyzing:'分析中','awaiting-approval':'待确认',generating:'生成中',reviewing:'检查中',publishing:'保存中','preview-ready':'预览已生成',completed:'已完成',failed:'未完成',cancelled:'已取消',interrupted:'已中断'};
