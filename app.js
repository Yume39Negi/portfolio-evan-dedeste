/* =====================================================================
   Portfolio de DEDESTE Evan : effets dynamiques (0 et 1, transitions)
   Ce script est chargé au tout début de <body> sur chaque page.
   ===================================================================== */
(function () {
    'use strict';

    var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var MONO = '"Cascadia Code","Fira Code","JetBrains Mono",Consolas,"SF Mono",Menlo,"Courier New",monospace';
    var body = document.body;
    var overlay = null;

    function bit() { return Math.random() < 0.5 ? '0' : '1'; }

    function bits(n) {
        var s = '';
        for (var i = 0; i < n; i++) { s += bit() + (i < n - 1 ? '\n' : ''); }
        return s;
    }

    /* ---------- Transition de page : colonnes de 0 et de 1 ---------- */
    function creerTransition() {
        overlay = document.createElement('div');
        overlay.className = 'transition entree';
        overlay.setAttribute('aria-hidden', 'true');
        var n = Math.ceil(window.innerWidth / 52);
        var h = Math.ceil(window.innerHeight / 16) + 2;
        for (var i = 0; i < n; i++) {
            var col = document.createElement('div');
            col.className = 'tcol';
            col.style.setProperty('--d', Math.round(Math.random() * 320) + 'ms');
            col.textContent = bits(h);
            overlay.appendChild(col);
        }
        body.appendChild(overlay);
        // Une fois l'arrivée terminée, on retire la couche pour ne pas gêner la page
        setTimeout(function () { if (overlay) { overlay.style.display = 'none'; } }, 1300);
    }

    function quitter(adresse) {
        overlay.className = 'transition sortie';
        overlay.style.display = 'flex';
        setTimeout(function () { window.location.href = adresse; }, 780);
    }

    function gererLiens() {
        document.addEventListener('click', function (e) {
            if (!overlay || reduit) { return; }
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
            var a = e.target.closest ? e.target.closest('a[href]') : null;
            if (!a) { return; }
            if ((a.target && a.target !== '_self') || a.hasAttribute('download')) { return; }
            var url;
            try { url = new URL(a.href, window.location.href); } catch (err) { return; }
            if (url.protocol !== window.location.protocol) { return; }
            if (url.protocol !== 'file:' && url.host !== window.location.host) { return; }
            if (url.pathname === window.location.pathname && url.hash) { return; }
            e.preventDefault();
            quitter(a.href);
        });

        // Retour arrière du navigateur : on enlève la couche de transition
        window.addEventListener('pageshow', function (e) {
            if (e.persisted && overlay) { overlay.style.display = 'none'; }
        });
    }

    /* ---------- Pluie de 0 et de 1 ---------- */
    function pluie() {
        var cv = document.createElement('canvas');
        cv.id = 'pluie';
        cv.setAttribute('aria-hidden', 'true');
        body.insertBefore(cv, body.firstChild);
        var ctx = cv.getContext('2d');
        if (!ctx) { return; }

        var L, H, taille, cols = [], mx = -999, dernier = 0;

        function aleatoire(n) {
            var t = [];
            for (var i = 0; i < n; i++) { t.push(bit()); }
            return t;
        }

        function dimensionner() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            L = window.innerWidth;
            H = window.innerHeight;
            cv.width = Math.round(L * dpr);
            cv.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            taille = L < 600 ? 15 : 17;
            var n = Math.ceil(L / taille);
            cols = [];
            for (var i = 0; i < n; i++) {
                cols.push({
                    y: Math.random() * (H / taille + 20),
                    v: 0.12 + Math.random() * 0.3,
                    longueur: 8 + Math.floor(Math.random() * 14),
                    chars: aleatoire(40)
                });
            }
            if (reduit) { dessiner(); }
        }

        function dessiner() {
            ctx.clearRect(0, 0, L, H);
            ctx.font = taille + 'px ' + MONO;
            ctx.textBaseline = 'top';
            for (var i = 0; i < cols.length; i++) {
                var c = cols[i];
                var x = i * taille;
                var proche = Math.max(0, 1 - Math.abs(x + taille / 2 - mx) / 110);
                var tete = Math.floor(c.y);
                for (var k = 0; k < c.longueur; k++) {
                    var rang = tete - k;
                    if (rang < 0) { continue; }
                    var py = rang * taille;
                    if (py > H) { continue; }
                    var a = (1 - k / c.longueur) * 0.5 * (1 + proche * 1.4);
                    ctx.globalAlpha = Math.min(1, a);
                    ctx.fillStyle = k === 0 ? '#cffafe' : '#00d4ff';
                    var ch = k === 0 ? bit() : c.chars[rang % c.chars.length];
                    ctx.fillText(ch, x, py);
                }
                if (!reduit) {
                    c.y += c.v * (1 + proche * 1.5);
                    if ((c.y - c.longueur) * taille > H) {
                        c.y = -Math.random() * 20;
                        c.v = 0.12 + Math.random() * 0.3;
                    }
                    if (Math.random() < 0.03) { c.chars[Math.floor(Math.random() * c.chars.length)] = bit(); }
                }
            }
            ctx.globalAlpha = 1;
        }

        function boucle(t) {
            window.requestAnimationFrame(boucle);
            if (document.hidden || t - dernier < 33) { return; }
            dernier = t;
            dessiner();
        }

        window.addEventListener('resize', dimensionner);
        window.addEventListener('pointermove', function (e) { mx = e.clientX; }, { passive: true });
        window.addEventListener('pointerleave', function () { mx = -999; });
        dimensionner();
        if (!reduit) { window.requestAnimationFrame(boucle); }
    }

    /* ---------- Titres qui se « décodent » (0 et 1 → texte) ---------- */
    function decoder(el, duree) {
        if (el.getAttribute('data-decode-fait')) { return; }
        el.setAttribute('data-decode-fait', '1');
        var texte = el.textContent.replace(/\s+/g, ' ').trim();
        if (reduit || !texte) { return; }

        var sr = document.createElement('span');
        sr.className = 'sr';
        sr.textContent = texte;
        var vis = document.createElement('span');
        vis.setAttribute('aria-hidden', 'true');
        vis.className = 'dec';
        el.textContent = '';
        el.appendChild(sr);
        el.appendChild(vis);

        var n = texte.length;
        var debut = performance.now();
        (function tick(t) {
            var p = Math.min(1, (t - debut) / duree);
            var fixes = Math.floor(p * n);
            var s = '';
            for (var i = 0; i < n; i++) {
                var c = texte.charAt(i);
                s += (i < fixes || c === ' ') ? c : bit();
            }
            vis.textContent = p < 1 ? s : texte;
            if (p < 1) { window.requestAnimationFrame(tick); }
        })(debut);
    }

    /* ---------- Phrase tapée (page d'accueil) ---------- */
    function taper(el) {
        var texte = el.textContent.trim();
        if (reduit || !texte) { return; }
        var sr = document.createElement('span');
        sr.className = 'sr';
        sr.textContent = texte;
        var vis = document.createElement('span');
        vis.setAttribute('aria-hidden', 'true');
        vis.className = 'dec';
        el.textContent = '';
        el.appendChild(sr);
        el.appendChild(vis);
        var i = 0;
        setTimeout(function etape() {
            vis.textContent = texte.slice(0, i) + (i < texte.length ? bit() : '');
            if (i++ < texte.length) { setTimeout(etape, 45 + Math.random() * 55); }
        }, 1000);
    }

    /* ---------- Initialisation une fois la page chargée ---------- */
    function init() {
        var elements = [].slice.call(document.querySelectorAll('.reveal'));
        elements.forEach(function (el, i) { el.style.setProperty('--d', (i % 3) * 110 + 'ms'); });

        function afficher(el) {
            el.classList.add('visible');
            var t = el.querySelector('h3');
            if (t) { decoder(t, 600); }
        }

        function toutAfficher() { elements.forEach(afficher); }

        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entrees) {
                entrees.forEach(function (e) {
                    if (e.isIntersecting) { afficher(e.target); obs.unobserve(e.target); }
                });
            }, { threshold: 0.12 });
            elements.forEach(function (el) { obs.observe(el); });
        } else {
            toutAfficher();
        }

        // Titre principal : décodage après la transition d'arrivée
        var h1 = document.querySelector('h1');
        if (h1) { setTimeout(function () { decoder(h1, 900); }, reduit ? 0 : 650); }

        var tape = document.querySelector('[data-tape]');
        if (tape) { taper(tape); }

        // Signature : « EVAN » en binaire
        var sig = document.querySelector('[data-binaire]');
        if (sig) {
            var mot = sig.getAttribute('data-binaire');
            var groupes = [];
            for (var i = 0; i < mot.length; i++) {
                var b = mot.charCodeAt(i).toString(2);
                while (b.length < 8) { b = '0' + b; }
                groupes.push(b);
            }
            sig.textContent = groupes.join(' ');
            sig.setAttribute('title', mot);
        }

        // Lueur qui suit le curseur sur les cartes et les tuiles
        var cible = null, px = 0, py = 0, attente = false;
        document.addEventListener('pointermove', function (e) {
            var c = e.target.closest ? e.target.closest('.carte, .tuile') : null;
            if (!c) { return; }
            cible = c; px = e.clientX; py = e.clientY;
            if (attente) { return; }
            attente = true;
            window.requestAnimationFrame(function () {
                attente = false;
                var r = cible.getBoundingClientRect();
                cible.style.setProperty('--mx', (px - r.left) + 'px');
                cible.style.setProperty('--my', (py - r.top) + 'px');
            });
        }, { passive: true });

        // Sommaire de la page « Présentation du BTS » : le lien actif suit le défilement
        var liens = [].slice.call(document.querySelectorAll('.sommaire a[href^="#"]'));
        if (liens.length && 'IntersectionObserver' in window) {
            var spy = new IntersectionObserver(function (entrees) {
                entrees.forEach(function (e) {
                    if (e.isIntersecting) {
                        liens.forEach(function (a) {
                            a.classList.toggle('actif', a.getAttribute('href') === '#' + e.target.id);
                        });
                    }
                });
            }, { rootMargin: '-25% 0px -60% 0px' });
            liens.forEach(function (a) {
                var s = document.getElementById(a.getAttribute('href').slice(1));
                if (s) { spy.observe(s); }
            });
        }

        // Barre de progression de lecture
        var barre = document.querySelector('.progression');
        if (barre) {
            var maj = function () {
                var h = document.documentElement;
                var max = h.scrollHeight - h.clientHeight;
                barre.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
            };
            window.addEventListener('scroll', maj, { passive: true });
            window.addEventListener('resize', maj);
            maj();
        }

        // Bouton PDF
        var pdf = document.querySelector('.btn-pdf');
        if (pdf) { pdf.addEventListener('click', function () { window.print(); }); }
        window.addEventListener('beforeprint', toutAfficher);

        // Boutons « Copier »
        [].slice.call(document.querySelectorAll('.copier')).forEach(function (btn) {
            btn.addEventListener('click', function () {
                var valeur = btn.getAttribute('data-copie');
                var ok = function () {
                    btn.textContent = 'Copié !';
                    setTimeout(function () { btn.textContent = 'Copier'; }, 1600);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(valeur).then(ok, function () {});
                } else {
                    var t = document.createElement('textarea');
                    t.value = valeur;
                    document.body.appendChild(t);
                    t.select();
                    try { document.execCommand('copy'); ok(); } catch (err) { /* rien */ }
                    document.body.removeChild(t);
                }
            });
        });
    }

    if (!reduit) { creerTransition(); }
    pluie();
    gererLiens();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
