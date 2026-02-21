// ==UserScript==
// @name         GKD快照审查器自定义域
// @namespace    ling
// @version      1.2
// @description  重定向 i.gkd.li 并使用自定义域配置修补设备重定向
// @match        https://i.gkd.li/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  // 注册菜单命令，让用户配置域名
  GM_registerMenuCommand('设置自定义域名', function () {
    const customDomain = prompt(
      '请输入自定义域名:',
      GM_getValue('customDomain', 'https://li.chenge.eu.org'),
    );
    if (customDomain && customDomain !== GM_getValue('customDomain')) {
      GM_setValue('customDomain', customDomain); // 保存用户配置
      alert('自定义域名已更新为: ' + customDomain);
    }
  });

  // 获取自定义域名配置，默认值为 'https://li.chenge.eu.org'
  const customDomain = GM_getValue('customDomain', 'https://li.chenge.eu.org');

  const url = new URL(location.href);

  // ===============================
  // 1. 处理 /i/xxxx 直接跳转
  // ===============================
  if (url.pathname.startsWith('/i/')) {
    const id = url.pathname.replace('/i/', '');
    if (id) {
      const target = `${customDomain}/${id}`;
      location.replace(target);
      return;
    }
  }

  // ===============================
  // 2. 处理 device 接口重定向
  // ===============================
  if (url.pathname === '/device') {
    if (url.hostname === 'i.gkd.li') {
      url.hostname = new URL(customDomain).hostname; // 使用自定义域名的 host
      location.replace(url.href);
      return;
    }
  }
})();
