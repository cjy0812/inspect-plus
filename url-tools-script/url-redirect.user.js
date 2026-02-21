// ==UserScript==
// @name         GKD Redirect by ChatGPT
// @namespace    your.namespace
// @version      1.0
// @description  Redirect i.gkd.li to li.chenge.eu.org
// @match        https://i.gkd.li/i/*
// @description 2026/2/21 21:21:34
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const path = location.pathname; // /i/00000000
  const id = path.replace('/i/', '');

  if (id) {
    const target = `https://li.chenge.eu.org/${id}`;
    location.replace(target);
  }
})();
