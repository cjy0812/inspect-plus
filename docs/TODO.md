# TODO (按风险与收益排序)

> 约束: 不破坏核心功能（树渲染、节点聚焦、快查定位、属性面板展示、主题切换可用）。
> 若某项改动导致上述能力回归，立即回滚该项并降级为“设计/预研任务”，不强推上线。

## P0 本周先做（低风险高收益）

- [X] `src/utils/node.ts`：将 `settingsStore` 导入移到文件顶部，修复导入顺序问题。
- [ ] `src/views/snapshot/WindowCard.vue`：去掉 `as any`（`data/filter/nodeProps/renderLabel`），补齐 Naive UI Tree 对应类型。
- [ ] `src/views/snapshot/WindowCard.vue`：将 `QuickFindMeta` 类型上移到脚本顶部，统一类型定义位置。
- [ ] `src/style/var.scss`：新增最小主题变量（背景、文本、边框、强调色、focusNodeColor）。
- [ ] `src/App.vue` + `src/style/index.scss`：先保留现有类切换逻辑，改为“类名 + CSS 变量”并存，移除一批可替代的硬编码颜色。
- [ ] `src/views/snapshot/AttrCard.vue`：拆解同一单元格中的双 Tooltip 触发逻辑，避免交互冲突（保留一个主 Tooltip，另一个改为图标说明或合并内容）。

## P1 下个迭代（中风险，需回归测试）

- [ ] 主题系统模块化：新增 `useTheme` composable，集中管理：
  - 主题模式（light/dark/auto）
  - 时间段策略
  - `prefers-color-scheme` 系统监听
  - DOM 类名与变量注入
- [ ] `src/style/index.scss`：按组件域分层替换颜色，逐步消除 `html.dark-mode-active ... !important`。
- [ ] `src/views/snapshot/WindowCard.vue`：统一滚动策略（二选一）：
  - 仅 `treeRef.scrollTo`
  - 或仅 `scrollIntoView`
- [ ] `src/views/snapshot/WindowCard.vue`：快查元数据缓存优化（基于根节点 identity/version 的 memo），避免重复全树计算。

## P2 结构优化（较高改动量，分批推进）

- [ ] `src/views/snapshot/AttrCard.vue`：按职责拆小组件（属性名单元格、属性值单元格、解释 Tooltip）。
- [ ] `src/views/snapshot/WindowCard.vue`：统一风格选择（继续 TSX 或迁回模板渲染），避免混合风格继续扩散。
- [ ] `src/utils/node.ts`：清理未使用工具函数（先通过引用扫描确认后再删）。

## 验收清单（每项完成都要过）

- [ ] 树节点点击/聚焦/展开行为与当前一致。
- [ ] 快查图标、快查跳转、属性面板展示无回归。
- [ ] 深浅色切换无明显闪屏，且颜色语义一致。
- [ ] `pnpm lint` 与类型检查通过。
