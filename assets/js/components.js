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

    const manualLight = document.documentElement.classList.contains('light-theme');
    const manualDark = document.documentElement.classList.contains('dark-theme');
    const osDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    const isDark = manualDark ? true : (manualLight ? false : osDark);

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
    new MutationObserver(syncFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

class SiteNav extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (data) {
            this.render(data.navigation, rootPath);
        }
        this._hashHandler = () => this.render(data.navigation, rootPath);
        window.addEventListener('hashchange', this._hashHandler);
    }

    disconnectedCallback() {
        if (this._hashHandler) {
            window.removeEventListener('hashchange', this._hashHandler);
            this._hashHandler = null;
        }
    }

    render(navLinks, rootPath) {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;

        const isHome = currentPath.endsWith('/') || currentPath.endsWith('index.html');
        const isAbout = currentPath.includes('about.html');
        const isAppsActive = currentHash === '#apps';

        this.innerHTML = `
        <header class="full-width-header">
            <div class="container">
                <nav>
                    <a href="${rootPath}index.html" class="logo-wrapper" aria-label="OneDroid home">
                        <img src="${rootPath}assets/icons/onedroid-icon.png" class="logo-icon" alt="OneDroid Icon">
                        <span class="logo-text">
                            <span class="logo-title">OneDroid</span>
                            <span class="tagline">Simple, Secure & Open</span>
                        </span>
                    </a>
                    <button class="hamburger" aria-label="Toggle menu" aria-expanded="false">
                        <span></span><span></span><span></span>
                    </button>
                    <div class="nav-links">
                        ${navLinks.map(link => {
            const isActive = (link.label === 'HOME' && isHome && !isAppsActive) ||
                (link.label === 'PRODUCT' && isAppsActive) ||
                (link.label === 'ABOUT' && isAbout);
            return `<a href="${rootPath}${link.url}" class="${isActive ? 'green' : ''}">${link.label}</a>`;
        }).join('')}
                    </div>
                </nav>
            </div>
        </header>
        `;

        const hamburger = this.querySelector('.hamburger');
        const navLinksEl = this.querySelector('.nav-links');
        if (hamburger && navLinksEl) {
            hamburger.addEventListener('click', () => {
                const expanded = hamburger.getAttribute('aria-expanded') === 'true';
                hamburger.setAttribute('aria-expanded', String(!expanded));
                hamburger.classList.toggle('active');
                navLinksEl.classList.toggle('open');
            });
            navLinksEl.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.setAttribute('aria-expanded', 'false');
                    hamburger.classList.remove('active');
                    navLinksEl.classList.remove('open');
                });
            });
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
        else if (page === 'about') heroData = { title: data.about.title, subtitle: data.about.description, links: data.about.links };

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
                ${heroData.icon ? `<img src="${rootPath}${heroData.icon}" alt="App Icon" class="app-icon">` : ''}
                <h1 ${page === 'about' ? 'style="text-transform: none;"' : ''}>${heroData.title}</h1>
                <p>${heroData.subtitle}</p>
                <div class="btn-group">
                    ${page === 'home' ? `
                        <a href="${heroData.github_url}" class="btn btn-outline">
                            <img src="${rootPath}assets/icons/github.svg" alt="GitHub"> GitHub
                        </a>
                        <a class="btn btn-outline disabled" aria-disabled="true">
                            <img src="${rootPath}assets/icons/smartphone.svg" alt="Playstore"> Playstore (Coming Soon)
                        </a>
                    ` : ''}
                    ${page === 'about' ? heroData.links.map(l => `
                        <a href="${l.url}" target="_blank" class="btn btn-outline">
                            <img src="${rootPath}${l.icon}" alt="${l.label}"> ${l.label}
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
        if (!data || !data.home.projects || !data.home.projects.length) return;

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

class SiteFooter extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || getRootPath() || './';
        const data = await fetchContent(rootPath).catch(() => null);
        const githubUrl = (data && data.home && data.home.hero && data.home.hero.github_url) || 'https://www.github.com/onedroid';
        const linkedinUrl = (data && data.about && data.about.links)
            ? (data.about.links.find(l => /linkedin/i.test(l.label)) || {}).url || 'https://www.linkedin.com/company/onedroid'
            : 'https://www.linkedin.com/company/onedroid';

        this.innerHTML = `
        <footer class="full-width-footer">
            <div class="container">
                <div class="footer-main">
                    <div class="footer-brand">
                        <a href="${rootPath}index.html" class="footer-logo" aria-label="OneDroid home">
                            <img src="${rootPath}assets/icons/onedroid-icon.png" alt="OneDroid logo">
                            <span>OneDroid</span>
                        </a>
                        <p class="footer-desc">Simple, Secure &amp; Open. Open-source Android apps built with integrity. No ads, no tracking, free forever.</p>
                        <div class="footer-socials">
                            <a href="${githubUrl}" target="_blank" rel="noopener" aria-label="GitHub">
                                <img src="${rootPath}assets/icons/github.svg" alt="GitHub">
                            </a>
                            <a href="${linkedinUrl}" target="_blank" rel="noopener" aria-label="LinkedIn">
                                <img src="${rootPath}assets/icons/linkedin-icon.svg" alt="LinkedIn">
                            </a>
                            <a href="https://www.youtube.com/@one-droid" target="_blank" rel="noopener" aria-label="YouTube">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                            </a>
                        </div>
                    </div>
                    <nav class="footer-links" aria-label="Footer">
                        <div class="footer-col">
                            <h4>Explore</h4>
                            <a href="${rootPath}index.html">Home</a>
                            <a href="${rootPath}index.html#apps">Product</a>
                            <a href="${rootPath}pages/about.html">About</a>
                        </div>
                        <div class="footer-col">
                            <h4>Resources</h4>
                            <a href="${githubUrl}" target="_blank" rel="noopener">GitHub</a>
                            <a href="${linkedinUrl}" target="_blank" rel="noopener">LinkedIn</a>
                            <a href="https://www.youtube.com/@one-droid" target="_blank" rel="noopener">YouTube</a>
                        </div>
                    </nav>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} One Droid. All rights reserved.</p>
                    <p>One Droid &ndash; Mobile App Development Studio</p>
                </div>
            </div>
        </footer>
        `;
    }
}

customElements.define('site-nav', SiteNav);
customElements.define('hero-section', HeroSection);
customElements.define('project-carousel', ProjectCarousel);
customElements.define('about-content', AboutContent);
customElements.define('site-footer', SiteFooter);
