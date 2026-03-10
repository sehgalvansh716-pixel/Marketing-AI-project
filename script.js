/* =========================================================================
   PREMIUM SCRIPT - V4 ULTRA THEME ENGINE
   (Three.js, Cursors, Page Transitions, Live Terminal, Draggable Gallery)
   ========================================================================= */

// --- 0. PAGE TRANSITION MASK ---
const initPageTransitions = () => {
    const mask = document.getElementById('page-mask');
    if (!mask) return;

    // Slide up when page loads (or fallback strictly after 1.5s if CDNs hang)
    let hasLoaded = false;
    const hideMask = () => {
        if (hasLoaded) return;
        hasLoaded = true;
        mask.classList.add('slide-up');
    };

    window.addEventListener('load', () => setTimeout(hideMask, 100));
    setTimeout(hideMask, 1500); // Failsafe

    // Intercept links
    document.querySelectorAll('a').forEach(anchor => {
        if(anchor.href && anchor.href.indexOf(window.location.host) !== -1 && !anchor.href.includes('#')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                mask.classList.remove('slide-up');
                setTimeout(() => window.location.assign(anchor.href), 750);
            });
        }
    });
};

// --- 1. CUSTOM CURSOR TRACKING ---
const initCustomCursor = () => {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Add active state to cursor when hovering clickable things
    document.querySelectorAll('a, button, .theme-toggle, .bento-item, .thumbnail, .faq-question, .draggable-gallery-container, .sim-link').forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('active');
            ring.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('active');
            ring.classList.remove('active');
        });
    });

    // Lerp animation loop for smooth trailing ring
    const renderCursor = () => {
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        
        // Linear interpolation (Lerp) for the ring to make it trail behind naturally
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

        requestAnimationFrame(renderCursor);
    };
    renderCursor();
};

// --- 2. THEME TOGGLE LOGIC ---
const initThemeToggle = () => {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('premium_theme', newTheme);
        
        showToast(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode`, true);
        
        // Notify Three.js to update colors if needed
        window.dispatchEvent(new Event('themeChanged'));
    });
};

// --- 3. THREE.JS WEBGL RENDERER (Replacing canvas particles) ---
const initThreeJSCanvas = () => {
    const container = document.getElementById('webgl-canvas-container');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create a massive floating particle network
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        // Spread particles out in a sphere shape
        posArray[i] = (Math.random() - 0.5) * 15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Dynamic material that changes with theme
    const getParticleColor = () => {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 0x2563eb : 0xa1a1aa;
    };

    const material = new THREE.PointsMaterial({
        size: 0.02,
        color: getParticleColor(),
        transparent: true,
        opacity: 0.4
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    camera.position.z = 5;

    // Mouse tracking for parallax
    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    // Listen for theme switch to change particle color
    window.addEventListener('themeChanged', () => {
        material.color.setHex(getParticleColor());
    });

    const animate = () => {
        requestAnimationFrame(animate);
        
        particlesMesh.rotation.y += 0.001;
        particlesMesh.rotation.x += 0.0005;

        // Smooth parallax based on mouse
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;

        renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// --- 4. TEXT DECODER / SCRAMBLER EFFECT ---
const initDecoderText = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    const decoders = document.querySelectorAll('.decoder-text');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let iteration = 0;
                let element = entry.target;
                const finalStr = element.dataset.value;
                if (!finalStr) return;

                clearInterval(element.dataset.interval);

                element.dataset.interval = setInterval(() => {
                    element.innerText = finalStr
                        .split("")
                        .map((letter, index) => {
                            if(index < iteration || letter === " ") {
                                return finalStr[index];
                            }
                            return letters[Math.floor(Math.random() * 26)];
                        })
                        .join("");
                    
                    if(iteration >= finalStr.length) {
                        clearInterval(element.dataset.interval);
                        element.style.fontFamily = 'inherit'; // Swap back off mono font if desired
                    }
                    
                    iteration += 1 / 2; // Speed of decipher
                }, 30);
                
                observer.unobserve(element); // Only run once
            }
        });
    }, { threshold: 0.2 });

    decoders.forEach(d => observer.observe(d));
};

// --- 5. PRODUCT GALLERY SYSTEM WITH VIDEO PLAYBACK ---
const initProductGallery = () => {
    const mainImg = document.getElementById('main-img');
    const mainVid = document.getElementById('main-vid');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (!thumbnails.length || !mainImg || !mainVid) return;

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            
            const type = thumb.dataset.type;
            const src = thumb.dataset.src;
            
            if (type === 'video') {
                mainImg.style.display = 'none';
                mainVid.style.display = 'block';
                mainVid.src = src;
                mainVid.play();
            } else {
                mainVid.pause();
                mainVid.style.display = 'none';
                mainImg.style.display = 'block';
                
                mainImg.style.opacity = '0.3';
                mainImg.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    mainImg.src = src;
                    mainImg.style.transform = 'scale(1)';
                    mainImg.style.opacity = '1';
                }, 200);
            }
        });
    });
};

// --- 6. LIVE TERMINAL SIMULATION (Stats Page) ---
const initLiveTerminalDemo = () => {
    const terminal = document.getElementById('live-terminal');
    if (!terminal) return;

    const messages = [
        '<span class="cmd-cyan">sys:</span> Scanning Node #A2...',
        '<span class="cmd-cyan">sys:</span> Scanning Node #B7...',
        '<span class="cmd-green">ok:</span> Valid hand-shake intercepted from [ID: Autonomous_722].',
        '<span class="cmd-yellow">warn:</span> Analyzing behavioral heat-map...',
        '<span class="cmd-green">ok:</span> User profile matches high-intent threshold.',
        '<span class="cmd-cyan">sys:</span> Pushing targeted ad payload...',
        '<span class="cmd-cyan">sys:</span> Redirecting node to secure checkout gateway.',
        '<span class="cmd-green">ok:</span> Conversion logged. Updating global ledger.'
    ];

    let currentMsgIndex = 0;

    setInterval(() => {
        if (currentMsgIndex >= messages.length) {
            currentMsgIndex = 0; // Loop simulation
        }

        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = messages[currentMsgIndex];
        terminal.appendChild(div);

        // Keep scroll at bottom
        terminal.scrollTop = terminal.scrollHeight;
        
        currentMsgIndex++;
    }, 1200); // New line every 1.2s
};

// --- HELPER CLASSES IMPORTED FROM V3 ---
const initScrollProgress = () => {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.width = ((winScroll / height) * 100) + "%";
    });
};

const initScrollAnimations = () => {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
    if (reveals.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
    reveals.forEach(r => observer.observe(r));
};

const initMagneticButtons = () => {
    document.querySelectorAll('.btn-primary, .theme-toggle').forEach(btn => {
        let currentX = 0, currentY = 0;
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - (rect.left - currentX) - rect.width/2;
            const y = e.clientY - (rect.top - currentY) - rect.height/2;
            currentX = x * 0.3; currentY = y * 0.3;
            btn.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            currentX = 0; currentY = 0;
            btn.style.transform = `translate(0px, 0px)`;
        });
    });
};

const init3DTiltCards = () => {
    document.querySelectorAll('.bento-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotateX = ((e.clientY - rect.top - rect.height/2) / (rect.height/2)) * -5;
            const rotateY = ((e.clientX - rect.left - rect.width/2) / (rect.width/2)) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    });
};

const initFAQ = () => {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const p = q.parentElement;
            document.querySelectorAll('.faq-item').forEach(i => { if(i !== p) i.classList.remove('active'); });
            p.classList.toggle('active');
        });
    });
};

const showToast = (message, isSuccess = true) => {
    let container = document.getElementById('toast-container') || document.body.appendChild(Object.assign(document.createElement('div'), {id: 'toast-container'}));
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = (isSuccess ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>` : `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`) + ` <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
};

// --- DATA TRACKING (Kept highly consistent from V3 requirements) ---
const startSessionMetrics = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const adSource = urlParams.get('ad'); 
    if (adSource === 'human' || adSource === 'autonomous') sessionStorage.setItem('current_ad_source', adSource);
    
    if (!localStorage.getItem('premium_ecommerce_stats')) {
        localStorage.setItem('premium_ecommerce_stats', JSON.stringify({ human: { totalVisits: 0, productViews: 0, buyClicks: 0 }, autonomous: { totalVisits: 0, productViews: 0, buyClicks: 0 } }));
    }

    const isStatsPage = window.location.pathname.includes('stats.html');
    if (!sessionStorage.getItem('premium_session_visited') && !isStatsPage) {
        let stats = JSON.parse(localStorage.getItem('premium_ecommerce_stats'));
        stats[sessionStorage.getItem('current_ad_source') || 'human'].totalVisits += 1;
        localStorage.setItem('premium_ecommerce_stats', JSON.stringify(stats));
        sessionStorage.setItem('premium_session_visited', 'true');
    }

    if (window.location.pathname.includes('product.html') && !sessionStorage.getItem('premium_product_viewed')) {
        let stats = JSON.parse(localStorage.getItem('premium_ecommerce_stats'));
        stats[sessionStorage.getItem('current_ad_source') || 'human'].productViews += 1;
        localStorage.setItem('premium_ecommerce_stats', JSON.stringify(stats));
        sessionStorage.setItem('premium_product_viewed', 'true');
    }
};

const initializeBuyTracking = () => {
    const buyButton = document.getElementById('buy-now-btn');
    if (buyButton) {
        buyButton.addEventListener('click', (e) => {
            e.preventDefault();
            let stats = JSON.parse(localStorage.getItem('premium_ecommerce_stats'));
            stats[sessionStorage.getItem('current_ad_source') || 'human'].buyClicks += 1;
            localStorage.setItem('premium_ecommerce_stats', JSON.stringify(stats));
            
            const originalText = buyButton.innerHTML;
            buyButton.innerHTML = '<span style="display:inline-block; animation: spinSlow 1s linear infinite;">⏳</span> Processing Secure Key...';
            buyButton.style.backgroundColor = 'var(--text-muted)';
            buyButton.style.pointerEvents = 'none';
            setTimeout(() => {
                buyButton.innerHTML = '✔ Bank Authorized';
                buyButton.style.backgroundColor = 'var(--accent-success)';
                showToast("Test Conversion Data Successfully Pushed to Data Lab", true);
                setTimeout(() => { buyButton.innerHTML = originalText; buyButton.style.backgroundColor = ''; buyButton.style.pointerEvents = 'auto'; }, 2000);
            }, 1200);
        });
    }
};

// --- V4 BOOTSTRAP MASTER EXECUTION ---
document.addEventListener('DOMContentLoaded', () => {
    initPageTransitions();
    initCustomCursor();
    initThemeToggle();
    initThreeJSCanvas();
    initDecoderText();
    initProductGallery(); // Reverted to logic
    initLiveTerminalDemo();
    
    initScrollProgress();
    initScrollAnimations();
    initMagneticButtons();
    init3DTiltCards();
    initFAQ();
    
    startSessionMetrics();
    initializeBuyTracking();
    
    // Navbar glass logic
    const navbar = document.querySelector('.navbar');
    if (navbar) window.addEventListener('scroll', () => window.scrollY > 80 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled'));

    console.log("%cCoolBreeze Pro Engine V4 Intialized (WebGL + Terminal + Draggable)", "color: #3b82f6; font-size: 20px; font-weight: bold; background: #141416; padding: 10px; border-radius: 8px;");
});
