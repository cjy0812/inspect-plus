// ==UserScript==
// @name         GKD快照审查器自定义域
// @namespace    ling
// @version      1.3
// @description  重定向 i.gkd.li 并使用自定义域配置修补设备重定向（修复参数丢失问题）
// @match        https://i.gkd.li/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  // ===============================
  // 注册菜单命令：设置自定义域名
  // ===============================
  GM_registerMenuCommand('设置自定义域名', function () {
    const current = GM_getValue('customDomain', 'https://li.chenge.eu.org');
    const input = prompt('请输入自定义域名:', current);

    if (!input) return;

    try {
      const parsed = new URL(input);
      GM_setValue('customDomain', parsed.origin);
      alert('自定义域名已更新为: ' + parsed.origin);
    } catch (e) {
      alert('域名格式不正确，请输入完整地址，例如 https://example.com');
    }
  });

  // ===============================
  // 获取自定义域名
  // ===============================
  const customDomainRaw = GM_getValue(
    'customDomain',
    'https://li.chenge.eu.org'
  );

  let customOrigin;
  try {
    customOrigin = new URL(customDomainRaw).origin;
  } catch {
    customOrigin = 'https://li.chenge.eu.org';
  }

  const url = new URL(location.href);

  // ===============================
  // 1. 处理 /i/xxxx 示例分享跳转
  //    修复：保留 query + hash
  // ===============================
  if (url.pathname.startsWith('/i/')) {
    const id = url.pathname.replace('/i/', '');

    if (id) {
      const target = new URL(customOrigin);
      target.pathname = `/${id}`;
      target.search = url.search; // ✅ 保留参数
      target.hash = url.hash;     // ✅ 保留 hash

      location.replace(target.href);
      return;
    }
  }

  // ===============================
  // 2. 处理 /device 重定向
  // ===============================
  if (url.pathname === '/device') {
    const target = new URL(customOrigin);
    target.pathname = url.pathname;
    target.search = url.search;
    target.hash = url.hash;

    location.replace(target.href);
    return;
  }

})();
