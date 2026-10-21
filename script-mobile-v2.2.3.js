;(function() {

// ═══════════════════════════════════════════════════════════════
// CONFIG MANUTENZIONE (overlay in fondo al bundle)
// 0 = forum online (overlay spento)
// 1 = accesso solo staff (admin, g1-g4)
// 2 = accesso solo amministratori (admin, g1)
// ═══════════════════════════════════════════════════════════════
var MANUTENZIONE = 1; // <-- CAMBIA QUESTO VALORE

// ═══════════════════════════════════════════════════════════════
// GUARD GLOBALE — gira solo su mobile (classe ffm nel body)
// ═══════════════════════════════════════════════════════════════

if (!document.body.classList.contains('ffm')) return;

var HXH_DOMAINS = [
    'graficaxskinxelaborazione.forumfree.it',
    'hxhforumgdr.forumcommunity.net'
];
if (HXH_DOMAINS.indexOf(location.hostname) === -1) return;

// ═══════════════════════════════════════════════════════════════
// FIX KEYWORD TOOLTIPS (mobile) — copia di keyword-tooltips-fix.js
// Parole intere, apostrofi equivalenti, popup senza raffiche e parole
// extra da keyword-tooltips-lista.js su GitHub, che qui viene caricata
// in automatico (niente tag script da aggiungere sul mobile).
// ═══════════════════════════════════════════════════════════════
;(function () {
  /* Se la copia del bundle mobile e' gia' caricata, gira una sola copia */
  if (window.__hxhKeywordFix) return;
  window.__hxhKeywordFix = true;

  var IH = 'inner' + 'HTML';
  var SKIP = { A: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, BUTTON: 1, SELECT: 1 };

  /* ---------- POPUP: niente apri/chiudi a raffica ----------
     L'originale accoda un fadeIn per ogni parola sfiorata col mouse, senza
     mai annullarlo. Qui il popup si apre solo se il mouse resta fermo sulla
     parola per un attimo, e passare sopra altre parole annulla le aperture
     in sospeso. Le funzioni vengono "bloccate" su window, cosi' funziona sia
     che l'originale parta prima sia che parta dopo. */
  var SHOW_DELAY = 350; /* ms fermi sulla parola prima di aprire */
  var HIDE_DELAY = 300; /* ms prima di chiudere (per poter entrare nel popup) */
  var FADE = 150;
  var showTimer = null;

  function calcDim(el, top) {
    var b = 0;
    while (el) {
      b += top ? el.offsetTop : el.offsetLeft;
      el = el.offsetParent;
    }
    return b;
  }

  function fadePopup(show) {
    var p = document.getElementById('keyword_popup');
    if (!p) { return; }
    var jq = window.jQuery;
    if (!jq) { p.style.display = show ? '' : 'none'; return; }
    var hidden = p.style.display === 'none' || window.getComputedStyle(p).display === 'none';
    if (show) {
      if (hidden) { jq(p).stop(true, true).fadeIn(FADE); }
      else { jq(p).stop(true).fadeTo(FADE, 1); }
    } else if (!hidden) {
      jq(p).stop(true).fadeOut(FADE);
    }
  }

  function fillPopup(a) {
    var p = document.getElementById('keyword_popup');
    var title = document.getElementById('keyword_popup_title');
    var text = document.getElementById('keyword_popup_text');
    if (!p || !title || !text) { return false; }
    title[IH] = a[IH];
    text[IH] = unescape(a.getAttribute('data-keywordtooltip') || '');
    p.style.left = calcDim(a, false) + 'px';
    p.style.top = (calcDim(a, true) + 35) + 'px';
    return true;
  }

  function fixedShow(a) {
    clearTimeout(window.key_timeout);
    clearTimeout(showTimer);
    showTimer = setTimeout(function () {
      showTimer = null;
      if (fillPopup(a)) { fadePopup(true); }
    }, SHOW_DELAY);
  }

  function fixedHide() {
    clearTimeout(showTimer);
    showTimer = null;
    clearTimeout(window.key_timeout);
    window.key_timeout = setTimeout(function () { fadePopup(false); }, HIDE_DELAY);
  }

  function lockGlobal(name, fn) {
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: function () { return fn; },
        set: function () {}
      });
    } catch (e) {
      window[name] = fn;
    }
  }
  lockGlobal('show_keywordtooltips', fixedShow);
  lockGlobal('hide_keywordtooltips', fixedHide);

  /* lettera (di qualsiasi alfabeto, accentate comprese), cifra o underscore */
  function isWordChar(c) {
    if (!c) { return false; }
    var isLetter = c.toLowerCase() !== c.toUpperCase();
    var isDigit = c >= '0' && c <= '9';
    var res = isLetter || isDigit || c === '_';
    return res;
  }

  /* ---------- apostrofi e caratteri speciali nei nomi ----------
     L'originale trasforma ogni nome con btoa(), che va in errore con
     apostrofi tipografici, trattini lunghi, emoji ecc. e blocca tutto lo
     script. Mentre gira l'originale sostituiamo btoa con una versione che
     accetta qualsiasi carattere e produce solo cifre (cosi' nessuna parola
     chiave puo' "agganciarsi" dentro i segnaposto). */
  function safeToken(s) {
    var out = '';
    s = String(s);
    for (var i = 0; i < s.length; i++) { out += s.charCodeAt(i) + '_'; }
    return out;
  }
  function callOriginal(fn, s) {
    var saved = window.btoa;
    var res;
    window.btoa = safeToken;
    try {
      res = fn(s);
    } finally {
      window.btoa = saved;
    }
    return res;
  }
  /* apostrofo dritto e tipografico contano come uguali */
  function normApos(s) {
    var out = s.replace(/[‘’ʼ]/g, "'");
    return out;
  }

  function isUpper(c) {
    var res = !!c && c !== c.toLowerCase();
    return res;
  }

  function escapeHtml(s) {
    var out = s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
    return out;
  }

  function isInsideSkipped(node, root) {
    var p = node.parentNode;
    while (p && p !== root) {
      if (p.nodeName && SKIP[p.nodeName.toUpperCase()]) { return true; }
      p = p.parentNode;
    }
    return false;
  }

  /* ---------- PAROLE EXTRA (lista su GitHub) ----------
     window.HXH_KEYWORDS = [ { parola, immagine, pack, campi: [...] }, ... ]
     window.HXH_KEYWORD_PACKS = { "Nome pack": "link al topic", ... }
     Se una parola e' sia qui sia su Easy Innovation, vince questa lista. */
  var extraCache = null;

  /* stessa codifica dell'originale (%uXXXX), letta poi con unescape() */
  function toUnicode(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var h = s.charCodeAt(i).toString(16).toUpperCase();
      while (h.length < 4) { h = '0' + h; }
      out += '%u' + h;
    }
    return out;
  }

  /* costruisce l'HTML del popup con la stessa grafica delle voci di Easy Innovation */
  function buildContent(it, packs) {
    if (it.contenuto) { return String(it.contenuto); }
    var h = '';
    if (it.immagine) {
      h += '<div style="background-image: url(' + it.immagine + '); background-repeat: no-repeat; width: 300px; height: 300px;border-radius: 10px; border: 2px solid Gainsboro"></div><br>';
    }
    var campi = it.campi || [];
    for (var i = 0; i < campi.length; i++) {
      var c = campi[i];
      if (typeof c === 'string') { h += c + '<br>'; }
      else if (c && c.length) { h += '<b>' + c[0] + ':</b> ' + (c.length > 1 ? c[1] : '') + '<br>'; }
    }
    if (it.pack) {
      var link = packs[it.pack];
      h += '<b>Expansion Pack: </b>' + (link ? '<a href="' + link + '">' + it.pack + '</a>' : it.pack);
    }
    return h;
  }

  function makeAnchor(parola, contenuto) {
    var a = document.createElement('a');
    a.className = 'keyword_tooltip';
    a.setAttribute('on' + 'mouseover', 'window.show_keywordtooltips(this)');
    a.setAttribute('on' + 'mouseout', 'window.hide_keywordtooltips()');
    a.setAttribute('data-keywordtooltip', toUnicode(contenuto));
    a.appendChild(document.createTextNode(parola));
    return a;
  }

  function getExtras() {
    if (extraCache) { return extraCache; }
    var src = window.HXH_KEYWORDS;
    if (!src || !src.length) { return []; }
    var packs = window.HXH_KEYWORD_PACKS || {};
    var out = [];
    for (var i = 0; i < src.length; i++) {
      var it = src[i];
      if (!it || !it.parola) { continue; }
      try {
        out.push({
          key: normApos(String(it.parola).toLowerCase()),
          anchor: makeAnchor(String(it.parola), buildContent(it, packs))
        });
      } catch (e) {
        console.error('[Keyword Tooltips fix] voce non valida:', it, e);
      }
    }
    extraCache = out;
    return out;
  }

  /* Trova le parole chiave presenti nel testo e prepara i loro <a>:
     quelle di Easy Innovation (chiedendole alla funzione originale) e quelle
     della lista extra. */
  function discover(originalFn, plainText) {
    var map = {};
    var list = [];
    var i;
    if (originalFn) {
      /* il testo viene provato anche con gli apostrofi scambiati, cosi' si
         trovano le parole chiave scritte con l'uno o con l'altro */
      var variants = [plainText, normApos(plainText), plainText.split("'").join('’')];
      for (var v = 0; v < variants.length; v++) {
        var t = document.createElement('template');
        var produced = callOriginal(originalFn, escapeHtml(variants[v]));
        t[IH] = produced;
        var anchors = t.content.querySelectorAll('a.keyword_tooltip');
        for (i = 0; i < anchors.length; i++) {
          var key = normApos(anchors[i].textContent.toLowerCase());
          if (!map[key]) { map[key] = anchors[i]; list.push(key); }
        }
      }
    }
    var extras = getExtras();
    if (extras.length) {
      var normText = normApos(plainText.toLowerCase());
      for (i = 0; i < extras.length; i++) {
        var ex = extras[i];
        if (normText.indexOf(ex.key) === -1) { continue; }
        if (!map[ex.key]) { list.push(ex.key); }
        map[ex.key] = ex.anchor;
      }
    }
    /* prima le parole piu' lunghe, come fa l'originale */
    list.sort(function (a, b) { return b.length - a.length; });
    var res = { map: map, list: list };
    return res;
  }

  function replaceInTextNode(node, data) {
    var text = node.nodeValue;
    var frag = null;
    var last = 0;
    var i = 0;
    while (i < text.length) {
      var found = null;
      if (!isWordChar(text.charAt(i - 1))) {
        for (var k = 0; k < data.list.length; k++) {
          var key = data.list[k];
          if (normApos(text.substr(i, key.length).toLowerCase()) === key && !isWordChar(text.charAt(i + key.length))) {
            found = key;
            break;
          }
        }
      }
      if (found) {
        if (!frag) { frag = document.createDocumentFragment(); }
        if (i > last) { frag.appendChild(document.createTextNode(text.slice(last, i))); }
        frag.appendChild(document.importNode(data.map[found], true));
        i += found.length;
        last = i;
      } else {
        i++;
      }
    }
    if (frag) {
      if (last < text.length) { frag.appendChild(document.createTextNode(text.slice(last))); }
      node.parentNode.replaceChild(frag, node);
    }
  }

  function processRoot(root, data) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    var n = walker.nextNode();
    while (n) {
      if (!isInsideSkipped(n, root)) { nodes.push(n); }
      n = walker.nextNode();
    }
    for (var j = 0; j < nodes.length; j++) { replaceInTextNode(nodes[j], data); }
  }

  function fixedReplace(originalFn, str) {
    var work = document.createElement('template');
    work[IH] = str;
    var root = work.content;
    var data = discover(originalFn, root.textContent);
    if (!data.list.length) { return str; }
    processRoot(root, data);
    var out = work[IH];
    return out;
  }

  /* Ripiego se questo script parte DOPO l'originale:
     toglie i tooltip finiti dentro altre parole. */
  function cleanupExisting() {
    var anchors = document.querySelectorAll('.color a.keyword_tooltip');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var prev = a.previousSibling;
      var next = a.nextSibling;
      var pc = (prev && prev.nodeType === 3) ? prev.nodeValue.charAt(prev.nodeValue.length - 1) : '';
      var nc = (next && next.nodeType === 3) ? next.nodeValue.charAt(0) : '';
      if (!isWordChar(pc) && !isWordChar(nc)) { continue; }

      /* l'originale ha sostituito il testo con la parola scritta come nelle
         impostazioni ("QuIndi"): proviamo a ricostruire le maiuscole */
      var txt = a.textContent;
      if (isWordChar(pc)) {
        txt = (isUpper(pc) && (isUpper(nc) || !isWordChar(nc))) ? txt.toUpperCase() : txt.toLowerCase();
      } else {
        txt = txt.charAt(0) + txt.slice(1).toLowerCase();
      }
      var parent = a.parentNode;
      parent.replaceChild(document.createTextNode(txt), a);
      parent.normalize();
    }
    /* e aggiunge comunque le parole della lista extra, direttamente sulla pagina */
    applyExtrasToPage();
  }

  /* Applica le parole della lista extra ai post gia' presenti nella pagina
     (le parole gia' trasformate in tooltip vengono saltate). */
  function applyExtrasToPage() {
    if (!getExtras().length) { return; }
    var posts = document.querySelectorAll('.color');
    for (var p = 0; p < posts.length; p++) {
      var data = discover(null, posts[p].textContent);
      if (data.list.length) { processRoot(posts[p], data); }
    }
  }

  /* Se la lista non e' gia' stata caricata con il suo tag script (es. sul
     mobile, dove c'e' un solo file), la carichiamo da qui e la applichiamo
     appena arriva. */
  var LISTA_URL = 'https://cdn.jsdelivr.net/gh/HXH-F-GDR/ScriptForumfree@main/keyword-tooltips-lista.js';
  if (!window.HXH_KEYWORDS) {
    var ls = document.createElement('script');
    ls.src = LISTA_URL;
    ls.async = true;
    ls.onload = function () {
      extraCache = null;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyExtrasToPage);
      } else {
        applyExtrasToPage();
      }
    };
    (document.head || document.documentElement).appendChild(ls);
  }

  if (typeof window.replace_keywordtooltips === 'function') {
    /* l'originale e' gia' passato */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cleanupExisting);
    } else {
      cleanupExisting();
    }
    return;
  }

  /* Trappola: quando l'originale definisce la sua funzione, la teniamo da parte
     e al suo posto gli restituiamo la versione corretta. */
  var originalFn = null;
  function wrapper(str) {
    var out;
    try {
      out = fixedReplace(originalFn, str);
    } catch (e) {
      console.error('[Keyword Tooltips fix]', e);
      out = callOriginal(originalFn, str);
    }
    return out;
  }
  Object.defineProperty(window, 'replace_keywordtooltips', {
    configurable: true,
    get: function () { return originalFn ? wrapper : undefined; },
    set: function (fn) { originalFn = fn; }
  });
})();

// ── LOGO SKIN: crea e popola logonataleffm e logohalloweenffm ──
;(function() {
    var logo = document.querySelector('.logo');
    if (!logo) return;

    var imagesNatale    = ['https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-gonN.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-killuaN.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-kurapikaN.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-leorioN.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-chrolloN.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-hisokaN.png'];
    var imagesHalloween = ['https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-gonH.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-killuaH.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-kurapikaH.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-leorioH.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-chrolloH.png','https://chroniclesofabrokensky.altervista.org/wp-content/uploads/2026/09/logo-hisokaH.png'];

    function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function makeLogoEl(cls, images) {
        var a = document.createElement('a');
        a.className = cls;
        a.href = logo.href || '/';
        a.style.backgroundImage = 'url(https://img.forumfree.net/index_file/spacer.gif)';
        var inner = document.createElement('div');
        inner.innerHTML = '<img src="' + pickRandom(images) + '">';
        a.appendChild(inner);
        return a;
    }

    var nat = makeLogoEl('logonataleffm', imagesNatale);
    var hal = makeLogoEl('logohalloweenffm', imagesHalloween);
    logo.parentNode.insertBefore(nat, logo.nextSibling);
    logo.parentNode.insertBefore(hal, logo.nextSibling);
})();

// ── UTILITY: riprova l'iniezione fino a maxAttempts volte ogni 500ms ──
function injectWithRetry(fn, checkId, maxAttempts) {
    var attempts = 0;
    function tryInject() {
        if (document.getElementById(checkId)) return; // già presente
        fn();
        attempts++;
        if (attempts < maxAttempts) setTimeout(tryInject, 500);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(tryInject, 100); });
    } else {
        setTimeout(tryInject, 100);
    }
}


// ═══════════════════════════════════════════════════════════════
// FRAMEWORK
// ═══════════════════════════════════════════════════════════════

window.HxHFramework = {
    constants:  {},
    groups:     {},
    location:   {},
    requests:   {},
    api:        {},
    topForum:   {},
    utilities:  { dates: {}, string: {}, storage: {} }
};

window.HxHFramework.constants.DOMAINS    = HXH_DOMAINS;
window.HxHFramework.constants.DOMAIN     = location.hostname;
window.HxHFramework.constants.FORUM_NAME = 'Hunter x Hunter Forum - GDR Remastered';
window.HxHFramework.constants.SECTIONS   = { SPAM: null, RICAMBIO_SPAM: null, REGOLAMENTI: null };
window.HxHFramework.constants.JSONBIN_MASTER_KEY = '$2a$10$Oz7UWaTI1ugJ6ukQdWtpjOvBLnAAEFRIOvi0iyDPb.FH3Zut..lp6';
window.HxHFramework.constants.JSONBIN_ACCESS_KEY = null;

function isAdmin()            { return /\badmin\b/g.test(document.body.className); }
function isGDRMaster()        { return /(g1)\b/g.test(document.body.className); }
function isGDRMod()           { return /(g2)\b/g.test(document.body.className); }
function isGDRGrapherMaster() { return /(g3)\b/g.test(document.body.className); }
function isGrapher()          { return /(g4)\b/g.test(document.body.className); }
function isUtility()          { return /(g14)\b/g.test(document.body.className); }
function isStaff()            { return /\badmin\b/g.test(document.body.className) || /(g1|g2|g3|g4)\b/g.test(document.body.className); }
function isUser()             { return /(g1|g2|g3|g4|g5|g6|g7|g8|g9|g10|g11|g12|g13|g14)\b/g.test(document.body.className); }
function isGuest()            { return !isUser(); }
window.HxHFramework.groups = { isAdmin: isAdmin, isGDRMaster: isGDRMaster, isGDRMod: isGDRMod, isGDRGrapherMaster: isGDRGrapherMaster, isGrapher: isGrapher, isUtility: isUtility, isStaff: isStaff, isUser: isUser, isGuest: isGuest };

function isHome()       { return document.body.id === 'board'; }
function isTopic()      { return document.body.id === 'topic'; }
function isSection()    { return document.body.id === 'forum'; }
function getTopicId()   { var m = location.search.match(/[?&]t=(\d+)/); return m ? m[1] : null; }
function getSectionId() { var m = location.search.match(/[?&]f=(\d+)/); return m ? m[1] : null; }
window.HxHFramework.location = { isHome: isHome, isTopic: isTopic, isSection: isSection, getTopicId: getTopicId, getSectionId: getSectionId };

function fetchToken(callback) {
    fetch('https://' + location.hostname + '/')
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var marker = 'name=' + '"s" value="';
            var start  = html.indexOf(marker);
            var token  = null;
            if (start !== -1) { start += marker.length; var end = html.indexOf('"', start); if (end !== -1) token = html.substring(start, end); }
            callback(token);
        })
        .catch(function() { callback(null); });
}
function fetchData(method, url, body, callback) {
    fetch(url, { method: method, body: body })
        .then(function(res) {
            var ct = res.headers.get('content-type') || '';
            var hm = ct.match(/charset=([^;\s]+)/i);
            var charset = hm ? hm[1].trim().toLowerCase() : null;
            return res.arrayBuffer().then(function(buffer) {
                if (!charset) { try { var g = new TextDecoder('utf-8').decode(buffer); var mm = g.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i); if (mm) charset = mm[1].toLowerCase(); } catch(e) {} }
                charset = charset || 'utf-8';
                var decoded;
                try { decoded = new TextDecoder(charset).decode(buffer); } catch(e) { try { decoded = new TextDecoder('utf-8').decode(buffer); } catch(e2) { decoded = new TextDecoder('windows-1252').decode(buffer); } }
                callback(new DOMParser().parseFromString(decoded, 'text/html'));
            });
        })
        .catch(function(e) { console.error('[HxHFramework] fetchData error:', e); });
}
function postComment(token, sectionId, topicId, content, callback, enablesig, track_topic) {
    enablesig   = enablesig   !== undefined ? enablesig   : '1';
    track_topic = track_topic !== undefined ? track_topic : '1';
    var fd = new FormData();
    fd.set('st','0'); fd.set('act','Post'); fd.set('s',token); fd.set('CODE','03');
    fd.set('f',sectionId); fd.set('t',topicId); fd.set('Post',content);
    fd.set('enablesig',enablesig); fd.set('track_topic',track_topic);
    fd.set('mod_options','nowt'); fd.set('charset','UTF-8'); fd.set('cook'+'ie','1');
    fetchData('POST', 'https://' + location.hostname + '/', fd, function(doc) {
        callback(doc && doc.location && doc.location.href ? doc.location.href.indexOf('saved') !== -1 : true, doc);
    });
}
function postTopic(sectionId, title, content, callback) {
    fetch('https://' + location.hostname + '/?act=Post&CODE=00&f=' + sectionId)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var form = doc.getElementById('REPLIER_POST');
            if (!form) { callback(false, null); return; }
            var fd = new FormData();
            fd.set('st',form.st.value); fd.set('act',form.act.value); fd.set('s',form.s.value);
            fd.set('f',form.f.value); fd.set('CODE',form.CODE.value); fd.set('TopicTitle',title);
            fd.set('Post',content); fd.set('enablesig','1'); fd.set('track_topic','1'); fd.set('charset','UTF-8');
            if (form.MAX_FILE_SIZE) fd.set('MAX_FILE_SIZE',form.MAX_FILE_SIZE.value);
            if (form.check) fd.set('check',form.check.value);
            return fetch('https://' + location.hostname + '/', { method:'POST', body:fd }).then(function(r) { return r.text(); });
        })
        .then(function(html) {
            if (!html) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var m = doc.body.className.match(/t(\d+)/);
            callback(true, m ? m[1] : null);
        })
        .catch(function(e) { console.error('[HxHFramework] postTopic error:', e); callback(false, null); });
}
window.HxHFramework.requests = { fetchToken: fetchToken, fetchData: fetchData, postComment: postComment, postTopic: postTopic };

async function getUserTopicsInSection(userId, sectionId, includePinned) {
    userId = userId || Commons.user.id; sectionId = sectionId || Commons.location.section.id; includePinned = includePinned || false;
    try { var res = await fetch('https://' + location.hostname + '/api.php?starter=' + userId + '&f=' + sectionId + (includePinned ? '' : '&no_pinned=1&no_annunci=1') + '&cookie=1'); var data = await res.json(); return data.topic_ids || []; }
    catch(e) { return []; }
}
async function hasUserTopicsInSection(userId, sectionId) { return (await getUserTopicsInSection(userId, sectionId)).length > 0; }
async function getAllTopicsInSection(sectionId) {
    if (!sectionId) return [];
    var all = [], page = 0, hasMore = true;
    try {
        while (hasMore && page < 50) {
            var res = await fetch('https://' + location.hostname + '/api.php?f=' + sectionId + '&st=' + (page*15) + '&cookie=1');
            if (!res.ok) break;
            var data = await res.json();
            if (data && data.threads && data.threads.length > 0) {
                data.threads.forEach(function(t) { all.push({ title:t.title, url:'https://'+location.hostname+'/?t='+t.id, id:t.id }); });
                if (data.threads.length < 15) hasMore = false; else page++;
            } else { hasMore = false; }
        }
    } catch(e) {}
    return all;
}
window.HxHFramework.api = { getUserTopicsInSection: getUserTopicsInSection, hasUserTopicsInSection: hasUserTopicsInSection, getAllTopicsInSection: getAllTopicsInSection };

function formatDate(date, template) {
    date = date || new Date(); template = template || 'D/M/Y';
    var pad = function(n) { return n < 10 ? '0'+n : ''+n; };
    return template.replace('D',pad(date.getDate())).replace('M',pad(date.getMonth()+1)).replace('Y',date.getFullYear())
                   .replace('H',pad(date.getHours())).replace('I',pad(date.getMinutes())).replace('S',pad(date.getSeconds()));
}
function isSameDay(day) { var t=new Date(),c=new Date(day); return t.getDate()===c.getDate()&&t.getMonth()===c.getMonth()&&t.getFullYear()===c.getFullYear(); }
function isNewDay(key) { var today=formatDate(new Date(),'D/M/Y'),last=localStorage.getItem(key); if(last!==today){localStorage.setItem(key,today);return true;} return false; }
window.HxHFramework.utilities.dates = { formatDate: formatDate, isSameDay: isSameDay, isNewDay: isNewDay };

function getURLParameter(url, parameter) { var m=new RegExp('[?&]'+parameter+'=([^&#]*)').exec(url); return m?decodeURIComponent(m[1]):null; }
function JSONtoString(json)   { try{return JSON.stringify(json);}catch(e){return '';} }
function StringToJSON(string) { try{return JSON.parse(string);}catch(e){return null;} }
window.HxHFramework.utilities.string = { getURLParameter: getURLParameter, JSONtoString: JSONtoString, StringToJSON: StringToJSON };

function storageSet(key,value) { try{localStorage.setItem(key,typeof value==='object'?JSONtoString(value):value);}catch(e){} }
function storageGet(key,parseJSON) { var v=localStorage.getItem(key); if(v===null)return null; return parseJSON?StringToJSON(v):v; }
function storageRemove(key) { localStorage.removeItem(key); }
function storageExists(key) { return localStorage.getItem(key)!==null; }
window.HxHFramework.utilities.storage = { set: storageSet, get: storageGet, remove: storageRemove, exists: storageExists };

function waitFor(condition, callback, interval, timeout) {
    interval=interval||100; timeout=timeout||10000; var elapsed=0;
    function check() { if(condition()){callback();}else if(elapsed>=timeout){console.warn('[HxHFramework] waitFor timeout.');}else{elapsed+=interval;setTimeout(check,interval);} }
    check();
}
window.HxHFramework.utilities.waitFor = waitFor;

// ── TOP FORUM ──
// Stessa logica e stesso nodo Firebase della versione desktop: il record
// topforum/AAAA-MM viene creato una sola volta (le rules impediscono di
// sovrascriverlo), da chiunque arrivi prima, desktop o mobile.
// Su mobile la posizione si legge da .stats_list (link act=topforum).

var TOPFORUM_URL       = 'https://spam-limitato-e-illimitato-default-rtdb.europe-west1.firebasedatabase.app';
var TOPFORUM_SOGLIA    = 200;
var TOPFORUM_CACHE_KEY = 'hxh-topforum';
var TOPFORUM_TEST_KEY  = 'hxh-topforum-test';

window.HxHFramework.constants.TOPFORUM_FIREBASE_URL = TOPFORUM_URL;
window.HxHFramework.constants.TOPFORUM_SOGLIA       = TOPFORUM_SOGLIA;

function topForumMese() {
    var formato = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit' });
    var parti = formato.formatToParts(new Date());
    var anno = '', mese = '';
    for (var i = 0; i < parti.length; i++) {
        if (parti[i].type === 'year')  anno = parti[i].value;
        if (parti[i].type === 'month') mese = parti[i].value;
    }
    var chiave = anno + '-' + mese;
    return chiave;
}

// Legge la posizione dalle statistiche: prima il formato mobile, poi quello desktop.
function topForumLeggiPagina(doc) {
    doc = doc || document;
    var el = doc.querySelector('.stats_list a[href*="act=topforum"] span') || doc.querySelector('#top a b');
    var pos = el ? parseInt(el.textContent, 10) : NaN;
    var risultato = isNaN(pos) ? null : pos;
    return risultato;
}

function topForumRisultato(mese, record) {
    var ok = !!(record && typeof record.posizione === 'number');
    var ris = { mese: mese, rilevato: ok, posizione: ok ? record.posizione : null, dentro: ok ? record.posizione <= TOPFORUM_SOGLIA : false };
    return ris;
}

function topForumSimulazione() {
    if (!document.body || !isStaff()) return null;
    var valore = storageGet(TOPFORUM_TEST_KEY);
    if (valore === null) return null;
    var pos = parseInt(valore, 10);
    if (isNaN(pos) || pos < 1) return null;
    var ris = topForumRisultato(topForumMese(), { posizione: pos });
    ris.simulato = true;
    console.warn('[HxHFramework] topForum SIMULATO: posizione ' + pos + (ris.dentro ? ' (dentro)' : ' (fuori)'));
    return ris;
}

function topForumSimula(posizione) {
    if (posizione === null || posizione === undefined) {
        storageRemove(TOPFORUM_TEST_KEY);
        console.log('[HxHFramework] topForum: simulazione disattivata');
        return;
    }
    if (!isStaff()) { console.warn('[HxHFramework] topForum: simulazione riservata allo staff'); return; }
    storageSet(TOPFORUM_TEST_KEY, String(parseInt(posizione, 10)));
    console.log('[HxHFramework] topForum: simulazione attiva, posizione ' + posizione);
}

function topForumSalvaCache(mese, record) { storageSet(TOPFORUM_CACHE_KEY, { mese: mese, posizione: record.posizione }); }

function topForumQuandoPronto(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
}

function topForumLeggiRecord(url, fine) {
    fetch(url)
        .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); var json = r.json(); return json; })
        .then(function(record) { fine(record); })
        .catch(function(e) { console.error('[HxHFramework] topForum lettura:', e); fine(null); });
}

function topForumScrivi(url, mese, pos, fine) {
    var record = { posizione: pos, dentro: pos <= TOPFORUM_SOGLIA, timestamp: { '.sv': 'timestamp' } };
    fetch(url, { method: 'PUT', body: JSONtoString(record) })
        .then(function(r) {
            if (r.ok) { topForumSalvaCache(mese, record); fine(topForumRisultato(mese, record)); return; }
            // Rifiutata: il record esiste già (creato da desktop o da un altro mobile). Si rilegge.
            topForumLeggiRecord(url, function(esistente) {
                if (esistente && typeof esistente.posizione === 'number') topForumSalvaCache(mese, esistente);
                fine(topForumRisultato(mese, esistente));
            });
        })
        .catch(function(e) { console.error('[HxHFramework] topForum scrittura:', e); fine(topForumRisultato(mese, null)); });
}

function topForumCarica(mese, fine) {
    var url = TOPFORUM_URL + '/topforum/' + mese + '.json';
    topForumLeggiRecord(url, function(record) {
        if (record && typeof record.posizione === 'number') {
            topForumSalvaCache(mese, record);
            fine(topForumRisultato(mese, record));
            return;
        }
        // Record assente: si crea solo se la pagina mostra la posizione (home con statistiche).
        topForumQuandoPronto(function() {
            var pos = topForumLeggiPagina(document);
            if (pos === null) { fine(topForumRisultato(mese, null)); return; }
            topForumScrivi(url, mese, pos, fine);
        });
    });
}

var topForumInAttesa = null;

function topForumGet(callback) {
    var simulato = topForumSimulazione();
    if (simulato) { callback(simulato); return; }

    var mese  = topForumMese();
    var cache = storageGet(TOPFORUM_CACHE_KEY, true);
    if (cache && cache.mese === mese && typeof cache.posizione === 'number') {
        callback(topForumRisultato(mese, cache));
        return;
    }

    if (topForumInAttesa) { topForumInAttesa.push(callback); return; }
    topForumInAttesa = [callback];

    topForumCarica(mese, function(ris) {
        var lista = topForumInAttesa;
        topForumInAttesa = null;
        for (var i = 0; i < lista.length; i++) {
            try { lista[i](ris); } catch(e) { console.error('[HxHFramework] topForum callback:', e); }
        }
    });
}

function topForumSvuotaCache() { storageRemove(TOPFORUM_CACHE_KEY); }

window.HxHFramework.topForum = {
    SOGLIA:      TOPFORUM_SOGLIA,
    get:         topForumGet,
    mese:        topForumMese,
    leggiPagina: topForumLeggiPagina,
    svuotaCache: topForumSvuotaCache,
    simula:      topForumSimula
};

// Rilevamento automatico: dove la pagina mostra la posizione (home),
// si prova a creare il record del mese se ancora non c'è.
topForumQuandoPronto(function() {
    if (topForumLeggiPagina(document) !== null) topForumGet(function() {});
});

console.log('[HxHFramework] mobile — Loaded on ' + location.hostname);


// ═══════════════════════════════════════════════════════════════
// FILTERGRID
// ═══════════════════════════════════════════════════════════════

window.filterGridConfig = {
    pillCss: ['font-size:10px','font-weight:700','letter-spacing:.5px','padding:3px 11px','border-radius:20px','cursor:pointer','border:1.5px solid','transition:background .15s,color .15s,border-color .15s'].join(';'),
    activeBackground: '#0B486B', activeColor: '#CFF09E', activeBorder: '#0B486B',
    inactiveBackground: 'transparent', inactiveColor: '#3B8686', inactiveBorder: '#3B8686',
    controlsCss: 'display:flex;gap:5px;flex-wrap:wrap;'
};

function fgParseList(str) {
    var out = [], parts, i, p, eq;
    if (!str) return out;
    parts = str.split(',');
    for (i = 0; i < parts.length; i++) {
        p = parts[i].trim(); if (!p) continue;
        eq = p.indexOf('=');
        if (eq > -1) out.push({ value: p.slice(0, eq).trim(), label: p.slice(eq + 1).trim() });
        else out.push({ value: p, label: p });
    }
    return out;
}

function filterGrid(opts) {
    var cfg = window.filterGridConfig || {};
    var o = Object.assign({ itemSelector:'[data-group]', gridSelector:'#filter-grid', controlsSelector:'#filter-controls', allLabel:'Tutti', groupLabels:{}, hiddenClass:'fg-hidden', activeClass:'fg-active', emptyClass:'fg-empty' }, opts || {});
    var controls = document.querySelector(o.controlsSelector);
    var items    = document.querySelectorAll(o.itemSelector);
    if (!controls || !items.length) return;
    var allLabel  = controls.getAttribute('data-fg-all') || o.allLabel;
    var emptyMode = (controls.getAttribute('data-fg-empty') || 'disable').toLowerCase();
    var declared  = fgParseList(controls.getAttribute('data-fg-groups'));
    var count = {}, found = [], groups = [], used = {}, i, g;
    for (i = 0; i < items.length; i++) { g = items[i].getAttribute('data-group'); if (!g) continue; if (!count[g]) { count[g] = 0; found.push(g); } count[g]++; }
    for (i = 0; i < declared.length; i++) { if (used[declared[i].value]) continue; used[declared[i].value] = true; groups.push(declared[i]); }
    for (i = 0; i < found.length; i++) { if (used[found[i]]) continue; used[found[i]] = true; groups.push({ value: found[i], label: o.groupLabels[found[i]] || found[i] }); }
    function setActive(btn)   { btn.style.background=cfg.activeBackground||'#000'; btn.style.color=cfg.activeColor||'#fff'; btn.style.borderColor=cfg.activeBorder||'#000'; }
    function setInactive(btn) { btn.style.background=cfg.inactiveBackground||'transparent'; btn.style.color=cfg.inactiveColor||'#000'; btn.style.borderColor=cfg.inactiveBorder||'#000'; }
    function makePill(f, label, active, empty) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = label; btn.setAttribute('data-f', f); btn.style.cssText = cfg.pillCss || '';
        if (empty) { btn.className = o.emptyClass; if (emptyMode === 'disable') { btn.disabled = true; btn.style.opacity = '0.45'; btn.style.cursor = 'default'; } }
        if (active) { btn.className += (btn.className ? ' ' : '') + o.activeClass; setActive(btn); } else { setInactive(btn); }
        var res = btn;
        return res;
    }
    if (cfg.controlsCss) controls.style.cssText = cfg.controlsCss;
    var pills = [makePill('__all__', allLabel, true, false)], isEmpty;
    for (i = 0; i < groups.length; i++) { isEmpty = !count[groups[i].value]; if (isEmpty && emptyMode === 'hide') continue; pills.push(makePill(groups[i].value, groups[i].label, false, isEmpty)); }
    for (i = 0; i < pills.length; i++) controls.appendChild(pills[i]);
    var hs = document.createElement('style');
    hs.textContent = o.controlsSelector+' button:not(:disabled):hover{background:'+(cfg.activeBackground||'#000')+' !important;color:'+(cfg.activeColor||'#fff')+' !important;border-color:'+(cfg.activeBorder||'#000')+' !important}\n.'+o.hiddenClass+'{display:none !important}';
    document.head.appendChild(hs);
    controls.addEventListener('click', function(e) {
        var btn = e.target.closest('button'); if (!btn || btn.disabled || !btn.getAttribute('data-f')) return;
        var j, f = btn.getAttribute('data-f');
        for (j = 0; j < pills.length; j++) { pills[j].classList.remove(o.activeClass); setInactive(pills[j]); }
        btn.classList.add(o.activeClass); setActive(btn);
        for (j = 0; j < items.length; j++) items[j].classList.toggle(o.hiddenClass, f !== '__all__' && items[j].getAttribute('data-group') !== f);
    });
}
(function waitFG() { if(document.querySelector('#filter-controls')&&document.querySelector('[data-group]')){try{filterGrid();}catch(err){if(window.console)console.error('filterGrid:',err);}}else{setTimeout(waitFG,50);} })();


// ═══════════════════════════════════════════════════════════════
// ECHO SLIDER
// ═══════════════════════════════════════════════════════════════

;(function() {
    var F  = window.HxHFramework;
    var ST = F.utilities.storage;

    var config = {
        forumId:         '1082772',
        sezioniEscluse:  [65111597, 65111833],
        numTopics:       10,
        intervalloSlide: 5000,
        maxExpanded:     10,
        posizionamento:  '.tagboard',
        coloriSezioni: {
    'Ongame':  { ids: ['65114233','65114232','65114231','65114236'], className: 'echo-ongame' },
    'Offgame': { ids: ['65114124','65112407','65112409'],            className: 'echo-offgame' },
    'Extra':   { ids: ['65073571','65073572'],                       className: 'echo-extra' }
}
    };

    var echoTopicsData=[], echoCurrentIndex=0, echoSliderInterval=null, echoSliderElement=null;

    function echoLoadTopics(callback) {
        var sp = config.sezioniEscluse.length ? '&nosez='+config.sezioniEscluse.join(',') : '';
        fetch('https://'+location.hostname+'/api.php?a=1&n='+config.numTopics+sp+'&cook'+'ie=1&_='+Date.now())
            .then(function(r){if(!r.ok)throw new Error();return r.text();})
            .then(function(text){
                var data;
                try{data=JSON.parse(text.replace(/[\n\r\t]/g,' ').trim());}
                catch(e){try{data=JSON.parse(text.replace(/,\s*]/g,']').replace(/,\s*}/g,'}').replace(/[\n\r\t]/g,' ').trim());}catch(e2){throw new Error();}}
                if(!data.threads||!data.threads.length){if(callback)callback(false);return;}
                echoTopicsData=[];
                for(var i=0;i<data.threads.length;i++){
                    var th=data.threads[i],lp=th.info.last;
                    echoTopicsData.push({id:th.id,title:th.title,url:'https://'+location.hostname+'/?t='+th.id+'&view=getlastpost#lastpost',author:lp.name,authorId:lp.id,authorUrl:'https://'+location.hostname+'/?act=Profile&MID='+lp.id,avatar:lp.avatar,date:F.utilities.dates.formatDate(new Date(lp.date),'D/M/Y'),time:F.utilities.dates.formatDate(new Date(lp.date),'H:I'),sectionName:th.section_name||'N/A',sectionId:th.section_id||''});
                }
                var ds={}; for(var j=0;j<echoTopicsData.length;j++){ds['t'+echoTopicsData[j].id]=echoTopicsData[j];} ST.set('EchoSliderData',ds);
                if(callback)callback(true);
            })
            .catch(function(){
                var cached=ST.get('EchoSliderData',true);
                if(cached){echoTopicsData=[];for(var k in cached){if(cached.hasOwnProperty(k))echoTopicsData.push(cached[k]);}if(callback)callback(true);}
                else{if(callback)callback(false);}
            });
    }

    function echoDecodeHtml(str){var t=document.createElement('div');t.innerHTML=str;return t.innerHTML;}

    function echoCreateSlider(){
        if (document.getElementById('echo-slider')) return true;
        var target=document.querySelector(config.posizionamento); if(!target)return false;
        var d=document.createElement('div'); d.id='echo-slider';
        d.innerHTML='<div class="echo-wrapper"><div class="echo-container"><div class="echo-loading">Caricamento...</div></div></div><div class="echo-nav"><button class="echo-btn echo-prev"><i class="fa fa-chevron-left"></i></button><button class="echo-btn echo-next"><i class="fa fa-chevron-right"></i></button><button class="echo-btn echo-expand"><i class="fa fa-chevron-down"></i></button></div>';
        target.parentNode.insertBefore(d,target); echoSliderElement=d;
        d.querySelector('.echo-prev').addEventListener('click',function(e){e.preventDefault();echoPrevSlide();});
        d.querySelector('.echo-next').addEventListener('click',function(e){e.preventDefault();echoNextSlide();});
        d.querySelector('.echo-expand').addEventListener('click',function(e){e.preventDefault();echoToggleExpand();});
        return true;
    }

    function echoBuildAllSlides(){
        if(!echoSliderElement)return;
        var container=echoSliderElement.querySelector('.echo-container'),html='';
        for(var i=0;i<config.numTopics;i++){
            if(i<echoTopicsData.length){
                var t=echoTopicsData[i],av=t.avatar?'<img src="'+t.avatar+'" class="echo-avatar" alt="'+t.author+'">':'<div class="echo-avatar echo-avatar-default"></div>';
                var su=t.sectionId?'https://'+location.hostname+'/?f='+t.sectionId:'#',ss='';
if(t.sectionId){var sid=String(t.sectionId);outer:for(var g in config.coloriSezioni){if(!config.coloriSezioni.hasOwnProperty(g))continue;var grp=config.coloriSezioni[g];for(var j=0;j<grp.ids.length;j++){if(grp.ids[j]===sid){ss=' '+grp.className;break outer;}}}}
                html+='<div class="echo-item"><a href="'+su+'" class="echo-section'+ss+'" target="_blank">'+echoDecodeHtml(t.sectionName)+'</a><a href="'+t.authorUrl+'" class="echo-avatar-wrap" target="_blank">'+av+'</a><div class="echo-content"><div class="echo-meta"><a href="'+t.authorUrl+'" class="echo-author" target="_blank">'+t.author+'</a><span class="echo-action">dice:</span><a href="'+t.url+'" class="echo-topic" target="_blank">'+t.title+'</a></div><div class="echo-time">alle <span class="echo-hour">'+t.time+'</span> del <span class="echo-date">'+t.date+'</span></div></div></div>';
            } else {
                html+='<div class="echo-item echo-placeholder"><div class="echo-section" style="background:#000!important">N/A</div><div class="echo-avatar-wrap"><img src="https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png" class="echo-avatar"></div><div class="echo-content"><div class="echo-meta"><span class="echo-author" style="color:#ebeadd">Nessun topic</span><span class="echo-action" style="color:#6d5b7a">disponibile</span></div></div></div>';
            }
        }
        container.innerHTML=html;
    }

    function echoShowTopic(i){if(echoSliderElement)echoSliderElement.querySelector('.echo-container').style.transform='translateX('+-(i*echoSliderElement.offsetWidth)+'px)';}
    function echoPrevSlide(){echoCurrentIndex=(echoCurrentIndex-1+config.numTopics)%config.numTopics;echoShowTopic(echoCurrentIndex);echoResetAutoplay();}
    function echoNextSlide(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);echoResetAutoplay();}
    function echoResetAutoplay(){if(echoSliderInterval)clearInterval(echoSliderInterval);echoSliderInterval=setInterval(function(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);},config.intervalloSlide);}

    function echoToggleExpand(){
        if(!echoSliderElement)return;
        var w=echoSliderElement.querySelector('.echo-wrapper'),c=echoSliderElement.querySelector('.echo-container');
        var eb=echoSliderElement.querySelector('.echo-expand'),pb=echoSliderElement.querySelector('.echo-prev'),nb=echoSliderElement.querySelector('.echo-next');
        var icon=eb.querySelector('i'),exp=echoSliderElement.classList.contains('echo-expanded'),items=c.querySelectorAll('.echo-item');
        if(exp){
            for(var i=0;i<items.length;i++)items[i].style.display='flex';
            echoSliderElement.classList.remove('echo-expanded');w.style.overflow='hidden';c.style.transition='transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)';
            icon.className='fa fa-chevron-down';pb.style.display='flex';nb.style.display='flex';echoResetAutoplay();
        } else {
            for(var i=0;i<items.length;i++)items[i].style.display=i<config.maxExpanded?'flex':'none';
            c.style.transition='none';c.style.transform='translateX(0)';echoSliderElement.classList.add('echo-expanded');w.style.overflow='visible';
            icon.className='fa fa-chevron-up';pb.style.display='none';nb.style.display='none';if(echoSliderInterval)clearInterval(echoSliderInterval);
        }
    }

    function echoStartSlider(){if(echoSliderInterval)clearInterval(echoSliderInterval);echoBuildAllSlides();echoCurrentIndex=0;echoShowTopic(0);echoSliderInterval=setInterval(function(){echoCurrentIndex=(echoCurrentIndex+1)%config.numTopics;echoShowTopic(echoCurrentIndex);},config.intervalloSlide);}

    function echoInitSlider(){
        if (document.getElementById('echo-slider')) return;
        function init(){if(!echoCreateSlider())return;echoLoadTopics(function(){echoStartSlider();});}
        if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{setTimeout(init,100);}
    }
    echoInitSlider();
})();


// ═══════════════════════════════════════════════════════════════
// SKIN ALTERNATIVE
// ═══════════════════════════════════════════════════════════════

;(function() {
    var skinAttive = 3;

    function def()       { document.body.classList.remove('bodynatale','bodyhalloween'); document.body.classList.add('bodydef'); }
    function natale()    { document.body.classList.remove('bodydef','bodyhalloween');    document.body.classList.add('bodynatale'); }
    function halloween() { document.body.classList.remove('bodydef','bodynatale');       document.body.classList.add('bodyhalloween'); }

    var saved = localStorage.getItem('skin');
    if (!saved)                     { localStorage.setItem('skin','def'); def(); }
    else if (saved === 'def')       { def(); }
    else if (saved === 'natale')    { natale(); }
    else if (saved === 'halloween') { halloween(); }

    if (skinAttive === 0) { def(); localStorage.setItem('skin','def'); return; }

    // ── injectWithRetry: riprova fino a 20 volte ogni 500ms ──
    injectWithRetry(function() {
        var ffLinks = document.querySelector('#ff_links');
        if (!ffLinks) return;

        var box = document.createElement('div');
        box.id = 'skin-addon-box';

        if (skinAttive >= 1) {
            var b = document.createElement('span');
            b.className = 'skin-switcher skin-base';
            b.onclick = function() { def(); localStorage.setItem('skin','def'); };
            box.appendChild(b);
        }
        if (skinAttive === 1 || skinAttive === 3) {
            var h = document.createElement('span');
            h.className = 'skin-switcher skin-halloween';
            h.onclick = function() { halloween(); localStorage.setItem('skin','halloween'); };
            box.appendChild(h);
        }
        if (skinAttive === 2 || skinAttive === 3) {
            var n = document.createElement('span');
            n.className = 'skin-switcher skin-natale';
            n.onclick = function() { natale(); localStorage.setItem('skin','natale'); };
            box.appendChild(n);
        }

        ffLinks.appendChild(box);
    }, 'skin-addon-box', 20);
})();


// ═══════════════════════════════════════════════════════════════
// TEAMZONE PATCH
// ═══════════════════════════════════════════════════════════════

;(function() {
    window.TeamZoneConfig = {
        recruit: {
            enabled: true,
            url:     'https://hxhforumgdr.forumcommunity.net/?t=61175237',
            text:    'Cerchiamo staff, proponiti <a href="{url}">QUI</a>'
        }
    };

    function patchTooltip() {
        var icon = document.querySelector('.team-zone-show-suspended-members'); if(!icon)return;
        ['data-tooltip','data-info','title','aria-label','data-title','data-content'].forEach(function(a){if(icon.getAttribute(a)==='Mostra Membri Sospesi')icon.setAttribute(a,'Staff ad Honorem');});
    }
    function addRecruitBanner() {
        var cfg = window.TeamZoneConfig && window.TeamZoneConfig.recruit; if(!cfg){setTimeout(addRecruitBanner,300);return;} if(!cfg.enabled)return;
        var list = document.querySelector('.team-zone-content.team-zone-member-list'); if(!list){setTimeout(addRecruitBanner,300);return;}
        var b=document.createElement('DIV'); b.className='team-zone-recruit-banner'; b.innerHTML=cfg.text.replace('{url}',cfg.url); list.appendChild(b);
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){patchTooltip();addRecruitBanner();});}
    else{setTimeout(function(){patchTooltip();addRecruitBanner();},500);}
})();


// ═══════════════════════════════════════════════════════════════
// COMPLEANNI
// ═══════════════════════════════════════════════════════════════

;(function() {
    var F  = window.HxHFramework;
    var ST = F.utilities.storage;
    var SETTINGS = { sez: 65073571, topic: 81025561, toast_duration: 8000 };
    var FB_URL = 'https://compleanni-4035c-default-rtdb.europe-west1.firebasedatabase.app/birthdays-done';

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // Legge il nodo di oggi. Prova a ottenere anche l'ETag per la scrittura condizionata;
    // se il browser/CORS non lo permette, ricade su una GET normale (etag = null).
    // Se la data salvata non è oggi, restituisce un nodo vuoto (verrà sovrascritto alla prima scrittura).
    async function fbRead() {
        var r, etag = null;
        try {
            r = await fetch(FB_URL + '.json', { cache: 'no-store', headers: { 'X-Firebase-ETag': 'true' } });
            etag = r.headers.get('ETag');
        } catch(e) {
            r = await fetch(FB_URL + '.json', { cache: 'no-store' });
        }
        var data = await r.json();
        if (!data || data.date !== todayKey()) data = { date: todayKey(), users: {}, tagged: {} };
        if (!data.users)  data.users  = {};
        if (!data.tagged) data.tagged = {};
        return { data: data, etag: etag };
    }

    // Valore che una mutate può restituire per dire "nessuna modifica, non scrivere".
    var NO_WRITE = {};

    // Lettura-modifica-scrittura. Con l'ETag la PUT riesce solo se nessun altro ha scritto
    // nel frattempo (altrimenti 412 → si rilegge e si riprova), così due utenti che cliccano
    // insieme non possono "prendersi" entrambi il tag.
    async function fbTransaction(mutate) {
        for (var attempt = 0; attempt < 5; attempt++) {
            var res    = await fbRead();
            var result = mutate(res.data);
            if (result === NO_WRITE) return result;
            var opts   = { method: 'PUT', body: JSON.stringify(res.data) };
            if (res.etag) opts.headers = { 'if-match': res.etag };
            var w = await fetch(FB_URL + '.json', opts);
            if (w.ok) return result;
            if (w.status !== 412) throw new Error('Firebase ' + w.status);
        }
        throw new Error('Firebase: troppi conflitti');
    }

    // true fra mezzanotte e l'ora in cui UTC passa al giorno nuovo (le 2 d'estate, l'1 d'inverno):
    // in quella finestra la lista compleanni del mobile di ForumFree è ancora quella di ieri.
    function dateSkewed() {
        var d = new Date();
        return d.getUTCDate() !== d.getDate();
    }

    // Scrive l'utente nel nodo Firebase per oggi
    async function markDone(userId) {
        try {
            await fbTransaction(function(data) { data.users[userId] = true; });
        } catch(e) { console.warn('[BGR] markDone fallito:', e); }
    }

    // Riserva il tag per i festeggiati non ancora taggati oggi.
    // Restituisce gli ID che QUESTO utente deve taggare.
    async function claimTags(birthdays, userId) {
        try {
            return await fbTransaction(function(data) {
                var mine = [];
                for (var i = 0; i < birthdays.length; i++) {
                    var id = birthdays[i].id;
                    if (id && !data.tagged[id]) {
                        data.tagged[id] = userId;
                        mine.push(id);
                    }
                }
                return mine;
            });
        } catch(e) { console.warn('[BGR] claimTags fallito:', e); return []; }
    }

    // Se il post fallisce, libera i tag riservati così li farà il prossimo utente.
    async function releaseTags(ids, userId) {
        if (!ids.length) return;
        try {
            await fbTransaction(function(data) {
                for (var i = 0; i < ids.length; i++) {
                    if (data.tagged[ids[i]] === userId) delete data.tagged[ids[i]];
                }
            });
        } catch(e) {}
    }

    window.addEventListener('load', function() {
        if (!F.location.isHome() || F.groups.isGuest()) return;
        F.requests.fetchToken(function(token) {
            var today = new Date().toDateString(), DOM_BIRTHDAYS = [];
            var container = document.querySelector('#birthdays');
            if (container) { var links = container.querySelectorAll('.submenu a'); for(var i=0;i<links.length;i++){var a=links.item(i),href=a.getAttribute('href')||'',m=href.match(/MID=(\d+)/);DOM_BIRTHDAYS.push({id:m?m[1]:null,nickname:a.textContent.trim(),url:href});} }

            var userId = String(Commons.user.id);

            fbRead().then(function(res) { start(res.data); }, function(e) { console.warn('[BGR] lettura Firebase fallita:', e); start(null); });

            function start(data) {
                // Lista dei festeggiati: 1) quella salvata oggi dal desktop;
                // 2) se manca e siamo nella finestra sfasata, nessuna (quella del mobile è di ieri);
                // 3) altrimenti quella della pagina mobile.
                var BIRTHDAYS;
                if (data && data.listReady) BIRTHDAYS = data.list || [];
                else if (dateSkewed()) BIRTHDAYS = [];
                else BIRTHDAYS = DOM_BIRTHDAYS;

                if (!BIRTHDAYS.length) return;
                for (var i=0;i<BIRTHDAYS.length;i++){if(BIRTHDAYS[i].id==Commons.user.id)return;}
                injectFA(); injectStyles();

                if (data && data.users[userId]) return; // già fatto oggi su qualsiasi device
                if (ST.get('bgr-lastcheck') === today) { showBubble(BIRTHDAYS); return; }
                ST.set('bgr-lastcheck', today);
                showCard(BIRTHDAYS);
            }

            function postWish(birthdays, taggedIds, callback) {
                var tags=''; for(var i=0;i<birthdays.length;i++){if(i>0)tags+=', ';if(taggedIds.indexOf(birthdays[i].id)!==-1){tags+='<mark data-uid="'+birthdays[i].id+'">'+birthdays[i].nickname+'</mark>';}else{tags+=birthdays[i].nickname;}}
                var msg='<div style="background:linear-gradient(135deg,#1a1040 0%,#0d3b52 100%);border-radius:16px;padding:28px;font-family:Montserrat,sans-serif;">'
                    +'<div style="text-align:center;margin-bottom:20px;"><div style="font-size:36px;color:#79BD9A;"><i class="fa fa-birthday-cake"></i></div>'
                    +'<div style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#79BD9A,#CFF09E,#79BD9A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Buon Compleanno!</div></div>'
                    +'<div style="background:rgba(255,255,255,.06);border-radius:12px;padding:16px;text-align:center;margin-bottom:18px;">'
                    +'<p style="font-size:14px;color:#8FBEBA;margin:0;">Tanti auguri a '+tags+' da parte di tutti noi di <strong style="color:#E2F7C4;">'+F.constants.FORUM_NAME+'</strong>!</p></div>'
                    +'<div style="text-align:center;border-top:1px solid rgba(143,190,186,.15);padding-top:14px;"><span style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(143,190,186,.5);">'+F.constants.FORUM_NAME+'</span></div></div>';
                F.requests.postComment(token, SETTINGS.sez, SETTINGS.topic, msg, function(ok) { callback(ok); });
            }
            function showCard(b){renderCard(b,true);}
            function showCardFromBubble(b){renderCard(b,false);}
            function renderCard(birthdays, autoDismiss) {
                var nl=buildNamesList(birthdays), verb=birthdays.length===1?'compie gli anni oggi!':'compiono gli anni oggi!';
                document.body.insertAdjacentHTML('beforeend','<div id="bgr-card"><button class="bgr-close"><i class="fa fa-times"></i></button><div class="bgr-icon"><i class="fa fa-birthday-cake"></i></div><div class="bgr-body"><p class="bgr-title">Compleanni di oggi!</p><p class="bgr-subtitle">'+nl+' '+verb+'</p><button class="bgr-btn" id="bgr-wish-btn"><i class="fa fa-heart"></i> Fai gli auguri!</button></div></div>');
                var card=document.getElementById('bgr-card'), wb=document.getElementById('bgr-wish-btn'), cb=card.querySelector('.bgr-close');
                wb.addEventListener('click', function() {
                    wb.disabled=true; wb.innerHTML='<i class="fa fa-spinner fa-spin"></i> Invio...';
                    claimTags(birthdays, userId).then(function(taggedIds) {
                        postWish(birthdays, taggedIds, function(ok) {
                            var after = ok ? Promise.resolve() : releaseTags(taggedIds, userId);
                            after.then(function() { return markDone(userId); }).then(function() {
                                // view=getlastpost: ForumFree calcola lato server la pagina giusta del topic
                                setTimeout(function(){ document['loca'+'tion']['hre'+'f']='https://'+location.hostname+'/?t='+SETTINGS.topic+'&view=getlastpost'; }, 2000);
                            });
                        });
                    });
                });
                if(autoDismiss){cb.addEventListener('click',function(){minimizeToBubble(card,birthdays);});setTimeout(function(){minimizeToBubble(card,birthdays);},SETTINGS.toast_duration);}
                else{cb.addEventListener('click',function(){if(card.parentNode)card.parentNode.removeChild(card);showBubble(birthdays);});}
            }
            function minimizeToBubble(card,birthdays){if(!card||card._minimizing)return;card._minimizing=true;card.style.animation='bgr-shrink .4s forwards';setTimeout(function(){if(card.parentNode)card.parentNode.removeChild(card);showBubble(birthdays);},400);}
            function showBubble(birthdays){document.body.insertAdjacentHTML('beforeend','<button id="bgr-bubble"><i class="fa fa-birthday-cake"></i></button>');var b=document.getElementById('bgr-bubble');b.addEventListener('click',function(){if(b.parentNode)b.parentNode.removeChild(b);showCardFromBubble(birthdays);});}
            function buildNamesList(birthdays){var h='';for(var i=0;i<birthdays.length;i++){if(i>0)h+=', ';h+='<a class="bgr-name" href="https://'+location.hostname+birthdays[i].url+'">'+birthdays[i].nickname+'</a>';}return h;}
        });
    });

    function injectFA(){if(document.getElementById('bgr-fa'))return;var l=document.createElement('link');l.id='bgr-fa';l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';document.head.appendChild(l);}
    function injectStyles(){
        if(document.getElementById('bgr-styles'))return;
        var css='@keyframes bgr-slideIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}'
            +'@keyframes bgr-shrink{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.5)}}'
            +'@keyframes bgr-bubbleIn{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}'
            +'#bgr-card{position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;align-items:flex-start;gap:14px;background:linear-gradient(135deg,#292354 0%,#0B486B 100%);border-radius:20px;box-shadow:0 16px 48px rgba(11,72,107,.5);padding:22px 24px;max-width:320px;animation:bgr-slideIn .4s cubic-bezier(.22,1,.36,1) forwards;border-top:3px solid #79BD9A;border-bottom:3px solid #79BD9A;font-family:Montserrat,inherit}'
            +'#bgr-card .bgr-close{position:absolute;top:10px;right:12px;background:none;border:none;font-size:11px;color:rgba(143,190,186,.4);cursor:pointer;padding:2px 4px}'
            +'#bgr-card .bgr-icon{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#79BD9A,#CFF09E);display:flex;align-items:center;justify-content:center;font-size:21px;color:#0B486B;flex-shrink:0}'
            +'#bgr-card .bgr-body{display:flex;flex-direction:column;gap:6px;padding-right:14px}'
            +'#bgr-card .bgr-title{margin:0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(90deg,#79BD9A,#CFF09E);-webkit-background-clip:text;-webkit-text-fill-color:transparent}'
            +'#bgr-card .bgr-subtitle{margin:0;font-size:13px;font-weight:500;color:#8FBEBA;line-height:1.55}'
            +'#bgr-card .bgr-name{font-weight:800;color:#CFF09E;text-decoration:none;-webkit-text-fill-color:#CFF09E}'
            +'#bgr-card .bgr-btn{margin-top:10px;padding:9px 20px;background:transparent;color:#CFF09E;border:1.5px solid #CFF09E;border-radius:50px;font-family:Montserrat,inherit;font-weight:700;font-size:11px;cursor:pointer;align-self:flex-start;transition:.2s}'
            +'#bgr-card .bgr-btn:hover{background:#CFF09E;color:#0B486B}'
            +'#bgr-bubble{position:fixed;bottom:24px;left:24px;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#292354,#0B486B);color:#79BD9A;border:2px solid #79BD9A;font-size:22px;cursor:pointer;animation:bgr-bubbleIn .3s cubic-bezier(.22,1,.36,1) forwards;transition:.3s ease}'
            +'#bgr-bubble:hover{transform:scale(1.1)}';
        var s=document.createElement('style');s.id='bgr-styles';s.textContent=css;document.head.appendChild(s);
    }
})();


// ═══════════════════════════════════════════════════════════════
// METEO — carica meteo-v7.4.js, lo stesso file del desktop
// Luoghi, tempo di gioco e override sono quelli del desktop: qui non
// c'è niente da tenere allineato. Sul mobile la scheda è sempre aperta.
// Quando esce una nuova versione dello script meteo, aggiorna solo URL_METEO.
// ═══════════════════════════════════════════════════════════════
;(function() {
    var URL_METEO = 'https://cdn.jsdelivr.net/gh/HXH-F-GDR/ScriptForumfree@main/meteo-v7.4.js';

    function parti() {
        if (window.HxHMeteo) window.HxHMeteo.avvia({ mobile: true });
    }

    injectWithRetry(function() {
        var ffLinks = document.querySelector('#ff_links');
        if (!ffLinks) return;
        var container = document.createElement('div');
        container.id = 'hxh-meteo-box';
        var bar = document.createElement('div');
        bar.id = 'hxh-bar';
        container.appendChild(bar);
        ffLinks.appendChild(container);

        if (window.HxHMeteo) { parti(); return; }
        var sm = document.createElement('script');
        sm.src = URL_METEO;
        sm.onload = parti;
        document.head.appendChild(sm);
    }, 'hxh-meteo-box', 20);
})();


// ═══════════════════════════════════════════════════════════════
// STAFF TASKS — mobile: inietta come <li> nella lista profilo
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    F.utilities.waitFor(
        function() { return F.constants.JSONBIN_MASTER_KEY !== null; },
        function() {

    var SETTINGS = { binId:'699b6d2fd0ea881f40cff23d', sectionName:'Task Staff' };
    var API_KEY  = F.constants.JSONBIN_MASTER_KEY;
    var API_URL  = 'https://api.jsonbin.io/v3/b/' + SETTINGS.binId;

    if (!SETTINGS.binId || !API_KEY) return;
    if (!F.groups.isStaff() && !F.groups.isAdmin()) return;
    if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return;

    function isProfileStaff() {
        var pc=document.querySelector('ul.list-group.profile'); if(!pc)return false;
        var cls=' '+pc.className+' ';
        return cls.indexOf(' box_amministratore ')!==-1||cls.indexOf(' box_founder ')!==-1||cls.indexOf(' box_globalmod ')!==-1||cls.indexOf(' box_gruppo1 ')!==-1||cls.indexOf(' box_gruppo2 ')!==-1||cls.indexOf(' box_gruppo3 ')!==-1||cls.indexOf(' box_gruppo4 ')!==-1;
    }
    if (!isProfileStaff()) return;

    var currentUserId = parseInt(window.Commons.location.profile.id);
    var currentUserName = Commons.user.nickname || 'Sconosciuto';
    var tasks = [];

    // ── Inserisce i due <li> nella lista profilo prima di .bottom ──
    function injectProfileSection() {
        if (document.getElementById('staff-tasks-content')) return;
        var uInfo = document.querySelector('.list-group.profile .u_info');
        if (!uInfo) return;
        var anchor = uInfo.nextSibling;
        var titleLi = document.createElement('li');
        titleLi.className = 'title';
        titleLi.textContent = SETTINGS.sectionName;
        var contentLi = document.createElement('li');
        contentLi.className = 'u_tasks';
        contentLi.innerHTML = '<div id="staff-tasks-message"></div><div id="staff-tasks-content"><p class="st-loading">Caricamento...</p></div><div id="staff-tasks-add"></div>';
        uInfo.parentNode.insertBefore(titleLi, anchor);
        uInfo.parentNode.insertBefore(contentLi, anchor);
        loadTasks();
        renderAddTaskForm();
    }

    function getProfileUserName(){var el=document.querySelector('.u_nick');return el?el.textContent.trim():'questo utente';}

    async function loadTasks(){try{var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});if(!r.ok)throw new Error();var d=await r.json();tasks=(d.record.tasks||{})[currentUserId]||[];renderTasks();}catch(e){showError('Errore nel caricamento delle task');}}
    async function saveTasks(all){try{var r=await fetch(API_URL,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':API_KEY},body:JSON.stringify({tasks:all})});if(!r.ok)throw new Error();return true;}catch(e){showError('Errore nel salvataggio');return false;}}
    async function fetchAllTasks(){var r=await fetch(API_URL+'/latest',{method:'GET',headers:{'X-Master-Key':API_KEY}});var d=await r.json();return d.record.tasks||{};}
    async function addTask(taskTitle){try{var all=await fetchAllTasks();if(!all[currentUserId])all[currentUserId]=[];var t={id:'task_'+Date.now(),title:taskTitle,assignedBy:currentUserName,assignedById:String(Commons.user.id),assignedAt:new Date().toISOString(),completed:false,completedAt:null};all[currentUserId].push(t);var saved=await saveTasks(all);if(saved){tasks.push(t);renderTasks();showSuccess('Task aggiunta!');}}catch(e){showError("Errore nell'aggiunta");}}
    async function toggleTask(taskId){try{var all=await fetchAllTasks();var ut=all[currentUserId];if(!ut)return;for(var i=0;i<ut.length;i++){if(ut[i].id===taskId){ut[i].completed=!ut[i].completed;ut[i].completedAt=ut[i].completed?new Date().toISOString():null;break;}}var saved=await saveTasks(all);if(saved)await loadTasks();}catch(e){showError("Errore nell'aggiornamento");}}
    async function deleteTask(taskId){try{var all=await fetchAllTasks();if(!all[currentUserId])return;all[currentUserId]=all[currentUserId].filter(function(t){return t.id!==taskId;});var saved=await saveTasks(all);if(saved)await loadTasks();}catch(e){showError("Errore nell'eliminazione");}}

    function escapeHtml(t){return t.replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];});}

    function renderTasks(){
        var container=document.getElementById('staff-tasks-content'); if(!container)return;
        var own = currentUserId == Commons.user.id;
        var at=tasks.filter(function(t){return!t.completed;}), ct=tasks.filter(function(t){return t.completed;});
        var html='<div class="tasks-section"><h4>Task Attive <span class="count">('+at.length+')</span></h4>'+(at.length===0?'<p class="st-empty">Nessuna task attiva</p>':'<ul class="tasks-list">'+at.map(function(t){return renderTask(t,own);}).join('')+'</ul>')+'</div>';
        if(ct.length>0)html+='<div class="tasks-section completed-section"><h4>Task Completate <span class="count">('+ct.length+')</span></h4><ul class="tasks-list">'+ct.map(function(t){return renderTask(t,own);}).join('')+'</ul></div>';
        container.innerHTML=html;
        attachEventListeners(own);
    }
    function renderTask(task,own){
        var h='<li class="task-item '+(task.completed?'completed':'')+'" data-task-id="'+task.id+'">';
        if(own)h+='<input type="checkbox" class="task-checkbox" '+(task.completed?'checked':'')+' >';
        h+='<div class="task-content"><div class="task-title">'+escapeHtml(task.title)+'</div><div class="task-meta"><span class="task-assigned">Da: <strong>'+escapeHtml(task.assignedBy)+'</strong></span><span class="task-date">'+F.utilities.dates.formatDate(new Date(task.assignedAt),'D/M/Y H:I')+'</span></div></div>';
        if(own&&task.completed)h+='<button class="task-delete">&#10005;</button>';
        return h+'</li>';
    }
    function attachEventListeners(own){
        if(!own)return;
        document.querySelectorAll('.task-checkbox').forEach(function(cb){cb.addEventListener('change',function(){toggleTask(this.closest('.task-item').getAttribute('data-task-id'));});});
        document.querySelectorAll('.task-delete').forEach(function(btn){btn.addEventListener('click',function(){var id=this.closest('.task-item').getAttribute('data-task-id');if(confirm('Eliminare questa task?'))deleteTask(id);});});
    }
    function renderAddTaskForm(){
        var container=document.getElementById('staff-tasks-add'); if(!container)return;
        container.innerHTML='<div class="add-task-form"><h4>Aggiungi Task a '+getProfileUserName()+'</h4><input type="text" id="task-title-input" placeholder="Titolo della task..."><button id="add-task-btn">Aggiungi</button></div>';
        var ab=document.getElementById('add-task-btn');
        ab.addEventListener('click',function(){var t=document.getElementById('task-title-input').value.trim();if(!t){alert('Inserisci un titolo');return;}addTask(t);document.getElementById('task-title-input').value='';});
        document.getElementById('task-title-input').addEventListener('keypress',function(e){if(e.key==='Enter')ab.click();});
    }
    function showMessage(msg,type){var c=document.getElementById('staff-tasks-message');if(!c)return;c.innerHTML='<div class="st-message '+type+'">'+msg+'</div>';setTimeout(function(){c.innerHTML='';},3000);}
    function showError(m){showMessage(m,'error');}
    function showSuccess(m){showMessage(m,'success');}

    injectWithRetry(injectProfileSection, 'staff-tasks-content', 20);

    var style=document.createElement('style');
    style.textContent='.u_tasks{padding:10px}.tasks-section{margin-bottom:12px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.tasks-section.completed-section{border-left-color:#0b486b}.tasks-section h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.tasks-section h4 .count{color:#3B8686;font-weight:normal;font-size:12px}.tasks-list{list-style:none;padding:0;margin:0;overflow-y:auto;max-height:140px}.task-item{display:flex;align-items:flex-start;gap:8px;padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px;position:relative}.task-item.completed{opacity:0.6}.task-item.completed .task-title{text-decoration:line-through}.task-checkbox{width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px}.task-content{flex:1;min-width:0}.task-title{color:#292354;font-weight:600;font-size:13px;margin-bottom:3px;word-wrap:break-word}.task-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:10px}.task-assigned{color:#292354;background:#A8DBA8;padding:2px 5px;border-radius:3px}.task-date{color:#FFF;background:#3B8686;padding:2px 5px;border-radius:3px}.task-delete{position:absolute;top:6px;right:6px;background:#d9534f;color:#FFF;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;line-height:1;padding:0}.add-task-form{background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #79BD9A;margin-top:8px}.add-task-form h4{color:#0B486B;margin:0 0 8px 0;font-size:13px;font-weight:bold}.add-task-form input{width:100%;padding:8px;margin-bottom:8px;border:2px solid #3B8686;border-radius:5px;font-size:13px;box-sizing:border-box}.add-task-form button{width:100%;padding:9px;background:#3B8686;color:#FFF;border:none;border-radius:5px;font-size:13px;font-weight:bold;cursor:pointer}.st-message{padding:7px;border-radius:5px;margin-bottom:8px;text-align:center;font-weight:bold;font-size:12px}.st-message.error{background:#d9534f;color:#FFF}.st-message.success{background:#79BD9A;color:#FFF}.st-empty{color:#3B8686;font-style:italic;padding:6px;font-size:12px}.st-loading{text-align:center;color:#0B486B;padding:12px;font-size:13px}';
    document.head.appendChild(style);

    }); // fine waitFor
})();


// ═══════════════════════════════════════════════════════════════
// SCHEDE GDR — mobile: inietta come <li> nella lista profilo
// ═══════════════════════════════════════════════════════════════

;(function() {
    'use strict';
    var F = window.HxHFramework;

    if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return;

    var SETTINGS = {
        sectionName: 'Schede PG',
        sections: {
            attive:       { id: 65112407, label: 'Schede Attive' },
            nonApprovate: { id: 65112406, label: 'Schede Non Approvate' },
            congelate:    { id: 65112408, label: 'Schede Congelate' },
            inattive:     { id: 65112409, label: 'Schede Inattive' }
        }
    };

    var currentProfileUserId = parseInt(window.Commons.location.profile.id);
    var sheets = {};
    for (var k in SETTINGS.sections) sheets[k] = [];

    function decodeHTML(text){var ta=document.createElement('textarea');ta.innerHTML=text;return ta.value;}

    function injectProfileSection() {
        if (document.getElementById('gdr-custom-content')) return;
        var uInfo = document.querySelector('.list-group.profile .u_info');
        if (!uInfo) return;
        var anchor = uInfo.nextSibling;
        var titleLi = document.createElement('li');
        titleLi.className = 'title';
        titleLi.textContent = SETTINGS.sectionName;
        var contentLi = document.createElement('li');
        contentLi.className = 'u_sheets';
        contentLi.innerHTML = '<div id="gdr-progress" class="gdr-loading">Caricamento schede...</div><div id="gdr-custom-content"></div>';
        uInfo.parentNode.insertBefore(titleLi, anchor);
        uInfo.parentNode.insertBefore(contentLi, anchor);
        loadAllSheets();
    }

    function loadTopicsFromAPI(sectionId) {
        var all=[],perPage=100,page=0;
        function loadPage(){
            return fetch('https://'+location.hostname+'/api.php?f='+sectionId+'&a=2&n='+perPage+'&st='+(page*perPage)+'&cook'+'ie=1&_='+Date.now())
                .then(function(r){if(!r.ok)throw new Error();return r.json();})
                .then(function(data){
                    if(!data.threads||!data.threads.length)return all;
                    for(var i=0;i<data.threads.length;i++){var t=data.threads[i];if(!t.info||!t.info.start)continue;if(parseInt(t.info.start.id)!==currentProfileUserId)continue;all.push({id:parseInt(t.id),titolo:decodeHTML(t.title),url:'https://'+location.hostname+'/?t='+t.id,dataCreazione:new Date(t.info.start.date),dataUltimaModifica:new Date(t.info.last?t.info.last.date:t.info.start.date)});}
                    if(data.threads.length===perPage){page++;return loadPage();}
                    return all;
                });
        }
        return loadPage();
    }

    async function loadAllSheets(){
        var pe=document.getElementById('gdr-progress');
        var keys=Object.keys(SETTINGS.sections), total=keys.length, loaded=0;
        for(var key in SETTINGS.sections){
            var sec=SETTINGS.sections[key];
            if(pe)pe.textContent='Caricamento '+sec.label+'...';
            try{sheets[key]=await loadTopicsFromAPI(sec.id);}catch(e){sheets[key]=[];}
            loaded++;
            if(pe)pe.textContent='Caricamento... '+Math.round((loaded/total)*100)+'%';
        }
        if(pe)pe.style.display='none';
        renderSheets();
    }

    function renderSheets(){
        var container=document.getElementById('gdr-custom-content'); if(!container)return;
        var html='';
        for(var key in SETTINGS.sections){
            var sec=SETTINGS.sections[key], list=sheets[key];
            list.sort(function(a,b){return b.dataCreazione-a.dataCreazione;});
            html+='<div class="gdr-section"><h4>'+sec.label+' <span class="gdr-count">('+list.length+')</span></h4>';
            if(!list.length){html+='<p class="gdr-empty">Nessuna scheda</p>';}
            else{html+='<ul class="gdr-sheets-list">';for(var i=0;i<list.length;i++){var s=list[i];html+='<li><a href="'+s.url+'" class="gdr-sheet-title">'+s.titolo+'</a><div class="gdr-sheet-dates"><span class="gdr-date-created">'+F.utilities.dates.formatDate(s.dataCreazione,'D/M/Y H:I')+'</span><span class="gdr-date-modified">'+F.utilities.dates.formatDate(s.dataUltimaModifica,'D/M/Y H:I')+'</span></div></li>';}html+='</ul>';}
            html+='</div>';
        }
        container.innerHTML=html;
    }

    injectWithRetry(injectProfileSection, 'gdr-custom-content', 20);

    var style=document.createElement('style');
    style.textContent='.u_sheets{padding:10px}.gdr-loading{background:#3B8686;color:#FFF;padding:8px;border-radius:5px;margin-bottom:10px;text-align:center;font-weight:bold;font-size:12px}.gdr-section{margin-bottom:12px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.gdr-section h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.gdr-count{color:#3B8686;font-weight:normal;font-size:12px}.gdr-sheets-list{list-style:none;padding:0;margin:0;overflow-y:auto;max-height:140px}.gdr-sheets-list li{padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px}.gdr-sheet-title{color:#292354;text-decoration:none;font-weight:600;font-size:13px;display:block;margin-bottom:4px}.gdr-sheet-dates{display:flex;gap:6px;flex-wrap:wrap}.gdr-date-created,.gdr-date-modified{font-size:10px;padding:2px 5px;border-radius:3px;color:#FFF}.gdr-date-created{background:#79BD9A}.gdr-date-modified{background:#3B8686}.gdr-empty{color:#3B8686;font-style:italic;padding:6px;font-size:12px}';
    document.head.appendChild(style);
})();




// ============================================================
// GREED ISLAND — Minigame gatcha (mobile)
// ============================================================
//  Config (dati) + logica in un unico IIFE, come gli altri
//  script mobile. Differenze dal desktop:
//    - guard/topic via window.HxHFramework (F.location)
//    - utente via Commons.user (id + nickname), non dal DOM

;(function() {

    var F = window.HxHFramework;
    if (!F) return;
    var FW = F; // alias: la logica riusata dal desktop usa "FW"

    // ---- CONFIG (dati modificabili) ----
    var CONFIG = {
        TOPIC_ID: '81151008',
        SECTION_ID: '65073571',
        FIREBASE_DB_URL: 'https://greed-island-9c98e-default-rtdb.europe-west1.firebasedatabase.app',
        ENFORCE_TURN_RULE: true,
        POST_TO_TOPIC: true
    };
    var IMG_BASE = 'https://upload.forumfree.net/i/ff13540297/HxH/GreedIsland/';
    var CARD_BACK = 'https://upload.forumfree.net/i/ff13540297/HxH/GreedIsland/Carte-Retro.png';
    var MALUS_ID = -3;
    var RANK_WEIGHTS = { SS: 5, S: 10, A: 20, B: 45, D: 10, MALUS: 10 };

    // Le 100 carte collezionabili: solo numero (id) e rank.
    var CARDS_SRC = [
        {id:0,rank:'SS'}, {id:1,rank:'SS'}, {id:2,rank:'SS'}, {id:3,rank:'A'}, {id:4,rank:'A'},
        {id:5,rank:'S'}, {id:6,rank:'A'}, {id:7,rank:'S'}, {id:8,rank:'S'}, {id:9,rank:'S'},
        {id:10,rank:'A'}, {id:11,rank:'B'}, {id:12,rank:'S'}, {id:13,rank:'A'}, {id:14,rank:'B'},
        {id:15,rank:'S'}, {id:16,rank:'S'}, {id:17,rank:'SS'}, {id:18,rank:'A'}, {id:19,rank:'A'},
        {id:20,rank:'B'}, {id:21,rank:'B'}, {id:22,rank:'A'}, {id:23,rank:'B'}, {id:24,rank:'A'},
        {id:25,rank:'B'}, {id:26,rank:'A'}, {id:27,rank:'B'}, {id:28,rank:'B'}, {id:29,rank:'A'},
        {id:30,rank:'B'}, {id:31,rank:'S'}, {id:32,rank:'B'}, {id:33,rank:'S'}, {id:34,rank:'B'},
        {id:35,rank:'S'}, {id:36,rank:'S'}, {id:37,rank:'B'}, {id:38,rank:'B'}, {id:39,rank:'B'},
        {id:40,rank:'B'}, {id:41,rank:'B'}, {id:42,rank:'B'}, {id:43,rank:'B'}, {id:44,rank:'B'},
        {id:45,rank:'B'}, {id:46,rank:'A'}, {id:47,rank:'A'}, {id:48,rank:'A'}, {id:49,rank:'A'},
        {id:50,rank:'A'}, {id:51,rank:'S'}, {id:52,rank:'B'}, {id:53,rank:'A'}, {id:54,rank:'A'},
        {id:55,rank:'A'}, {id:56,rank:'B'}, {id:57,rank:'A'}, {id:58,rank:'A'}, {id:59,rank:'A'},
        {id:60,rank:'B'}, {id:61,rank:'A'}, {id:62,rank:'B'}, {id:63,rank:'B'}, {id:64,rank:'B'},
        {id:65,rank:'S'}, {id:66,rank:'B'}, {id:67,rank:'B'}, {id:68,rank:'A'}, {id:69,rank:'B'},
        {id:70,rank:'A'}, {id:71,rank:'A'}, {id:72,rank:'A'}, {id:73,rank:'A'}, {id:74,rank:'A'},
        {id:75,rank:'A'}, {id:76,rank:'B'}, {id:77,rank:'S'}, {id:78,rank:'B'}, {id:79,rank:'A'},
        {id:80,rank:'S'}, {id:81,rank:'SS'}, {id:82,rank:'A'}, {id:83,rank:'B'}, {id:84,rank:'D'},
        {id:85,rank:'S'}, {id:86,rank:'A'}, {id:87,rank:'S'}, {id:88,rank:'A'}, {id:89,rank:'A'},
        {id:90,rank:'A'}, {id:91,rank:'A'}, {id:92,rank:'S'}, {id:93,rank:'B'}, {id:94,rank:'S'},
        {id:95,rank:'A'}, {id:96,rank:'A'}, {id:97,rank:'A'}, {id:98,rank:'S'}, {id:99,rank:'S'}
    ];

    // Icona SVG del bottone "Pesca carta".
    var DRAW_ICON_SVG = '<svg viewBox="0 0 151.6 150.2" width="28" height="28" style="display:block;fill:currentColor;" xmlns="http://www.w3.org/2000/svg"><polygon points="75.7,0.2 65.2,22.6 86.1,22.6"/><polygon points="86.2,127.7 75.8,150.2 65.3,127.7"/><polygon points="129.1,64.7 151.6,75 129.1,85.5"/><polygon points="22.4,64.7 0,75 22.4,85.5"/><path d="M75.8,26.9c-26.6,0-48.2,21.6-48.2,48.2c0,26.6,21.6,48.2,48.2,48.2c26.6,0,48.2-21.6,48.2-48.2C123.9,48.5,102.4,26.9,75.8,26.9z M75.8,115.8c-22.5,0-40.7-18.2-40.7-40.7c0-22.5,18.2-40.7,40.7-40.7c22.5,0,40.7,18.2,40.7,40.7C116.5,97.6,98.3,115.8,75.8,115.8z"/><path d="M75.5,40.9c-18.8,0-34.1,15.3-34.1,34.1s15.3,34.1,34.1,34.1c18.8,0,34.1-15.3,34.1-34.1S94.3,40.9,75.5,40.9z M75.7,102C60.8,102,48.7,89.9,48.7,75s12.1-27.1,27.1-27.1c14.9,0,27.1,12.1,27.1,27.1S90.7,102,75.7,102z"/><circle cx="75.4" cy="75" r="17.4"/></svg>';

    function imgUrl(id) {
        var s;
        if (id < 0) { s = '-' + ('00' + Math.abs(id)).slice(-3); }
        else { s = ('00' + id).slice(-3); }
        return IMG_BASE + s + '.png';
    }

    var CARDS = [];
    for (var _i = 0; _i < CARDS_SRC.length; _i++) {
        CARDS.push({ id: CARDS_SRC[_i].id, rank: CARDS_SRC[_i].rank, img: imgUrl(CARDS_SRC[_i].id) });
    }

    var MALUS_CARD = { id: MALUS_ID, rank: null, img: imgUrl(MALUS_ID) };
    var TOTAL_CARDS = CARDS.length;

// -- Nomi ufficiali (inglese) delle 100 carte collezionabili. --
var NAMES = {
    0: "Ruler's Blessing",
    1: "Patch of Forest",
    2: "Plot of Beach",
    3: "Pitcher of Eternal Water",
    4: "Skin Care Hot Springs",
    5: "Spirited Away Hollow",
    6: "Liquor Spring",
    7: "Pregnancy Stones",
    8: "Mystery Pond",
    9: "Tree of Plenty",
    10: "Golden Guidebook",
    11: "Golden Scales",
    12: "Golden Dictionary",
    13: "Luck Bankbook",
    14: "Connection Severing Scissors",
    15: "Fickle Genie",
    16: "Fairy King's Advice",
    17: "Angel's Breath",
    18: "Imp's Wink",
    19: "Poltergeist Pillow",
    20: "Mood Clock",
    21: "X-Ray Goggles",
    22: "Toraemon",
    23: "Tome of a Thousand Tales",
    24: "Hypothetical T.V.",
    25: "Risky Dice",
    26: "Night Shift Dwarves",
    27: "Book of V.I.P Passes",
    28: "Capricious Remote",
    29: "Pre-Order Vouchers",
    30: "Favor Cushion",
    31: "Double Postcard to the Dead",
    32: "Parrot Candy",
    33: "Hormone Cookies",
    34: "Universal Survey",
    35: "Chameleon Cat",
    36: "Recycling Room",
    37: "Fledgling Athlete",
    38: "Fledgling Artist",
    39: "Fledgling Politician",
    40: "Fledgling Musician",
    41: "Fledgling Pilot",
    42: "Fledgling Novelist",
    43: "Fledgling Gambler",
    44: "Fledgling Actor",
    45: "Fledgling CEO",
    46: "Gold Dust Girl",
    47: "Sleeping Girl",
    48: "Aromatherapy Girl",
    49: "Miniature Mermaid",
    50: "Miniature Dino",
    51: "Miniature Dragon",
    52: "Pearl Locusts",
    53: "King White Stag Beetle",
    54: "Millennium Butterfly",
    55: "Revenge Shop",
    56: "Perfect Memory Studio",
    57: "Hideout Realtor",
    58: "Secrets Video Rental",
    59: "Instant Foreign Language School",
    60: "Long Lost Delivery",
    61: "Vending Check-Up",
    62: 'Club "You Rule"',
    63: "Virtual Restaurant",
    64: "Witch's Love Potion",
    65: "Witch's Rejuvenation Potion",
    66: "Witch's Diet Pills",
    67: "Doyen's Growth Pills",
    68: "Doyen's Virility Pills",
    69: "Doyen's Hair Restorer",
    70: "Mad Scientist's Steroids",
    71: "Mad Scientist's Pheromones",
    72: "Mad Scientist's Plastic Surgery",
    73: "Night Jade",
    74: "Sage's Aquamarine",
    75: "Wild Luck Alexandrite",
    76: "Roaming Ruby",
    77: "Beauty Magnet Emerald",
    78: "Lonely Sapphire",
    79: "Rainbow Diamond",
    80: "Levitation Stone",
    81: "Blue Planet",
    82: "Staff of Judgment",
    83: "Sword of Truth",
    84: "Paladin's Necklace",
    85: "Sacrifice Armor",
    86: "Quiver of Frustration",
    87: "Shield of Faith",
    88: "Eternal Hammer",
    89: "Tax Collector's Gauntlet",
    90: "Memory Helmet",
    91: "Plastic King",
    92: "Swap Ticket",
    93: "Book of Life",
    94: "Bandit's Blade",
    95: "Secret Cape",
    96: "Clairvoyant Snake",
    97: "3-D Camera",
    98: "Silver Dog",
    99: "Panda Maid"
};

    // ---- GUARD: attivo solo nel topic del minigame ----
    if (!F.location.isTopic() || F.location.getTopicId() !== String(CONFIG.TOPIC_ID)) {
        return;
    }

    // ---- UTENTE LOGGATO: da Commons.user (mobile) ----
    // ATTENZIONE: window.Commons viene popolato da ForumFree in tempi
    // variabili a seconda del browser. Controllarlo una volta sola qui
    // causerebbe una race condition (su alcuni browser il modulo parte
    // prima che Commons esista, esce, e il minigame non compare mai).
    // USER viene quindi risolto all'avvio, dentro waitFor.
    var USER = null;

    function risolviUtente() {
        if (window.Commons && Commons.user && Commons.user.id) {
            USER = {
                id: String(Commons.user.id),
                name: Commons.user.nickname || ('Utente ' + Commons.user.id)
            };
            return true;
        }
        return false;
    }

// FIREBASE  —  REST API (niente SDK)
// ----------------------------------------
//
// Struttura dati:
//   /greedisland/players/<userId> = { name: "...", cards: { "3": true, "7": true } }
//   /greedisland/meta/lastDrawUserId = "<userId>"

var DB = CONFIG.FIREBASE_DB_URL.replace(/\/+$/, '');

function fbGet(path, callback) {
    fetch(DB + path + '.json')
        .then(function(r) { return r.json(); })
        .then(function(data) { callback(null, data); })
        .catch(function(e) { callback(e, null); });
}

function fbPut(path, value, callback) {
    fetch(DB + path + '.json', {
        method: 'PUT',
        body: JSON.stringify(value)
    })
        .then(function(r) { return r.json(); })
        .then(function(data) { callback(null, data); })
        .catch(function(e) { callback(e, null); });
}

// LOGICA DI GIOCO
// ----------------------------------------

function getCardById(id) {
    for (var i = 0; i < CARDS.length; i++) {
        if (CARDS[i].id === id) return CARDS[i];
    }
    return null;
}

/**
 * Numero carta formattato a 3 cifre: 5 -> "005", 62 -> "062".
 * Il malus (-3) diventa "-003".
 */
function cardNum(card) {
    if (card.id < 0) {
        return '-' + ('00' + Math.abs(card.id)).slice(-3);
    }
    return ('00' + card.id).slice(-3);
}

/**
 * Nome di una carta. Le collezionabili lo prendono da NAMES;
 * il malus (-003) ha nome fisso "Eliminate".
 */
function cardName(card) {
    if (card.id < 0) return 'Eliminate';
    var nm = NAMES[card.id];
    return nm ? nm : ('Carta ' + cardNum(card));
}

/**
 * Rank leggibile: le carte usano il loro rank; il malus non ha un
 * vero rank e mostra "Game Master".
 * Il valore di card.rank arriva dal config incollato nel forum: se
 * ForumFree ci ha iniettato caratteri invisibili (es. soft hyphen dopo
 * la "S"), li rimuoviamo tenendo solo lettere e spazi.
 */
function cardRankLabel(card) {
    if (!card.rank) return 'Game Master';
    // Prima toglie eventuali entity HTML (es. il testo "&shy;"), poi
    // tiene solo lettere A-Z e spazi (elimina soft hyphen e altri residui).
    return String(card.rank).replace(/&[a-z]+;/gi, '').replace(/[^A-Za-z ]/g, '');
}

/**
 * Etichetta testuale completa di una carta:
 *   "Carta #005 - Nome - [Rank B]"
 *   "Carta #-003 - Eliminate - [Rank Game Master]"
 */
function cardLabel(card) {
    return 'Carta #' + cardNum(card) +
        ' - ' + cardName(card) +
        ' - [Rank ' + cardRankLabel(card) + ']';
}

/**
 * Versione HTML dell'etichetta per i POST.
 * Il nome passa in escapeHTML; il resto è testo sicuro. Nessun trucco
 * extra: "[Rank S]" scritto normalmente nel post non dà problemi.
 */
function cardLabelHTML(card) {
    return escapeHTML(cardLabel(card));
}

/**
 * Restituisce tutte le carte collezionabili di un dato rank.
 */
function cardsOfRank(rank) {
    var out = [];
    for (var i = 0; i < CARDS.length; i++) {
        if (CARDS[i].rank === rank) out.push(CARDS[i]);
    }
    return out;
}

/**
 * Sorteggia una carta secondo RANK_WEIGHTS.
 * 1) Sceglie un "esito" (un rank, oppure MALUS) pesato sulle percentuali.
 * 2) Se è MALUS, restituisce la carta -003. Altrimenti pesca a caso una
 *    carta collezionabile dentro il rank scelto.
 *
 * @returns {{card: object, isMalus: boolean}}
 */
function pickCard() {
    // Somma dei pesi (di norma 100, ma calcolata per robustezza).
    var total = 0;
    var key;
    for (key in RANK_WEIGHTS) {
        if (RANK_WEIGHTS.hasOwnProperty(key)) total += RANK_WEIGHTS[key];
    }

    // Estrazione pesata dell'esito.
    var roll = Math.random() * total;
    var acc = 0;
    var chosen = null;
    for (key in RANK_WEIGHTS) {
        if (!RANK_WEIGHTS.hasOwnProperty(key)) continue;
        acc += RANK_WEIGHTS[key];
        if (roll < acc) { chosen = key; break; }
    }
    if (chosen === null) chosen = 'B'; // fallback difensivo

    // Malus: nessuna carta collezionabile.
    if (chosen === 'MALUS') {
        return { card: MALUS_CARD, isMalus: true };
    }

    // Pesca una carta a caso nel rank scelto.
    var pool = cardsOfRank(chosen);
    if (pool.length === 0) {
        // Rank senza carte (non dovrebbe capitare): ripiega su tutta la lista.
        pool = CARDS;
    }
    var card = pool[Math.floor(Math.random() * pool.length)];
    return { card: card, isMalus: false };
}

/**
 * Esegue una pesca: controlla la regola dei turni, sorteggia una carta
 * secondo i pesi per rank, salva su Firebase (se non è il malus),
 * posta nel topic.
 */
function drawCard(onDone) {
    // 1. Regola dei turni: non due pesche consecutive dallo stesso utente.
    fbGet('/greedisland/meta/lastDrawUserId', function(err, lastId) {
        if (!err && CONFIG.ENFORCE_TURN_RULE && lastId && String(lastId) === String(USER.id)) {
            onDone({ ok: false, reason: 'turn' });
            return;
        }

        // 2. Sorteggia la carta (o il malus) secondo RANK_WEIGHTS.
        var pick = pickCard();
        var card = pick.card;
        var isMalus = pick.isMalus;

        // 3. Leggi lo stato attuale del giocatore.
        fbGet('/greedisland/players/' + USER.id, function(err2, player) {
            player = player || { name: USER.name, cards: {} };
            player.name = USER.name; // aggiorna nome in caso sia cambiato
            if (!player.cards) player.cards = {};

            // 4. Se NON è il malus, aggiungi la carta alla collezione.
            var isNew = false;
            if (!isMalus) {
                isNew = !player.cards[card.id];
                player.cards[card.id] = true;
            }

            // 5. Salva il giocatore (sempre, così il nome resta aggiornato;
            //    col malus la collezione resta invariata).
            fbPut('/greedisland/players/' + USER.id, player, function(err3) {
                if (err3) { onDone({ ok: false, reason: 'db' }); return; }

                // 6. Aggiorna lastDrawUserId (anche il malus "consuma" il turno).
                fbPut('/greedisland/meta/lastDrawUserId', USER.id, function() {
                    var owned = countOwned(player);

                    // 7. Post e animazione IN PARALLELO:
                    //    - il post parte subito, così ForumFree ha tutto il
                    //      tempo dell'animazione per registrarlo (altrimenti
                    //      #lastpost punterebbe al post precedente al nostro);
                    //    - l'animazione scorre;
                    //    - a fine ANIMAZIONE si completa (-> reload), a
                    //      prescindere dall'esito del post: la carta e' gia'
                    //      salvata su Firebase, quindi non si perde nulla.
                    announceDrawInTopic(card, owned, isMalus, function() {
                        // post concluso (o loggato): nessuna azione, il reload
                        // e' guidato dalla fine dell'animazione qui sotto.
                    });

                    playDrawAnimation(card, isMalus, function() {
                        onDone({ ok: true, card: card, isNew: isNew, owned: owned, isMalus: isMalus });
                    });
                });
            });
        });
    });
}

function countOwned(player) {
    if (!player || !player.cards) return 0;
    var n = 0;
    for (var i = 0; i < CARDS.length; i++) {
        if (player.cards[CARDS[i].id]) n++;
    }
    return n;
}

/**
 * Posta il risultato della pesca nel topic tramite il framework.
 */
/**
 * Pubblica una risposta nel topic, versione MOBILE.
 *
 * Non cerchiamo il token "a mano": replichiamo l'approccio che il
 * framework usa già in postTopic (e che gli script ufficiali usano via
 * document.REPLIER): si scarica la pagina di risposta del topic, si
 * prende il form REPLIER_POST e si leggono i suoi campi reali (compreso
 * il token "s"). Così funziona sia su desktop sia su mobile, perché i
 * valori arrivano direttamente dal form che ForumFree stesso genera.
 *
 * @param {string} sectionId
 * @param {string} topicId
 * @param {string} content   HTML del messaggio
 * @param {function} callback riceve (ok)
 */
function postCommentMobile(sectionId, topicId, content, callback) {
    var host = 'https://' + location.hostname;
    var replyUrl = host + '/?act=Post&CODE=02&f=' + sectionId + '&t=' + topicId;

    fetch(replyUrl)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var form = doc.getElementById('REPLIER_POST');
            if (!form) {
                console.warn('[GreedIsland mobile] form REPLIER_POST non trovato');
                callback(false);
                return null;
            }

            // Legge un campo del form in modo sicuro.
            function campo(nome, fallback) {
                try {
                    if (form[nome] && typeof form[nome].value !== 'undefined') {
                        return form[nome].value;
                    }
                } catch (e) { /* ignora */ }
                return fallback;
            }

            var fd = new FormData();
            fd.set('st',   campo('st', '0'));
            fd.set('act',  campo('act', 'Post'));
            fd.set('s',    campo('s', ''));
            fd.set('CODE', campo('CODE', '03'));
            fd.set('f',    campo('f', sectionId));
            fd.set('t',    campo('t', topicId));
            fd.set('Post', content);
            fd.set('enablesig', '1');
            fd.set('track_topic', '1');
            fd.set('charset', 'UTF-8');
            if (form.MAX_FILE_SIZE) fd.set('MAX_FILE_SIZE', form.MAX_FILE_SIZE.value);
            if (form.check)         fd.set('check', form.check.value);

            return fetch(host + '/', {
                method: 'POST',
                body: fd
            }).then(function(r) { return r.text(); });
        })
        .then(function(html) {
            if (html === null || typeof html === 'undefined') return;
            callback(true);
        })
        .catch(function(e) {
            console.error('[GreedIsland mobile] errore pubblicazione:', e);
            callback(false);
        });
}

function announceDrawInTopic(card, owned, isMalus, cb) {
    if (!CONFIG.POST_TO_TOPIC) {
        console.log('[GreedIsland] (post disattivato) ' + USER.name + ' -> ' + cardLabel(card));
        cb();
        return;
    }

    var html = buildDrawPostHTML(card, owned, isMalus);

    postCommentMobile(CONFIG.SECTION_ID, CONFIG.TOPIC_ID, html, function(ok) {
        if (!ok) console.warn('[GreedIsland mobile] post non confermato');
        cb();
    });
}

// HTML DEI POST  —  tutto inline (vincolo ForumFree)
// ----------------------------------------

function buildDrawPostHTML(card, owned, isMalus) {
    var label = cardLabel(card); // "Carta #NNN - Nome - [Rank X]"

    if (isMalus) {
        // Post speciale per la carta -003 Eliminate: espulsione, nessuna carta.
        return '' +
            '<div style="border:1px solid #a03030;background:#2a1414;padding:14px;max-width:400px;font-family:montserrat,sans-serif;color:#f2c4c4;">' +
                '<div style="font-family:\'Alegreya Sans SC\',sans-serif;font-size:16px;color:#ff8080;margin-bottom:8px;text-align:center;letter-spacing:1px;">' +
                    'Hai pescato la carta:' +
                '</div>' +
                '<div style="text-align:center;margin:8px 0;">' +
                    '<img src="' + card.img + '" alt="' + escapeHTML(label) + '"' +
                    ' style="max-width:100%;height:auto;border:2px solid #a03030;border-radius:4px;">' +
                '</div>' +
                '<div style="text-align:center;font-size:14px;color:#f2c4c4;">' +
                    '<b>' + cardLabelHTML(card) + '</b>' +
                '</div>' +
                '<div style="text-align:center;font-size:13px;color:#ff8080;margin-top:8px;">' +
                    'Sei stato espulso da Greed Island! Nessuna carta ottenuta.' +
                '</div>' +
            '</div>';
    }

    // Post normale. Immagine a dimensione naturale, limitata dal div (400px).
    var img = '<img src="' + card.img + '" alt="' + escapeHTML(label) + '"' +
        ' style="max-width:100%;height:auto;border:2px solid #79BD9A;border-radius:4px;">';

    return '' +
        '<div style="border:1px solid #3B8686;background:#292354;padding:14px;max-width:400px;font-family:montserrat,sans-serif;color:#E2F7C4;">' +
            '<div style="font-family:\'Alegreya Sans SC\',sans-serif;font-size:16px;color:#CFF09E;margin-bottom:8px;text-align:center;letter-spacing:1px;">' +
                'Hai pescato la carta:' +
            '</div>' +
            '<div style="text-align:center;margin:8px 0;">' +
                img +
            '</div>' +
            '<div style="text-align:center;font-size:14px;color:#E2F7C4;">' +
                '<b>' + cardLabelHTML(card) + '</b>' +
            '</div>' +
            '<div style="text-align:center;font-size:12px;color:#8FBEBA;margin-top:8px;">' +
                'Collezione: ' + owned + '/' + TOTAL_CARDS +
            '</div>' +
        '</div>';
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// UI  —  pannello laterale + modali (tutto inline)
// ----------------------------------------

var el = {}; // riferimenti agli elementi

function buildPanel() {
    var panel = document.createElement('div');
    panel.id = 'gi-panel';
    // Mobile: nessun box, solo i tre bottoni circolari attaccati al bordo
    // destro e centrati verticalmente.
    panel.style.cssText = 'position:fixed;top:50%;right:4px;z-index:9998;' +
        'transform:translateY(-50%);' +
        'display:flex;flex-direction:column;gap:10px;' +
        'background:transparent;border:none;padding:0;';

    el.drawBtn       = makeButton('Pesca carta', DRAW_ICON_SVG,   '#79BD9A', '#292354');
    el.collectionBtn = makeButton('Collezione',  'fa-layer-group',  '#3B8686', '#E2F7C4');
    el.rankingBtn    = makeButton('Classifica',  'fa-ranking-star', '#3B8686', '#E2F7C4');

    panel.appendChild(el.drawBtn);
    panel.appendChild(el.collectionBtn);
    panel.appendChild(el.rankingBtn);

    document.body.appendChild(panel);

    el.drawBtn.addEventListener('click', onDrawClick);
    el.collectionBtn.addEventListener('click', openCollection);
    el.rankingBtn.addEventListener('click', openRanking);
}

/**
 * Mobile: bottone CIRCOLARE con la sola icona (niente testo, per
 * risparmiare spazio). L'icona può essere un SVG inline (se inizia con
 * "<svg") o una classe Font Awesome.
 * Il testo dell'etichetta finisce nel title (tooltip) e in aria-label.
 * b._label resta come oggetto fittizio: onDrawClick ci scrive il testo
 * di stato ("Pesco...", "Fatto!") e lo riversiamo nel title, senza
 * rompere nulla e senza mostrare testo nel bottone.
 */
function makeButton(label, iconSpec, bg, fg) {
    var b = document.createElement('button');
    b.title = label;
    b.setAttribute('aria-label', label);
    b.style.cssText = 'cursor:pointer;border:1px solid #3B8686;' +
        'width:52px;height:52px;border-radius:50%;padding:0;' +
        'background:' + bg + ';color:' + fg + ';' +
        'display:flex;align-items:center;justify-content:center;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.4);' +
        'font-family:montserrat,sans-serif;';

    var icon;
    if (iconSpec.indexOf('<svg') === 0) {
        icon = document.createElement('span');
        icon.style.cssText = 'display:inline-flex;align-items:center;';
        icon.innerHTML = iconSpec;
    } else {
        icon = document.createElement('i');
        icon.className = 'fa-solid ' + iconSpec;
        icon.style.cssText = 'font-size:22px;';
    }

    b.appendChild(icon);

    // Etichetta nascosta: uno <span> reale ma non visibile. Così
    // onDrawClick può continuare a fare _label.textContent = '...'
    // senza rischi (niente getter/setter) e senza mostrare testo.
    var hidden = document.createElement('span');
    hidden.textContent = label;
    hidden.style.cssText = 'display:none;';
    b.appendChild(hidden);
    b._label = hidden;

    return b;
}

function onDrawClick() {
    el.drawBtn.disabled = true;
    el.drawBtn._label.textContent = 'Pesco...';

    drawCard(function(res) {
        if (!res.ok) {
            el.drawBtn.disabled = false;
            el.drawBtn._label.textContent = 'Pesca carta';
            if (res.reason === 'turn') {
                alert('Devi aspettare che peschi un altro giocatore prima di pescare di nuovo!');
            } else {
                alert('Errore durante la pesca. Riprova.');
            }
            return;
        }

        // Successo. Il post è partito all'inizio dell'animazione, quindi
        // ForumFree ha già avuto tutta la durata dell'animazione (~5s) per
        // registrarlo. Per portarci all'ultimo post usiamo il formato
        // server-side di ForumFree "view=getlastpost": a differenza di un
        // semplice #anchor, questo calcola lato server la PAGINA giusta del
        // topic (i topic multi-pagina altrimenti si aprono sulla pagina 1,
        // dove l'anchor non trova nulla e si finisce "a metà").
        el.drawBtn._label.textContent = 'Fatto!';
        var topicUrl = 'https://' + location.hostname + '/?t=' + CONFIG.TOPIC_ID + '&view=getlastpost';
        location.replace(topicUrl);
    });
}

// ── Modale generico ──────────────────────────────────────────────

function openModal(titleText, contentNode) {
    closeModal(); // eventuale modale aperto

    var overlay = document.createElement('div');
    overlay.id = 'gi-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;' +
        'background:rgba(0,0,0,.6);display:flex;align-items:center;' +
        'justify-content:center;font-family:montserrat,sans-serif;';

    var box = document.createElement('div');
    box.style.cssText = 'background:#292354;border:2px solid #3B8686;' +
        'border-radius:8px;max-width:560px;width:90%;max-height:80vh;' +
        'overflow:auto;box-shadow:0 4px 20px rgba(0,0,0,.5);';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;' +
        'align-items:center;padding:12px 16px;background:#0B486B;' +
        'border-radius:6px 6px 0 0;';

    var h = document.createElement('div');
    h.textContent = titleText;
    h.style.cssText = "font-family:'Alegreya Sans SC',sans-serif;" +
        'color:#CFF09E;font-weight:bold;font-size:17px;letter-spacing:1px;';

    var x = document.createElement('button');
    x.className = 'fa-solid fa-xmark';
    x.style.cssText = 'cursor:pointer;background:transparent;border:none;' +
        'color:#CFF09E;font-size:18px;font-weight:bold;';
    x.addEventListener('click', closeModal);

    header.appendChild(h);
    header.appendChild(x);

    var body = document.createElement('div');
    body.style.cssText = 'padding:16px;';
    body.appendChild(contentNode);

    box.appendChild(header);
    box.appendChild(body);
    overlay.appendChild(box);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
}

function closeModal() {
    var ex = document.getElementById('gi-modal-overlay');
    if (ex) ex.parentNode.removeChild(ex);
}

// ── Modale collezione ────────────────────────────────────────────

function openCollection() {
    var loading = document.createElement('div');
    loading.textContent = 'Caricamento...';
    loading.style.cssText = 'text-align:center;color:#8FBEBA;';
    openModal('La tua collezione', loading);

    fbGet('/greedisland/players/' + USER.id, function(err, player) {
        var owned = (player && player.cards) ? player.cards : {};
        var ownedCount = countOwned(player);

        var wrap = document.createElement('div');

        var summary = document.createElement('div');
        summary.style.cssText = 'text-align:center;font-size:14px;color:#CFF09E;margin-bottom:12px;';
        summary.innerHTML = '<b>' + ownedCount + '</b> / ' + TOTAL_CARDS + ' carte collezionate';
        wrap.appendChild(summary);

        var grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;justify-content:center;';

        for (var i = 0; i < CARDS.length; i++) {
            (function(c) {
                var has = !!owned[c.id];

                var cell = document.createElement('div');
                cell.style.cssText = 'width:110px;text-align:center;font-size:11px;color:#E2F7C4;' +
                    (has ? '' : 'opacity:.4;filter:grayscale(1);');

                var img = document.createElement('img');
                img.src = c.img;
                img.alt = cardLabel(c);
                img.style.cssText = 'width:100px;border:2px solid ' +
                    (has ? '#79BD9A' : '#8FBEBA') + ';border-radius:4px;' +
                    (has ? 'cursor:pointer;' : '');

                // Solo le carte possedute sono cliccabili per l'ingrandimento.
                if (has) {
                    img.addEventListener('click', function() { openCardZoom(c); });
                }

                var nm = document.createElement('div');
                nm.textContent = has ? ('#' + cardNum(c) + ' - ' + cardName(c)) : '???';
                nm.style.cssText = 'margin-top:4px;color:#E2F7C4;';

                cell.appendChild(img);
                cell.appendChild(nm);
                grid.appendChild(cell);
            })(CARDS[i]);
        }

        wrap.appendChild(grid);
        replaceModalBody(wrap);
    });
}

/**
 * Overlay che mostra una carta ingrandita. Cliccando fuori si chiude.
 * È indipendente dal modale collezione (ci si sovrappone).
 */
function openCardZoom(card) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;' +
        'background:rgba(0,0,0,.8);display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;font-family:montserrat,sans-serif;';

    var img = document.createElement('img');
    img.src = card.img;
    img.alt = cardLabel(card);
    img.style.cssText = 'max-width:90%;max-height:80vh;height:auto;' +
        'border:3px solid #79BD9A;border-radius:6px;box-shadow:0 4px 24px rgba(0,0,0,.6);';

    var caption = document.createElement('div');
    caption.textContent = cardLabel(card);
    caption.style.cssText = 'margin-top:12px;color:#E2F7C4;font-size:14px;text-align:center;';

    overlay.appendChild(img);
    overlay.appendChild(caption);
    overlay.addEventListener('click', function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });

    document.body.appendChild(overlay);
}

// ── Modale classifica ────────────────────────────────────────────

function openRanking() {
    var loading = document.createElement('div');
    loading.textContent = 'Caricamento...';
    loading.style.cssText = 'text-align:center;color:#8FBEBA;';
    openModal('Classifica collezionisti', loading);

    fbGet('/greedisland/players', function(err, players) {
        players = players || {};

        var rows = [];
        for (var uid in players) {
            if (!players.hasOwnProperty(uid)) continue;
            rows.push({
                id: uid,
                name: players[uid].name || ('Utente ' + uid),
                count: countOwned(players[uid])
            });
        }

        rows.sort(function(a, b) { return b.count - a.count; });

        var wrap = document.createElement('div');

        if (rows.length === 0) {
            wrap.textContent = 'Ancora nessun collezionista. Sii il primo a pescare!';
            wrap.style.cssText = 'text-align:center;color:#8FBEBA;';
            replaceModalBody(wrap);
            return;
        }

        var table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

        // Colori del podio per i primi 3 (oro, argento, bronzo).
        var podium = [
            { bg: '#4a3b0a', accent: '#ffd447', icon: 'fa-trophy' },       // 1°
            { bg: '#3a3f45', accent: '#d4dbe2', icon: 'fa-medal' },        // 2°
            { bg: '#40301c', accent: '#e0a066', icon: 'fa-medal' }         // 3°
        ];

        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var isMe = String(r.id) === String(USER.id);
            var isPodium = i < 3;
            var p = isPodium ? podium[i] : null;

            var tr = document.createElement('tr');
            var rowBg = isPodium ? p.bg : (isMe ? '#0B486B' : 'transparent');
            tr.style.cssText = 'border-bottom:1px solid #3B8686;background:' + rowBg + ';' +
                (isMe ? 'outline:2px solid #79BD9A;outline-offset:-2px;' : '');

            var pos = document.createElement('td');
            pos.style.cssText = 'padding:10px 8px;width:44px;text-align:center;font-weight:bold;' +
                'font-size:15px;color:' + (isPodium ? p.accent : '#CFF09E') + ';';
            if (isPodium) {
                // Medaglia + numero.
                var medal = document.createElement('i');
                medal.className = 'fa-solid ' + p.icon;
                medal.style.cssText = 'margin-right:4px;';
                pos.appendChild(medal);
                pos.appendChild(document.createTextNode(String(i + 1)));
            } else {
                pos.textContent = (i + 1);
            }

            var nm = document.createElement('td');
            nm.textContent = r.name;
            nm.style.cssText = 'padding:10px 8px;color:' +
                (isPodium ? '#ffffff' : '#E2F7C4') + ';' +
                (isPodium ? 'font-weight:bold;' : '');

            var cnt = document.createElement('td');
            cnt.textContent = r.count + '/' + TOTAL_CARDS;
            cnt.style.cssText = 'padding:10px 8px;width:80px;text-align:right;color:' +
                (isPodium ? p.accent : '#8FBEBA') + ';font-weight:' +
                (isPodium ? 'bold' : 'normal') + ';';

            tr.appendChild(pos);
            tr.appendChild(nm);
            tr.appendChild(cnt);
            table.appendChild(tr);
        }

        wrap.appendChild(table);
        replaceModalBody(wrap);
    });
}

function replaceModalBody(node) {
    var overlay = document.getElementById('gi-modal-overlay');
    if (!overlay) return;
    var body = overlay.querySelector('div > div:last-child');
    // il body è il secondo figlio del box
    var box = overlay.firstChild;
    var b = box.childNodes[1];
    if (b) {
        b.innerHTML = '';
        b.appendChild(node);
    }
}

// ANIMAZIONE DI PESCA  —  flip carta + ingrandimento + coriandoli
// ----------------------------------------

/**
 * Inietta una sola volta i keyframes usati dall'animazione di pesca.
 */
function ensureDrawAnimStyle() {
    if (document.getElementById('gi-draw-style')) return;
    var st = document.createElement('style');
    st.id = 'gi-draw-style';
    st.textContent =
        '@keyframes gi-fade-out { to { opacity:0; visibility:hidden; } }' +
        // Il "flip": ruota su Y più volte, poi si ferma sul fronte (360deg finali).
        '@keyframes gi-flip {' +
        '  0%   { transform: rotateY(0deg); }' +
        '  100% { transform: rotateY(1800deg); }' +   // 5 giri completi in ~2s
        '}' +
        // Dopo il flip: piccolo ingrandimento "pop".
        '@keyframes gi-pop {' +
        '  0%   { transform: scale(1); }' +
        '  60%  { transform: scale(1.25); }' +
        '  100% { transform: scale(1.15); }' +
        '}' +
        // Fallback 2D (browser senza supporto 3D): comparsa in scala.
        '@keyframes gi-appear {' +
        '  0%   { transform: scale(.5); opacity: 0; }' +
        '  100% { transform: scale(1);  opacity: 1; }' +
        '}' +
        // Coriandoli: volano verso l\'alto/lati e svaniscono. Impostati via JS.
        '@keyframes gi-confetti {' +
        '  0%   { opacity:1; transform: translate(0,0) rotate(0deg); }' +
        '  100% { opacity:0; transform: translate(var(--dx), var(--dy)) rotate(var(--dr)); }' +
        '}';
    document.head.appendChild(st);
}

/**
 * Mostra l'animazione della carta pescata e, al termine, chiama done().
 *   - la carta gira fronte/retro per ~2s
 *   - si ferma sul fronte e si ingrandisce
 *   - se NON è il malus, spara coriandoli attorno
 * Se manca CARD_BACK, salta l'animazione e chiama subito done().
 *
 * @param {object} card    la carta pescata (ha .img del fronte)
 * @param {boolean} isMalus se true, niente coriandoli
 * @param {function} done   callback di fine animazione
 */
function playDrawAnimation(card, isMalus, done) {
    if (!CARD_BACK) { done(); return; }
    ensureDrawAnimStyle();

    // Alcuni browser mobile non supportano le trasformazioni 3D
    // (transform-style:preserve-3d). Se manca, niente flip: mostriamo
    // la carta con una comparsa in scala, così il minigame funziona
    // comunque ovunque invece di rompersi.
    var supporta3D = (function() {
        try {
            var t = document.createElement('div');
            t.style.transformStyle = 'preserve-3d';
            return t.style.transformStyle === 'preserve-3d';
        } catch (e) { return false; }
    })();

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10001;' +
        'background:rgba(10,8,20,.78);display:flex;align-items:center;' +
        'justify-content:center;overflow:hidden;';

    // Contenitore con prospettiva 3D per il flip.
    var stage = document.createElement('div');
    stage.style.cssText = 'perspective:1200px;width:280px;height:392px;position:relative;';

    var flipper = document.createElement('div');

    if (supporta3D) {
        // Flip 3D: contenitore che ruota, con due facce (fronte/retro).
        flipper.style.cssText = 'position:relative;width:100%;height:100%;' +
            'transform-style:preserve-3d;-webkit-transform-style:preserve-3d;' +
            'animation:gi-flip 2s ease-out forwards;';

        var faceStyle = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
            'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
            'border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.6);' +
            'background-size:cover;background-position:center;';

        // Fronte: la carta pescata. Parte "davanti" (rotateY 0).
        var front = document.createElement('div');
        front.style.cssText = faceStyle + 'background-image:url(' + card.img + ');';

        // Retro: dietro, ruotato di 180deg così appare durante i giri.
        var back = document.createElement('div');
        back.style.cssText = faceStyle + 'background-image:url(' + CARD_BACK + ');' +
            'transform:rotateY(180deg);-webkit-transform:rotateY(180deg);';

        flipper.appendChild(front);
        flipper.appendChild(back);
    } else {
        // Fallback 2D: niente flip, la carta compare in scala.
        flipper.style.cssText = 'position:relative;width:100%;height:100%;' +
            'border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.6);' +
            'background-size:cover;background-position:center;' +
            'background-image:url(' + card.img + ');' +
            'animation:gi-appear .6s ease-out forwards;';
    }

    stage.appendChild(flipper);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    // Fase 2 (dopo il flip, ~2s): ferma la rotazione sul fronte, ingrandisci,
    // e (se non malus) spara i coriandoli.
    setTimeout(function() {
        if (supporta3D) {
            flipper.style.animation = 'none';
            flipper.style.transform = 'rotateY(0deg)';
        }
        stage.style.animation = 'gi-pop .5s ease-out forwards';
        if (!isMalus) {
            spawnConfetti(overlay);
        }
    }, 2000);

    // Fase 3: dopo che l'utente ha visto la carta ingrandita (~2.3s),
    // dissolvi l'overlay e chiama done() (che farà partire post + reload).
    setTimeout(function() {
        overlay.style.animation = 'gi-fade-out .5s ease-in forwards';
    }, 4300);
    setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        done();
    }, 4800);
}

/**
 * Genera un burst di coriandoli colorati attorno al centro dell'overlay.
 */
function spawnConfetti(overlay) {
    var colors = ['#CFF09E', '#79BD9A', '#3B8686', '#E2F7C4', '#ffd447', '#ff8080', '#8FBEBA'];
    var N = 40;
    for (var i = 0; i < N; i++) {
        var piece = document.createElement('div');
        var size = 6 + Math.floor(Math.random() * 8);
        var color = colors[Math.floor(Math.random() * colors.length)];

        // Direzione casuale (angolo + distanza).
        var angle = Math.random() * Math.PI * 2;
        var dist = 120 + Math.random() * 220;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        var dr = (Math.random() * 720 - 360);
        var dur = 0.8 + Math.random() * 0.7;

        piece.style.cssText = 'position:absolute;top:50%;left:50%;' +
            'width:' + size + 'px;height:' + (size * 0.6) + 'px;' +
            'background:' + color + ';border-radius:2px;' +
            '--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;' +
            '--dr:' + dr.toFixed(0) + 'deg;' +
            'animation:gi-confetti ' + dur.toFixed(2) + 's ease-out forwards;';
        overlay.appendChild(piece);
    }
}

// ---- AVVIO ----
// Aspettiamo che ForumFree abbia popolato window.Commons (tempi diversi
// da browser a browser: è questa la causa del "su alcuni browser va, su
// altri no"). Solo quando l'utente è risolto costruiamo il pannello.
function avviaPannello() {
    if (typeof injectWithRetry === 'function') {
        injectWithRetry(buildPanel, 'gi-panel', 20);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildPanel);
    } else {
        buildPanel();
    }
    console.log('[GreedIsland mobile] avviato per ' + USER.name + ' (id ' + USER.id + ')');
}

// Usa il waitFor del framework se c'è; altrimenti un equivalente locale.
if (F.utilities && typeof F.utilities.waitFor === 'function') {
    F.utilities.waitFor(risolviUtente, avviaPannello, 100, 15000);
} else {
    (function() {
        var trascorso = 0;
        function controlla() {
            if (risolviUtente()) { avviaPannello(); return; }
            trascorso += 100;
            if (trascorso < 15000) setTimeout(controlla, 100);
        }
        controlla();
    })();
}

})();




// ═══════════════════════════════════════════════════════════════
// CONTATORE CARATTERI/PAROLE — mobile: toggle lordo/netto sui post
// ═══════════════════════════════════════════════════════════════
//  Genera i contatori sui post (l'originale ForumFree non gira su mobile).
//  Tap per ciclare: caratteri -> parole -> caratteri validi -> parole valide.
//    - LORDO: markup incluso. Formula identica al desktop (nodo-contenuto,
//      ultimo td del .color, ripulito da .bottomborder e <br>). Parita' garantita.
//    - NETTO (validi): solo narrazione; esclude firma/edit/tag,
//      quote/spoiler/code/html e box PG/NPC.

;(function() {
    'use strict';
    var F = window.HxHFramework;
    if (!F || !F.location || !F.location.isTopic()) return;

    var MODES = ['chars', 'words', 'vchars', 'vwords'];
    var LABEL = {
        chars:  ' caratteri',
        words:  ' parole',
        vchars: ' caratteri validi',
        vwords: ' parole valide'
    };

    // selettori DOM mobile
    var POST_SEL   = 'li.post';
    var COLOR_SEL  = 'table.color';
    var ANCHOR_SEL = '.option'; // iniezione in basso, accanto alla data

    // ═══ CONTEGGIO (identico al desktop) ═══

    function contentNode(cleanBase) {
        var tds = Array.prototype.filter.call(cleanBase.querySelectorAll('td'), function(td) {
    return td.closest('table') === cleanBase;
});
        var host = tds.length ? tds[tds.length - 1] : cleanBase;
        var d = host.cloneNode(true);
        d.querySelectorAll('.bottomborder, br').forEach(function(el) { el.remove(); });
        return d;
    }
    function countGross(cleanBase, countWords) {
        if (cleanBase == null) return 0;
        var node = contentNode(cleanBase);
        var html = (node.innerHTML || '').replace(/\r\n|\r|\n/g, ' ');
        if (countWords) return countWordsIn(html);
        return html.replace(/\s/g, '').length;
    }
    function countNet(n, countWords) {
        if (n == null) return 0;
        var a, b;
        if (countWords) {
            var nb = n.cloneNode(true);
            nb.innerHTML = nb.innerHTML
                .replace(/<\/(\w+)[(\s+)]?>/gim, "</$1> ")
                .replace(/&lt;(.*?)\/(\w+)(.*?)[(\s+)]?&gt;/gim, "&lt;$1/$2$3&gt; ");
            a = (typeof(nb.innerText) == 'string') ? nb.innerText.trim().replace(/<(.*?) >/gim, "<$1>").replace(/>(\s+)<\//gim, "></") : '';
            b = (typeof(nb.textContent) == 'string') ? nb.textContent.trim().replace(/<(.*?) >/gim, "<$1>").replace(/>(\s+)<\//gim, "></") : '';
            a = a.split(/\r\n|\r|\n/).join(' ');
            b = b.split(/\r\n|\r|\n/).join(' ');
            a = countWordsIn(a);
            b = countWordsIn(b);
        } else {
            a = (typeof(n.innerText) == 'string') ? n.innerText : '';
            b = (typeof(n.textContent) == 'string') ? n.textContent : '';
            a = a.split(/\r\n|\r|\n/).join(' ');
            b = b.split(/\r\n|\r|\n/).join(' ');
            a = a.replace(/\s/g, '').length;
            b = b.replace(/\s/g, '').length;
        }
        return (a > b) ? a : b;
    }
    function countWordsIn(s) {
        s = s.replace(/\s+/g, ' ').trim();
        if (s === '') return 0;
        return s.split(' ').length;
    }

    // ═══ COSTRUZIONE NODI ═══

    function buildCleanNode(post) {
        var src = post.querySelector(COLOR_SEL);
        if (src == null) return null;
        var d = src.cloneNode(true);
        ['span.edit', 'div.signature', 'dl.tags'].forEach(function(sel) {
            d.querySelectorAll(sel).forEach(function(el) { el.remove(); });
        });
        return d;
    }
    function buildValidNode(baseNode) {
        var d = baseNode.cloneNode(true);
        d.querySelectorAll('.spoiler').forEach(function(el) { el.remove(); });
        d.querySelectorAll('.quote_top, .quote').forEach(function(el) { el.remove(); });
        d.querySelectorAll('.code_top, .code').forEach(function(el) { el.remove(); });
        removeQuoteBoxes(d);
        return d;
    }
    function removeQuoteBoxes(root) {
        var MARKERS = ['\u275D', '\u275E']; // guillemet a uncino
        var toRemove = [];
        root.querySelectorAll('div').forEach(function(el) {
            var txt = el.textContent || '';
            if (MARKERS.some(function(m) { return txt.indexOf(m) !== -1; })) {
                var box = findBoxAncestor(el, root);
                if (box && toRemove.indexOf(box) === -1) toRemove.push(box);
            }
        });
        toRemove.forEach(function(el) { if (el.parentNode) el.remove(); });
    }
    function findBoxAncestor(el, root) {
        var cur = el;
        while (cur && cur !== root) {
            var style = (cur.getAttribute && cur.getAttribute('style')) || '';
            if (/border-radius/i.test(style) && /border-(left|right|top|bottom)\s*:\s*\d/i.test(style)) return cur;
            cur = cur.parentNode;
        }
        return null;
    }

    // ═══ VALORI ═══

    function computeInto(link, post) {
        var base = buildCleanNode(post);
        if (base == null) return false;
        var valid = buildValidNode(base);
        link.dataset.chars  = countGross(base, false);
        link.dataset.words  = countGross(base, true);
        link.dataset.vchars = countNet(valid, false);
        link.dataset.vwords = countNet(valid, true);
        return true;
    }
    function valueFor(link, mode) {
        if (mode === 'chars')  return link.dataset.chars;
        if (mode === 'words')  return link.dataset.words;
        if (mode === 'vchars') return link.dataset.vchars;
        return link.dataset.vwords;
    }

    // ═══ GENERAZIONE ═══

    function generate() {
        document.querySelectorAll(POST_SEL).forEach(function(post) {
            var anchor = post.querySelector(ANCHOR_SEL);
            if (!anchor) return;
            if (anchor.querySelector('a.ffcharcount')) return;

            var link = document.createElement('a');
            link.href = 'javascript:void(0);';
            link.className = 'ffcharcount';
            link.style.cssText = 'cursor:pointer;display:inline-block;vertical-align:middle;margin:0 6px;font-size:11px;font-weight:700;color:#0B486B;';
            link.title = 'Tocca: caratteri / parole / caratteri validi / parole valide';

            if (!computeInto(link, post)) return;
            link.dataset.mode = 'chars';
            link.textContent = valueFor(link, 'chars') + LABEL.chars;

            anchor.appendChild(link);
        });
    }

    // ═══ TAP: cicla le 4 modalita' ═══

    document.addEventListener('click', function(e) {
        var link = e.target.closest ? e.target.closest('a.ffcharcount') : null;
        if (!link) return;
        e.preventDefault();
        e.stopPropagation();
        var idx = MODES.indexOf(link.dataset.mode);
        if (idx === -1) idx = 0;
        var next = MODES[(idx + 1) % MODES.length];
        link.dataset.mode = next;
        link.textContent = valueFor(link, next) + LABEL[next];
    }, true);

    // ═══ AVVIO ═══

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(generate, 100); });
    } else {
        setTimeout(generate, 100);
    }
    setTimeout(generate, 800);
    setTimeout(generate, 1800);

    console.log('[ContatoreCaratteri mobile] attivo');
})();


// ═══════════════════════════════════════════════════════════════
// PLAYER YOUTUBE / SOUNDCLOUD + LYRICS SCROLLER (mobile)
// ═══════════════════════════════════════════════════════════════
//  Accorpa player.js, player-with-textbox.js, soundcloud-api.js e
//  youtube-api-2.js. Differenze dalla versione desktop:
//    - dentro l'IIFE YT, YTConfig, SC e onYouTubeIframeAPIReady non sono
//      piu' globali da soli: vanno agganciati esplicitamente a window
//      (la www-widgetapi li cerca li');
//    - ytPlayers/scPlayers sono condivisi tra player e lyrics nello
//      stesso modulo, senza passare da window;
//    - avvio con controllo di readyState (il bundle puo' girare dopo
//      DOMContentLoaded, e i listener non scatterebbero mai);
//    - l'API YouTube si carica solo se nella pagina c'e' un player YouTube;
//    - tentativi di aggancio a YT limitati (prima riprovava all'infinito).

;(function() {
    if (window.__hxhPlayersMobile) return;
    window.__hxhPlayersMobile = true;

    // ── Libreria SoundCloud Widget API (inline, invariata) ──
    if (!(window.SC && window.SC.Widget)) {
        (function() {
var SC="object"==typeof SC?SC:{};SC.Widget=function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){var r,o,i,u=n(1),a=n(2),c=n(3),s=u.api,l=u.bridge,d=[],f=[],p=/^http(?:s?)/;function E(e){var t,n;for(t=0,n=f.length;t<n&&!1!==e(f[t]);t++);}function v(e){return e.contentWindow?e.contentWindow:e.contentDocument&&"parentWindow"in e.contentDocument?e.contentDocument.parentWindow:null}function _(e){var t,n=[];for(t in e)e.hasOwnProperty(t)&&n.push(e[t]);return n}function S(e,t,n){n.callbacks[e]=n.callbacks[e]||[],n.callbacks[e].push(t)}function h(e,t){var n=!0;return t.callbacks[e]=[],E((function(t){if((t.callbacks[e]||[]).length)return n=!1,!1})),n}function y(e,t,n){var r,o,i=v(n);if(!i.postMessage)return!1;r=n.getAttribute("src").split("?")[0],o=JSON.stringify({method:e,value:t}),"//"===r.substr(0,2)&&(r=window.location.protocol+r),r=r.replace(/http:\/\/(w|wt).soundcloud.com/,"https://$1.soundcloud.com"),i.postMessage(o,r)}function b(e){var t;return E((function(n){if(n.instance===e)return t=n,!1})),t}function g(e){var t;return E((function(n){if(v(n.element)===e)return t=n,!1})),t}function m(e,t){return function(n){var r,o=!!((r=n)&&r.constructor&&r.call&&r.apply),i=b(this),u=!o&&t?n:null,a=o&&!t?n:null;return a&&S(e,a,i),y(e,u,i.element),this}}function R(e,t,n){var r,o,i;for(r=0,o=t.length;r<o;r++)e[i=t[r]]=m(i,n)}function O(e,t,n){return e+"?url="+t+"&"+function(e){var t,n,r=[];for(t in e)e.hasOwnProperty(t)&&(n=e[t],r.push(t+"="+("start_track"===t?parseInt(n,10):n?"true":"false")));return r.join("&")}(n)}function w(e,t,n){var r,o,i=e.callbacks[t]||[];for(r=0,o=i.length;r<o;r++)i[r].apply(e.instance,n);(function(e){var t,n=!1;for(t in a)if(a.hasOwnProperty(t)&&a[t]===e){n=!0;break}return n}(t)||t===s.READY)&&(e.callbacks[t]=[])}function A(e){var t,n,r,o,i;try{n=JSON.parse(e.data)}catch(e){return!1}return t=g(e.source),r=n.method,o=n.value,(!t||P(e.origin)===P(t.domain))&&(t?(r===s.READY&&(t.isReady=!0,w(t,"__LATE_BINDING__"),h("__LATE_BINDING__",t)),r!==s.PLAY||t.playEventFired||(t.playEventFired=!0),r!==s.PLAY_PROGRESS||t.playEventFired||(t.playEventFired=!0,w(t,s.PLAY,[o])),i=[],void 0!==o&&i.push(o),void w(t,r,i)):(r===s.READY&&d.push(e.source),!1))}function P(e){return e.replace(p,"")}window.addEventListener?window.addEventListener("message",A,!1):window.attachEvent("onmessage",A),e.exports=i=function(e,t,n){var i;if((""===(i=e)||i&&i.charCodeAt&&i.substr)&&(e=document.getElementById(e)),!function(e){return!(!e||1!==e.nodeType||"IFRAME"!==e.nodeName.toUpperCase())}(e))throw new Error("SC.Widget function should be given either iframe element or a string specifying id attribute of iframe element.");t&&(n=n||{},e.src=O("https://wt.soundcloud.test:9200/",t,n));var u,a,c=g(v(e));return c&&c.instance?c.instance:(u=d.indexOf(v(e))>-1,a=new r(e),f.push(new o(a,e,u)),a)},i.Events=s,window.SC=window.SC||{},window.SC.Widget=i,o=function(e,t,n){this.instance=e,this.element=t,this.domain=function(e){var t,n,r,o="";"//"===e.substr(0,2)&&(e=window.location.protocol+e);for(r=e.split("/"),t=0,n=r.length;t<n&&t<3;t++)o+=r[t],t<2&&(o+="/");return o}(t.getAttribute("src")),this.isReady=!!n,this.callbacks={}},(r=function(){}).prototype={constructor:r,load:function(e,t){if(e){t=t||{};var n=this,r=b(this),o=r.element,i=o.src,u=i.substr(0,i.indexOf("?"));r.isReady=!1,r.playEventFired=!1,o.onload=function(){n.bind(s.READY,(function(){var e,n=r.callbacks;for(e in n)n.hasOwnProperty(e)&&e!==s.READY&&y(l.ADD_LISTENER,e,r.element);t.callback&&t.callback()}))},o.src=O(u,e,t)}},bind:function(e,t){var n=this,r=b(this);return r&&r.element&&(e===s.READY&&r.isReady?setTimeout(t,1):r.isReady?(S(e,t,r),y(l.ADD_LISTENER,e,r.element)):S("__LATE_BINDING__",(function(){n.bind(e,t)}),r)),this},unbind:function(e){var t,n=b(this);n&&n.element&&(t=h(e,n),e!==s.READY&&t&&y(l.REMOVE_LISTENER,e,n.element))}},R(r.prototype,_(a)),R(r.prototype,_(c),!0)},function(e,t){t.api={LOAD_PROGRESS:"loadProgress",PLAY_PROGRESS:"playProgress",PLAY:"play",PAUSE:"pause",FINISH:"finish",SEEK:"seek",READY:"ready",OPEN_SHARE_PANEL:"sharePanelOpened",CLICK_DOWNLOAD:"downloadClicked",CLICK_BUY:"buyClicked",ERROR:"error"},t.bridge={REMOVE_LISTENER:"removeEventListener",ADD_LISTENER:"addEventListener"}},function(e,t){e.exports={GET_VOLUME:"getVolume",GET_DURATION:"getDuration",GET_POSITION:"getPosition",GET_SOUNDS:"getSounds",GET_CURRENT_SOUND:"getCurrentSound",GET_CURRENT_SOUND_INDEX:"getCurrentSoundIndex",IS_PAUSED:"isPaused"}},function(e,t){e.exports={PLAY:"play",PAUSE:"pause",TOGGLE:"toggle",SEEK_TO:"seekTo",SET_VOLUME:"setVolume",NEXT:"next",PREV:"prev",SKIP:"skip"}}]);
        })();
    }

    // ── Loader API YouTube (versione adattata di youtube-api-2.js) ──
    function caricaYouTubeAPI() {
        if (window.YT && window.YT.loading) return;
        var scriptUrl = 'https://cdn.jsdelivr.net/gh/FadeToRed/ScriptForumfree@main/www-widgetapi.js';
        try {
            var ttPolicy = window.trustedTypes.createPolicy('youtube-widget-api', { createScriptURL: function(x) { return x; } });
            scriptUrl = ttPolicy.createScriptURL(scriptUrl);
        } catch(e) {}
        if (!window.YT) window.YT = { loading: 0, loaded: 0 };
        if (!window.YTConfig) window.YTConfig = { host: 'https://www.youtube.com' };
        var Y = window.YT, cfg = window.YTConfig;
        Y.loading = 1;
        var coda = [];
        Y.ready = function(f) { if (Y.loaded) f(); else coda.push(f); };
        window.onYTReady = function() {
            Y.loaded = 1;
            for (var i = 0; i < coda.length; i++) { try { coda[i](); } catch(e) {} }
        };
        Y.setConfig = function(c) { for (var k in c) if (c.hasOwnProperty(k)) cfg[k] = c[k]; };
        var a = document.createElement('script');
        a.type = 'text/javascript';
        a.id = 'www-widgetapi-script';
        a.src = scriptUrl;
        a.async = true;
        var b = document.getElementsByTagName('script')[0];
        if (b && b.parentNode) b.parentNode.insertBefore(a, b);
        else document.head.appendChild(a);
    }

    var ytPlayers = {};
    var scPlayers = {};
    var ytApiReady = false;

    // Callback chiamato dall'API YouTube: deve stare su window.
    // Se qualcun altro l'ha gia' definito, lo concateniamo.
    var ytReadyPrecedente = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function() {
        ytApiReady = true;
        console.log('[Player mobile] YouTube API pronta');
        if (typeof ytReadyPrecedente === 'function') { try { ytReadyPrecedente(); } catch(e) {} }
    };

    function ytPronto() { return !!(window.YT && window.YT.Player); }

    // ── Ferma tutti i player tranne quello indicato ──
    function stopAllPlayersExcept(currentPlayerId) {
        var id;
        for (id in scPlayers) {
            if (scPlayers.hasOwnProperty(id) && id !== currentPlayerId) scPlayers[id].pause();
        }
        for (id in ytPlayers) {
            if (ytPlayers.hasOwnProperty(id) && id !== currentPlayerId) {
                try { ytPlayers[id].pauseVideo(); } catch(e) { console.error('[Player mobile] errore pausa YouTube:', e); }
            }
        }
    }

    function trovaIframe(btn) {
        var iframe = null;
        var cur = btn.nextElementSibling;
        while (cur) {
            if (cur.tagName === 'IFRAME') { iframe = cur; break; }
            cur = cur.nextElementSibling;
        }
        if (!iframe && btn.parentElement) iframe = btn.parentElement.querySelector('iframe');
        if (!iframe) {
            var cont = btn.closest('.player-with-lyrics');
            if (cont) iframe = cont.querySelector('iframe');
        }
        return iframe;
    }

    function initAllPlayers() {
        var buttons = document.querySelectorAll('.custom-player');
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            if (btn.getAttribute('data-hxh-player')) continue; // gia' inizializzato
            var iframe = trovaIframe(btn);
            if (!iframe) { console.log('[Player mobile] iframe non trovato per:', btn); continue; }

            if (!btn.id)    btn.id    = 'btn-'    + Math.random().toString(36).substr(2, 9);
            if (!iframe.id) iframe.id = 'player-' + Math.random().toString(36).substr(2, 9);

            var src = iframe.src || '';
            if (src.indexOf('soundcloud.com') !== -1) {
                btn.setAttribute('data-hxh-player', 'sc');
                initSoundCloudPlayer(btn, iframe);
            } else if (src.indexOf('youtube.com') !== -1) {
                btn.setAttribute('data-hxh-player', 'yt');
                initYouTubePlayer(btn, iframe, 0);
            }
        }
    }

    // === SOUNDCLOUD ===
    function initSoundCloudPlayer(btn, iframe) {
        var widget = window.SC.Widget(iframe);
        var playerId = iframe.id;
        scPlayers[playerId] = widget;

        btn.addEventListener('click', function() { widget.toggle(); });

        widget.bind(window.SC.Widget.Events.PLAY, function() {
            stopAllPlayersExcept(playerId);
            btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
        });
        widget.bind(window.SC.Widget.Events.PAUSE, function() {
            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        });
        widget.bind(window.SC.Widget.Events.FINISH, function() {
            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        });
    }

    // === YOUTUBE ===
    var YT_MAX_TENTATIVI = 20; // 20 secondi

    function initYouTubePlayer(btn, iframe, tentativo) {
        if (!ytPronto()) {
            if (tentativo >= YT_MAX_TENTATIVI) {
                console.error('[Player mobile] API YouTube non caricata dopo ' + YT_MAX_TENTATIVI + 's, rinuncio');
                return;
            }
            setTimeout(function() { initYouTubePlayer(btn, iframe, tentativo + 1); }, 1000);
            return;
        }

        var playerId = iframe.id;
        if (ytPlayers[playerId]) return;

        try {
            var player = new window.YT.Player(iframe, {
                events: {
                    'onReady': function() {
                        btn.addEventListener('click', function() {
                            try {
                                if (player.getPlayerState() === 1) player.pauseVideo();
                                else player.playVideo();
                            } catch(e) { console.error('[Player mobile] errore click:', e); }
                        });
                    },
                    'onStateChange': function(event) {
                        var PS = window.YT.PlayerState;
                        if (event.data === PS.PLAYING) {
                            stopAllPlayersExcept(playerId);
                            btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
                        } else if (event.data === PS.PAUSED || event.data === PS.ENDED) {
                            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
                        }
                    },
                    'onError': function(event) {
                        console.error('[Player mobile] errore YouTube ' + event.data + ' (2=parametro non valido, 5=errore HTML5, 100=video non trovato, 101/150=non incorporabile)');
                    }
                }
            });
            ytPlayers[playerId] = player;
        } catch(e) {
            console.error('[Player mobile] errore creazione player YouTube:', e);
        }
    }

    // ═══ LYRICS SCROLLER ═══

    function initLyricsScrollers() {
        var conts = document.querySelectorAll('.player-with-lyrics');
        for (var i = 0; i < conts.length; i++) {
            var container = conts[i];
            if (container.getAttribute('data-hxh-lyrics')) continue;
            var btn = container.querySelector('.custom-player');
            var lyricsBox = container.querySelector('.lyrics-box');
            var iframe = container.querySelector('iframe');
            if (!btn || !lyricsBox || !iframe) continue;

            var lyricsContent = lyricsBox.querySelector('.lyrics-content');
            if (!lyricsContent) continue;

            var scroller = createLyricsScroller(lyricsBox, lyricsContent);
            if (!scroller) continue;
            container.setAttribute('data-hxh-lyrics', '1');

            var src = iframe.src || '';
            if (src.indexOf('soundcloud.com') !== -1) attachSoundCloudLyrics(iframe, scroller);
            else if (src.indexOf('youtube.com') !== -1) attachYouTubeLyrics(iframe, scroller);
        }
    }

    function createLyricsScroller(lyricsBox, lyricsContent) {
        var boxHeight = lyricsBox.offsetHeight;
        var contentHeight = lyricsContent.offsetHeight;
        var scrollDistance = contentHeight - boxHeight;
        if (scrollDistance <= 0) return null;

        lyricsContent.style.transform = 'translateY(0px)';

        return {
            content: lyricsContent,
            scrollDistance: scrollDistance,
            boxHeight: boxHeight,
            duration: 0,
            durationReady: false,
            startTime: null,
            pausedElapsed: 0,
            animationId: null,
            isFinished: false,
            isPaused: true,

            setDuration: function(dur) { this.duration = dur; this.durationReady = true; },

            start: function() {
                if (!this.durationReady || this.duration === 0) return;
                if (this.isFinished) return;
                this.isPaused = false;
                this.startTime = Date.now() - this.pausedElapsed;
                this.animate();
            },

            animate: function() {
                var self = this;
                if (self.isPaused) { self.animationId = null; return; }
                var elapsed = Date.now() - this.startTime;
                var progress = Math.min(elapsed / (this.duration * 1000), 1);
                this.content.style.transform = 'translateY(' + (-(progress * this.scrollDistance)) + 'px)';
                if (progress < 1) {
                    this.animationId = requestAnimationFrame(function() { self.animate(); });
                } else {
                    this.isFinished = true;
                    this.animationId = null;
                }
            },

            pause: function() {
                this.isPaused = true;
                if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
                if (this.startTime !== null) this.pausedElapsed = Date.now() - this.startTime;
            },

            reset: function() {
                this.pause();
                this.content.style.transform = 'translateY(0px)';
                this.startTime = null;
                this.pausedElapsed = 0;
                this.isFinished = false;
            }
        };
    }

    function attachSoundCloudLyrics(iframe, scroller) {
        var playerId = iframe.id;
        var isPlaying = false;
        var Ev = window.SC.Widget.Events;

        var checkInterval = setInterval(function() {
            if (!scPlayers[playerId]) return;
            clearInterval(checkInterval);
            var widget = scPlayers[playerId];

            widget.bind(Ev.READY, function() {
                widget.getDuration(function(duration) {
                    scroller.setDuration(duration / 1000);
                    if (isPlaying) scroller.start();
                });
            });
            widget.bind(Ev.PLAY,   function() { isPlaying = true;  scroller.start(); });
            widget.bind(Ev.PAUSE,  function() { isPlaying = false; scroller.pause(); });
            widget.bind(Ev.FINISH, function() { isPlaying = false; });
            widget.bind(Ev.SEEK, function() {
                widget.getPosition(function(position) {
                    scroller.pausedElapsed = position;
                    scroller.startTime = Date.now() - scroller.pausedElapsed;
                    scroller.isFinished = false;
                });
            });
        }, 100);
    }

    function attachYouTubeLyrics(iframe, scroller) {
        var playerId = iframe.id;

        var checkInterval = setInterval(function() {
            if (!ytPlayers[playerId]) return;
            clearInterval(checkInterval);
            var player = ytPlayers[playerId];

            var readyCheck = setInterval(function() {
                try {
                    var duration = player.getDuration();
                    if (duration > 0) {
                        clearInterval(readyCheck);
                        scroller.setDuration(duration);
                        var lastState = -1;
                        setInterval(function() {
                            var state = player.getPlayerState();
                            if (state === 1 && lastState !== 1) scroller.start();
                            else if (state === 2 && lastState === 1) scroller.pause();
                            lastState = state;
                        }, 200);
                    }
                } catch(e) {}
            }, 200);
        }, 100);
    }

    // ═══ AVVIO ═══

    function avvia() {
        var buttons = document.querySelectorAll('.custom-player');
        if (!buttons.length) return; // niente player nella pagina: non carica nulla

        // L'API YouTube serve solo se c'e' almeno un iframe YouTube.
        var iframes = document.querySelectorAll('iframe');
        for (var i = 0; i < iframes.length; i++) {
            if ((iframes[i].src || '').indexOf('youtube.com') !== -1) { caricaYouTubeAPI(); break; }
        }

        setTimeout(initAllPlayers, 1000);
        setTimeout(initLyricsScrollers, 1500);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
    else setTimeout(avvia, 100);

    console.log('[Player mobile] attivo');
})();


// ═══════════════════════════════════════════════════════════════
// POST PACK (mobile) — copia di PostPack.js v2.0.0
// Menu Dimensione/Colore/Font nell'editor, tool titolo (staff),
// zoom messaggi A- / A= / A+.
// font_ARR: su desktop arriva dal blocco HTML di ForumFree; qui e'
// definito nel bundle. Se window.font_ARR esiste, ha la precedenza.
// ═══════════════════════════════════════════════════════════════

var POSTPACK_FONT_ARR = ["Alegreya Sans SC","Calistoga","Cinzel","Montserrat","Roboto Condensed","Roboto","Share Tech Mono"];

/** 
 * HxHPostPack 
 * 
 * Pack post per Hunter x Hunter Forum - GDR Remastered. Vanilla JS puro. 
 * 
 * - Menu Dimensione font (10-30 px) nell'area di risposta [tutti] 
 * - Menu Colore (50 colori) nell'area di risposta [tutti] 
 * - Menu Font (da font_ARR) nell'area di risposta [tutti] 
 * - Tool titolo discussioni: Grassetto, Corsivo, Colore [solo staff] 
 * - Ingrandimento / rimpicciolimento messaggi (A- / A= / A+) [tutti] 
 * 
 * Dipende da HxHFramework solo per isStaff(). La variabile font_ARR 
 * viene iniettata a parte dal pannello ForumFree. 
 * 
 * @version 2.0.0 
 */ 
 
(function () { 
 'use strict'; 

 // Se la versione desktop/jsDelivr e' gia' caricata nella pagina, non duplica menu e pulsanti.
 if (window.__hxhPostPack) return; 
 window.__hxhPostPack = true; 
 
 // ----- ----- ----- ----- ----- CONFIG 
 
 // Font caricati dalla config separata su ForumFree. 
 // Font standard di ForumFree: su mobile vanno aggiunti a mano nel menu Font. 
 var FONT_STANDARD = ['Arial', 'Times', 'Courier', 'Impact', 'Geneva', 'Optima']; 

 var FONT_ARR = (typeof window.font_ARR !== 'undefined' && window.font_ARR) ? window.font_ARR : POSTPACK_FONT_ARR; 
 
 // 50 colori leggibili sullo sfondo dei post (#8fbeba). 
 var COLORS = [ 
 '#1a1a1a', '#3a3a3a', '#5a5a5a', '#7a1f1f', '#a3231b', 
 '#c0392b', '#8b2f00', '#b8500f', '#a86500', '#8a6d00', 
 '#5c6b00', '#3b6d11', '#1e6b3a', '#0f6e56', '#0a5c5c', 
 '#116b7a', '#0c5a8a', '#185fa5', '#1a3f8a', '#26215c', 
 '#3c2a7a', '#534ab7', '#6a3d9e', '#8e2f8e', '#993556', 
 '#b83266', '#c0392f', '#7a4a2a', '#5a3a1a', '#3d2b1f', 
 '#2c2c54', '#1f4037', '#4a1b3d', '#6b1f2e', '#004d40', 
 '#37474f', '#4e342e', '#880e4f', '#1b5e20', '#4a148c', 
 '#e60073', '#d10047', '#e01e00', '#e05a00', '#7a00cc', 
 '#5900e6', '#0040ff', '#0077cc', '#008a5c', '#2e8b00' 
 ]; 
 
 // Dimensioni font in pixel: da 10 a 30. 
 var FONT_MIN = 10; 
 var FONT_MAX = 30; 
 
 // ----- ----- ----- ----- ----- HELPERS 
 
 var isOldLayout = function () { return document.compatMode === 'BackCompat'; }; 
 
 // Verifica staff tramite HxHFramework. Se il framework non c'e', non e' staff. 
 function isStaff() { 
 return !!(window.HxHFramework && 
 window.HxHFramework.groups && 
 window.HxHFramework.groups.isStaff && 
 window.HxHFramework.groups.isStaff()); 
 } 
 
 // Attende una condizione poi esegue il callback (procede comunque al timeout). 
 function waitFor(condition, callback, interval, timeout) { 
 interval = interval || 100; 
 timeout = timeout || 10000; 
 var elapsed = 0; 
 (function check() { 
 if (condition()) callback(); 
 else if (elapsed >= timeout) callback(); 
 else { elapsed += interval; setTimeout(check, interval); } 
  })(); 
 } 
 
 // Stringa <option> per il menu colore. 
 function buildColorOptions() { 
 var html = '<option value="0">Colore</option>'; 
 for (var i = 0; i < COLORS.length; i++) { 
 html += '<option value="' + COLORS[i] + '" style="background:' + COLORS[i] + '"></option>'; 
 } 
 return html; 
 } 
 
 // Stringa <option> per il menu dimensione (10-30 px). 
 function buildSizeOptions() { 
 var html = '<option value="0">Dimens.</option>'; 
 for (var px = FONT_MIN; px <= FONT_MAX; px++) { 
 html += '<option value="' + px + '">' + px + 'px</option>'; 
 } 
 return html; 
 } 
 
 // Stringa <option> per i font di FONT_ARR. 
 function buildFontOptions() { 
 var html = ''; 
 for (var i = 0; i < FONT_ARR.length; i++) { 
 html += '<option value="' + FONT_ARR[i] + '">' + FONT_ARR[i] + '</option>'; 
 } 
 return html; 
 } 
 
 // Inserisce before+selezione+after in una textarea/input, riposizionando il cursore. 
 function wrapSelection(el, before, after) { 
 if (!el) return; 
 var start = el.selectionStart; 
 var end = el.selectionEnd; 
 var val = el.value; 
 var sel = val.substring(start, end); 
 var insert = before + sel + after; 
 el.value = val.substring(0, start) + insert + val.substring(end); 
 var caret = (start === end) ? start + before.length : start + insert.length; 
 el.focus(); 
 if (el.setSelectionRange) el.setSelectionRange(caret, caret); 
 } 
 
 // Legge la font-size in px (numero) di un elemento. 
 function fontSizePx(el) { 
 return Number(window.getComputedStyle(el).fontSize.split('px')[0]); 
 } 
 
 // ----- ----- ----- ----- ----- EDITOR RISPOSTA (menu Colore/Dimensione/Font) [tutti] 
 
 function enhanceReplyEditor() { 
 var href = location.href; 
 var isReplyContext = 
 document.querySelector('.msg #Post') !== null || 
 document.body.id === 'send' || 
 href.indexOf('?t=') !== -1; 
 
 if (!isReplyContext) return; 
 
 // Colore: per name (layout vecchio) o per title (layout nuovo). 
 var color = document.querySelector('select[name="COLOR"]') || 
 document.querySelector('select[title="Inserisci tag Colore Carattere"]'); 
 if (color) color.innerHTML = buildColorOptions(); 
 
 // Dimensione (px). 
 var size = document.querySelector('select[name="SIZE"]') || 
 document.querySelector('select[title="Inserisci tag Grandezza Carattere"]'); 
 if (size) { 
 size.innerHTML = buildSizeOptions(); 
 size.className += ' hxhPxSize'; // marca il select come "in pixel" 
 // ForumFree ha un onchange inline che inserisce [size=N] con la SUA 
 // scala in punti (10 -> 17pt, ecc.). Lo rimuoviamo: deve agire solo 
 // il nostro handler, che inserisce font-size in pixel reali. 
 size.removeAttribute('onchange'); 
 size.onchange = null; 
 } 
 
 // Font. 
 var font = document.querySelector('select[name="FONT"]') || 
 document.querySelector('select[title="Inserisci tag Tipo Carattere"]'); 
 if (font && FONT_ARR.length) font.innerHTML += buildFontOptions(); 
 } 
 
 // ----- ----- ----- ----- ----- EDITOR RISPOSTA MOBILE [tutti] 
 // Su mobile i select non hanno name/title: stanno in li.top-addons e si 
 // riconoscono dall'onchange inline ([size=...] / [color=...]). Il menu Font 
 // non esiste: lo creiamo noi accanto al Colore. 

 // Inserisce nel textarea usando la tag() di ForumFree (sa qual e' il campo 
 // giusto su mobile); se manca, ripiega su wrapSelection. 
 function insertTag(before, after) { 
 if (typeof window.tag === 'function') { window.tag(before, after); return; } 
 var post = (document.REPLIER && document.REPLIER.Post) || document.getElementById('Post'); 
 wrapSelection(post, before, after); 
 } 

 function enhanceMobileEditor() { 
 var box = document.querySelector('li.top-addons'); 
 if (!box) return false; 
 if (box.getAttribute('data-hxh-postpack')) return true; 
 box.setAttribute('data-hxh-postpack', '1'); 

 var selects = box.querySelectorAll('select'); 
 var size = null, color = null; 
 for (var i = 0; i < selects.length; i++) { 
 var oc = selects[i].getAttribute('onchange') || ''; 
 if (oc.indexOf('[size=') !== -1) size = selects[i]; 
 else if (oc.indexOf('[color=') !== -1) color = selects[i]; 
 } 

 if (size) { 
 size.removeAttribute('onchange'); 
 size.onchange = null; 
 size.innerHTML = buildSizeOptions(); 
 size.className += ' hxhPxSize'; 
 } 

 // Colore: il selettore nativo del telefono non mostra i colori delle 
 // opzioni, quindi il select diventa un bottone che apre una tavolozza. 
 var colorBtn = null; 
 if (color) { 
 colorBtn = document.createElement('button'); 
 colorBtn.type = 'button'; 
 colorBtn.className = 'codebuttons hxhColorToggle'; 
 colorBtn.title = 'Colore'; 
 colorBtn.innerHTML = '<i class="fa-solid fa-palette"></i>'; 
 color.parentNode.insertBefore(colorBtn, color); 
 color.parentNode.removeChild(color); 

 var pal = document.createElement('div'); 
 pal.id = 'hxhColorPalette'; 
 pal.setAttribute('style', 'display:none;margin:6px 0;padding:6px;background:#E2F7C4;border:1px solid #3B8686;border-radius:6px;line-height:0;'); 
 var sw = ''; 
 for (var c = 0; c < COLORS.length; c++) { 
 sw += '<span class="hxhSwatch" data-color="' + COLORS[c] + '" title="' + COLORS[c] + '" ' + 
 'style="display:inline-block;width:26px;height:26px;margin:2px;border-radius:4px;cursor:pointer;' + 
 'border:1px solid rgba(0,0,0,.25);background:' + COLORS[c] + ';"></span>'; 
 } 
 pal.innerHTML = sw; 
 box.appendChild(pal); 
 } 

 // Font: su mobile il menu non esiste, quindi servono anche i font standard 
 // che su desktop sono gia' nell'elenco di ForumFree. 
 var font = document.createElement('select'); 
 font.className = 'codebuttons hxhMobFont'; 
 font.setAttribute('style', 'width:40px;padding-left:6px'); 
 var fopts = '<option value="0">Font</option>'; 
 for (var f = 0; f < FONT_STANDARD.length; f++) { 
 fopts += '<option value="' + FONT_STANDARD[f] + '">' + FONT_STANDARD[f] + '</option>'; 
 } 
 font.innerHTML = fopts + buildFontOptions(); 
 var ref = colorBtn || size; 
 if (ref && ref.parentNode) ref.parentNode.insertBefore(font, ref.nextSibling); 
 else box.appendChild(font); 
 return true; 
 } 

 // L'editor puo' comparire dopo l'avvio: riprova per ~10s. 
 function enhanceMobileEditorRetry() { 
 var tentativi = 0; 
 (function prova() { 
 if (enhanceMobileEditor()) return; 
 if (++tentativi < 20) setTimeout(prova, 500); 
 })(); 
 } 

 // ----- ----- ----- ----- ----- TOOL TITOLO (B / I / Colore) [solo staff] 
 
 function updateTitleCounter() { 
 var el = document.getElementById('TopicTitle'); 
 var counter = document.getElementById('textTitleRemain'); 
 if (el && counter) counter.value = 200 - el.value.length; 
 } 
 
 // ForumFree inietta soft hyphen (U+00AD,) dentro il valore del titolo, 
 // spezzando i tag es. "<b>". Li rimuoviamo dopo ogni inserimento. 
 function stripSoftHyphens(el) { 
 if (!el) return; 
 if (el.value.indexOf('\u00AD') !== -1) { 
 el.value = el.value.replace(/\u00AD/g, ''); 
 } 
 } 
 
 function addTitleBBCode(before, after) { 
 var el = document.getElementById('TopicTitle'); 
 if (!el) return; 
 wrapSelection(el, before, after); 
 stripSoftHyphens(el); 
 updateTitleCounter(); 
 } 
 
 // Tavolozza di quadratini (al posto del select colore, illeggibile su mobile). 
 function buildPalette(id, swatchClass) { 
 var pal = document.createElement('div'); 
 pal.id = id; 
 pal.setAttribute('style', 'display:none;margin:6px 0;padding:6px;background:#E2F7C4;border:1px solid #3B8686;border-radius:6px;line-height:0;'); 
 var sw = ''; 
 for (var c = 0; c < COLORS.length; c++) { 
 sw += '<span class="' + swatchClass + '" data-color="' + COLORS[c] + '" title="' + COLORS[c] + '" ' + 
 'style="display:inline-block;width:26px;height:26px;margin:2px;border-radius:4px;cursor:pointer;' + 
 'border:1px solid rgba(0,0,0,.25);background:' + COLORS[c] + ';"></span>'; 
 } 
 pal.innerHTML = sw; 
 return pal; 
 } 

 function togglePalette(id) { 
 var pal = document.getElementById(id); 
 if (pal) pal.style.display = (pal.style.display === 'none') ? 'block' : 'none'; 
 } 

 // Colore nel titolo: stesso tag del desktop, costruito da char code. 
 function addTitleColor(cval) { 
 var LTf = String.fromCharCode(60); // < 
 var GTf = String.fromCharCode(62); // > 
 var SLf = String.fromCharCode(47); // / 
 var FONT = String.fromCharCode(102, 111, 110, 116); // "font" 
 addTitleBBCode(LTf + FONT + ' color="' + cval + '"' + GTf, LTf + SLf + FONT + GTf); 
 } 

 function buildTitleTool() { 
 var title = document.getElementById('TopicTitle'); 
 if (!title) return; 
 
 var wrap = document.createElement('span'); 
 wrap.innerHTML = 
 '<br>' + 
 '<button class="codebuttons titleBBCode" title="Testo in Grassetto (alt + b)" accesskey="b" type="button" data-tag="b">&nbsp;<b>B</b>&nbsp;</button>&nbsp;' + 
 '<button class="codebuttons titleBBCode" title="Testo in Corsivo (alt + i)" accesskey="i" type="button" data-tag="i">&nbsp;<i>I</i>&nbsp;</button>&nbsp;' + 
 '<button class="codebuttons hxhTitleColorToggle" title="Colore" type="button"><i class="fa-solid fa-palette"></i></button>' + 
 '&nbsp; <input type="text" class="textinput" value="200" style="width: 48px" id="textTitleRemain" readonly>'; 
 
 // Inserisce subito dopo il campo titolo. 
 if (title.nextSibling) title.parentNode.insertBefore(wrap, title.nextSibling); 
 else title.parentNode.appendChild(wrap); 
 wrap.appendChild(buildPalette('hxhTitlePalette', 'hxhTitleSwatch')); 
 
 updateTitleCounter(); 
 } 
 
 // ----- ----- ----- ----- ----- ZOOM MESSAGGI (A- / A= / A+) [tutti] 
 
 function buildZoomButtons() { 
 // Nella skin esistono piu' elementi ".left" (es. ".left Sub" della barra 
 // risposte/visite). Quello giusto e' la barra con i link Precedente/Successiva. 
 var host = null; 
 var candidates = document.querySelectorAll('.topic .title .left, .topic .title .lt'); 
 for (var i = 0; i < candidates.length; i++) { 
 // Scarta i container non visibili (dimensione zero): la skin ha barre 
 // di navigazione duplicate, una nascosta, che verrebbe scelta per prima. 
 var rect = candidates[i].getBoundingClientRect(); 
 if (rect.width === 0 && rect.height === 0) continue; 
 
 var anchorList = candidates[i].querySelectorAll('a'); 
 var found = false; 
 for (var j = 0; j < anchorList.length; j++) { 
 var hrefAttr = String.fromCharCode(104, 114, 101, 102); // "href" 
 var href = anchorList[j].getAttribute(hrefAttr); 
 if (!href) href = ''; 
 if (href.indexOf('view=old') !== -1 || href.indexOf('view=new') !== -1) { 
 found = true; 
 break; 
 } 
 } 
 if (found) { host = candidates[i]; break; } 
 } 
 // Fallback: primo container VISIBILE, poi .title. 
 if (!host) { 
 for (var k = 0; k < candidates.length; k++) { 
 var r2 = candidates[k].getBoundingClientRect(); 
 if (r2.width !== 0 || r2.height !== 0) { host = candidates[k]; break; } 
 } 
 } 
 if (!host) host = document.querySelector('.topic .title'); 
 if (!host) return; 
 
 var wrap = document.createElement('span'); 
 wrap.innerHTML = 
 '&nbsp;&nbsp;<a title="Diminuisci le dimensioni dei font." style="cursor: pointer; font-size: 11px" class="color_minus" id="colorMinus"><i>A-</i></a>' + 
 '&nbsp;&nbsp;<a title="Ripristina le dimensioni originali dei font." style="cursor: pointer; font-size: 11px" class="color_restore" id="colorRestore"><u>A=</u></a>' + 
 '&nbsp;&nbsp;<a title="Aumenta le dimensioni dei font." style="cursor: pointer; font-size: 11px" class="color_plus" id="colorPlus"><b>A+</b></a>'; 
 host.appendChild(wrap); 
 } 
 
 // Fattore di scala corrente (1 = originale). A+ / A- lo spostano di 0.1. 
 var zoomFactor = 1; 
 var ZOOM_STEP = 0.1; 
 var ZOOM_FACTOR_MIN = 0.5; 
 var ZOOM_FACTOR_MAX = 2; 
 
 // Applica il fattore di scala ai .color e discendenti, partendo dalla 
 // dimensione ORIGINALE di ciascun elemento. Le firme restano intatte. 
 // 
 // IMPORTANTE: la memorizzazione degli originali avviene in una passata 
 // SEPARATA e precedente all'applicazione. Altrimenti, settando il 
 // font-size di un genitore, i figli (che ereditano) verrebbero letti 
 // gia' ingranditi e memorizzati sbagliati -> doppia moltiplicazione. 
 function captureOriginals() { 
 var nodes = document.querySelectorAll('.color, .color *'); 
 for (var i = 0; i < nodes.length; i++) { 
 var el = nodes[i]; 
 if (el.closest && el.closest('.signature')) continue; 
 if (!el.hasAttribute('data-hxh-orig')) { 
 el.setAttribute('data-hxh-orig', fontSizePx(el)); 
 } 
 } 
 } 
 
 function applyZoom(factor) { 
 captureOriginals(); // prima leggi TUTTI gli originali... 
 var nodes = document.querySelectorAll('.color[data-hxh-orig], .color [data-hxh-orig]'); 
 for (var i = 0; i < nodes.length; i++) { // ...poi applica 
 var base = Number(nodes[i].getAttribute('data-hxh-orig')); 
 if (base > 0) nodes[i].style.fontSize = (base * factor) + 'px'; 
 } 
 } 
 
 function zoomMinus() { 
 var next = Math.round((zoomFactor - ZOOM_STEP) * 10) / 10; 
 if (next >= ZOOM_FACTOR_MIN) { 
 zoomFactor = next; 
 applyZoom(zoomFactor); 
 } 
 } 
 
 function zoomPlus() { 
 var next = Math.round((zoomFactor + ZOOM_STEP) * 10) / 10; 
 if (next <= ZOOM_FACTOR_MAX) { 
 zoomFactor = next; 
 applyZoom(zoomFactor); 
 } 
 } 
 
 // Ripristino reale: rimuove lo stile inline aggiunto da noi, cosi' ogni 
 // elemento torna esattamente alla dimensione del CSS originale. 
 function zoomRestore() { 
 zoomFactor = 1; 
 var nodes = document.querySelectorAll('.color [data-hxh-orig], .color[data-hxh-orig]'); 
 for (var i = 0; i < nodes.length; i++) { 
 nodes[i].style.fontSize = ''; 
 nodes[i].removeAttribute('data-hxh-orig'); 
 } 
 } 
 
 // ----- ----- ----- ----- ----- EVENT DELEGATION (listener globali) 
 
 function closestSafe(el, selector) { 
 return (el && el.closest) ? el.closest(selector) : null; 
 } 
 
 function onClick(e) { 
 var t = e.target; 
 
 if (closestSafe(t, '#colorMinus')) { zoomMinus(); return; } 
 if (closestSafe(t, '#colorPlus')) { zoomPlus(); return; } 
 if (closestSafe(t, '#colorRestore')) { zoomRestore(); return; } 
 
 if (closestSafe(t, '.hxhTitleColorToggle')) { togglePalette('hxhTitlePalette'); return; } 
 var tsw = closestSafe(t, '.hxhTitleSwatch'); 
 if (tsw) { 
 addTitleColor(tsw.getAttribute('data-color')); 
 var palTi = document.getElementById('hxhTitlePalette'); 
 if (palTi) palTi.style.display = 'none'; 
 return; 
 } 
 if (closestSafe(t, '.hxhColorToggle')) { 
 var palT = document.getElementById('hxhColorPalette'); 
 if (palT) palT.style.display = (palT.style.display === 'none') ? 'block' : 'none'; 
 return; 
 } 
 var swatch = closestSafe(t, '.hxhSwatch'); 
 if (swatch) { 
 insertTag('[color=' + swatch.getAttribute('data-color') + ']', '[/color]'); 
 var palS = document.getElementById('hxhColorPalette'); 
 if (palS) palS.style.display = 'none'; 
 return; 
 } 

 var bb = closestSafe(t, '.titleBBCode'); 
 if (bb) { 
 var tag = bb.getAttribute('data-tag'); // 'b' | 'i' 
 // Costruiamo i tag a runtime dai char code, cosi' nel source dello 
 // script salvato su ForumFree non esiste la sequenza "<b>" letterale 
 // che la piattaforma potrebbe spezzare con soft hyphen. 
 var LT = String.fromCharCode(60); // < 
 var GT = String.fromCharCode(62); // > 
 var SL = String.fromCharCode(47); // / 
 addTitleBBCode(LT + tag + GT, LT + SL + tag + GT); 
 return; 
 } 
 } 
 
 function onChange(e) { 
 var t = e.target; 
 if (!t.classList) return; 
 
 // Menu colore del titolo. Usiamo <span> invece di <span>: e' inline 
 // (niente spazi come <p>) e non e' colpito dalla regola .zz span{display:none} 
 // usata in homepage. I tag sono costruiti da char code per evitare che 
 // ForumFree spezzi le stringhe letterali con soft hyphen. 
 if (t.classList.contains('titleSelBBCode')) { 
 var cval = t.value; 
 if (cval !== '0') { 
 var LTf = String.fromCharCode(60); // < 
 var GTf = String.fromCharCode(62); // > 
 var SLf = String.fromCharCode(47); // / 
 var FONT = String.fromCharCode(102, 111, 110, 116); // "font" 
 var before = LTf + FONT + ' color="' + cval + '"' + GTf; 
 var after = LTf + SLf + FONT + GTf; 
 addTitleBBCode(before, after); 
 } 
 t.selectedIndex = 0; 
 return; 
 } 
 
 // Menu dimensione dell'editor risposta: PIXEL reali via <span>. 
 if (t.classList.contains('hxhPxSize')) { 
 var px = t.value; 
 if (px !== '0') { 
 insertTag('<span style="font-size:' + px + 'px">', '</span>'); 
 } 
 t.selectedIndex = 0; 
 return; 
 } 

 // Menu colore dell'editor mobile: stesso bbcode del desktop. 
 if (t.classList.contains('hxhMobColor')) { 
 if (t.value !== '0') insertTag('[color=' + t.value + ']', '[/color]'); 
 t.selectedIndex = 0; 
 return; 
 } 

 // Menu font dell'editor mobile: stesso bbcode del desktop. 
 if (t.classList.contains('hxhMobFont')) { 
 if (t.value !== '0') insertTag('[font=' + t.value + ']', '[/font]'); 
 t.selectedIndex = 0; 
 return; 
 } 
 } 
 
 function onKeyup(e) { 
 if (e.target && e.target.id === 'TopicTitle') { 
 stripSoftHyphens(e.target); 
 updateTitleCounter(); 
 } 
 } 
 
 // ----- ----- ----- ----- ----- INIT 
 
 function init() { 
 // I pulsanti zoom hanno bisogno di dimensioni affidabili per scartare i 
 // container nascosti: li costruiamo a load completo. Se load e' gia' 
 // passato, li costruiamo subito. 
 if (document.readyState === 'complete') { 
 buildZoomButtons(); 
 } else { 
 window.addEventListener('load', buildZoomButtons); 
 } 
 
 enhanceReplyEditor(); 
 enhanceMobileEditorRetry(); 
 
 // Tool titolo solo staff: attende il framework. 
 waitFor( 
 function () { 
 return !!(window.HxHFramework && window.HxHFramework.groups && window.HxHFramework.groups.isStaff); 
 }, 
 function () { 
 if (isStaff()) buildTitleTool(); 
 } 
 ); 
 
 document.addEventListener('click', onClick); 
 document.addEventListener('change', onChange); 
 document.addEventListener('keyup', onKeyup); 
 } 
 
 if (document.readyState === 'loading') { 
 document.addEventListener('DOMContentLoaded', init); 
 } else { 
 init(); 
 } 
 
})();


// ═══════════════════════════════════════════════════════════════
// FIX AVATAR NELLE CITAZIONI (mobile) — copia di
// fix-avatar-no-quote-generici-hunterxhunter-v3.js
// Avatar dell'autore nei quote interni (#ffav_quote), niente avatar
// nei quote generici (#quote_generico). Parte subito, senza attese:
// richiede l'opzione citazioni di Avatar Pack disattivata (se resta
// attiva, ripulisce comunque dopo l'originale).
// ═══════════════════════════════════════════════════════════════

;(function () {
  if (window.__hxhQuoteAvatar) return;
  window.__hxhQuoteAvatar = true;

  var DEFAULT_AVATAR = 'https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png';
  var PLACEHOLDERS = ['default_avatar', 'RDGkT8W'];
  var AVATAR_SELECTORS = [
    '.post .avatar img',
    '.details .avatar img',
    '.details img[alt="Avatar"]',
    '.post .details img',
    '.avatar img',          /* mobile: avatar fuori da .details */
    'img.avatar'
  ];

  /* ---------- stili: inseriti subito, prima ancora che giri il JS sui post ---------- */
  function injectStyles() {
    if (document.getElementById('ffav-quote-fix-styles')) return;
    var css = '' +
      /* specificita' piu' alta dell'originale (#ffav_quote ... !important) */
      '.quote#ffav_quote{padding-left:83px !important;padding-bottom:5px !important;min-height:85px}' +
      /* spazio riservato ai quote interni gia' al primo disegno della pagina,
         cosi' il testo non "salta" quando arriva l'avatar */
      '.quote_top:has(a[href*="#entry"]) + .quote,' +
      '.quote_top:has(a[href*="#entry"]) + .quoteentry + .quote{padding-left:83px !important;padding-bottom:5px !important;min-height:85px}' +
      '.quoteentry img{width:60px;height:60px;float:left;margin-top:10px;margin-left:30px;padding:1px;' +
      'border:1px solid #D5D5D5;background:#FFF;box-shadow:0 2px 2px rgba(0,0,0,0.1)}';
    var style = document.createElement('style');
    style.id = 'ffav-quote-fix-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function isValidAvatar(img) {
    if (!img) return false;
    var src = img.getAttribute('src') || '';
    if (!src) return false;
    for (var i = 0; i < PLACEHOLDERS.length; i++) {
      if (src.indexOf(PLACEHOLDERS[i]) !== -1) return false;
    }
    return true;
  }

  function findAvatar(entryNumber) {
    var targetPost = document.getElementById('ee' + entryNumber);
    if (!targetPost) return DEFAULT_AVATAR;
    for (var i = 0; i < AVATAR_SELECTORS.length; i++) {
      var img = targetPost.querySelector(AVATAR_SELECTORS[i]);
      if (img && img.src) return img.src;
    }
    return DEFAULT_AVATAR;
  }

  function makeEntry(src) {
    var div = document.createElement('div');
    div.className = 'quoteentry hxh-quote-avatar';
    var img = document.createElement('img');
    img.alt = 'Avatar';
    img.onerror = function () { this.onerror = null; this.src = DEFAULT_AVATAR; };
    img.src = src;
    div.appendChild(img);
    return div;
  }

  /* Passata unica e ripetibile: rimette in ordine ogni quote. */
  function process() {
    var tops = document.querySelectorAll('.quote_top');
    for (var i = 0; i < tops.length; i++) {
      var top = tops[i];

      /* raccoglie gli avatar gia' presenti subito dopo il titolo del quote */
      var entries = [];
      var cur = top.nextElementSibling;
      while (cur && cur.classList.contains('quoteentry')) {
        entries.push(cur);
        cur = cur.nextElementSibling;
      }
      var quote = (cur && cur.classList.contains('quote')) ? cur : null;
      var link = top.querySelector('a[href*="#entry"]');
      var j;

      /* quote generico: niente avatar */
      if (!link) {
        for (j = 0; j < entries.length; j++) entries[j].parentNode.removeChild(entries[j]);
        if (quote) quote.id = 'quote_generico';
        continue;
      }

      if (quote) quote.id = 'ffav_quote';

      /* quote interno: tiene un solo avatar valido, toglie segnaposto e doppioni */
      var keep = null;
      for (j = 0; j < entries.length; j++) {
        if (!keep && isValidAvatar(entries[j].querySelector('img'))) keep = entries[j];
        else entries[j].parentNode.removeChild(entries[j]);
      }
      if (keep) continue;

      var m = (link.getAttribute('href') || '').match(/#entry(\d+)/);
      var src = m ? findAvatar(m[1]) : DEFAULT_AVATAR;
      top.parentNode.insertBefore(makeEntry(src), top.nextSibling);
    }
  }

  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', process);
  } else {
    process();
  }

  /* passate di sicurezza nel caso l'opzione citazioni di Avatar Pack sia
     ancora attiva e l'originale arrivi dopo di noi */
  function lateRuns() {
    process();
    setTimeout(process, 1500);
  }
  if (document.readyState === 'complete') {
    lateRuns();
  } else {
    window.addEventListener('load', lateRuns);
  }
})();


// ═══════════════════════════════════════════════════════════════
// AVVISI FORUM SU TELEGRAM (mobile) — copia di hxh-avvisi-quest.js v1.1.0
// Quest: avvisa il primo bot quando l'utente risponde in un topic
// (il bot controlla se è una quest attiva).
// Presentazioni: avvisa quando l'utente apre un topic in Benvenuti.
// Anteprime e modifiche non generano avvisi.
// ═══════════════════════════════════════════════════════════════
;(function() {

// Se la versione desktop/jsDelivr è già caricata nella pagina, gira una sola copia
if (window.__hxhAvvisiQuest) return;
window.__hxhAvvisiQuest = true;

// ----- Configurazione
var BOT_URL    = 'https://script.google.com/macros/s/AKfycbz5wsCc8_65goInXEQ50yoN3_eU4EIWE61vgRYy--3OTmrWEiF44qUZvn6plyE3YsU/exec';      // proprietà WEBAPP_URL del primo bot
var BOT_CHIAVE = '0000000123:ASDFkqN9qDbhS_kgjsPcGDlsie2YLdgwm1Q'; // proprietà SEGRETO_FORUM del primo bot
var DEBUG      = false;                       // true per vedere i passaggi nella console

// Sezione "Benvenuti" di ciascun forum
var SEZIONE_BENVENUTI = {
    'graficaxskinxelaborazione.forumfree.it': '65073496',
    'hxhforumgdr.forumcommunity.net':         '9046710'
};

var CHIAVE_QUEST = 'hxh-avviso-quest';
var CHIAVE_PRES  = 'hxh-avviso-presentazione';
var VALIDITA     = 3 * 60 * 1000; // l'arrivo nel topic deve avvenire entro 3 minuti

function log(testo) {
    if (DEBUG) console.log('[HxH avvisi forum mobile] ' + testo);
}

function campo(form, nome) {
    var el = form && form.elements ? form.elements[nome] : null;
    if (el && el.length !== undefined && el.value === undefined) el = el[0]; // più campi con lo stesso nome
    return el && el.value !== undefined ? String(el.value) : '';
}

function leggi(chiave) {
    try { return JSON.parse(sessionStorage.getItem(chiave) || 'null'); } catch (e) { return null; }
}

function inviaAlBot(dati) {
    fetch(BOT_URL + '?f=' + BOT_CHIAVE, {
        method: 'POST',
        mode:   'no-cors',
        body:   JSON.stringify(dati)
    }).then(function() {
        log('avviso inviato: ' + JSON.stringify(dati));
    }).catch(function(e) {
        log('errore di invio: ' + e);
    });
}

// ----- 1. Invio del modulo

function segnaInvio(form, pulsante) {
    try {
        if (!form || campo(form, 'act').toLowerCase() !== 'post') return;
        if (pulsante && /preview|anteprima/i.test((pulsante.name || '') + ' ' + (pulsante.value || ''))) {
            log('anteprima, nessun avviso');
            return;
        }
        var code = campo(form, 'CODE');

        if (code === '03') {                                   // risposta
            var t = campo(form, 't');
            if (!/^\d+$/.test(t)) return;
            sessionStorage.setItem(CHIAVE_QUEST, JSON.stringify({ t: t, ts: Date.now() }));
            log('risposta inviata nel topic ' + t);

        } else if (code === '01') {                            // nuova discussione
            var f = campo(form, 'f');
            if (!f || f !== SEZIONE_BENVENUTI[location.hostname]) return;
            sessionStorage.setItem(CHIAVE_PRES, JSON.stringify({ f: f, ts: Date.now() }));
            log('nuova presentazione inviata');
        }
    } catch (e) {}
}

// Invio con il pulsante...
document.addEventListener('submit', function(ev) {
    segnaInvio(ev.target, ev.submitter);
}, true);

// ...e invio fatto da script (form.submit() non genera l'evento submit)
var submitOriginale = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function() {
    segnaInvio(this, null);
    return submitOriginale.apply(this, arguments);
};

// ----- 2. Arrivo nel topic

function utente() {
    var u = (window.Commons && window.Commons.user) || {};
    return {
        id:   String(u.id || ''),
        nome: String(u.nickname || u.name || u.username || '')
    };
}

function idTopicCorrente() {
    var m = location.search.match(/[?&]t=(\d+)/) || (document.body.className || '').match(/\bt(\d+)\b/);
    return m ? m[1] : null;
}

function controllaQuest() {
    var dato = leggi(CHIAVE_QUEST);
    if (!dato) return;

    if (Date.now() - dato.ts > VALIDITA) {
        sessionStorage.removeItem(CHIAVE_QUEST);
        log('quest: troppo tempo dall\'invio, annullato');
        return;
    }
    if (document.body.id !== 'topic' || idTopicCorrente() !== dato.t) {
        log('quest: non ancora nel topic, in attesa');
        return;
    }
    sessionStorage.removeItem(CHIAVE_QUEST);

    var u = utente();
    if (!u.nome) { log('quest: nome utente non trovato'); return; }

    inviaAlBot({ t: dato.t, utente: u.nome, uid: u.id, forum: location.hostname, id: dato.ts });
}

function controllaPresentazione() {
    var dato = leggi(CHIAVE_PRES);
    if (!dato) return;

    if (Date.now() - dato.ts > VALIDITA) {
        sessionStorage.removeItem(CHIAVE_PRES);
        log('presentazione: troppo tempo dall\'invio, annullato');
        return;
    }
    var loc = window.Commons && window.Commons.location;
    if (document.body.id !== 'topic' || !loc || !loc.topic || !loc.section ||
        String(loc.section.id) !== dato.f) {
        log('presentazione: non ancora nel topic, in attesa');
        return;
    }
    sessionStorage.removeItem(CHIAVE_PRES);

    // Deve essere un topic nuovo dell'utente: prima pagina, primo post suo
    var u = utente();
    var primo = loc.posts && loc.posts[0];
    if (!loc.isFirstPage || !primo || !primo.author || String(primo.author.id) !== u.id) {
        log('presentazione: il primo post non è dell\'utente, nessun avviso');
        return;
    }
    if (!u.nome) { log('presentazione: nome utente non trovato'); return; }

    inviaAlBot({
        tipo:   'presentazione',
        t:      String(loc.topic.id),
        titolo: String(loc.topic.title || ''),
        utente: u.nome,
        uid:    u.id,
        forum:  location.hostname,
        id:     dato.ts
    });
}

function controlla() {
    controllaQuest();
    controllaPresentazione();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', controlla);
} else {
    controlla();
}

})();


// ═══════════════════════════════════════════════════════════════
// OVERLAY MANUTENZIONE FORUM (mobile)
// Blocca l'accesso all'utenza durante gli aggiornamenti.
// Modalita' decisa da MANUTENZIONE (config in cima al bundle):
//   0 = spento, 1 = entra lo staff, 2 = entrano solo admin e g1.
// Grafica ridotta per mobile.
// ═══════════════════════════════════════════════════════════════
;(function() {

    var mode = parseInt(MANUTENZIONE, 10) || 0;
    if (mode !== 1 && mode !== 2) return;
 
    var frasi = [
        "Aggiornando il sistema di combattimento...",
        "Sistemando le schede personaggio...",
        "Approvando gli Hatsu...",
        "Contando gli HunterCoin...",
        "Lucidando Arena Forge...",
        "Preparando l'Esame Hunter...",
        "Schiavizzando il Founder...",
        "Incenerendo gli Hatsu troppo OP...",
        "Corrompendo gli Esaminatori...",
        "Abolendo il font Sriracha...",
        "Cercando Ging (ancora)...",
        "Bilanciando le Stats...",
        "Fingendo che sia tutto sotto controllo...",
        "Rimescolando i dadi...",
        "Negoziando con il Ragno...",
        "Sacrificando uno staffer agli d\u00e8i del codice...",
        "Sincronizzando il database...",
        "Ricalibrando i ritardi nelle Quest...",
        "OK...",
        "La Galleria contiene le straordinarie creazioni dei Simmini come te!... Ah, no...",
        "Non voglio auricolari gratuiti"
    ];
 
    var IMG_URL = "https://upload.forumfree.net/i/ff13982804/Hunter/loading.svg";
 
    // Override localStorage per test (come nella versione desktop)
    var force = null;
    try {
        if (window.localStorage) {
            if (localStorage.getItem("mntForceUser") === "1") force = "user";
            else if (localStorage.getItem("mntForceStaff") === "1") force = "staff";
        }
    } catch (e) {}
 
    // mode 1 -> isStaff (admin, g1-g4) | mode 2 -> isAdmin o isGDRMaster (admin, g1)
    var G = window.HxHFramework && window.HxHFramework.groups;
    var puoEntrare = false;
    if (G) {
        puoEntrare = (mode === 2) ? (G.isAdmin() || G.isGDRMaster()) : G.isStaff();
    }
    var staff = (force === "staff") || (force !== "user" && puoEntrare);
 
    if (staff) return;
    if (document.getElementById("mnt-overlay")) return;
 
    // --- Stili (grafica ridotta per mobile) ---
    var st = document.createElement("style");
    st.innerHTML =
        "body.mnt-lock *{z-index:auto!important;}" +
        "html.mnt-lock,body.mnt-lock{overflow:hidden!important;height:100%!important;" +
        "position:relative!important;}" +
        "#mnt-overlay{position:fixed;top:0;left:0;right:0;bottom:0;" +
        "width:100vw;height:100vh;min-height:100%;" +
        "z-index:2147483647;background:#ffffff;color:#000000;" +
        "font-family:'Montserrat',sans-serif;overflow:auto;" +
        "text-align:center;margin:0;padding:0;}" +
        "#mnt-overlay .mnt-box{position:absolute;top:0;left:0;right:0;bottom:0;" +
        "display:flex;flex-direction:column;align-items:center;" +
        "box-sizing:border-box;padding:5vh 16px 6vh;}" +
        "#mnt-overlay .mnt-head{width:100%;max-width:92vw;}" +
        "#mnt-overlay h1{font-family:'Calistoga',serif;color:#000000;" +
        "font-size:26px;margin:0 0 10px;line-height:1.2;}" +
        "#mnt-overlay p.mnt-sub{color:#333333;font-size:15px;margin:0;" +
        "line-height:1.45;}" +
        "#mnt-overlay .mnt-load{flex:1 1 auto;width:100%;display:flex;" +
        "flex-direction:column;align-items:center;justify-content:center;}" +
        "#mnt-overlay .mnt-spinner{width:220px;height:176px;max-width:70vw;" +
        "margin:0 auto 4px;}" +
        "#mnt-overlay .mnt-spinner img{display:block;width:100%;height:100%;}" +
        "#mnt-overlay .mnt-ticker{margin-top:-30px;position:relative;width:100%;" +
        "max-width:88vw;height:64px;overflow:hidden;}" +
        "#mnt-overlay .mnt-ticker span{position:absolute;top:0;left:0;right:0;" +
        "height:64px;display:flex;align-items:center;justify-content:center;" +
        "color:#555555;font-size:17px;font-style:italic;line-height:1.3;" +
        "opacity:0;}" +
        "#mnt-overlay .mnt-ticker span.on{" +
        "animation:mntSlide 5s ease-in-out forwards;}" +
        "@keyframes mntSlide{" +
        "0%{opacity:0;transform:translateX(-40px);}" +
        "12%{opacity:1;transform:translateX(0);}" +
        "88%{opacity:1;transform:translateX(0);}" +
        "100%{opacity:0;transform:translateX(40px);}}";
    document.head.appendChild(st);
 
    // --- Wrapper ---
    var ov = document.createElement("div");
    ov.id = "mnt-overlay";
 
    var box = document.createElement("div");
    box.className = "mnt-box";
 
    var head = document.createElement("div");
    head.className = "mnt-head";
 
    var h1 = document.createElement("h1");
    h1.innerHTML = "Stiamo aggiornando il forum";
 
    var sub = document.createElement("p");
    sub.className = "mnt-sub";
    sub.innerHTML =
        "Il forum \u00e8 temporaneamente offline per un grosso aggiornamento.<br>" +
        "Tutto dovrebbe tornare operativo al massimo entro il 5/11/2026. Grazie per la pazienza!";
 
    head.appendChild(h1);
    head.appendChild(sub);
 
    var load = document.createElement("div");
    load.className = "mnt-load";
 
    var spinner = document.createElement("div");
    spinner.className = "mnt-spinner";
    var img = document.createElement("img");
    img.src = IMG_URL;
    img.alt = "";
    spinner.appendChild(img);
 
    var ticker = document.createElement("div");
    ticker.className = "mnt-ticker";
 
    var spans = [];
    for (var i = 0; i < frasi.length; i++) {
        var s = document.createElement("span");
        s.innerHTML = frasi[i];
        ticker.appendChild(s);
        spans.push(s);
    }
 
    load.appendChild(spinner);
    load.appendChild(ticker);
 
    box.appendChild(head);
    box.appendChild(load);
    ov.appendChild(box);
 
    // --- Iniezione + blocco (overlay appeso a <html>) ---
    function lock() {
        if (document.documentElement && !/\bmnt-lock\b/.test(document.documentElement.className)) {
            document.documentElement.className += " mnt-lock";
        }
        if (document.body && !/\bmnt-lock\b/.test(document.body.className)) {
            document.body.className += " mnt-lock";
        }
    }
 
    function inject() {
        document.documentElement.appendChild(ov);
        lock();
    }
 
    if (document.documentElement) inject();
    else document.addEventListener("DOMContentLoaded", inject);
 
    // --- Guardia ---
    var mo = new MutationObserver(function() {
        if (!document.getElementById("mnt-overlay") && document.documentElement) {
            document.documentElement.appendChild(ov);
        }
        lock();
    });
    if (document.documentElement) mo.observe(document.documentElement, { childList: true });
 
    // --- Loop frasi in ordine casuale (Fisher-Yates) ---
    function shuffle(arr) {
        for (var j = arr.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = arr[j]; arr[j] = arr[k]; arr[k] = tmp;
        }
        return arr;
    }
 
    var order = [];
    for (var n = 0; n < spans.length; n++) order.push(n);
    shuffle(order);
 
    var pos = 0;
    var current = order[0];
    if (spans.length) spans[current].className = "on";
 
    setInterval(function() {
        spans[current].className = "";
        pos++;
        if (pos >= order.length) {
            var last = order[order.length - 1];
            shuffle(order);
            if (order.length > 1 && order[0] === last) {
                var swap = order[0]; order[0] = order[1]; order[1] = swap;
            }
            pos = 0;
        }
        current = order[pos];
        var next = spans[current];
        void next.offsetWidth;
        next.className = "on";
    }, 5000);
 
    console.log('[Manutenzione mobile] overlay attivo');
})();

// ═══════════════════════════════════════════════════════════════
// CONTATORE CARATTERI VALIDI — textarea di scrittura dei post
// ═══════════════════════════════════════════════════════════════
//  Mostra sotto la textarea i caratteri validi mentre scrivi.
//  Stessa regola dei "caratteri validi" sui post pubblicati:
//    - esclude [quote] [spoiler] [code] [html] col loro contenuto
//    - esclude [img] e i tag BBCode/HTML di formattazione (il testo resta)
//    - esclude il box PG/NPC (riconosciuto dai caratteri ❝ ❞ dentro
//      un contenitore con border-radius e bordo spesso)
//    - non conta gli spazi e gli a capo
//  Funziona uguale su desktop e mobile: lo stesso blocco va bene in entrambi.

;(function() {
	'use strict';
	if (window.__ccvTextarea) return;
	window.__ccvTextarea = true;

	// textarea dei post (risposta completa, risposta rapida, modifica)
	var TA_SEL = 'textarea[name="Post"], textarea#Post';

	// tag BBCode di sola formattazione: si tolgono i tag, il testo resta
	var INLINE_TAGS = 'b|i|u|s|strike|url|color|size|font|center|left|right|justify|align|float|indent|list|\\*|sub|sup|hr|email|tt';

	// ── 1) blocchi da togliere col contenuto (gestisce anche gli annidati) ──
	function stripBlocks(s) {
		var re = /\[(quote|spoiler|code|html|img)(?:=[^\]]*)?\]((?:(?!\[\1(?:=[^\]]*)?\])[\s\S])*?)\[\/\1\]/gi;
		var prev;
		do {
			prev = s;
			s = s.replace(re, ' ');
		} while (s !== prev);
		return s;
	}

	// ── 2) tag BBCode di formattazione ──
	function stripInlineTags(s) {
		var re = new RegExp('\\[\\/?(?:' + INLINE_TAGS + ')(?:=[^\\]]*)?\\]', 'gi');
		return s.replace(re, ' ');
	}

	// ── 3) box PG/NPC ──
	function removeQuoteBoxes(root) {
		var MARKERS = ['❝', '❞']; // ❝ ❞
		var divs = root.querySelectorAll('div');
		var toRemove = [];
		for (var i = 0; i < divs.length; i++) {
			var txt = divs[i].textContent || '';
			if (txt.indexOf(MARKERS[0]) !== -1 || txt.indexOf(MARKERS[1]) !== -1) {
				var box = findBoxAncestor(divs[i], root);
				if (box && toRemove.indexOf(box) === -1) toRemove.push(box);
			}
		}
		for (var j = 0; j < toRemove.length; j++) {
			if (toRemove[j].parentNode) toRemove[j].parentNode.removeChild(toRemove[j]);
		}
	}
	function findBoxAncestor(el, root) {
		var cur = el;
		while (cur && cur !== root) {
			var style = (cur.getAttribute && cur.getAttribute('style')) || '';
			if (/border-radius/i.test(style) && /border-(left|right|top|bottom)\s*:\s*\d/i.test(style)) return cur;
			cur = cur.parentNode;
		}
		return null;
	}

	function removeAll(root, sel) {
		var els = root.querySelectorAll(sel);
		for (var i = 0; i < els.length; i++) {
			if (els[i].parentNode) els[i].parentNode.removeChild(els[i]);
		}
	}

	// ── conteggio ──
	// L'HTML viene interpretato in un documento separato (DOMParser):
	// non esegue script e non carica immagini.
	var parser = new DOMParser();
	function countValid(raw) {
		var s = stripInlineTags(stripBlocks(raw || ''));
		var doc = parser.parseFromString(s, 'text/html');
		var root = doc.body;
		if (!root) return 0;
		removeAll(root, 'script, style');
		removeAll(root, '.spoiler, .quote_top, .quote, .code_top, .code');
		removeQuoteBoxes(root);
		return (root.textContent || '').replace(/\s/g, '').length;
	}

	// ── aggancio alla textarea ──
	function attach(ta) {
		if (ta.getAttribute('data-ccv')) return;
		ta.setAttribute('data-ccv', '1');

		var box = document.createElement('div');
		// aspetto e colori nel CSS del forum (classe ccv-counter), cosi'
		// le skin Halloween e Natale possono cambiarli
		box.className = 'ccv-counter';
		ta.parentNode.insertBefore(box, ta.nextSibling);

		var timer = null;
		var last = null;
		function update() {
			if (ta.value === last) return;
			last = ta.value;
			box.textContent = countValid(ta.value) + ' caratteri validi';
		}
		function schedule() {
			clearTimeout(timer);
			timer = setTimeout(update, 150);
		}
		ta.addEventListener('input', schedule);
		ta.addEventListener('keyup', schedule);
		ta.addEventListener('change', schedule);
		ta._ccvUpdate = update;
		update();
	}

	// controlla periodicamente: aggancia le textarea che compaiono dopo
	// (risposta rapida) e aggiorna il conto quando il testo cambia dai
	// pulsanti dell'editor, che non generano l'evento input.
	function scan() {
		var tas = document.querySelectorAll(TA_SEL);
		for (var i = 0; i < tas.length; i++) {
			attach(tas[i]);
			if (tas[i]._ccvUpdate) tas[i]._ccvUpdate();
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', scan);
	} else {
		scan();
	}
	setInterval(scan, 700);
})();

})(); // fine IIFE globale
