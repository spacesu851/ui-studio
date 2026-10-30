export const changelogCategories=[{id:'new',label:'新增',color:'#1e9e61'},{id:'improved',label:'改进',color:'#2f6bff'},{id:'fixed',label:'修复',color:'#e8792b'},{id:'security',label:'安全',color:'#d93f5c'}];
export const changelogReleases=[
  {id:'ui-studio-0-3-0-beta-2',version:'0.3.0-beta.2',date:'2026-10-30',title:'UI Studio · 组件二次拆分',unread:true,
    summary:'选中已经拆出的素材，继续拆成更细的独立透明组件，例如头像、边框、皇冠、按钮底板与文字。保留原素材和其他素材，新增版本并保存到本地。通过 24 项自动测试和模拟服务的浏览器流程检查；真实 API 图像质量尚未验收。',
    releaseUrl:'https://github.com/spacesu851/ui-studio/releases/tag/v0.3.0-beta.2',
    changes:[
      {type:'new',text:'素材属性加入“再次拆分组件”，可填写具体拆分要求；来源 PNG 预览可确认本次仅处理哪张素材。'},
      {type:'new',text:'支持连续多层细分，记录父素材、来源版本与局部坐标；子组件也可以再次拆分。'},
      {type:'improved',text:'专门识别更细的视觉层，要求空心边框移除头像、底板移除文字；逐项透明与视觉检查，失败可续做。'},
      {type:'improved',text:'保留来源素材和其他已保存素材的 ID 与 PNG，追加子组件创建新版本，并按偏好保存独立本地文件夹和打开。'},
      {type:'new',text:'增加 Codex 二次拆分指令；CLI、MCP、本地清单与 ZIP 可保留子组件来源记录。'},
      {type:'fixed',text:'局部补绘保留整图原有补绘状态，版本变化时拒绝覆盖，不将未处理背景标记为完成。'}]},
  {id:'ui-studio-0-3-0-beta-1',version:'0.3.0-beta.1',date:'2026-10-29',title:'UI Studio · 独立 AI 拆分预览版',unread:true,
    summary:'从“管理拆分结果”升级为可独立执行的 AI 工作流。使用者配置自己的 OpenAI API Key 后，可在网页完成识别、抠图、补绘、检查和保存。已通过 20 项自动测试、构建及模拟服务的网页流程验证；尚未进行真实模型拆分效果验收，不能保证与源图层逐像素一致。',
    releaseUrl:'https://github.com/spacesu851/ui-studio/releases/tag/v0.3.0-beta.1',
    changes:[
      {type:'new',text:'加入完整组件识别、透明 PNG 提取、遮挡区域补绘和干净背景生成，直接在网页执行。'},
      {type:'new',text:'加入模型设置、任务进度、逐项素材预览、取消和断点续做；已完成素材不重复生成。'},
      {type:'improved',text:'生成后检查真实 Alpha 通道，再用视觉模型检查主体、完整性与相似度；不合格时重试或停止。'},
      {type:'improved',text:'全部通过后创建不可变新版本，按偏好保存独立本地文件夹并打开。'},
      {type:'fixed',text:'颜色轮廓入口明确改为“辅助选区（非 AI）”，避免将白底小矩形裁切误认为 AI 拆分结果。'},
      {type:'security',text:'API Key 仅在使用者的本机服务内存或外部环境变量中使用，不写入数据库、工具包或 GitHub。'}]},
  {id:'ui-studio-0-2-0',version:'0.2.0',date:'2026-10-29',title:'UI Studio · 本地素材与版本管理',
    summary:'提供上传整图、合集、独立素材管理与版本历史。此版通过 CLI／MCP 与本地 Codex 拉取和回传素材，尚不包含独立 AI 拆分引擎。',
    releaseUrl:'https://github.com/spacesu851/ui-studio/releases/tag/v0.2.0',
    changes:[
      {type:'new',text:'提供 UI ID 与固定链接、合集浏览、素材预览、单张和 ZIP 下载。'},
      {type:'new',text:'提供不可变版本历史、恢复为新版本，以及本地 Codex CLI／MCP 联动。'},
      {type:'improved',text:'校验组件的真实透明通道，记录补绘与提取方式；支持独立本地文件夹保存和打开。'},
      {type:'security',text:'移除旧 PowerShell 启动器，分离依赖安装与启动；发布包排除本机配置、图片和版本数据库。'}]}
];
export const resolveChangelogReleases=()=>changelogReleases;
export function matchingReleases(releases,filter,query){const q=query.trim().toLocaleLowerCase();return releases.filter(r=>(filter==='all'||r.changes.some(c=>c.type===filter))&&(!q||[r.version,r.date,r.title,r.summary,...r.changes.map(c=>c.text)].join(' ').toLocaleLowerCase().includes(q)));}
