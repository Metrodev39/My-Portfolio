document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    /* ------------------------------------------------------------------
       Theme toggle
       The saved/system theme is applied by the inline script in <head>
       before first paint; this only keeps the button and meta in sync.
    ------------------------------------------------------------------ */
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');

    const syncThemeUI = () => {
        const isDark = html.classList.contains('dark');
        themeIcon.classList.toggle('fa-sun', isDark);
        themeIcon.classList.toggle('fa-moon', !isDark);
        themeToggle.setAttribute('aria-pressed', String(isDark));
        if (themeMeta) themeMeta.setAttribute('content', isDark ? '#000000' : '#0070f3');
    };

    let themeTimer;
    themeToggle.addEventListener('click', () => {
        // Fade every surface together (see .theme-transition in tailwind.css)
        html.classList.add('theme-transition');
        html.classList.toggle('dark');
        syncThemeUI();

        try {
            localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
        } catch (e) { /* storage unavailable (private mode) - theme still works for this visit */ }

        clearTimeout(themeTimer);
        themeTimer = setTimeout(() => html.classList.remove('theme-transition'), 350);
    });

    // Follow the OS theme live, but only until the visitor picks one themselves
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        let saved = null;
        try { saved = localStorage.getItem('theme'); } catch (err) { }
        if (saved) return;
        html.classList.toggle('dark', e.matches);
        syncThemeUI();
    });

    syncThemeUI();

    /* ------------------------------------------------------------------
       Mobile menu
    ------------------------------------------------------------------ */
    const menuToggle = document.getElementById('menuToggle');
    const closeMenuBtn = document.getElementById('closeMenu');
    const mobileMenu = document.getElementById('mobileMenu');

    if (menuToggle && closeMenuBtn && mobileMenu) {
        const setMenu = (open) => {
            mobileMenu.classList.toggle('translate-x-full', !open);
            document.body.classList.toggle('overflow-hidden', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            // `inert` keeps the off-screen links out of the tab order while closed
            mobileMenu.toggleAttribute('inert', !open);
            (open ? closeMenuBtn : menuToggle).focus({ preventScroll: true });
        };

        menuToggle.addEventListener('click', () => setMenu(true));
        closeMenuBtn.addEventListener('click', () => setMenu(false));
        mobileMenu.querySelectorAll('a').forEach((link) => {
            // Don't steal focus back to the toggle - the browser is about to scroll to the section
            link.addEventListener('click', () => {
                mobileMenu.classList.add('translate-x-full');
                document.body.classList.remove('overflow-hidden');
                menuToggle.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('inert', '');
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.hasAttribute('inert')) setMenu(false);
        });

        // If the window is widened past the mobile breakpoint, don't leave scrolling locked
        window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
            if (e.matches && !mobileMenu.hasAttribute('inert')) setMenu(false);
        });
    }

    /* ------------------------------------------------------------------
       Header shadow (passive listener, only touches the DOM when state changes)
    ------------------------------------------------------------------ */
    const header = document.querySelector('header');
    let scrolled = false;
    const onScroll = () => {
        const next = window.scrollY > 0;
        if (next !== scrolled) {
            scrolled = next;
            header.classList.toggle('shadow-md', next);
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ------------------------------------------------------------------
       Section reveal
       Smooth scrolling itself is handled by CSS (scroll-behavior +
       scroll-padding-top), so anchor links no longer need a JS handler.
    ------------------------------------------------------------------ */
    const revealTargets = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

        revealTargets.forEach((el) => revealObserver.observe(el));
    } else {
        revealTargets.forEach((el) => el.classList.add('is-visible'));
    }

    /* ------------------------------------------------------------------
       Contact form (sent to your inbox through Web3Forms)
    ------------------------------------------------------------------ */
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm) {
        const button = contactForm.querySelector('button[type="submit"]');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Sending...';
            formStatus.textContent = '';

            try {
                const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    contactForm.reset();
                    formStatus.textContent = "Message sent! I'll get back to you soon.";
                } else {
                    throw new Error(data.message || 'Request failed');
                }
            } catch (err) {
                formStatus.textContent = 'Something went wrong. Please email me directly at Metro.dev39@gmail.com.';
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        });
    }

    /* ------------------------------------------------------------------
       Hero terminal typing
    ------------------------------------------------------------------ */
    const terminalContent = document.querySelector('.terminal-content');
    const commandSpan = document.querySelector('.command-text');

    if (terminalContent && commandSpan) {
        const commandText = 'git clone https://github.com/Metrodev39';

        // Cursor is present from the start so the line doesn't change shape when typing ends
        const cursor = document.createElement('span');
        cursor.className = 'inline-block w-2 h-5 bg-gray-900 dark:bg-white ml-1 animate-blink align-middle';
        cursor.setAttribute('aria-hidden', 'true');
        commandSpan.after(cursor);

        if (reducedMotion.matches) {
            commandSpan.textContent = commandText;
        } else {
            let i = 0;
            const typeCommand = () => {
                if (i < commandText.length) {
                    commandSpan.textContent += commandText.charAt(i++);
                    setTimeout(typeCommand, 45);
                }
            };
            setTimeout(typeCommand, 400);
        }
    }
});
