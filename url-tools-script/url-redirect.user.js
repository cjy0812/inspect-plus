// ==UserScript==
// @name         GKD Redirect by ChatGPT
// @namespace    your.namespace
// @version      1.1
// @description  Redirect i.gkd.li and patch device redirect
// @match        https://i.gkd.li/*
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const customDomain = 'https://li.chenge.eu.org'; // 修改成你自己的审查工具域名

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
      url.hostname = 'li.chenge.eu.org';
      location.replace(url.href);
      return;
    }
  }
})();
