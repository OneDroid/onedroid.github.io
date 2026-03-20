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
                    <div class="logo">
                        <img src="${rootPath}assets/icons/onedroid-icon.png" class="onedroid-icon" alt="OneDroid Icon">
                        <a href="${rootPath}index.html">@onedroid</a>
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
            this.initDataPattern();
        }
    }

    initDataPattern() {
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

        const chars = '01ANDROID<>{}[]/\\|'.split('');
        const fontSize = 16;
        
        class Stream {
            constructor(x) {
                this.x = x;
                this.reset();
            }
            reset() {
                this.y = -(Math.random() * 800 + 100);
                this.speed = Math.random() * 2 + 1.5;
                this.length = Math.floor(Math.random() * 15 + 8);
                this.symbols = [];
                for (let i = 0; i < this.length; i++) {
                    this.symbols.push({
                        char: chars[Math.floor(Math.random() * chars.length)],
                        y: 0,
                        xOffset: 0
                    });
                }
            }
            update(mouse) {
                this.y += this.speed;
                let headY = this.y;
                
                if (headY - this.length * fontSize > height + 50) {
                    this.reset();
                    this.y = -200;
                }

                for (let i = 0; i < this.length; i++) {
                    this.symbols[i].y = headY - i * fontSize;
                    if (Math.random() < 0.03) {
                        this.symbols[i].char = chars[Math.floor(Math.random() * chars.length)];
                    }
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
                    
                    // Smoothly interpolate (lerp) toward the target calculated offset
                    this.symbols[i].xOffset += (targetXOffset - this.symbols[i].xOffset) * 0.1;
                }
            }
            draw(ctx) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.font = `${fontSize}px "Roboto Mono", monospace`;

                for (let i = 0; i < this.length; i++) {
                    let sym = this.symbols[i];
                    if (sym.y > -fontSize && sym.y < height) {
                        let opacity = 1 - (i / this.length);
                        if (i === 0) {
                            ctx.fillStyle = `rgba(200, 255, 200, ${opacity + 0.3})`;
                        } else {
                            ctx.fillStyle = `rgba(0, 247, 0, ${opacity * 0.8})`;
                        }
                        ctx.fillText(sym.char, this.x + sym.xOffset, sym.y);
                    }
                }
            }
        }

        let streams = [];
        const initStreams = () => {
            streams = [];
            const cols = Math.floor(width / fontSize);
            for (let i = 0; i < cols; i++) {
                if (i * fontSize > width * 0.2) { 
                    streams.push(new Stream(i * fontSize));
                }
            }
        };
        initStreams();

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

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            for (let stream of streams) {
                stream.update(mouse);
                stream.draw(ctx);
            }
            
            requestAnimationFrame(draw);
        };
        draw();

        window.addEventListener('resize', () => {
            updateSize();
            initStreams();
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
