class SiteNav extends HTMLElement {
    connectedCallback() {
        this.render();
        window.addEventListener('hashchange', () => this.render());
    }

    render() {
        const rootPath = this.hasAttribute('root') ? this.getAttribute('root') : './';
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;

        // Determine which link is active
        const isHome = currentPath.endsWith('/') || currentPath.endsWith('index.html');
        const isAbout = currentPath.includes('about.html');
        const isAppsActive = currentHash === '#apps';

        this.innerHTML = `
        <nav>
            <div class="logo">
                <img src="${rootPath}icons/onedroid-icon.png" class="onedroid-icon" alt="OneDroid Icon">
                <a href="${rootPath}index.html">@onedroid</a>
            </div>
            <div class="nav-links">
                <a href="${rootPath}index.html" class="${isHome && !isAppsActive ? 'green' : ''}">HOME</a>
                <a href="${rootPath}index.html#apps" class="${isAppsActive ? 'green' : ''}">APPS</a>
                <a href="${rootPath}pages/about.html" class="${isAbout ? 'green' : ''}">ABOUT</a>
            </div>
        </nav>
        `;
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <p class="copyright">OneDroid &copy; ${new Date().getFullYear()}</p>
        </footer>
        `;
    }
}

customElements.define('site-nav', SiteNav);
customElements.define('site-footer', SiteFooter);
