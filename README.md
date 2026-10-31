# ImageOs UI Studio 0.3

按用户提供的抖音视频界面和操作流程制作的本地 UI 拆图与素材版本工具。默认地址：**http://127.0.0.1:4763**。

**版本下载：[v0.3.0-beta.10 工具包](https://github.com/spacesu851/ui-studio/releases/tag/v0.3.0-beta.10)。默认直连本地 Codex；OpenAI API 作为可选引擎保留。**

版本号、更新说明和下载入口均随 UI Studio 提供：启动后点击工作台顶部“版本与下载”，或打开 [本机更新页](http://127.0.0.1:4763/updates/)。该页面离线可查看；下载会前往对应 GitHub 发布包。

## 直连本地 Codex（0.3.0-beta.8，当前默认）

本机安装 Codex CLI 并完成 `codex login` 后，UI Studio 自动检测安装与登录，复用现有账号，无需在工具里填写 API Key。使用官方 CLI 的临时非交互任务，不新建需要手动操作的聊天。使用前需可执行 `codex --version` 和 `codex login status`；工具不自动安装 CLI，也不接管登录。

1. 打开 UI，点击顶部「交给本地 Codex」，直接分析完整界面；也可以在「再次拆分组件」或「复刻 HTML5 + CSS」里直接分析选中素材。
2. 候选方案返回后，由设计师选择组件、调整边界和 CSS/图片策略，再确认生成。确认前不执行图像编辑。
3. 本地 Codex 使用真实图像工具去背景、生成透明 PNG、去字或补绘。结果回传到 UI Studio，经检查后新增版本，并按偏好保存、打开独立本地文件夹；保留原素材。
4. 「连接与引擎」可查看本机状态与版本，或显式切换 OpenAI API。未安装、未登录、额度/网络异常、图像工具不可用或处理超时会明确报告，不以裁切代替模型结果。

本地 Codex 仍需联网，图片会交给 Codex 使用的模型服务，额度和可用功能受登录账号影响。分发给别人时，对方使用自己的本机 Codex 登录；发布包不含你的账号、API Key 或用户素材。连接检测只检查 CLI 和登录状态，不宣称图像工具权限已验证。

任务通过 `shell:false` 参数数组调用官方 CLI，使用 `--ephemeral`、`--ignore-user-config`、`--sandbox read-only` 和结构化输出。分析禁用工具；图像编辑禁用 shell/浏览器等工具，返回图像工具原始 PNG 路径，由应用接收。本地状态和任务记录位于 `data/codex-tasks/`，不会发布到 GitHub；不读取或复制 Codex 凭据文件。接口依据：[Codex 非交互模式](https://learn.chatgpt.com/docs/non-interactive-mode)。

图像专用任务通过 `project_doc_max_bytes=0` 不加载父项目的 AGENTS.md，只接收当前视觉处理要求；Codex 的管理策略和沙箱仍然生效。候选分析进度固定在分析按钮下方。

复刻弹窗分成三页：**步骤 1：分析原图 → 步骤 2：确认还原方案 → 步骤 3：预览与保存**。每页只展示当前步骤；页头与底部导航固定，中间内容独立滚动。分析完成进入第 2 页；设计师确认底板、文字和图标后，点击「下一步：确认并生成预览」，处理成功进入第 3 页。候选分析不会自动去字、生成图标或发布文件。上一步保留方案，不自动重新分析；最后检查实际预览与交互，再保存版本和本地文件。

已在开发机实际验证无 UI Studio API Key 的图片识别，以及本地图像工具生成透明 PNG 并回传。自动测试另外覆盖模拟引擎下的设计师确认、结果发布、原素材保留与独立本地交付。真实图像连接验证不代表 90% 复刻率已通过，具体组件仍需设计师对照验收。

## 任意组件复刻与代码文字（0.3.0-beta.5）

选中素材，点击「复刻 HTML5 + CSS」，不要求它是按钮。组件类型可自动分析或手动选择按钮、面板、卡片、标签、文字、图标、输入框、进度条、装饰或其他。静态内容用容器，输入框用真实 input，按钮才有按钮交互。

- 单纯外框、纯色、微渐变用 CSS；复杂发光、玻璃或金属质感以保真优先，保留完整去字图片底板，不用粗糙 CSS 近似。例：紫色“花园守护”=CSS+代码文字；黄色发光价格牌=完整去字底板+独立红心 SVG/PNG+代码数字198。还原策略可自动判断或手动指定。
- 小图标优先使用独立 SVG path；复杂或被遮挡的图标逐项生成透明 PNG 并补绘，经 Alpha 与视觉检查后独立叠加。工程包 icons/ 中保存 SVG/PNG，独立 index.html 内嵌图标资源。混合底图会去掉独立图标，避免叠出两套。
- 标题、正文、数值、提示等逐项识别为 texts，通过 HTML 文字呈现；可编辑内容、位置、尺寸与颜色。
- 混合模式先去除原图所有文字并补绘，通过残字及图形检查后用作底图，再叠加代码文字；失败会报告，不用带字原图兜底。没有文字的图形可直接用原图。
- 无 API 时可导入本地 Codex 组件 JSON，也可上传已去字底图并手动添加文字。上传者需确认图片中原文字已移除。
- 还原度以 ≥90% 为目标。可点击“比对网页与原图”：在浏览器栅格化实际 HTML/CSS 后交给视觉模型检查整体布局、色彩、质感、文字和图标。显示模型估算分数与问题；修改配置后旧评分失效。模型评分不等同像素测量或人工验收。
- PNG 图标与底图按约 2 倍展示尺寸输出，不对原 PNG 改写；SVG 优先，工程片段可分离缓存资源，独立 HTML 内嵌资源方便离线携带。原生输入、焦点、按下与禁用反馈不依赖额外运行库。
- 保存为新版本，代码配置保存在 htmlComponent；本地和 ZIP 中 html-components/EL-ID/ 包含 index.html、component.html、component.css、component.json、reference.png，混合模式另有去字 source.png。旧 htmlButton 与旧工程包仍可读取。
- API：POST /api/ui/:id/html-component/plan 返回候选；POST /api/ui/:id/html-component/generate 携带 plan、designerConfirmed=true、expectedVersion、targetId 执行设计师确认方案；GET /api/ui/:id/html-component/:element/export?version=N。模型复刻和去字质量需要实际验收，自动检查不是像素级保证。

## 旧版按钮复刻（0.3.0-beta.4，兼容历史）

选中已保存的素材，在「素材属性」点击「复刻 HTML5 + CSS 按钮」。只处理选中 PNG，原图与可点击 HTML 并排对照。

- **原图贴图**：无需 API，保留 PNG 的纹理、复杂装饰与固有文字；输出原生 HTML button + CSS + PNG，不声称为纯 CSS 绘图。无障碍名称不会修改图片中字样。
- **CSS 复刻**：使用现有视觉模型分析该图的渐变、位置、圆角、描边、高光、阴影、文字与图标，生成 HTML/CSS；支持修改文字、尺寸、字号、颜色及完整样式 JSON。不同源图生成不同参数，不使用通用模板。复杂纹理和字体可能不一致，需对照检查。未配置 API 时可复制 Codex 指令并导入样式 JSON。
- 可悬停、按下、键盘聚焦或切换禁用状态。业务点击事件由使用方项目绑定。
- 复制 HTML / CSS，或下载内嵌图片的独立 HTML。保存会新增版本，保留原始 PNG；本地保存和素材 ZIP 包含 `html-buttons/EL-ID/` 下的 index.html、button.html、button.css、button.json、source.png、README.txt。原图模式集成片段时必须同时复制 source.png；独立 index.html 则可离线使用。
- 模型返回受限结构化参数，服务端校验后生成代码，预览在无脚本权限的 iframe 中运行；不接收任意脚本或外部资源 URL。配置保存在素材 htmlButton 字段，恢复版本及 CLI/MCP 导入均保留。
- API：`POST /api/ui/:id/html-button/analyze` 使用 expectedVersion、targetId；只分析不保存。`GET /api/ui/:id/html-button/:element/export?version=N` 下载已保存代码工程。

自动测试与浏览器流程使用模拟视觉结果验证，真实 API 复刻质量尚未验收。贴图方案与 CSS 绘制方案明确分开标记。

## 内置版本与下载（0.3.0-beta.3）

- 更新页位于本机 `/updates/`，与工作台使用同一个服务；入口在顶部和底部，另开页面以保留素材编辑状态。
- `package.json` 为当前安装版本；`site/updates/releases.mjs` 是共享更新记录，随工具包交付。`shared/releases.mjs` 检查最新记录与工具版本匹配，并生成对应下载地址。
- 当前安装版本、具体改动、筛选、搜索、时间线、已读记录可离线查看。字体与样式复用本地工具资源。下载安装包、浏览 GitHub 历史版本需要联网；此功能不自动安装更新。
- `GET /api/release` 返回当前工具版本、内置更新记录和对应下载链接。制作下一版时，同时更新 package.json、package-lock.json 和共享更新记录，再构建、测试、打包。
- ChangelogPro 使用用户提供的组件；公开网站如需展示，可以复用同一份数据作为镜像，工具不依赖镜像站运行。

## 可选 OpenAI API 拆分（0.3 新增）

如选择独立 API 服务，在「连接与引擎」切换 OpenAI API 并填写使用者自己的密钥，上传并打开 UI 后点「开始 AI 拆分」。工具自动执行：

1. 视觉模型识别完整按钮、图标、标题和背景，生成有语义的素材清单与坐标。
2. 图像编辑模型逐项生成透明组件，移除场景底色，并按要求补绘遮挡区域和干净背景。
3. 检查真实 Alpha、可见主体，再用视觉模型检查完整性、相似度、额外背景和错误元素。
4. 单项质检失败最多再生成一次；仍失败则停止并保留进度，**不会使用轮廓切片替代并宣称完成**。
5. 全部通过后创建新版本，按偏好保存独立本地目录并打开文件夹。

默认识别／质检模型为 `gpt-4.1`，图像编辑模型为 `gpt-image-1.5`，可在设置中更换。接口使用 OpenAI Responses 结构化视觉输入和 Images Edits 透明 PNG；兼容服务需要同时支持这两个接口与相关参数。图像模型可能需要组织验证和相应权限。

**使用者自己配置，不需要工具分发者提供密钥。** 密钥只保留在本机服务内存中，不写入浏览器存储、数据库、仓库或发布包；服务重启后需重填。也可在外部运行环境中设置 `OPENAI_API_KEY`；`OPENAI_BASE_URL` 可在首次启动时指定接口地址。非秘密模型设置保存在本机数据库。

原图、参考裁切与生成结果会发送到使用者配置的模型服务并产生 API 费用。每个任务默认最多 24 项（可设 1–40），每项最多两次生成；连接检查只验证密钥与模型可见性，不执行付费生成，也不能证明实际图像生成权限。

任务进度和已通过检查的 PNG 保存到 `data/ai-jobs/`，失败、取消或服务重启后可续做，不重复生成已经通过检查的素材。任务使用创建时的原图版本；若期间版本变化，会拒绝发布而保留结果。当前同一服务同时只运行一个 AI 任务。

**验证范围：** 自动测试通过模拟模型服务验证请求格式、流水线、质检失败处理、取消、续做、版本与本地交付。发布环境没有配置真实 API Key，因此尚未进行真实模型拆分效果验收。AI 视觉评分不等同于人工验收；补绘是生成还原，不能保证与原图或源 PSD 分层逐像素一致。

API 参数依据：[图像编辑](https://developers.openai.com/api/reference/resources/images/methods/edit)、[结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)、[图像生成说明](https://developers.openai.com/api/docs/guides/image-generation)。

## 组件二次拆分（0.3.0-beta.2）

在素材网格中选中一张已保存的素材，在「素材属性」点击「再次拆分组件」。填写具体要求（可选），例如“把头像、金色边框、皇冠分别拆开，边框中央透明，补齐遮挡边缘”，先分析候选方案，再由设计师选择、调整并确认后生成。

- 以选中 PNG 的实际像素为参考继续细分，不重复生成整张 UI；至少识别两个独立子组件。
- 保留来源素材和其他已保存素材的 ID 与 PNG 字节，追加新组件并创建新版本。子组件仍可继续细分。
- 每项检查真实 Alpha 与模型视觉结果；空心边框、无字底板、独立文字等按拆分描述分别处理。失败保留进度，可取消、续做；版本有变化时拒绝覆盖。
- 按当前偏好独立本地保存并打开，manifest、catalog 与 ZIP 都保留来源记录。
- 未配置模型也可以复制「Codex 二次拆分指令」，使用本地 Codex 的图像工具处理；这与网页内独立 AI 引擎是两条执行方式。

接口沿用 `POST /api/ui/:id/ai`，请求 `{expectedVersion, targetId, instructions}`；省略 targetId 仍为整图拆分。新组件的 `lineage` 保存 parentId、sourceVersion、来源 PNG 的 width/height 及其中的像素 rect。普通 rect 为映射到整张 UI 的参考范围，AI 重建后不保证像素级排版精度。只完成局部补绘时保留原有整图补绘状态，不把未验收的背景标记为完成。CLI spec 和 MCP 回传均支持 lineage。

二次拆分使用相同模型服务与计费规则。已通过隔离模拟服务的自动测试和浏览器流程检查，真实 API 图像质量尚未验收。

## 已统一的默认要求

- 去背景、真实透明 PNG、遮挡区域补绘，默认全部启用；可在详情页保存此 UI 的处理偏好。
- Codex 复制指令、CLI 拉取的 `requirements.json`／`UI.md`、MCP `get_ui` 使用同一份要求。
- 组件检查实际透明像素，拒绝全不透明的伪透明 PNG 和完全空白透明图。完整底图标记 `role=background`，可以不透明。
- 素材可标记原图提取、去背景提取、AI 透明提取、AI 补绘和轮廓补齐；保存生成工具、提示词、补绘说明与状态。未提供证明时保留 `unknown`／`unverified`，不冒充完成。
- 有素材的新版本默认自动另存独立本地目录，并打开文件夹；可在页面复制路径、打开文件夹或另存副本。旧目录和历史版本均保留。
- PowerShell 启动器已移除，不恢复安全软件删除的文件，也不要求加白。项目启动使用 `npm start`，依赖安装与启动分开。

## 操作方式

1. 上传 JPG、PNG、WebP。可多选；每张最多 20 MB、2400 万像素。
2. 合集总览以卡片网格展示 UI，点击进入详情。
3. 详情左侧是原图、底部是同合集缩略图，右侧是拆分素材。顶部可复制 UI ID、链接、完整 Codex 处理指令，并手动同步。
4. 默认点击「交给本地 Codex」分析，设计师确认候选后执行生成、质检与保存；也可在「连接与引擎」选择 OpenAI API。进度中可查看方案、检查结果，取消或续做。
5. 完成后自动显示新版本和本地保存路径，可打开文件夹、下载单张 PNG 或 ZIP。CLI／MCP 与复制指令到本地 Codex 的方式仍然保留。
6. 可在网页框选、调整像素坐标、命名、预览纯色去背景，保存为新版本。
7. 「版本历史」可以查看旧快照，或恢复为一个新版本。

底部缩略图用于切换**同合集的不同 UI**；历史版本有单独入口，避免混淆。

## Codex 联动

### 直接用链接和命令行

在此项目目录运行（可把 `UI-ID` 替换成完整网页链接）：

```powershell
node bridge/cli.mjs get --id UI-ID
node bridge/cli.mjs pull --id UI-ID --out D:/YourProject/work
node bridge/cli.mjs history --id UI-ID
node bridge/cli.mjs publish --id UI-ID --base 1 --spec D:/YourProject/work/materials.json --inpainting completed --note "透明提取与遮挡补绘完成"
node bridge/cli.mjs save --id UI-ID
node bridge/cli.mjs open --id UI-ID
```

- `pull` 新建 `UI-ID-v版本` 目录，包含 `original.png`、`assets/`、`manifest.json`、`UI.md` 和 `requirements.json`。已有同名目录时拒绝覆盖。
- `publish` 回传一个**完整素材集**，始终新增版本，必须携带读取时的 `--base`。旧版本冲突返回 409，应先拉取最新内容。
- 用 `--spec 文件.json` 可同时指定素材名称、ID、原图坐标：

```json
[
  {"path":"D:/YourProject/work/icon.png","name":"购买图标","id":"EL-12345678","role":"component","method":"ai-inpainting","generatedBy":"imagegen","prompt":"去除场景底色，补齐遮挡外沿，保留原图图案，真实透明 PNG","rect":{"x":50,"y":100,"width":80,"height":80}},
  {"path":"D:/YourProject/work/background.png","name":"补绘底图","role":"background","method":"ai-inpainting"}
]
```

保留同一素材的 `id` 可维持跨版本的素材标识。省略时自动分配。原图坐标用于布局说明；独立素材 PNG 的实际分辨率单独记录。

`--inpainting` 可用 `completed`、`not-needed`、`pending`、`unverified`；只有实际执行完成才能填 completed。可用 `--report-notes` 附说明。没有传入状态时默认 unverified。发布响应返回 `localExport` 的实际路径、保存状态、打开状态。保存或打开失败时 CLI 退出码为 2；已经提交的版本不会回滚，应使用 save/open 重试，避免重复发布。

`save` 每次创建独立副本，默认按偏好打开；`save --no-open` 只保存。`open` 只打开本工具已登记的导出目录，不接受任意路径或执行文件。

原图更新会清空新版本的素材列表，旧素材仍保留在历史中：

```powershell
node bridge/cli.mjs update --id UI-ID --base 2 --image D:/YourProject/work/new-ui.png --note "更新界面设计"
```

如需指定另一台**本机端口**的服务，通过当前终端的 `UI_STUDIO_URL` 设置；当前客户端拒绝连接外网服务。

### MCP

`bridge/mcp.mjs` 使用官方 MCP SDK，提供 `get_ui`、`get_ui_group`、`get_ui_history`、`pull_ui`、`publish_ui_materials`、`save_ui_locally`、`open_ui_folder` 七个工具。回传接受 role、method、notes、generatedBy、prompt 和 inpainting 状态，默认自动保存本地并打开。

GitHub 仓库和发布包不包含本机 `.codex/config.toml`。请按实际解压路径注册 MCP；本机配置、上传图片和版本数据库均不会随工具发布。

也可手动注册：

```powershell
codex mcp add imageos_ui_studio -- node "本项目绝对路径/bridge/mcp.mjs"
```

配置方式参考 [OpenAI 官方 MCP 文档](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)。网页里的「Codex 联动」可查看步骤。

### 接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/folders` | 列出合集 |
| `GET /api/folders/GROUP-ID` | 合集下的 UI 和最新版本 |
| `GET /api/ui/UI-ID` | 当前版本 manifest |
| `GET /api/ui/UI-ID?version=N` | 固定历史版本 |
| `GET /api/ui/UI-ID/history` | 历史记录 |
| `POST /api/ui/UI-ID/versions` | 新增版本；携带 expectedVersion |
| `POST /api/ui/UI-ID/restore` | 从旧版本恢复成新版本 |
| `GET /api/ui/UI-ID/export?version=N` | 素材 ZIP |
| `GET /api/connection` | 本机 CLI、MCP 入口路径 |
| `GET /api/ui/UI-ID/context?version=N` | 当前处理要求、实际 Alpha 检查、本地导出位置 |
| `POST /api/ui/UI-ID/preferences` | 保存去背景／透明／补绘／保存／打开偏好 |
| `GET /api/ui/UI-ID/local?version=N` | 已保存的本地位置与打开结果 |
| `POST /api/ui/UI-ID/local` | 独立另存，可携带 version 和 open |
| `POST /api/ui/UI-ID/local/open` | 打开登记的本地目录，可携带 version／exportId |
| `GET /api/ai/settings` | 模型设置与密钥配置状态；不返回密钥 |
| `POST /api/ai/settings` | 保存非秘密设置；apiKey 仅存当前进程内存，clearKey 清除 |
| `POST /api/ai/test` | 检查 API Key 和两个模型的可见性，不生成图像 |
| `POST /api/ui/UI-ID/ai` | 创建独立 AI 任务；携带 expectedVersion |
| `GET /api/ui/UI-ID/ai` | 当前 UI 最近的 AI 任务 |
| `GET /api/ai/jobs/AI-ID` | 任务进度、方案和检查结果 |
| `POST /api/ai/jobs/AI-ID/cancel` | 取消正在运行的请求；保留进度 |
| `POST /api/ai/jobs/AI-ID/approve` | 设计师确认所选候选与像素边界后生成二次拆分 |
| `POST /api/ai/jobs/AI-ID/resume` | 从已完成素材之后续做；沿用任务的模型设置 |

网页链接 `/ui/UI-ID` 支持 `Accept: application/json`，并通过 HTTP `Link` 头指出对应 manifest 接口。

## 拆图能力边界

- 网页自带的是**轮廓检测、矩形切片和与边缘相连的纯色去背景**，适合简单底色与手动精确选区。
- 视频那种通过本地 Codex 执行的拆图，以 CLI／MCP 拉取和回传为桥梁；使用者的 Codex 需要能访问此项目和本机原图，再选择可用的模型／图像工具完成处理。
- 「AI 自动拆分」调用使用者配置的真实视觉与图像模型，独立完成识别、透明提取、补绘、质检和保存。它需要模型服务和网络，不能离线运行；未配置时明确提示设置，不退回简单轮廓裁切。
- 「辅助选区（非 AI）」仍是本地颜色算法，只适合简单底色与手动选区，不做语义识别或生成补绘。与 AI 拆分入口分别标注。
- 导入 PNG 会保留已有透明通道与像素；不会重新生成、重绘素材。
- 上传、回传与同步均写入本机磁盘。当前版本用于本地运行，未接入云存储。若以后公开部署，应先接入对象存储并补齐身份认证。

## 运行与存储

Node.js 22.13+，建议 Node.js 24。

```powershell
npm ci
npm run build
npm start
```

日常使用 `npm start`。依赖安装通过 `npm ci` 单独执行；不提供自动下载安装或隐藏启动的 PowerShell 启动器，不恢复已被安全软件删除的启动脚本。

数据在 `data/studio.sqlite` 和 `data/UI-ID/v版本-随机标识/`。备份时完整复制 `data/`，建议停止服务后备份 SQLite 文件。每个版本的原图和素材使用独立目录、不可变链接。版本写入采用数据库事务与基准版本检查。

用户可直接使用的素材目录默认在项目旁边的 `outputs/ui-studio-exports/UI-ID/v版本-时间-随机标识/`，包含 `assets/`、原图、manifest、素材清单、README 和棋盘底预览。`UI_STUDIO_EXPORT_ROOT` 可以单独指定本地导出根目录。每次另存创建新目录，不覆盖用户在旧目录增加或修改的文件。保存失败与打开失败分别反馈，版本内容始终保留。

服务仅监听 `127.0.0.1`，校验 Host 和浏览器 Origin，不暴露数据库文件。`UI_STUDIO_DATA` 可指定另一个本地数据目录；`PORT` 可指定端口。客户端端口需要同步配置。

界面沿用 ImageOs 的字体、品牌、深色基调和圆角按钮，按视频加入蓝色网格背景与双栏工作台。使用 OverlayScrollbars 2.17.0 + 官方 React 适配 0.5.7，保留原生滚动行为。字体使用本地 Inter、Noto Sans SC 与中文系统回退。

## 验证

`npm test`：覆盖独立 AI 请求协议、密钥不落盘、透明／视觉质检、失败不发布、取消续做、图片检测／切片、CLI／MCP、版本恢复、并发冲突、本地独立保存与接口边界。测试注入模型服务和文件夹打开器，不调用付费 API，也不弹出资源管理器。

`npm run build` 生成前端；`npm run package` 将当前代码与构建保存为项目上一级的 `ui-studio.zip`，显式排除 PowerShell 启动器、本机 Codex 配置和用户数据。GitHub Release 的 ZIP 已包含构建页面，解压后执行 `npm ci`、`npm start` 即可运行。

浏览器验证：上传选择入口、打开 UI、手动框选、命名、保存新版本、历史查看、本地 Codex 回传后同步、390px 窄屏与中文字体。Chrome 扩展不允许文件 URL 时，自动化无法直接填充本机文件选择框；本次测试通过本机上传 API 注入参考图片，再执行页面交互。普通用户直接选择文件不需要该扩展权限。

视频参考与可确认的操作见 [REFERENCE.md](./REFERENCE.md)。

### 设计师确认和按钮状态

再次拆分先分析候选，由设计师选择、改名、修改要求与像素边界，确认后生成。复刻先分析候选，设计师可选择组件类型、CSS/完整底板、图标用 SVG/透明图或留在底图；方案可用 JSON 精调，确认前不去字或补绘。视觉模型评分仅作参考，最终由设计师验收。

按钮按原图整体色彩与质感提出移入、按下、键盘焦点、禁用状态，默认态保留原图。状态编辑器可逐态预览，调整亮度、饱和度、缩放、位移、透明度、光晕、焦点线与过渡；选择“实际交互”即可操作。完整交互 CSS 随本地目录、独立 HTML 与 ZIP 保存，无需前端运行库；支持触摸、键盘和减少动画偏好。业务点击事件由集成项目绑定。非按钮不自动套按钮效果。模型推测的非默认状态属于待设计师确认的建议，并非原稿已有的状态。

## 复刻验收（0.3.0-beta.6）

在工作台点击“复刻验收”，或打开 `/review/UI-ID`。已保存的 htmlComponent 无需 API 即可对照原图、以 1×/2× 预览并试用，修改代码文字、查看代码和导出。静态组件可由设计师勾选后试验按钮反馈，取消勾选恢复原语义；保存修改创建新版本。

设计师可记录“通过”“需要调整”及意见。服务校验 expectedVersion 与组件摘要，未保存的修改不能误标通过。新版本重新待验收，旧版本意见保留。每次提交意见按本地保存偏好创建独立交付目录，review-report.json 同时随本地目录和完整素材 ZIP 提供。发布 ZIP 不包含本机验收样例和用户图片。

接口：GET /api/ui/:id/reviews?version=N；POST /api/ui/:id/reviews，字段 expectedVersion、targetId、digest、status(pending/approved/changes-requested)、note。

## 候选分析反馈（0.3.0-beta.7）

“分析候选方案（AI）”先检查本机服务配置，再显示分析中状态；按钮旁显示阻塞原因，并提供同窗设置和本地 Codex/导入方案入口。已有 htmlComponent 打开即可预览和编辑，重新分析单独注明会调用 AI。新素材分析需要模型服务；设计师确认的纯 CSS/SVG 导入方案可以本地编译，无需 API。未配置服务时不会发送图片、伪造候选或改写素材。
