;(function() {

// ═══════════════════════════════════════════════════════════════
// BUNDLE MOBILE RIDOTTO: SOLO SKIN ALTERNATIVE E OVERLAY
// Contiene soltanto la parte del bundle script-mobile che carica
// forum-config. Serve per il GDR finche' non c'e' il bundle completo:
// quando metti il bundle completo, togli questo file.
// ═══════════════════════════════════════════════════════════════

// Gira solo su mobile (classe ffm nel body)
if (!document.body || !document.body.classList.contains('ffm')) return;

var HXH_DOMAINS = [
    'graficaxskinxelaborazione.forumfree.it',
    'hxhforumgdr.forumcommunity.net'
];
if (HXH_DOMAINS.indexOf(location.hostname) === -1) return;

// Stesso file del desktop: skin e overlay si decidono dal Pannello Forum.
// Quando esce una nuova versione, aggiorna solo URL_CONFIG.
var URL_CONFIG = 'https://cdn.jsdelivr.net/gh/HXH-F-GDR/ScriptForumfree@main/forum-config-v1.1.0.js';
if (window.__hxhForumConfig) return;
var sc = document.createElement('script');
sc.src = URL_CONFIG;
(document.head || document.documentElement).appendChild(sc);

})();
