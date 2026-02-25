# GKD快照审查工具Plus
#### 基于原版进行重构并增加一些功能与优化

## 功能演示

### 快速预览 & 快照树分类 & UI重构

### 白天/夜间模式

<div align="center">
  <table border="0">
    <tr>
      <td align="center" style="border: none;">
        <b>☀️ 日间模式</b><br>
        <img src="./images/00_Light.webp" />
        <img src="./images/01_Light-2.webp" />
      </td>
      <td align="center" style="border: none;">
        <b>🌚 夜间模式</b><br>
        <img src="./images/02_Dark.webp" />
        <img src="./images/03_Dark-2.webp" />
      </td>
    </tr>
  </table>
</div>

### 快照审查页-多种工具供你快速调用

![快照审查页-工具](./images/04_Tools.webp)

### 选择器实时语法检查

![选择器实时语法检查](./images/05_Selector-check.webp)


### 属性面板参数用途提示

![属性参数用途提示](./images/06_Property-tip.webp)


### 选择器路径视图UI无缝切换

<div align="center">
  <table border="0">
    <tr>
      <td align="center" style="border: none;">
        <b>☀️ 日间模式</b><br>
        <img src="./images/07_Selector-path-light.webp" />
      </td>
      <td align="center" style="border: none;">
        <b>🌚 夜间模式</b><br>
        <img src="./images/08_Selector-path-dark.webp" />
      </td>
    </tr>
  </table>
</div>


### 设置面板

#### 你可以在里面自定义想要的喜好设置

![设置面板](./images/09_settings.webp)

<details open>
  <summary>示例: 实时执行点击选择器</summary>

![实时执行点击选择器](./images/10_Click-selector.webp)

</details>

## 使用方法

### 目前需要使用脚本把官方域名重定向至本项目的域名，否则无法无感实现这些功能与优化，脚本源代码在本项目的[userscripts](./userscripts/url-redirect.user.js)目录下。

1. 安装[油猴脚本管理器](https://www.tampermonkey.net/index.php?browser=chrome&locale=zh)扩展。
2. 点击[这里](https://github.com/cjy0812/inspect-plus/raw/refs/heads/main/userscripts/url-redirect.user.js)打开脚本安装页面，点击安装。
3. 刷新GKD快照审查工具页面，即可重定向生效。

### 如果你还使用了miku增强脚本，你需要自行编辑增强脚本，把本项目域名添加到生效域名中，否则增强脚本的功能将无法正常使用。

```.js
// @match              https://li.chenge.eu.org/*
```

![添加本项目域名至生效域名](./images/11_Domain-add.png)

## 快照示例

<details close>

- <https://i.gkd.li/i/14045424>
- <https://i.gkd.li/i/14039510>
- <https://i.gkd.li/i/14035418>
- <https://i.gkd.li/i/14034770>
- <https://i.gkd.li/i/14031920>
- <https://li.chenge.eu.org/i/14018243>
- <https://li.chenge.eu.org/i/14011298>
- <https://li.chenge.eu.org/i/13999908>

</details>

## 项目进度

- 功能
  - [x] 快照树分类
  - [ ] 快照组备注(40%)
  - [x] 打开前预览快照图片
  - [x] 几乎~~完美~~支持夜间模式(99.8%)
  - [x] `测试选择器`至快照页与搜索面板合并
  - [x] `执行选择器` `修改内存订阅` 至快照审查页
  - [ ] 更强大的`内存订阅管理器`(0%)
  - [x] 属性面板参数停留可显示解释
  - [x] 设置面板实现管理
  - [ ] 同web页内快照审查快速切换快照(0%)
  - [x] 快查节点特殊颜色标记
  - [ ] 低内存模式(20%)
  - [ ] 国际化支持(0%)
  - [ ] 删除手机端快照管理(0%)
- 优化
  - [x] 界面UI重构优化
  - [x] 完善图标
  - [x] 点过快照标记**已查看**并有绿色遮罩
  - [x] 快照图片时间戳难以辨识
  - [x] 小放大图坐标难以辨识
  - [ ] 选择器查询输入框支持自动换行(0%)
  - [ ] 选择器查询支持matches数组(0%)

## 源码运行

[查看源码运行指南](./docs/structure.md)

## 🎉感谢以下项目

- [gkd-kit/inspect](https://github.com/gkd-kit/inspect) 原项目

## 🥇感谢以下开发者的贡献

- [CodeX](https://chatgpt.com/codex) AI高阶构思项目
- [Trae](https:///www.trae.ai) AI重复性劳动
- [Gemini](https://gemini.google.com/) AI辅助指导

## 📈Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cjy0812/inspect-plus&type=date&legend=top-left)](https://www.star-history.com/#cjy0812/inspect-plus&type=date&legend=top-left)


