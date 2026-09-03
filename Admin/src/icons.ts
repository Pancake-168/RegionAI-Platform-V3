// 全局统一 Icon 清单
// 所有页面/组件需要图标时，必须从这里按语义取，禁止在业务代码中直接写 icon 字符串。
export const ICONS = {
  add: 'codicon:add',
  bell: 'codicon:bell',
  arrowSwap: 'codicon:arrow-swap',
  calendar: 'codicon:calendar',
  check: 'codicon:check',
  chevronDown: 'codicon:chevron-down',
  chevronLeft: 'codicon:chevron-left',
  chevronRight: 'codicon:chevron-right',
  chromeClose: 'codicon:chrome-close',
  chromeMaximize: 'codicon:chrome-maximize',
  chromeMinimize: 'codicon:chrome-minimize',
  chromeRestore: 'codicon:chrome-restore',
  close: 'codicon:close',
  copy: 'codicon:copy',
  debugRestart: 'codicon:debug-restart',
  debugStop: 'codicon:debug-stop',
  darkMode: 'material-symbols:dark-mode',
  debugStart: 'codicon:debug-start',
  edit: 'codicon:edit',
  error: 'codicon:error',
  folderOpened: 'codicon:folder-opened',
  github: 'codicon:github',
  home: 'codicon:home',
  info: 'codicon:info',
  lightMode: 'material-symbols:light-mode',
  person: 'codicon:person',
  question: 'codicon:question',
  refresh: 'codicon:refresh',
  search: 'codicon:search',
  settingsGear: 'codicon:settings-gear',
  output: 'codicon:output',
  starFull: 'codicon:star-full',
  trash: 'codicon:trash',
} as const

export type IconName = keyof typeof ICONS

export function getIcon(name: IconName): string {
  return ICONS[name]
}
