// ==UserScript==
// @name         GKD快照审查器自定义域
// @namespace    ling
// @version      3.0
// @description  重定向 i.gkd.li 并使用自定义域配置，采用同步极速匹配，拒绝全局页面闪烁
// @author       Ling
// @match        http://*/*
// @match        https://*/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const SOURCE_HOST = 'i.gkd.li';
  const curHost = location.hostname;
  const isSource = curHost === SOURCE_HOST;
  const HIDE_CLASS = 'gkd-prevent-flash';

  /* ========= 1. 极致优化的隐藏逻辑 =========
     绝不能在全局隐藏页面！只在确认为源站 (i.gkd.li) 时才注入隐藏样式，保护其余全部网站性能。
  */
  if (isSource) {
    try {
      const style = document.createElement('style');
      style.id = 'gkd-hide-style';
      style.textContent = `html.${HIDE_CLASS} > body { visibility: hidden !important; }`;
      const parent = document.head || document.documentElement;
      parent.insertBefore(style, parent.firstChild);
      document.documentElement.classList.add(HIDE_CLASS);
    } catch (e) {
      console.warn('[GKD] 无法注入隐藏样式', e);
    }
  }

  /* ======== 2. 常量与环境准备 ======== */
  const DEFAULT_CUSTOM = 'https://li.chenge.eu.org';
  const STORE_REDIRECT_ENABLED = 'gkd_redirectEnabled';
  const STORE_CUSTOM_DOMAIN = 'gkd_customDomain';
  const STORE_SKIP_PREFIX = 'gkd_skip_';

  const _GM_getValue =
    typeof GM_getValue !== 'undefined' ? GM_getValue : (k, d) => d;
  const _GM_setValue =
    typeof GM_setValue !== 'undefined' ? GM_setValue : () => {};

  // 恢复页面可见性
  function restoreVisibility() {
    if (!isSource) return;
    try {
      document.documentElement.classList.remove(HIDE_CLASS);
      const s = document.getElementById('gkd-hide-style');
      if (s) s.remove();
    } catch (e) {}
  }

  /* ========== 3. 决策核心（利用同步 Fast-Path） ========== */
  (async function decideAndMaybeRedirect() {
    // 读取配置（兼容同步读取，避免 await 产生微任务延迟，实现真正零闪烁）
    let customRaw = _GM_getValue(STORE_CUSTOM_DOMAIN, DEFAULT_CUSTOM);
    let persistEnabled = _GM_getValue(STORE_REDIRECT_ENABLED, true);

    // 兼容异步 GM_getValue（仅在极其老旧或特殊的插件环境下触发）
    if (customRaw instanceof Promise) customRaw = await customRaw;
    if (persistEnabled instanceof Promise)
      persistEnabled = await persistEnabled;

    let customOrigin;
    try {
      customOrigin = new URL(customRaw).origin;
    } catch (e) {
      customOrigin = DEFAULT_CUSTOM;
    }

    const isTarget = location.origin === customOrigin;

    // 如果既不是源站，也不是目标站，直接退出，绝不执行多余逻辑
    if (!isSource && !isTarget) return;

    // 如果是在目标站，无需跳转，直接进入菜单注册
    if (isTarget) {
      registerMenu(persistEnabled, customOrigin);
      return;
    }

    // --- 以下逻辑仅在 isSource (i.gkd.li) 下执行 ---

    // 若开关关闭
    if (!persistEnabled) {
      restoreVisibility();
      registerMenu(persistEnabled, customOrigin);
      return;
    }

    // 检查是否跳过 (优先 URL 参数，使用原生属性更省性能)
    let skip = location.search.includes('noRedirect=1');
    if (!skip) {
      try {
        let tabId = window.name;
        if (!tabId || !tabId.startsWith('gkd_tab:')) {
          tabId = 'gkd_tab:' + Math.random().toString(36).slice(2);
          window.name = tabId;
        }
        let skipTime = _GM_getValue(STORE_SKIP_PREFIX + tabId, null);
        if (skipTime instanceof Promise) skipTime = await skipTime;

        if (skipTime) {
          _GM_setValue(STORE_SKIP_PREFIX + tabId, null);
          skip = true;
        }
      } catch (e) {}
    }

    if (skip) {
      restoreVisibility();
      registerMenu(persistEnabled, customOrigin);
      return;
    }

    // 执行极速重定向路由判断 (使用原生 location 属性)
    const pathname = location.pathname;
    let targetUrl = '';

    if (pathname.startsWith('/i/')) {
      const id = pathname.substring(3).replace(/\/$/, '');
      if (id)
        targetUrl = `${customOrigin}/${id}${location.search}${location.hash}`;
    } else if (pathname === '/device') {
      targetUrl = `${customOrigin}${pathname}${location.search}${location.hash}`;
    }

    // 命中路由则直接跳转（不恢复可见性，完美防闪）
    if (targetUrl) {
      location.replace(targetUrl);
      return;
    }

    // 其他路径不处理
    restoreVisibility();
    registerMenu(persistEnabled, customOrigin);
  })();

  /* ======== 4. 异步注册菜单 ======== */
  function registerMenu(persistEnabled, currentCustomDomain) {
    setTimeout(() => {
      if (typeof GM_registerMenuCommand === 'undefined') return;

      GM_registerMenuCommand(
        (persistEnabled ? '✅ ' : '❎ ') + '启用自定义域跳转',
        () => {
          _GM_setValue(STORE_REDIRECT_ENABLED, !persistEnabled);
          setTimeout(() => location.reload(), 60);
        },
      );

      GM_registerMenuCommand('⚙️ 设置自定义域名', () => {
        const input = prompt(
          '请输入自定义域名 (含协议)，例如 https://example.com',
          currentCustomDomain,
        );
        if (!input) return;
        try {
          const parsed = new URL(input);
          _GM_setValue(STORE_CUSTOM_DOMAIN, parsed.origin);
          alert('已保存，将在刷新后生效：' + parsed.origin);
          setTimeout(() => location.reload(), 60);
        } catch (e) {
          alert('域名格式不正确，请包含 http/https');
        }
      });

      if (isSource || location.origin === currentCustomDomain) {
        GM_registerMenuCommand('⏭️ 单次跳过下一次跳转', () => {
          try {
            const tabId =
              window.name && window.name.startsWith('gkd_tab:')
                ? window.name
                : 'gkd_tab:' + Math.random().toString(36).slice(2);
            window.name = tabId;
            _GM_setValue(STORE_SKIP_PREFIX + tabId, Date.now());
            alert('已设置单次跳过（在本 tab 生效）');
          } catch (e) {
            alert('设置失败：' + e);
          }
        });
      }
    }, 200);
  }
})();
