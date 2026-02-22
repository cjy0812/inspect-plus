# GKD快照审查工具Plus
## 基于原版进行重构并增加一些功能

- 功能
  - [x] 快照树分类
  - [ ] 快照组备注
  - [x] 打开前预览快照图片
  - [x] 几乎完美支持**夜间模式**(99.8%)
  - [ ] `测试选择器`至快照页与搜索面板合并
  - [ ] `执行选择器`至快照页
  - [ ] `修改内存订阅`至快照页面
  - [ ] 更强大的`内存订阅管理器`
  - [x] 属性面板参数停留可显示解释
  - [x] 设置面板实现管理
  - [ ] 同web页内快照审查快速切换快照
  - [ ] 快查节点特殊颜色标记
  - [ ] 低内存模式
  - [ ] 国际化支持
- 优化
  - [x] 界面UI重构
  - [x] 点过快照标记**已查看**并有绿色遮罩
  - [ ] 快照图片时间戳难以辨识
  - [x] 小放大图坐标难以辨识

## 功能演示

### 快照图片预览 & 快照树分类 & UI重构

#### 白天

<video src="./images/00_Snap-tree-demo.mp4" controls autoplay loop muted width="80%"></video>

https://github.com/user-attachments/assets/079a48b0-aca8-46bb-95cf-589b08d7b546

#### 夜间

<details close>
<video src="./images/01_Snap-tree-demo-dark.mp4" controls autoplay loop muted width="80%"></video>

https://github.com/user-attachments/assets/3f97bf89-3e9f-4369-b080-d70049969b05

</details>

<details open>
  <summary>示例: 审查快照-搬入 测试选择器</summary>
<video src="./images/02_Snap-tools.mp4" controls autoplay loop muted width="100%"></video>
  
https://github.com/user-attachments/assets/7724a546-7722-4964-8f17-b55591fcef63

</details>

<details open>
  <summary>示例: 属性面板参数停留2s可显示解释</summary>
<video src="./images/03_Property-Panel_Tip.mp4" controls autoplay loop muted width="100%"></video>
  
https://github.com/user-attachments/assets/4127ae50-b1a1-4714-b314-3844c06a2890

</details>

<details open>
  <summary>示例: 选择器路径视图 白/夜 显示</summary>
<video src="./images/04_Drak_sport.mp4" controls autoplay loop muted width="100%"></video>
  
https://github.com/user-attachments/assets/f0c85372-7176-4530-b379-6f573e600f9a

</details>

### 设置面板

#### 你可以在里面自定义想要的喜好设置
![设置面板](./images/05_settings.webp)

<details open>
  <summary>示例: 实时执行点击选择器</summary>

![2023-09-02_14-12-08](https://github.com/gkd-kit/inspect/assets/38517192/af79f677-bac0-49a3-964c-6d4cace9d9c9)

</details>

## 快照示例

<details close>

- <https://i.gkd.li/i/14045424>
- <https://i.gkd.li/i/14039510>
- <https://i.gkd.li/i/14035418>
- <https://i.gkd.li/i/14034770>
- <https://i.gkd.li/i/14031920>
- <https://i.gkd.li/i/14018243>
- <https://i.gkd.li/i/14011298>
- <https://i.gkd.li/i/13999908>

</details>

## 项目结构
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
├─ scripts/                    # 构建脚本目录
│  └─ updateVersion.ts         # 版本更新脚本
├─ url-tools-script/           # URL工具脚本目录
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

## 🎉感谢以下项目

- [gkd-kit/inspect](https://github.com/gkd-kit/inspect) 原项目

## 🥇感谢以下开发者的贡献

- [CodeX](https://chatgpt.com/codex)

## 📈Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cjy0812/inspect-plus&type=date&legend=top-left)](https://www.star-history.com/#cjy0812/inspect-plus&type=date&legend=top-left)


