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

### 部署到 Cloudflare Pages

> [!IMPORTANT]
> **部署方式说明（二选一）**
> 1. **自动分发模式 **：
> 直接配置 GitHub Secrets（Token）。当你修改代码并 `push` 后，GitHub Actions 会自动帮你在 **Cloudflare Pages** 和 **GitHub Pages** 同时更新网页，版本号也会自动更新。
> 2. **网页直接绑定模式 **：
> 在 Cloudflare 后台直接关联 GitHub 仓库。虽然设置简单，但无法运行项目自定义的自动更新脚本，可能导致网页显示的版本信息不准。
> 


1. 获取认证凭据 (Secrets)

因为你是通过 GitHub Actions 远程“推”文件给 Cloudflare，而不是让 Cloudflare 来“拉”代码，所以必须给 Actions 授权。

   * 获取**CLOUDFLARE_ACCOUNT_ID**:

   * 登录 Cloudflare 控制台，点击左侧的**Computer**-> **Workers & Pages**  

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
    
---
3. **在CloudFlare创建对应Pages**

  * 回到CF worker & pages页 -> 
    ![image-20260228090843607](./images/19_CF-Pagesmain.webp)
  * 点击`开始使用` -> 导入现有git存储库
<div style="display:flex; gap:10px;">
    <img src="./images/20_CF-Pagesadd.webp" alt="image-20260228091113378" style="zoom: 58%;" />
    <img src="./images/21_CF-Pagesadd-git.webp" alt="image-20260228091408354" style="zoom:67%;" />
</div>

  * 登录你的GitHub/GitLab账户后选择你自己仓库点继续
    <img src="./images/22_CF-Pagesadd-git-add.webp" alt="image-20260228091747114" style="zoom:67%;" />
  * 填写好参数(纯在CF网页构建需要)后点击`保存并部署`，Aciton构建用户只需留空
<div style="display:flex; gap:10px;">
    <img src="./images/23_CF-Pagescommad02.webp" alt="image-20260228092312160" style="zoom:67%;" />
    <img src="./images/25_CF-Pagescommad01.png" alt="image-20260228093307881" style="zoom:67%;" />
</div>

  * 回到项目源代码修改`.github/workflows/deploy.yml`文件其中`--project-name=你的pages名`![image-20260228092947111](./images/24_ci-CFyml.webp)



### 部署到 GitHub Pages

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

## 3. 发布NPM包 (非必须)

### 解决方案

#### 第一步：检查并重新配置 GitHub Secrets

1. **生成新 Token**：

   - 登录 [npmjs.com](https://www.npmjs.com/)。

   - 进入 **Access Tokens** -> **Generate New Token** ->
    <div style="display:flex; gap:10px;">
      <img src="./images/12_NPM-main.webp" alt="image-20260228080118195" style="zoom:40%;" />
      <img src="./images/13_NPM-main-token.webp" alt="image-20260228080331750" style="zoom:40%;" />
    </div>

   - 填好名称日期等信息后点`Generate token`
    <div style="display:flex; gap:10px;">
      <img src="./images/14_NPM-token-add01.webp" alt="image-20260228082205605" style="zoom:60%;" />
      <img src="./images/15_NPM-token-add02.webp" alt="image-20260228082342486" style="zoom:50%;" />
    </div>
   
   - 创建好点`copy`

    ![image-20260228083334285](./images/16_NPM-token-copy.webp)


2. **更新 GitHub 仓库配置**：
    - 进入仓库 **Settings** -> **Secrets and variables** -> **Actions**。
    ![image-20260228065533714](./images/08_Github-settings.webp)
    - 变量名称填 `NPM_TOKEN`，点击修改（或重新创建），粘贴刚才生成的 Token
    ![image-20260228084051262](./images/17_NPM-token-github.webp)

3. **修改发包名为自己**
   - 在根目录找到`package.json`文件把开头名字换成`@你的npm用户名（必须）/仓库名(非强制一样)`  
    ![image-20260228085420358](./images/18_NPM-Packagejson.webp)


## 项目源码目录结构

> 设计原则：`src` 内保持“官方主干 + plus 扩展层”分离。  
> 官方兼容代码优先放在原路径，增强逻辑统一收敛到 `plus/` 子目录，减少后续与官方合并冲突。

```bash
src/
├─ App.vue                      # 应用根组件
├─ main.ts                      # Vue 应用入口（createApp 挂载、插件注册）
├─ router.ts                    # 路由表与 Router 实例创建
├─ shims.d.ts                   # SFC/模块类型补充声明
├─ theme.ts                     # Naive UI 主题引用（discreteAppTheme）
├─ vite-env.d.ts                # Vite 环境类型声明
│
├─ assets/
│  └─ svg/                      # SVG 静态图标资源（页面与组件图标）
│
├─ components/                  # 通用组件（官方主干）
│  ├─ ActionCard.vue            # 通用动作卡片组件
│  ├─ BodyScrollbar.vue         # 页面滚动容器组件
│  ├─ DeviceControlTools.vue    # 设备控制工具栏组件
│  ├─ DialogContainer.vue       # 全局对话框挂载容器
│  ├─ DraggableCard.vue         # 可拖拽卡片容器
│  ├─ ErrorDlg.vue              # 错误提示对话框
│  ├─ FullScreenDialog.vue      # 全屏弹窗容器
│  ├─ GapList.ts                # 间隔列表渲染辅助（TSX 组件）
│  ├─ SelectorText.vue          # 选择器文本展示组件
│  ├─ SettingsModal.vue         # 设置面板弹窗
│  ├─ SvgIcon.vue               # SVG 图标渲染组件
│  ├─ TrackCard.vue             # 轨迹信息卡片组件
│  ├─ TrackGraph.vue            # 轨迹图可视化组件
│  └─ plus/                     # plus 新增 UI 组件
│     └─ snapshot/
│        ├─ AttrNameCell.vue    # 快照属性名单元格（plus）
│        ├─ AttrValueCell.vue   # 快照属性值单元格（plus）
│        └─ SelectorTestCard.vue # 选择器测试卡片（plus）
│
├─ composables/
│  └─ plus/                     # plus 组合式逻辑（页面增强）
│     ├─ useDeviceControlTools.ts # 设备控制工具逻辑封装（plus）
│     ├─ usePreviewCache.ts     # 预览 URL 缓存与释放逻辑（plus）
│     ├─ useSnapshotPlus.ts     # SnapshotPage 的 plus 状态/行为封装
│     └─ useTheme.ts            # 主题模式共享逻辑（plus）
│
├─ locales/
│  ├─ index.ts                  # i18n 初始化与语言注册
│  └─ lang/
│     ├─ en.ts                  # 英文文案
│     └─ zh-CN.ts               # 中文文案
│
├─ store/
│  ├─ dialog.ts                 # 对话框状态与 Promise 回调管理
│  ├─ global.ts                 # 全局运行态 Store
│  └─ storage.ts                # 本地持久化设置与 IndexedDB 状态
│
├─ style/
│  ├─ atom.scss                 # 原子样式类
│  ├─ html-reset.scss           # 基础样式重置
│  ├─ index.scss                # 全局样式入口
│  └─ var.scss                  # 全局样式变量
│
├─ types/
│  ├─ global.d.ts               # 全局类型扩展声明
│  ├─ vue-components.d.ts       # 组件自动导入类型声明
│  └─ vue-router.d.ts           # 路由相关类型补充
│
├─ utils/                       # 工具主干（官方兼容）
│  ├─ api.ts                    # 接口地址与 API 相关工具
│  ├─ check.ts                  # 数据校验工具
│  ├─ chunk.ts                  # 分块处理工具
│  ├─ commit.data.ts            # 提交信息常量数据
│  ├─ dialog.tsx                # 对话框渲染辅助（TSX）
│  ├─ directives.ts             # 全局指令定义
│  ├─ discrete.ts               # Naive UI 离散式 API 工具
│  ├─ draggable.ts              # 拖拽行为工具
│  ├─ error.ts                  # 错误处理工具
│  ├─ export.ts                 # 导出相关工具
│  ├─ fetch.ts                  # 网络请求封装
│  ├─ file_type.ts              # 文件类型识别工具
│  ├─ g6.ts                     # G6 图形绘制/边渲染工具
│  ├─ github.ts                 # GitHub 相关辅助方法
│  ├─ gm.ts                     # Greasemonkey/Tampermonkey 兼容工具
│  ├─ import.ts                 # 导入流程相关工具
│  ├─ node.ts                   # 节点数据处理工具
│  ├─ others.ts                 # 其他通用工具
│  ├─ root.ts                   # 根上下文/全局对象工具
│  ├─ selector.ts               # 选择器处理工具
│  ├─ size.ts                   # 尺寸/容量格式化工具
│  ├─ snapshot.ts               # 快照处理工具
│  ├─ svg.ts                    # SVG 处理工具
│  ├─ table.tsx                 # 表格渲染辅助（TSX）
│  ├─ task.ts                   # 异步任务工具
│  ├─ url.ts                    # URL 处理工具
│  └─ plus/                     # plus 增强工具（与主干解耦）
│     ├─ clock.ts               # 时间字符串解析/归一化（plus）
│     ├─ dialogService.ts       # 对话框服务单例（plus）
│     ├─ g6.ts                  # plus 的 G6 边样式与图元增强
│     ├─ json.ts                # 容错 JSON5 解析工具（plus）
│     ├─ selector.ts            # plus 选择器图标/连接符映射
│     ├─ snapshot.ts            # plus 快照元信息归一化
│     ├─ snapshotGroup.ts       # 快照按包名/Activity 分组工具
│     └─ url.ts                 # plus URL 生成与域名归一化工具
│
└─ views/
   ├─ DevicePage.vue            # 设备页
   ├─ ImportPage.vue            # 导入页
   ├─ SelectorPage.vue          # 选择器页
   ├─ SvgPage.vue               # SVG 调试/展示页
   ├─ _404Page.vue              # 404 页面
   ├─ home/
   │  └─ HomePage.vue           # 首页（快照列表与分组展示）
   └─ snapshot/
      ├─ AttrCard.vue           # 属性查看卡片
      ├─ MiniHoverImg.vue       # 悬浮缩略图
      ├─ OverlapCard.vue        # 重叠节点信息卡片
      ├─ RuleCard.vue           # 规则生成与编辑卡片
      ├─ ScreenshotCard.vue     # 截图卡片
      ├─ SearchCard.vue         # 搜索卡片
      ├─ snapshot.ts            # 快照页共享状态（useSnapshotStore）
      ├─ SnapshotPage.vue       # 快照主页面
      └─ WindowCard.vue         # 窗口信息卡片
```

#### 维护建议（便于后续同步官方更新）

1. 仅在 `plus/` 子目录放增强逻辑，避免修改主干同名文件。
2. `plus` 文件中统一使用 `@/` 绝对路径导入，不使用 `../` 回跳主干目录。
3. 组件层优先“组合式扩展”而不是直接改页面大文件，降低冲突面积。
4. 引入官方更新时，先合并主干，再逐步回放 `plus/` 目录改动。

#### 本次解耦补充（官方兼容路由层）

为减少后续与官方同路径文件冲突，当前将“可运行入口”切换到 `views/plus/` 目录，官方同名页面用于保持目录与实现基线：

```text
src/views/
├─ DevicePage.vue              # 官方基线页（保留）
├─ SelectorPage.vue            # 官方基线页（保留）
├─ SvgPage.vue                 # 官方基线页（保留）
├─ home/
│  └─ HomePage.vue             # 官方基线页（保留）
└─ snapshot/
   ├─ SnapshotPage.vue         # 官方基线页（保留）
   ├─ snapshot.ts              # 官方快照 store（保留）
   ├─ AttrCard.vue             # 官方基线组件（保留）
   ├─ MiniHoverImg.vue         # 官方基线组件（保留）
   ├─ OverlapCard.vue          # 官方基线组件（保留）
   ├─ RuleCard.vue             # 官方基线组件（保留）
   ├─ ScreenshotCard.vue       # 官方基线组件（保留）
   ├─ SearchCard.vue           # 官方基线组件（保留）
   └─ WindowCard.vue           # 官方基线组件（保留）
└─ plus/
   ├─ DevicePage.vue           # plus 设备页入口（路由实际使用）
   ├─ SelectorPage.vue         # plus 选择器页入口（路由实际使用）
   ├─ SvgPage.vue              # plus SVG 页入口（路由实际使用）
   ├─ home/
   │  └─ HomePage.vue          # plus 首页入口（路由实际使用）
   └─ snapshot/
      ├─ SnapshotPage.vue      # plus 快照页入口（路由实际使用）
      ├─ snapshot.ts           # plus 快照 store
      ├─ AttrCard.vue          # plus 组件
      ├─ MiniHoverImg.vue      # plus 组件
      ├─ OverlapCard.vue       # plus 组件
      ├─ RuleCard.vue          # plus 组件
      ├─ ScreenshotCard.vue    # plus 组件
      ├─ SearchCard.vue        # plus 组件
      └─ WindowCard.vue        # plus 组件
```
