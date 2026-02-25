export type TodoItem = {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  notes?: string;
};

export const todoList: TodoItem[] = [
  {
    id: 'theme-refactor-1',
    title:
      '重构主题系统：只保留 light/dark/auto，CSS 变量驱动，组件无硬编码颜色',
    status: 'todo',
    notes:
      '满足：系统主题监听、无闪屏、无组件内 document 操作、逻辑在 composable。',
  },
  {
    id: 'theme-refactor-2',
    title: '移除基于时间的暗色切换逻辑',
    status: 'todo',
    notes: '不允许 setTimeout 或时间判断强制切换。',
  },
  {
    id: 'theme-refactor-3',
    title: '统一 SVG 使用 currentColor',
    status: 'todo',
    notes: '检查 SvgIcon 与图标资源，避免硬编码 fill/stroke。',
  },
  {
    id: 'src-structure-audit',
    title: '检查 src 是否存在大杂烩，按模块整理',
    status: 'todo',
    notes: '模块独立分组，降低耦合，便于维护。',
  },
];
