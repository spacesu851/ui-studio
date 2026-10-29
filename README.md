# ImageOs UI Studio 0.2

按用户提供的抖音视频界面和操作流程制作的本地 UI 拆图与素材版本工具。默认地址：**http://127.0.0.1:4763**。

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
4. 复制指令到本地 Codex，由它拉取原图并拆分素材，再回传。
5. 回到网页点击「同步」，查看素材和新增版本。本地保存路径直接显示在详情页，可打开文件夹，也可下载单张 PNG 或 ZIP。
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

网页链接 `/ui/UI-ID` 支持 `Accept: application/json`，并通过 HTTP `Link` 头指出对应 manifest 接口。

## 拆图能力边界

- 网页自带的是**轮廓检测、矩形切片和与边缘相连的纯色去背景**，适合简单底色与手动精确选区。
- 视频那种通过本地 Codex 执行的拆图，以 CLI／MCP 拉取和回传为桥梁；使用者的 Codex 需要能访问此项目和本机原图，再选择可用的模型／图像工具完成处理。
- 网页算法本身不具有 AI 分层和遮挡生成能力；补绘要求交给本地 Codex 配合可用图像工具执行，代码负责保存请求、检查 Alpha、记录处理来源并完成回传与本地交付。AI 补绘应标记，不是源 PSD 的精确恢复。
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

`npm test`：覆盖图片检测／切片、真实透明通道、CLI 拉取与回传、MCP 读取、版本恢复、并发冲突、存储重开、默认要求持久化、本地自动保存、独立副本、错误路径限制、保存／打开失败反馈和接口访问边界。测试注入文件夹打开器，不弹出资源管理器。

`npm run build` 生成前端；`npm run package` 将当前代码与构建保存为项目上一级的 `ui-studio.zip`，显式排除 PowerShell 启动器、本机 Codex 配置和用户数据。GitHub Release 的 ZIP 已包含构建页面，解压后执行 `npm ci`、`npm start` 即可运行。

浏览器验证：上传选择入口、打开 UI、手动框选、命名、保存新版本、历史查看、本地 Codex 回传后同步、390px 窄屏与中文字体。Chrome 扩展不允许文件 URL 时，自动化无法直接填充本机文件选择框；本次测试通过本机上传 API 注入参考图片，再执行页面交互。普通用户直接选择文件不需要该扩展权限。

视频参考与可确认的操作见 [REFERENCE.md](./REFERENCE.md)。
