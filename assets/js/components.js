let siteData = null;

async function fetchContent(rootPath = './') {
    if (siteData) return siteData;
    try {
        const response = await fetch(`${rootPath}data/content.json`);
        siteData = await response.json();
        return siteData;
    } catch (error) {
        console.error('Error loading content:', error);
        return null;
    }
}

function getRootPath() {
    const nav = document.querySelector('site-nav');
    if (nav && nav.getAttribute('root')) {
        return nav.getAttribute('root');
    }
    const script = document.querySelector('script[src*="components.js"]');
    if (script) {
        const src = script.getAttribute('src');
        return src.replace(/assets\/js\/components\.js.*$/, '');
    }
    const css = document.querySelector('link[href*="global.css"]');
    if (css) {
        const href = css.getAttribute('href');
        return href.replace(/assets\/css\/global\.css.*$/, '');
    }
    return './';
}

function updateFaviconLink(rel, sizes, type, href) {
    let selector = `link[rel="${rel}"]`;
    if (sizes) selector += `[sizes="${sizes}"]`;
    if (type) selector += `[type="${type}"]`;

    let link = document.querySelector(selector);
    if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (sizes) link.sizes = sizes;
        if (type) link.type = type;
        link.href = href;
        document.head.appendChild(link);
        return;
    }

    if (link.getAttribute('href') !== href) {
        const newLink = link.cloneNode(true);
        newLink.setAttribute('href', href);
        link.parentNode.replaceChild(newLink, link);
    }
}

function syncFavicon() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Site is dark-only; the tab icon alone follows the browser/OS theme.
    // Folder names describe the ICON color: favicon_dark/ = BLACK logo for
    // light browser theme, favicon_light/ = WHITE logo for dark browser theme.
    const isDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;

    const iconFolder = isDark ? 'favicon_light' : 'favicon_dark';
    const rootPath = getRootPath();

    updateFaviconLink('icon', '', 'image/svg+xml', `${rootPath}assets/icons/favicon.svg`);
    updateFaviconLink('icon', '32x32', 'image/png', `${rootPath}assets/icons/${iconFolder}/favicon-32x32.png`);
    updateFaviconLink('icon', '16x16', 'image/png', `${rootPath}assets/icons/${iconFolder}/favicon-16x16.png`);
    updateFaviconLink('apple-touch-icon', '', '', `${rootPath}assets/icons/${iconFolder}/apple-touch-icon.png`);

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        manifestLink.setAttribute('href', `${rootPath}assets/icons/${iconFolder}/site.webmanifest`);
    }

    const shortcutLink = document.querySelector('link[rel="shortcut icon"]');
    if (shortcutLink) {
        shortcutLink.setAttribute('href', `${rootPath}assets/icons/${iconFolder}/favicon.ico`);
    }
}

if (typeof window !== 'undefined' && window.matchMedia) {
    syncFavicon();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncFavicon);
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncFavicon);
}

// Preloader: fade out once the page has fully loaded (with a safety timeout).
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('done');
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
        setTimeout(hidePreloader, 4000);
    }
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

// Shared icons -------------------------------------------------------------
const ICON_ARROW = '<svg class="icon-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>';
const ICON_UP = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
const SOCIAL_SVGS = {
    youtube: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>',
    huggingface: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624"/></svg>'
};

function socialIcon(id, rootPath) {
    if (id === 'github') return `<img src="${rootPath}assets/icons/github.svg" alt="" aria-hidden="true">`;
    if (id === 'linkedin') return `<img src="${rootPath}assets/icons/linkedin-icon.svg" alt="" aria-hidden="true">`;
    return SOCIAL_SVGS[id] || '';
}

function getSocials(data) {
    return (data && data.brand && Array.isArray(data.brand.socials)) ? data.brand.socials : [
        { id: 'github', label: 'GitHub', url: 'https://www.github.com/onedroid' },
        { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/onedroid' }
    ];
}

function getSocialUrl(data, id) {
    return (getSocials(data).find(s => s.id === id) || {}).url || '';
}

// On the home page, in-page links become bare hashes so they scroll instead of reloading.
function navHref(url, rootPath) {
    const path = window.location.pathname;
    const onHome = !path.includes('/pages/') && (path.endsWith('/') || path.endsWith('index.html'));
    const hashIdx = url.indexOf('#');
    if (onHome && hashIdx > -1 && url.startsWith('index.html')) return url.slice(hashIdx);
    return `${rootPath}${url}`;
}

function getActiveNavId() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('about.html')) return 'about';
    const isHome = path.endsWith('/') || path.endsWith('index.html');
    if (!isHome) return '';
    if (hash === '#apps') return 'apps';
    if (hash === '#approach') return 'approach';
    return 'home';
}

class SiteNav extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data) return;
        this.render(data, rootPath);

        this._hashHandler = () => this.updateActive();
        window.addEventListener('hashchange', this._hashHandler);

        this._mq = window.matchMedia('(min-width: 769px)');
        this._mqHandler = (e) => { if (e.matches) this.closeMenu(false); };
        this._mq.addEventListener('change', this._mqHandler);

        this._keyHandler = (e) => this.onKeydown(e);
        document.addEventListener('keydown', this._keyHandler);
    }

    disconnectedCallback() {
        if (this._hashHandler) window.removeEventListener('hashchange', this._hashHandler);
        if (this._mq && this._mqHandler) this._mq.removeEventListener('change', this._mqHandler);
        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
        document.documentElement.classList.remove('menu-open');
    }

    render(data, rootPath) {
        const navLinks = data.navigation || [];
        const brand = data.brand || {};
        const githubUrl = getSocialUrl(data, 'github') || 'https://www.github.com/onedroid';
        const activeId = getActiveNavId();
        const pad = (n) => String(n + 1).padStart(2, '0');

        this.innerHTML = `
        <header class="full-width-header">
            <div class="container">
                <nav aria-label="Main">
                    <a href="${rootPath}index.html" class="logo-wrapper" aria-label="${brand.name || 'OneDroid'} home">
                        <img src="${rootPath}assets/icons/onedroid-icon.png" class="logo-icon" alt="">
                        <span class="logo-text">
                            <span class="logo-title">${brand.name || 'OneDroid'}</span>
                            <span class="tagline">${brand.tagline || 'Android App Studio'}</span>
                        </span>
                    </a>
                    <div class="nav-links">
                        ${navLinks.map(link => `<a href="${navHref(link.url, rootPath)}" data-nav-id="${link.id}" class="${link.id === activeId ? 'active' : ''}"${link.id === activeId ? ' aria-current="page"' : ''}>${link.label}</a>`).join('')}
                        <a href="${githubUrl}" class="nav-cta" target="_blank" rel="noopener">
                            ${socialIcon('github', rootPath)} GitHub
                        </a>
                    </div>
                    <button class="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
                        <span></span><span></span><span></span>
                    </button>
                </nav>
            </div>
            <div class="mobile-menu" id="mobile-menu" aria-label="Mobile menu">
                <div class="mobile-menu-inner">
                    <p class="mobile-menu-label">Menu</p>
                    <ul class="mobile-menu-links">
                        ${navLinks.map((link, i) => `
                        <li style="--i:${i}">
                            <a href="${navHref(link.url, rootPath)}" data-nav-id="${link.id}" class="${link.id === activeId ? 'active' : ''}"${link.id === activeId ? ' aria-current="page"' : ''}>
                                <span class="mm-index">${pad(i)}</span>
                                <span class="mm-label">${link.label}</span>
                                ${ICON_ARROW}
                            </a>
                        </li>`).join('')}
                    </ul>
                    <div class="mobile-menu-actions" style="--i:${navLinks.length}">
                        <a href="${navHref('index.html#apps', rootPath)}" class="btn btn-solid">Explore Apps</a>
                        <a href="${githubUrl}" class="btn btn-outline" target="_blank" rel="noopener">${socialIcon('github', rootPath)} GitHub</a>
                    </div>
                    <div class="mobile-menu-footer" style="--i:${navLinks.length + 1}">
                        <div class="mm-socials">
                            ${getSocials(data).map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}">${socialIcon(s.id, rootPath)}</a>`).join('')}
                        </div>
                        <p>${brand.tagline || 'Android App Studio'}</p>
                    </div>
                </div>
            </div>
        </header>
        `;

        this._header = this.querySelector('.full-width-header');
        this._hamburger = this.querySelector('.hamburger');
        this._menu = this.querySelector('.mobile-menu');

        this._hamburger.addEventListener('click', () => {
            if (this.isOpen()) this.closeMenu(true);
            else this.openMenu();
        });
        this._menu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => this.closeMenu(false));
        });
    }

    updateActive() {
        const activeId = getActiveNavId();
        this.querySelectorAll('[data-nav-id]').forEach(a => {
            const on = a.dataset.navId === activeId;
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
    }

    isOpen() {
        return !!this._menu && this._menu.classList.contains('open');
    }

    openMenu() {
        if (!this._menu) return;
        this.style.setProperty('--header-h', `${this._header.getBoundingClientRect().bottom}px`);
        this._menu.classList.add('open');
        this._hamburger.classList.add('active');
        this._hamburger.setAttribute('aria-expanded', 'true');
        this._hamburger.setAttribute('aria-label', 'Close menu');
        document.documentElement.classList.add('menu-open');
    }

    closeMenu(returnFocus) {
        if (!this.isOpen()) return;
        this._menu.classList.remove('open');
        this._hamburger.classList.remove('active');
        this._hamburger.setAttribute('aria-expanded', 'false');
        this._hamburger.setAttribute('aria-label', 'Open menu');
        document.documentElement.classList.remove('menu-open');
        if (returnFocus) this._hamburger.focus();
    }

    onKeydown(e) {
        if (!this.isOpen()) return;
        if (e.key === 'Escape') {
            this.closeMenu(true);
            return;
        }
        if (e.key !== 'Tab') return;
        // Keep focus inside the hamburger + open menu.
        const focusables = [this._hamburger, ...this._menu.querySelectorAll('a[href], button')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

class HeroSection extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const page = this.getAttribute('page') || 'home';
        const data = await fetchContent(rootPath);
        if (!data) return;

        let heroData;
        if (page === 'home') heroData = data.home.hero;
        else if (page === 'about') heroData = { title: data.about.title, subtitle: data.about.description, links: getSocials(data).filter(s => s.id === 'github' || s.id === 'linkedin') };
        const playstoreUrl = (data.brand && data.brand.playstore_url) || '';

        if (!heroData) return;

        this.className = 'hero';

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.innerWidth < 768;
        const showCanvas = page === 'home' && !prefersReducedMotion && !isMobile;

        this.innerHTML = `
            ${showCanvas ? `
            <div class="hero-canvas-container" aria-hidden="true" style="position: absolute; top: -50px; left: 0; height: calc(100% + 50px); z-index: -1; pointer-events: none; opacity: 0.8; mask-image: linear-gradient(to bottom, transparent, black 15%, black 80%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 80%, transparent);">
                <canvas id="data-pattern-canvas" style="width: 100%; height: 100%; display: block; mask-image: linear-gradient(to right, transparent 20%, black 50%, black 100%); -webkit-mask-image: linear-gradient(to right, transparent 20%, black 50%, black 100%);"></canvas>
            </div>
            ` : ''}
            <div class="hero-content" style="position: relative; z-index: 1;">
                ${heroData.eyebrow ? `<span class="eyebrow"><span class="eyebrow-dot" aria-hidden="true"></span>${heroData.eyebrow}</span>` : ''}
                <h1 ${page === 'about' ? 'style="text-transform: none;"' : ''}>${heroData.title}</h1>
                <p>${heroData.subtitle}</p>
                <div class="btn-group">
                    ${page === 'home' ? `
                        <a href="#apps" class="btn btn-solid">Explore Apps</a>
                        <a href="${heroData.github_url}" class="btn btn-outline" target="_blank" rel="noopener">
                            ${socialIcon('github', rootPath)} GitHub
                        </a>
                        ${playstoreUrl ? `
                        <a href="${playstoreUrl}" class="btn btn-outline" target="_blank" rel="noopener">
                            <img src="${rootPath}assets/icons/smartphone.svg" alt="" aria-hidden="true"> Google Play
                        </a>` : `
                        <span class="btn btn-outline disabled" aria-disabled="true">
                            <img src="${rootPath}assets/icons/smartphone.svg" alt="" aria-hidden="true"> Google Play &middot; Soon
                        </span>`}
                    ` : ''}
                    ${page === 'about' ? heroData.links.map(l => `
                        <a href="${l.url}" target="_blank" rel="noopener" class="btn btn-outline">
                            ${socialIcon(l.id, rootPath)} ${l.label}
                        </a>
                    `).join('') : ''}
                </div>
            </div>
        `;

        this.style.position = 'relative';
        this.style.display = 'block';

        if (showCanvas) {
            this.initDataPattern(heroData.animation || 'matrix', heroData.animation_randomize);
        }
    }

    disconnectedCallback() {
        this._cleanup();
    }

    _cleanup() {
        if (this._animFrameId) {
            cancelAnimationFrame(this._animFrameId);
            this._animFrameId = null;
        }
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._mouseMoveHandler) {
            window.removeEventListener('mousemove', this._mouseMoveHandler);
            this._mouseMoveHandler = null;
        }
        if (this._mouseLeaveHandler) {
            window.removeEventListener('mouseleave', this._mouseLeaveHandler);
            this._mouseLeaveHandler = null;
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    initDataPattern(configAnim, randomize) {
        const canvas = this.querySelector('#data-pattern-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const canvasContainer = this.querySelector('.hero-canvas-container');

        let width = 0;
        let height = 0;
        const dpr = window.devicePixelRatio || 1;

        const updateSize = () => {
            const container = this.closest('.container');
            if (container && canvasContainer) {
                const parentStyles = window.getComputedStyle(container);
                const pl = parseFloat(parentStyles.paddingLeft);
                const pr = parseFloat(parentStyles.paddingRight);
                canvasContainer.style.width = (container.offsetWidth - pl - pr) + 'px';
            }
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        updateSize();

        const animTypes = ['matrix', 'particles', 'circuit', 'logcat'];
        let currentAnim = animTypes.includes(configAnim) ? configAnim : 'matrix';
        if (randomize) {
            currentAnim = animTypes[Math.floor(Math.random() * animTypes.length)];
        }

        const mouse = { x: -1000, y: -1000 };
        this._mouseMoveHandler = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };
        this._mouseLeaveHandler = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };
        window.addEventListener('mousemove', this._mouseMoveHandler);
        window.addEventListener('mouseleave', this._mouseLeaveHandler);

        const animations = {
            matrix: () => {
                const chars = '01ANDROID<>{}[]/\\|'.split('');
                const fontSize = 16;
                class Stream {
                    constructor(x) { this.x = x; this.reset(); }
                    reset() {
                        this.y = -(Math.random() * 800 + 100);
                        this.speed = Math.random() * 2 + 1.5;
                        this.length = Math.floor(Math.random() * 15 + 8);
                        this.symbols = [];
                        for (let i = 0; i < this.length; i++) {
                            this.symbols.push({ char: chars[Math.floor(Math.random() * chars.length)], y: 0, xOffset: 0 });
                        }
                    }
                    update() {
                        this.y += this.speed;
                        const headY = this.y;
                        if (headY - this.length * fontSize > height + 50) {
                            this.reset();
                            this.y = -200;
                        }
                        for (let i = 0; i < this.length; i++) {
                            this.symbols[i].y = headY - i * fontSize;
                            if (Math.random() < 0.03) this.symbols[i].char = chars[Math.floor(Math.random() * chars.length)];
                        }
                        const dx = this.x - mouse.x;
                        for (let i = 0; i < this.length; i++) {
                            const dy = this.symbols[i].y - mouse.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            let targetXOffset = 0;
                            if (dist < 120) {
                                const force = (120 - dist) / 120;
                                const direction = dx === 0 ? 1 : dx / Math.abs(dx);
                                targetXOffset = direction * force * 35;
                            }
                            this.symbols[i].xOffset += (targetXOffset - this.symbols[i].xOffset) * 0.1;
                        }
                    }
                    draw() {
                        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                        ctx.font = `${fontSize}px "Roboto Mono", monospace`;
                        for (let i = 0; i < this.length; i++) {
                            const sym = this.symbols[i];
                            if (sym.y > -fontSize && sym.y < height) {
                                const opacity = 1 - (i / this.length);
                                ctx.fillStyle = i === 0 ? `rgba(200, 255, 200, ${opacity + 0.3})` : `rgba(0, 247, 0, ${opacity * 0.8})`;
                                ctx.fillText(sym.char, this.x + sym.xOffset, sym.y);
                            }
                        }
                    }
                }
                let streams = [];
                const setup = () => {
                    streams = [];
                    const cols = Math.floor(width / fontSize);
                    for (let i = 0; i < cols; i++) {
                        if (i * fontSize > width * 0.2) streams.push(new Stream(i * fontSize));
                    }
                };
                return {
                    setup, resize: setup,
                    draw: () => {
                        ctx.clearRect(0, 0, width, height);
                        for (const stream of streams) { stream.update(); stream.draw(); }
                    }
                };
            },
            particles: () => {
                let parts = [];
                const setup = () => {
                    parts = [];
                    for (let i = 0; i < 80; i++) parts.push({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8, ox: 0, oy: 0 });
                };
                return {
                    setup, resize: setup,
                    draw: () => {
                        ctx.clearRect(0, 0, width, height);
                        for (let i = 0; i < parts.length; i++) {
                            const p = parts[i];
                            p.x += p.vx; p.y += p.vy;
                            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
                            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

                            const dx = p.x - mouse.x, dy = p.y - mouse.y;
                            const distM = Math.hypot(dx, dy);
                            let targetX = 0, targetY = 0;

                            if (distM < 180) {
                                const f = (180 - distM) / 180;
                                targetX = -(dx) * f * 0.6;
                                targetY = -(dy) * f * 0.6;
                            }
                            p.ox += (targetX - p.ox) * 0.1;
                            p.oy += (targetY - p.oy) * 0.1;

                            if (p.x > width * 0.1) {
                                let r = 255, g = 255, b = 255, a = 0.5;
                                const currentDist = Math.hypot((p.x + p.ox) - mouse.x, (p.y + p.oy) - mouse.y);
                                if (currentDist < 120) {
                                    const intensity = 1 - (currentDist / 120);
                                    r = Math.floor(255 - (255 * intensity));
                                    b = Math.floor(255 - (255 * intensity));
                                    g = Math.floor(255 - (8 * intensity));
                                    a = 0.5 + intensity * 0.5;
                                }
                                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                                ctx.beginPath(); ctx.arc(p.x + p.ox, p.y + p.oy, 2, 0, Math.PI * 2); ctx.fill();
                            }

                            for (let j = i + 1; j < parts.length; j++) {
                                const p2 = parts[j];
                                const dist = Math.hypot((p.x + p.ox) - (p2.x + p2.ox), (p.y + p.oy) - (p2.y + p2.oy));
                                if (dist < 85 && (p.x > width * 0.1 || p2.x > width * 0.1)) {
                                    ctx.beginPath();
                                    ctx.moveTo(p.x + p.ox, p.y + p.oy); ctx.lineTo(p2.x + p2.ox, p2.y + p2.oy);

                                    let lineR = 255, lineG = 255, lineB = 255;
                                    const midX = (p.x + p.ox + p2.x + p2.ox) / 2;
                                    const midY = (p.y + p.oy + p2.y + p2.oy) / 2;
                                    const midDist = Math.hypot(midX - mouse.x, midY - mouse.y);

                                    if (midDist < 120) {
                                        const intensity = 1 - (midDist / 120);
                                        lineR = Math.floor(255 - (255 * intensity));
                                        lineB = Math.floor(255 - (255 * intensity));
                                        lineG = Math.floor(255 - (8 * intensity));
                                    }

                                    ctx.strokeStyle = `rgba(${lineR}, ${lineG}, ${lineB}, ${(1 - dist / 85) * 0.5})`;
                                    ctx.lineWidth = 1.5; ctx.stroke();
                                }
                            }
                        }
                    }
                };
            },
            circuit: () => {
                const gridSize = 20;
                let sparks = [];
                const setup = () => {
                    sparks = [];
                    for (let i = 0; i < 30; i++) {
                        sparks.push({
                            x: Math.floor((Math.random() * width * 0.8 + width * 0.2) / gridSize) * gridSize,
                            y: Math.floor(Math.random() * height / gridSize) * gridSize,
                            dir: Math.floor(Math.random() * 4),
                            trail: [],
                            length: Math.floor(Math.random() * 20 + 10),
                            speed: Math.random() * 2 + 1
                        });
                    }
                };
                return {
                    setup, resize: setup,
                    draw: () => {
                        ctx.clearRect(0, 0, width, height);
                        for (const s of sparks) {
                            s.trail.unshift({ x: s.x, y: s.y });
                            if (s.trail.length > s.length) s.trail.pop();

                            if (s.dir === 0) s.x += s.speed;
                            else if (s.dir === 1) s.y += s.speed;
                            else if (s.dir === 2) s.x -= s.speed;
                            else if (s.dir === 3) s.y -= s.speed;

                            if (Math.abs(s.x % gridSize) < Math.ceil(s.speed) && Math.abs(s.y % gridSize) < Math.ceil(s.speed)) {
                                s.x = Math.round(s.x / gridSize) * gridSize;
                                s.y = Math.round(s.y / gridSize) * gridSize;
                                if (Math.random() < 0.1) s.dir = (s.dir + (Math.random() > 0.5 ? 1 : -1) + 4) % 4;
                            }

                            if (s.x < width * 0.1) s.x = width; if (s.x > width) s.x = width * 0.1;
                            if (s.y < 0) s.y = height; if (s.y > height) s.y = 0;

                            const distM = Math.hypot(s.x - mouse.x, s.y - mouse.y);
                            const intensity = distM < 120 ? 1 : 0.4;

                            if (s.trail.length > 1) {
                                ctx.beginPath();
                                ctx.moveTo(s.trail[0].x, s.trail[0].y);
                                for (let i = 1; i < s.trail.length; i++) ctx.lineTo(s.trail[i].x, s.trail[i].y);
                                ctx.strokeStyle = `rgba(0, 247, 0, ${intensity})`;
                                ctx.lineWidth = 1.5; ctx.stroke();

                                ctx.fillStyle = distM < 120 ? '#00f700' : '#fff';
                                ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                    }
                };
            },
            logcat: () => {
                let logs = [
                    "D/AndroidRuntime: Shutting down VM",
                    "I/ActivityManager: START u0 {act=android.intent.action.MAIN}",
                    "E/ActivityThread: Failed to find provider info",
                    "I/OneDroid: Initializing core open-source modules...",
                    "W/SystemServer: Slow operation: 54ms",
                    "D/NetworkModule: Connecting to secure endpoints.",
                    "I/WiDroid: Database sync successful. Offline mode.",
                    "D/AudioFlinger: mixer(0xdfa0) thread",
                    "V/RenderThread: Frame rendered in 4.2ms",
                    "D/BluetoothManager: State changed to 12",
                    "I/PackageManager: Unpacking org.onedroid",
                    "E/SensorService: active connections count exceeds log limit",
                    "W/InputReader: Dropping focus due to rapid traversal",
                    "I/Keyguard: Unlock successful, initializing services",
                ];

                try {
                    const cached = sessionStorage.getItem('onedroid_repos');
                    if (cached) {
                        const repos = JSON.parse(cached);
                        logs = [...logs, ...buildRepoLogs(repos)];
                    } else {
                        fetch('https://api.github.com/users/onedroid/repos')
                            .then(res => res.json())
                            .then(repos => {
                                if (Array.isArray(repos)) {
                                    try { sessionStorage.setItem('onedroid_repos', JSON.stringify(repos)); } catch (e) { }
                                    logs = [...logs, ...buildRepoLogs(repos)];
                                }
                            }).catch(() => { });
                    }
                } catch (e) { }

                function buildRepoLogs(repos) {
                    const newLogs = [];
                    repos.forEach(repo => {
                        if (!repo.name) return;
                        newLogs.push(`I/Git(Repo): Loaded ${repo.name} [${repo.language || 'Code'}]`);
                        newLogs.push(`V/System(${repo.name}): Validating offline cache...`);
                        newLogs.push(`I/Build(${repo.name}): Starting gradle daemon...`);
                        newLogs.push(`I/OneDroid(${repo.name}): Syncing modular dependencies...`);
                        newLogs.push(`E/Lint(${repo.name}): 0 errors, 0 warnings found`);
                        if (repo.stargazers_count > 0) newLogs.push(`D/Git(Star): ${repo.name} has ${repo.stargazers_count} stars`);
                        if (repo.open_issues_count > 0) newLogs.push(`W/Git(Issue): ${repo.name} has ${repo.open_issues_count} open issues`);
                        if (repo.forks_count > 0) newLogs.push(`I/Git(Fork): ${repo.name} forked ${repo.forks_count} times`);
                        if (repo.pushed_at) {
                            const pushDate = new Date(repo.pushed_at).toISOString().split('T')[0];
                            newLogs.push(`V/Git(Push): ${repo.name} last push ${pushDate}`);
                        }
                        if (repo.description) {
                            newLogs.push(`D/Git(Desc): ${repo.description.substring(0, 45)}...`);
                        }
                    });
                    return newLogs;
                }

                let activeLogs = [];
                const setup = () => { activeLogs = []; };
                return {
                    setup, resize: setup,
                    draw: () => {
                        ctx.clearRect(0, 0, width, height);

                        if (Math.random() < 0.08 && activeLogs.length < 35) {
                            const newX = Math.random() * (width * 0.5) + width * 0.3;
                            const isOverlapping = activeLogs.some(log =>
                                log.y > height - 20 && Math.abs(log.x - newX) < 90
                            );

                            if (!isOverlapping) {
                                activeLogs.push({
                                    text: logs[Math.floor(Math.random() * logs.length)],
                                    x: newX,
                                    y: height + 20,
                                    speed: Math.random() * 0.8 + 0.4,
                                    alpha: Math.random() * 0.5 + 0.3,
                                    xOffset: 0
                                });
                            }
                        }

                        ctx.font = '12px "Roboto Mono", monospace';
                        ctx.textAlign = 'left';

                        const survivingLogs = [];
                        for (let i = 0; i < activeLogs.length; i++) {
                            const log = activeLogs[i];
                            const dx = (log.x + log.xOffset) - mouse.x, dy = log.y - mouse.y;
                            const distM = Math.hypot(dx, dy);

                            let targetXOffset = 0;
                            if (distM < 120) {
                                const f = (120 - distM) / 120;
                                const direction = dx === 0 ? 1 : dx / Math.abs(dx);
                                targetXOffset = direction * f * 40;
                            }
                            log.xOffset += (targetXOffset - log.xOffset) * 0.1;

                            log.y -= log.speed;

                            let fade = log.y < 150 ? log.y / 150 : 1;
                            let alpha = log.alpha * fade;

                            if (distM < 120) {
                                const f = (120 - distM) / 120;
                                alpha = Math.min(1.0, alpha + f * 0.6);
                            }

                            ctx.fillStyle = log.text.startsWith('E/') ? `rgba(255, 100, 100, ${alpha})`
                                : log.text.startsWith('W/') ? `rgba(255, 200, 50, ${alpha})`
                                    : `rgba(0, 247, 0, ${alpha})`;

                            ctx.fillText(log.text, log.x + log.xOffset, log.y);

                            if (log.y > -20) survivingLogs.push(log);
                        }
                        activeLogs = survivingLogs;
                    }
                };
            }
        };

        const currentEngine = animations[currentAnim]();
        currentEngine.setup();

        let isVisible = true;

        this._observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
        }, { threshold: 0 });
        this._observer.observe(this);

        const render = () => {
            if (isVisible) {
                currentEngine.draw();
            }
            this._animFrameId = requestAnimationFrame(render);
        };
        render();

        this._resizeHandler = debounce(() => {
            updateSize();
            if (currentEngine.resize) currentEngine.resize();
        }, 150);
        window.addEventListener('resize', this._resizeHandler);
    }
}

class ProjectCarousel extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        // Keep the static "coming soon" markup when there are no projects yet.
        if (!data || !data.home.projects || !data.home.projects.length) return;

        const MODEL_LABELS = { 'open-source': 'Open Source', 'ads': 'Free with Ads', 'iap': 'In-App Purchases', 'paid': 'Paid' };

        this.innerHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-nav">
                    <button class="arrow-btn" id="prevBtn" aria-label="Previous Project">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button class="arrow-btn" id="nextBtn" aria-label="Next Project">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
                <div class="projects-carousel" id="projectCarousel">
                    ${data.home.projects.map(p => `
                        <a href="${p.url}" class="widget-link">
                            <article class="widget">
                                <div>
                                    <div class="widget-header">
                                        <div class="app-icon">
                                            <img src="${rootPath}${p.icon}" alt="${p.title}">
                                        </div>
                                        <svg color="#444" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
                                    </div>
                                    ${Array.isArray(p.model) && p.model.length ? `
                                    <div class="model-badges">
                                        ${p.model.map(m => `<span class="model-badge model-${m}">${MODEL_LABELS[m] || m}</span>`).join('')}
                                    </div>` : ''}
                                    <h3>${p.title}</h3>
                                    <p>${p.status}</p>
                                </div>
                                <div class="feature-pills">
                                    ${p.tags.map(t => `<span class="pill">${t}</span>`).join('')}
                                </div>
                            </article>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        this.initCarousel();
    }

    disconnectedCallback() {
        if (this._autoScroll) {
            clearInterval(this._autoScroll);
            this._autoScroll = null;
        }
    }

    initCarousel() {
        const carousel = this.querySelector('#projectCarousel');
        const prevBtn = this.querySelector('#prevBtn');
        const nextBtn = this.querySelector('#nextBtn');
        if (!carousel || !prevBtn || !nextBtn) return;

        const getScrollAmount = () => carousel.querySelector('.widget-link').offsetWidth + 24;
        const scrollNext = () => {
            if (carousel.scrollLeft >= (carousel.scrollWidth - carousel.clientWidth - 1)) carousel.scrollTo({ left: 0, behavior: 'smooth' });
            else carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        };
        const scrollPrev = () => {
            if (carousel.scrollLeft <= 0) carousel.scrollTo({ left: carousel.scrollWidth, behavior: 'smooth' });
            else carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        };

        prevBtn.addEventListener('click', scrollPrev);
        nextBtn.addEventListener('click', scrollNext);
        this._autoScroll = setInterval(scrollNext, 4000);
        carousel.addEventListener('mouseenter', () => clearInterval(this._autoScroll));
        carousel.addEventListener('mouseleave', () => { this._autoScroll = setInterval(scrollNext, 4000); });
    }
}

class AboutContent extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data || !data.about || !data.about.sections) return;

        this.innerHTML = data.about.sections.map((section, idx) => `
            <div class="section-label">${section.title}</div>
            <div style="margin-bottom: 60px;">
                ${section.content.map((p, pIdx) => `
                    <p class="bio-text ${idx === data.about.sections.length - 1 && pIdx === section.content.length - 1 ? 'last' : ''}">${p}</p>
                `).join('')}
            </div>
        `).join('');
    }
}

class ApproachGrid extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        const items = data && data.home && data.home.approach;
        if (!items || !items.length) return;

        this.innerHTML = `
            <div class="approach-grid">
                ${items.map(item => `
                    <article class="approach-card">
                        <div class="approach-icon"><img src="${rootPath}${item.icon}" alt="" aria-hidden="true"></div>
                        <div class="approach-body">
                            <h3>${item.title}</h3>
                            <p>${item.text}</p>
                            ${item.tag ? `<span class="pill">${item.tag}</span>` : ''}
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }
}

class SiteFooter extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || getRootPath() || './';
        const data = await fetchContent(rootPath).catch(() => null);
        const brand = (data && data.brand) || {};
        const name = brand.name || 'OneDroid';
        const navLinks = (data && data.navigation) || [
            { label: 'Home', url: 'index.html' },
            { label: 'Apps', url: 'index.html#apps' },
            { label: 'About', url: 'pages/about.html' }
        ];
        const socials = getSocials(data);
        const playstoreUrl = brand.playstore_url || '';
        const githubUrl = getSocialUrl(data, 'github') || 'https://www.github.com/onedroid';

        this.innerHTML = `
        <footer class="full-width-footer">
            <div class="container">
                <div class="footer-main">
                    <div class="footer-brand">
                        <a href="${rootPath}index.html" class="footer-logo" aria-label="${name} home">
                            <img src="${rootPath}assets/icons/onedroid-icon.png" alt="">
                            <span>${name}</span>
                        </a>
                        <p class="footer-desc">An independent Android app studio building simple, secure, and genuinely useful apps.</p>
                        <ul class="footer-models" aria-label="How our apps are offered">
                            <li><span class="model-dot model-open-source" aria-hidden="true"></span>Open Source</li>
                            <li><span class="model-dot model-ads" aria-hidden="true"></span>Free with Ads</li>
                            <li><span class="model-dot model-iap" aria-hidden="true"></span>In-App Purchases</li>
                        </ul>
                    </div>
                    <nav class="footer-links" aria-label="Footer">
                        <div class="footer-col">
                            <h4>Explore</h4>
                            <ul>
                                ${navLinks.map(l => `<li><a href="${navHref(l.url, rootPath)}">${l.label}</a></li>`).join('')}
                            </ul>
                        </div>
                        <div class="footer-col">
                            <h4>Get the Apps</h4>
                            <ul>
                                <li>${playstoreUrl
                ? `<a href="${playstoreUrl}" target="_blank" rel="noopener">Google Play</a>`
                : `<span class="footer-soon">Google Play <em>Soon</em></span>`}</li>
                                <li><a href="${githubUrl}" target="_blank" rel="noopener">Open Source on GitHub</a></li>
                            </ul>
                        </div>
                        <div class="footer-col footer-col-social">
                            <h4>Follow</h4>
                            <ul class="footer-socials">
                                ${socials.map(s => `
                                <li><a href="${s.url}" target="_blank" rel="noopener">
                                    <span class="footer-social-icon">${socialIcon(s.id, rootPath)}</span>
                                    <span>${s.label}</span>
                                </a></li>`).join('')}
                            </ul>
                        </div>
                    </nav>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</p>
                    <button type="button" class="back-to-top">${ICON_UP} Back to top</button>
                </div>
            </div>
        </footer>
        `;

        const toTop = this.querySelector('.back-to-top');
        if (toTop) {
            toTop.addEventListener('click', () => {
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
            });
        }
    }
}

customElements.define('site-nav', SiteNav);
customElements.define('hero-section', HeroSection);
customElements.define('project-carousel', ProjectCarousel);
customElements.define('approach-grid', ApproachGrid);
customElements.define('about-content', AboutContent);
customElements.define('site-footer', SiteFooter);
