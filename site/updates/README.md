# UI Studio 共享版本更新页

工具内入口：http://127.0.0.1:4763/updates/ ，随安装包交付，工作台顶部“版本与下载”打开。当前安装版本由 package.json 确定，shared/releases.mjs 检查与更新记录匹配。

www.opsu.cc/updates/ 是可选的公开镜像与下载说明，不提供 UI Studio 后端，不是工具运行地址。

使用用户提供的 ChangelogPro 组件，保留分类筛选、搜索高亮、展开／折叠、已读记录、时间线及深链接；界面改为中文，并补充每个真实版本的下载入口。没有使用示例中的虚构版本。

版本数据在 `releases.mjs`，按新到旧排列。每条需说明工具名、版本号、发布日期、实际变更、验证范围和下载地址。预览版与真实模型尚未验收的状态必须保留。后续更新此文件，再执行 `npm run build:updates`；输出到项目同级的 `opsu-updates/`。

组件代码为用户粘贴的 `ChangelogPro.mjs` 的适配版；样式取自同一组件的现有源码。公开镜像的字体与许可放在独立 OSS 前缀 `ui/20261029-www-ui-studio-updates/`，线上只引用 `https://media.opsu.cc/`。分类与主页面独立滚动使用 OverlayScrollbars 2.17.0；支持中文字体回退、深浅色及减少动态效果。

本次通过构建、浏览器搜索／展开测试、真实字体加载检查及媒体 SHA-256、MIME、www 跨域检查。部署保留原首页文件夹和现有作品资源，只在首页加入入口；不把本地 UI Studio 后端或用户上传图片部署到公网。
