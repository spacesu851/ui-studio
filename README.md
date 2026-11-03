# UI Studio

本地 UI 图片拆分与素材工作台。当前版本 **0.3.0-beta.25**，默认直连本机已登录的 Codex CLI。

## 启动

需要 Node.js 22.13+、已安装并登录的 Codex CLI。

```powershell
npm install
npm run build
npm start
```

打开 http://127.0.0.1:4763/ 。服务仅监听本机。依赖安装和启动分开执行，不提供 PowerShell 自动下载启动脚本，不复制任何 Codex 凭据。

## 最简单的工作方式

1. 项目库点击 UI 图，直接打开左原图、右素材的工作台；底部缩略图直接切换 UI。上传新图同样进入工作台，每张图有固定 UI ID。
2. 点击“拆分素材”打开弹窗，勾选去背景、透明 PNG、遮挡补绘三项要求后开始。
3. 本地 Codex 接收整图、ID 和要求，在一个任务中自主判断组件范围，调用真实图像工具拆分、补绘并整理回传。程序不按视觉分数、透明比例或白边判定拦截结果，不再固定 24 项逐项质检重试。
4. 回传结果自动新增版本，回到素材工作台。设计师查看是否满意，程序只显示 Alpha、尺寸和来源等事实，不把生成完成当作人工验收。
5. 不满意的素材可复制 UI ID、EL 素材 ID 或 SPLIT 任务 ID，连同修改意见再次交给 Codex；素材详情提供“复制给 Codex 修改”入口。修正时保留其他素材与历史，以新版本回传。

点击素材仍打开原有详情，可继续细分、复刻 HTML5/CSS 或下载。版本历史保留在素材面板，“项目信息与高级联动”提供本地保存和打开目录。移除四步导航及底部上一步/下一步；旧步骤链接兼容进入 /ui/UI-ID?stage=components 工作台。

原图中被遮挡的部分属于生成推断，不能声称原 PSD 无损分层。真实拆分效果最终由设计师判断；本次流程验证使用隔离模型替身，不作为真实图像质量验收。

## 结果与中断

生成图像保留来源、实际 Alpha 和“待设计师检查”状态。连接、额度、文件格式等技术错误会说明具体原因；已有文件与任务 ID 保留，可交给 Codex 继续处理。程序不会把没有返回的图片伪装为完成。不会用轮廓矩形冒充语义拆分。

任务与图像落在本地 data/，每次保存产生不可变版本和独立导出目录。更新要求 expectedVersion；旧任务已发布后不复用其 ID 绑定第二个结果，修正任务有新 ID。源码和发布 ZIP 不包含 data/、用户图片、导出目录、node_modules 或凭据。

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

bridge/mcp.mjs 提供 get_ui、get_ui_group、get_ui_history、pull_ui、publish_ui_materials、save_ui_locally、open_ui_folder、get_split_task、list_ui_tasks。使用自己的解压路径注册 STDIO，不复制其他人的配置。CLI 与 MCP 按相同 UI/素材/任务 ID 查找来源和回传版本。

## 网页组件

保留 CSS 可绘制部分；复杂质感使用去字底图，文字为可编辑代码，小图标用 SVG 或透明 PNG。复刻向导保留分析、方案确认、预览保存三页。生成图像不再经自动视觉拒绝门槛，去字、布局、效果和交互由设计师查看，不声称自动达到 90%。语法、安全 SVG、文件定位和版本冲突属于技术检查。

## 版本与分发

本地 /updates/ 随工具提供版本说明及下载。

- 源码：https://github.com/spacesu851/ui-studio
- 发布：https://github.com/spacesu851/ui-studio/releases/tag/v0.3.0-beta.25
- 工具包：https://github.com/spacesu851/ui-studio/releases/download/v0.3.0-beta.25/ui-studio-v0.3.0-beta.25.zip

分发给别人后，对方使用自己的本机 Codex 登录；OpenAI API 仍作为显式可选兼容引擎，密钥只放本机服务内存或环境变量。字体、Logo 与 favicon 本地打包；保留 OverlayScrollbars 和按需加载的 GSAP 微交互，减少动态效果时停用动画。

## 检查与打包

```powershell
npm test
npm run build
npm run build:updates
npm run package
```

测试使用隔离数据和模拟模型，不消费图像 API，不打开用户文件夹。
