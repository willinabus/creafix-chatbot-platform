/**
 * CreaFix Chatbot Embed Script
 * Injects the chatbot widget into any webpage
 * 
 * Usage:
 * <script src="https://your-domain.com/embed.js?botId=clarissa-v1"></script>
 */

(function() {
  'use strict';

  var CONFIG = {
    botId: 'clarissa-v1',
    hostUrl: '', // Will be detected automatically
    position: 'right',
    primaryColor: '#a0886d',
  };

  function detectHostUrl() {
    var script = document.currentScript;
    if (script && script.src) {
      var url = new URL(script.src);
      return url.origin;
    }
    return '';
  }

  function parseQueryString() {
    var script = document.currentScript;
    if (!script || !script.src) return;
    var url = new URL(script.src);
    if (url.searchParams.has('botId')) {
      CONFIG.botId = url.searchParams.get('botId') || CONFIG.botId;
    }
    if (url.searchParams.has('position')) {
      CONFIG.position = url.searchParams.get('position') || CONFIG.position;
    }
  }

  function createStyles() {
    var css = `
      .cf-chatbot-widget {
        position: fixed;
        bottom: 24px;
        ${CONFIG.position}: 24px;
        width: 56px;
        height: 56px;
        background: #0c0b09;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        color: #F5F3EE;
        z-index: 9999;
        transition: opacity 0.2s ease;
      }
      .cf-chatbot-widget:hover {
        opacity: 0.85;
      }
      .cf-chatbot-panel {
        position: fixed;
        bottom: 24px;
        ${CONFIG.position}: 24px;
        width: 420px;
        max-width: calc(100vw - 48px);
        height: 680px;
        max-height: calc(100vh - 48px);
        border: 1px solid rgba(17,17,17,0.10);
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        z-index: 9999;
        background: #FCFBF8;
        display: none;
        flex-direction: column;
      }
      .cf-chatbot-panel.open {
        display: flex;
      }
      .cf-chatbot-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      @media (max-width: 480px) {
        .cf-chatbot-panel {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
          bottom: 0;
          ${CONFIG.position}: 0;
          border-radius: 0;
        }
      }
    `;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createWidget() {
    var hostUrl = CONFIG.hostUrl || detectHostUrl() || '';
    var iframeUrl = hostUrl + '/widget-preview?embedded=true&botId=' + encodeURIComponent(CONFIG.botId);

    // Create panel
    var panel = document.createElement('div');
    panel.className = 'cf-chatbot-panel';
    panel.id = 'cf-chatbot-panel';

    var iframe = document.createElement('iframe');
    iframe.className = 'cf-chatbot-iframe';
    iframe.src = iframeUrl;
    iframe.title = 'Chatbot';
    panel.appendChild(iframe);

    // Create button
    var btn = document.createElement('button');
    btn.className = 'cf-chatbot-widget';
    btn.setAttribute('aria-label', 'Ouvrir le chatbot');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

    var open = false;
    btn.addEventListener('click', function() {
      open = !open;
      panel.classList.toggle('open', open);
      btn.style.display = open ? 'none' : 'flex';
    });

    // Close handler from iframe
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'CF_CHATBOT_CLOSE') {
        open = false;
        panel.classList.remove('open');
        btn.style.display = 'flex';
      }
    });

    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    parseQueryString();
    createStyles();
    createWidget();
  }

  init();
})();
