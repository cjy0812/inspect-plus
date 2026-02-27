# 源码开发运行指南

## 运行环境

- Node.js 18+
- pnpm 8+
- Git
- 浏览器（推荐 Chrome 或 Firefox）

## 推荐 VSCode 插件

- Vue - Official (Volar)
- ESLint (可选checker)
- Prettier（可选code checker）
- SCSS
- TypeScript
- Markdown

> 请勿同时安装 Vetur，可能导致类型冲突。

## 克隆项目
`git clone https://github.com/cjy0812/inspect-plus.git`

`cd inspect-plus`

## 安装依赖
`pnpm install`

## 运行项目

`pnpm dev`

## 访问项目

在浏览器中打开 `http://localhost:8444` 即可查看项目运行效果。

## 在线部署指南

### - 部署到 Cloudflare Pages
1. 获取认证凭据 (Secrets)

因为你是通过 GitHub Actions 远程“推”文件给 Cloudflare，而不是让 Cloudflare 来“拉”代码，所以必须给 Actions 授权。

  * 获取**CLOUDFLARE_ACCOUNT_ID**:

  * 登录 Cloudflare 控制台，点击左侧的**Computer**-> **Workers & Pages**  。

  * 在右侧栏可以看到 **Account ID**，复制它备用。

  ![image-20260228055225745](./images/01_CF-AccountID.webp)

---

  * 获取**CLOUDFLARE_API_TOKEN**:
  * 点击左上角快速搜索 -> 输入**api** -> **回车**，出现 **账户API令牌**-> **创建令牌**
<div style="display:flex; gap:10px;">
  <img src="./images/02_CF-API-Tokensearch.webp" alt="image-20260228055053315" style="zoom:46%;" />
  <img src="./images/03_CF-API-Tokenadd.webp" alt="image-20260228055937967" style="zoom: 38%;" />
</div>

  * 使用**自定义令牌**-> **开始使用**

  <img src="./images/04_CF-API-Tokenadd-02.webp" alt="image-20260228061105050" style="zoom:80%;" />

  * 确保权限包含 `Cloudflare Pages: Edit`！

  <img src="./images/05_CF-API-Tokenedit.webp" alt="image-20260228061622372" style="zoom: 80%;" />

  * 点击**创建令牌**后**复制字符串**
<div style="display:flex; gap:10px;">
  <img src="./images/06_CF-API-Tokenadd-03.webp" alt="image-20260228061932995" style="zoom:67%;" />
  <img src="./images/07_CF-API-Tokencopy-02.webp" alt="image-20260228062213438" style="zoom:80%;" />
</div>

---

2. **配置到 GitHub**:

  * 到你的Github仓库点击**设置** -> **机密和变量**下拉菜单 -> **操作** -> 点击`新建操作变量`
    ![image-20260228065533714](./images/08_Github-settings.webp)
  
  * 将`CLOUDFLARE_ACCOUNT_ID`与`CLOUDFLARE_API_TOKEN`分别填进去

  ![image-20260228070118137](./images/09_Github-add.webp)

### - 部署到 GitHub Pages

把 GitHub Pages 的部署方式改为 YAML（Actions）分发后，**必须**在 GitHub 仓库设置里进行一次“接头认证”，否则 Actions 跑完后页面也不会更新。

具体操作只有以下 **3 步**：

### 1. 切换部署源 (最关键)

GitHub 默认会去寻找 `gh-pages` 分支，现在我们要告诉它“等 Actions 的信号”。

1. 进入你的 GitHub 仓库页面。

2. 点击右上角的 **Settings** (设置)。

3. 在左侧菜单栏找到 **Pages**。

4. 在中间的 **Build and deployment** > **Source** 下拉菜单中，将 `Deploy from a branch` 切换为 **`GitHub Actions`**。

   ![image-20260228071928239](./images/10_GitHub-pages.webp)

---

### 2. 检查仓库权限

由于你的 YAML 中定义了 `permissions`，通常不需要额外操作。但如果部署报错 `403`，请检查：

1. **Settings** -> **Actions** -> **General**。

2. 滚动到底部的 **Workflow permissions**。

3. 确保勾选了 **Read and write permissions**（虽然 YAML 里的声明优先级更高，但这里是全局总开关）。

   ![image-20260228072140913](./images/11_GitHub-pages-write.webp)

---

### 3. (可选) 配置自定义域名

如果你之前在 GitHub Pages 绑定了自定义域名（如 `docs.example.com`）：

* 在使用 Actions 部署时，构建产物 `dist` 目录里**必须包含一个名为 `CNAME` 的文件**，内容是你的域名。
* 或者在部署成功后，去 **Settings** -> **Pages** 重新填一遍自定义域名，GitHub 会自动帮你处理。


## 项目目录结构

```bash
inspect-plus/
├─ src/                         # 前端运行时代码（核心逻辑）
│  ├─ main.ts                   # SPA 入口文件，创建应用并挂载
├─ public/                     # 静态资源目录
│  ├─ .nojekyll                # 阻止 GitHub Pages 忽略下划线开头的文件
│  └─ _redirects               # 重定向配置文件
├─ images/                     # 项目文档图片资源
│  ├─ 00_Snap-tree-demo.mp4    # 演示视频1
│  ├─ 01_Snap-tree-demo-dark.mp4 # 演示视频2
│  ├─ 02_Snap-tools.mp4        # 演示视频3
│  ├─ 03_Property-Panel_Tip.mp4 # 演示视频4
│  ├─ 04_Drak_sport.mp4        # 演示视频5
│  ├─ 05_settings.webp         # 设置面板截图
│  ├─ ...                      # 其他图片资源
│  └─ Run-action.webp          # 运行动作截图
├─ .github/                    # GitHub 配置目录
│  └─ workflows/
│     └─ deploy.yml            # 自动部署工作流配置
├─ plugins/                    # Vite 插件目录
│  ├─ _404Page.ts              # 404页面插件
│  ├─ index.ts                 # 插件入口文件
│  ├─ miniSvg.ts               # SVG处理插件
│  ├─ mirror.ts                # 镜像处理插件
│  └─ unAutoImport.ts          # 取消自动导入插件
├─ scripts/                    # 项目油猴脚本目录
│  └─ updateVersion.ts         # 版本更新脚本
├─ userscripts/                # URL工具脚本目录
│  └─ url-redirect.user.js     # URL重定向用户脚本
├─ node_modules/               # Node.js依赖包目录
├─ .eslintcache                # ESLint缓存文件
├─ .eslintrc-auto-import.json  # 自动导入ESLint配置
├─ .gitignore                  # Git忽略文件配置
├─ .npmrc                      # npm配置文件
├─ .prettierignore             # Prettier忽略文件配置
├─ .prettierrc.mjs             # Prettier配置文件
├─ eslint.config.ts            # ESLint配置文件
├─ index.html                  # HTML模板文件
├─ package.json                # 项目配置文件
├─ pnpm-lock.yaml              # pnpm依赖锁定文件
├─ pnpm-workspace.yaml         # pnpm工作区配置文件
├─ README.md                   # 项目说明文档
├─ tsconfig.app.json           # 应用TypeScript配置文件
├─ tsconfig.json               # TypeScript主配置文件
├─ tsconfig.node.json          # Node.js TypeScript配置文件
├─ uno.config.ts               # UnoCSS配置文件
└─ vite.config.ts              # Vite构建配置文件
```

### src 目录结构详情

```bash
src/
├─ assets/                     # 静态资源
│  └─ svg/                     # SVG图标资源
│     ├─ arrow.svg             # 箭头图标
│     ├─ close.svg             # 关闭图标
│     ├─ code.svg              # 代码图标
│     ├─ copy.svg              # 复制图标
│     ├─ delete.svg            # 删除图标
│     ├─ device.svg            # 设备图标
│     ├─ discussion.svg        # 讨论图标
│     ├─ export.svg            # 导出图标
│     ├─ github.svg            # GitHub图标
│     ├─ home.svg              # 主页图标
│     ├─ import.svg            # 导入图标
│     ├─ info.svg              # 信息图标
│     ├─ minus.svg             # 减号图标
│     ├─ ok.svg                # 确认图标
│     ├─ path.svg              # 路径图标
│     ├─ prop.svg              # 属性图标
│     ├─ search-list.svg       # 搜索列表图标
│     ├─ search.svg            # 搜索图标
│     ├─ settings.svg          # 设置图标
│     ├─ share.svg             # 分享图标
│     ├─ system.svg            # 系统图标
│     ├─ terminal.svg          # 终端图标
│     ├─ test.svg              # 测试图标
│     ├─ warn.svg              # 警告图标
│     └─ ...                   # 其他SVG图标
├─ components/                 # Vue组件
│  ├─ ActionCard.vue           # 动作卡片组件
│  ├─ BodyScrollbar.vue        # 滚动条组件
│  ├─ DraggableCard.vue        # 可拖拽卡片组件
│  ├─ ErrorDlg.vue             # 错误对话框组件
│  ├─ FullScreenDialog.vue     # 全屏对话框组件
│  ├─ GapList.ts               # 间隙列表组件
│  ├─ SelectorText.vue         # 选择器文本组件
│  ├─ SettingsModal.vue        # 设置模态框组件
│  ├─ SvgIcon.vue              # SVG图标组件
│  ├─ TrackCard.vue            # 轨迹卡片组件
│  ├─ TrackGraph.vue           # 轨迹图组件
│  └─ ...                      # 其他组件
├─ composables/                # Vue组合式API函数
│  └─ usePreviewCache.ts       # 预览缓存组合函数
├─ store/                      # 状态管理
│  ├─ global.ts                # 全局状态
│  └─ storage.ts               # 存储状态
├─ style/                      # 样式文件
│  ├─ atom.scss               # 原子样式
│  ├─ html-reset.scss         # HTML重置样式
│  ├─ index.scss              # 样式入口文件
│  └─ var.scss                # CSS变量
├─ types/                      # 类型定义
│  ├─ auto-import-components.d.ts # 自动导入组件类型
│  ├─ auto-import.d.ts        # 自动导入类型
│  ├─ global.d.ts             # 全局类型定义
│  ├─ vue-components.d.ts     # Vue组件类型
│  └─ vue-router.d.ts         # Vue路由类型
├─ utils/                      # 工具函数
│  ├─ api.ts                  # API相关工具
│  ├─ check.ts                # 检查工具
│  ├─ chunk.ts                # 分块处理工具
│  ├─ clock.ts                # 时钟工具
│  ├─ commit.data.ts          # 提交数据工具
│  ├─ dialog.tsx              # 对话框工具
│  ├─ directives.ts           # 指令工具
│  ├─ discrete.ts             # 离散工具
│  ├─ draggable.ts            # 拖拽工具
│  ├─ en.json                 # 英文语言包
│  ├─ error.ts                # 错误处理工具
│  ├─ export.ts               # 导出工具
│  ├─ fetch.ts                # 获取工具
│  ├─ file_type.ts            # 文件类型工具
│  ├─ g6.ts                   # G6图表工具
│  ├─ github.ts               # GitHub工具
│  ├─ gm.ts                   # GM工具
│  ├─ i18n.ts                 # 国际化工具
│  ├─ import.ts               # 导入工具
│  ├─ node.ts                 # 节点工具
│  ├─ others.ts               # 其他工具
│  ├─ root.ts                 # 根工具
│  ├─ selector.ts             # 选择器工具
│  ├─ size.ts                 # 尺寸工具
│  ├─ snapshot.ts             # 快照工具
│  ├─ snapshotGroup.ts        # 快照组工具
│  ├─ svg.ts                  # SVG工具
│  ├─ table.tsx               # 表格工具
│  ├─ task.ts                 # 任务工具
│  ├─ url.ts                  # URL工具
│  ├─ zh.json                 # 中文语言包
│  └─ ...                     # 其他工具函数
├─ views/                      # 页面视图
│  ├─ home/                   # 主页视图
│  │  └─ HomePage.vue         # 主页页面
│  ├─ snapshot/               # 快照相关页面
│  │  ├─ AttrCard.vue         # 属性卡片组件
│  │  ├─ MiniHoverImg.vue     # 悬停小图组件
│  │  ├─ OverlapCard.vue      # 重叠卡片组件
│  │  ├─ RuleCard.vue         # 规则卡片组件
│  │  ├─ ScreenshotCard.vue   # 截图卡片组件
│  │  ├─ SearchCard.vue       # 搜索卡片组件
│  │  ├─ SelectorTestCard.vue # 选择器测试卡片组件
│  │  ├─ SnapshotPage.vue     # 快照页面
│  │  ├─ WindowCard.vue       # 窗口卡片组件
│  │  └─ snapshot.ts          # 快照相关工具
│  ├─ DevicePage.vue          # 设备页面
│  ├─ ImportPage.vue          # 导入页面
│  ├─ SelectorPage.vue        # 选择器页面
│  ├─ SvgPage.vue             # SVG页面
│  └─ _404Page.vue            # 404页面
├─ App.vue                     # 应用根组件
├─ main.ts                     # 应用入口文件
├─ router.ts                   # 路由配置
├─ shims.d.ts                  # 类型补充文件
└─ vite-env.d.ts               # Vite环境类型定义
```
