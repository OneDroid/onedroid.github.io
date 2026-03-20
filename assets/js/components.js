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

class SiteNav extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (data) {
            this.render(data.navigation, rootPath);
        }
        window.addEventListener('hashchange', () => this.render(data.navigation, rootPath));
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
                    <div class="logo-wrapper">
                        <img src="${rootPath}assets/icons/onedroid-icon.png" class="logo-icon" alt="OneDroid Icon">
                        <div class="logo-text">
                            <div class="logo-title">
                                <a href="${rootPath}index.html">OneDroid</a>
                            </div>
                            <span class="tagline">Simple, Secure & Open</span>
                        </div>
                    </div>
                    <div class="nav-links">
                        ${navLinks.map(link => {
            const isActive = (link.label === 'HOME' && isHome && !isAppsActive) ||
                (link.label === 'APPS' && isAppsActive) ||
                (link.label === 'ABOUT' && isAbout);
            return `<a href="${rootPath}${link.url}" class="${isActive ? 'green' : ''}">${link.label}</a>`;
        }).join('')}
                    </div>
                </nav>
            </div>
        </header>
        `;
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
        else if (page === 'jotter') heroData = { title: data.apps.jotter.title, subtitle: data.apps.jotter.tagline, icon: data.apps.jotter.icon };

        if (!heroData) return;

        this.className = 'hero';
        this.style.position = 'relative';
        this.style.display = 'block';

        this.innerHTML = `
            <div class="hero-canvas-container" style="position: absolute; top: -50px; left: 0; height: calc(100% + 50px); z-index: -1; pointer-events: none; opacity: 0.8; mask-image: linear-gradient(to bottom, transparent, black 15%, black 80%, transparent); -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 80%, transparent);">
                <canvas id="data-pattern-canvas" style="width: 100%; height: 100%; display: block; mask-image: linear-gradient(to right, transparent 20%, black 50%, black 100%); -webkit-mask-image: linear-gradient(to right, transparent 20%, black 50%, black 100%);"></canvas>
            </div>
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

        if (page === 'home') {
            this.initDataPattern(heroData.animation || 'matrix', heroData.animation_randomize, heroData.github_url);
        }
    }

    initDataPattern(configAnim, randomize, githubUrl) {
        const canvas = this.querySelector('#data-pattern-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const canvasContainer = this.querySelector('.hero-canvas-container');

        let width = 0;
        let height = 0;

        const updateSize = () => {
            let container = this.closest('.container');
            if (container && canvasContainer) {
                const parentStyles = window.getComputedStyle(container);
                const pl = parseFloat(parentStyles.paddingLeft);
                const pr = parseFloat(parentStyles.paddingRight);
                canvasContainer.style.width = (container.offsetWidth - pl - pr) + 'px';
            }
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        updateSize();

        const animTypes = ['matrix', 'particles', 'circuit', 'logcat'];
        let currentAnim = animTypes.includes(configAnim) ? configAnim : 'matrix';
        if (randomize) {
            currentAnim = animTypes[Math.floor(Math.random() * animTypes.length)];
        }

        let mouse = { x: -1000, y: -1000 };
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        window.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

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
                        let headY = this.y;
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
                            let sym = this.symbols[i];
                            if (sym.y > -fontSize && sym.y < height) {
                                let opacity = 1 - (i / this.length);
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
                        for (let stream of streams) { stream.update(); stream.draw(); }
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
                            let p = parts[i];
                            p.x += p.vx; p.y += p.vy;
                            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
                            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

                            const dx = p.x - mouse.x, dy = p.y - mouse.y;
                            const distM = Math.hypot(dx, dy);
                            let targetX = 0, targetY = 0;

                            // Gravitate towards the cursor
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
                                let p2 = parts[j];
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
                        for (let s of sparks) {
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
                    let org = "onedroid";
                    fetch(`https://api.github.com/users/${org}/repos`)
                        .then(res => res.json())
                        .then(repos => {
                            if (Array.isArray(repos)) {
                                let newLogs = [];
                                repos.forEach(repo => {
                                    if (repo.name) {
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
                                    }
                                });
                                // Mix the generated ones with the original Android variants
                                if (newLogs.length > 0) logs = [...logs, ...newLogs];
                            }
                        }).catch(() => { });
                } catch (e) { }

                let activeLogs = [];
                const setup = () => { activeLogs = []; };
                return {
                    setup, resize: setup,
                    draw: () => {
                        ctx.clearRect(0, 0, width, height);

                        // Increased density limits while retaining the anti-overlap physics!
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

                        let survivingLogs = [];
                        for (let i = 0; i < activeLogs.length; i++) {
                            let log = activeLogs[i];
                            const dx = (log.x + log.xOffset) - mouse.x, dy = log.y - mouse.y;
                            const distM = Math.hypot(dx, dy);

                            // Smooth repulsion logic (lerp)
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

        let animFrameId;
        const render = () => {
            currentEngine.draw();
            animFrameId = requestAnimationFrame(render);
        };
        render();

        window.addEventListener('resize', () => {
            updateSize();
            if (currentEngine.resize) currentEngine.resize();
        });
    }
}

class ProjectCarousel extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data || !data.home.projects) return;

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
        let autoScroll = setInterval(scrollNext, 4000);
        carousel.addEventListener('mouseenter', () => clearInterval(autoScroll));
        carousel.addEventListener('mouseleave', () => autoScroll = setInterval(scrollNext, 4000));
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

class JotterSpecs extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data || !data.apps.jotter.specs) return;
        const specs = data.apps.jotter.specs;

        this.innerHTML = `
            <div class="section-label" id="features">(01) FEATURES</div>
            <div class="info-grid jotter-specs">
                <div class="glass-panel">
                    <p class="bio-text">${specs.bio}</p>
                    <p class="bio-sub">${specs.bio_sub}</p>
                </div>
                <div class="glass-panel" style="padding: 30px">
                    <div class="stack-list">
                        <div class="stack-item"><span>Download</span><span>Source</span></div>
                        ${specs.download_links.map(l => `
                            <div class="stack-item"><span>${l.label}</span><span><a href="${l.url}" target="_blank">${l.value}</a></span></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

class ScreenshotCarousel extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data || !data.apps.jotter.screenshots) return;

        this.innerHTML = `
            <div class="section-label" id="screenshots">(02) SCREENSHOTS</div>
            <section class="screenshots-section">
                <div class="screenshot-carousel-wrapper">
                    <div class="screenshot-nav">
                        <button class="nav-btn" id="shotPrev" aria-label="Previous">
                            <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <button class="nav-btn" id="shotNext" aria-label="Next">
                            <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                    <div class="screenshot-carousel" id="shotCarousel">
                        ${data.apps.jotter.screenshots.map(s => `
                            <div class="screenshot-item">
                                <img src="${s.src}" alt="${s.alt}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
        this.initLightbox();
        this.initCarousel();
    }

    initCarousel() {
        const carousel = this.querySelector('#shotCarousel');
        const prevBtn = this.querySelector('#shotPrev');
        const nextBtn = this.querySelector('#shotNext');
        if (!carousel || !prevBtn || !nextBtn) return;
        const scrollAmount = 300;
        prevBtn.onclick = () => carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        nextBtn.onclick = () => carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        if (!lightbox || !lightboxImg) return;
        this.querySelectorAll('.screenshot-item img').forEach(img => {
            img.onclick = () => {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            };
        });
        lightbox.onclick = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        };
    }
}

class FeatureGrid extends HTMLElement {
    async connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        const data = await fetchContent(rootPath);
        if (!data || !data.apps.jotter.features) return;

        this.innerHTML = `
            <div class="section-label" id="specs">(03) More Relevent</div>
            <div class="bento-grid">
                ${data.apps.jotter.features.map(f => `
                    <article class="widget">
                        <div>
                            <div class="widget-header">
                                <div class="app-icon">
                                    <img src="${rootPath}${f.icon}" alt="${f.title} Icon">
                                </div>
                            </div>
                            <h3>${f.title}</h3>
                            <p>${f.description}</p>
                        </div>
                        <div class="feature-pills">
                            ${f.tags.map(t => `<span class="pill">${t}</span>`).join('')}
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        const rootPath = this.getAttribute('root') || './';
        this.innerHTML = `
        <footer class="full-width-footer">
            <div class="container">
                <footer>
                    <p class="copyright">OneDroid &copy; ${new Date().getFullYear()} 
                       <a href="${rootPath}pages/admin.html" style="opacity: 0.1; margin-left: 10px;">.</a>
                    </p>
                </footer>
            </div>
        </footer>
        `;
    }
}

// Register Components
customElements.define('site-nav', SiteNav);
customElements.define('hero-section', HeroSection);
customElements.define('project-carousel', ProjectCarousel);
customElements.define('about-content', AboutContent);
customElements.define('jotter-specs', JotterSpecs);
customElements.define('screenshot-carousel', ScreenshotCarousel);
customElements.define('feature-grid', FeatureGrid);
customElements.define('site-footer', SiteFooter);
