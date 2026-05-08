// ============================================================
// MOBILMENY
// ============================================================
const hamburger = document.querySelector('.hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active')) {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    }
});

// ============================================================
// FLIK-NAVIGERING (TABS)
// ============================================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active-tab');

    const selectedNavTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (selectedNavTab) selectedNavTab.classList.add('active');

    // Close mobile menu
    if (hamburger && navLinks) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }

    window.history.pushState(null, null, `#${tabId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-run animations for newly visible elements
    setTimeout(() => triggerVisibleAnimations(), 100);
}

// Expose globally so onclick attributes in HTML can call it
window.switchTab = switchTab;

function bindTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-tab');
            if (targetId) switchTab(targetId);
        });
    });
}

// Browser back/forward
window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) switchTab(hash);
});

// ============================================================
// KUNDVAGN & FRAKT
// ============================================================
const modal       = document.getElementById('swish-modal');
const closeBtn    = document.querySelector('.close-btn');
const openCartBtn  = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar  = document.getElementById('cart-sidebar');
const cartOverlay  = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const checkoutBtn  = document.getElementById('checkout-btn');

let cart = [];
let cartTotal = 0;
let cartWeight = 0;
let shippingRates = [];
let currentShippingCost = 0;

function toggleCart() {
    if (cartSidebar) cartSidebar.classList.toggle('open');
    if (cartOverlay)  cartOverlay.classList.toggle('show');
}

if (openCartBtn)  openCartBtn.addEventListener('click', toggleCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if (cartOverlay)  cartOverlay.addEventListener('click', toggleCart);

async function fetchShippingRates() {
    try {
        const res = await fetch('/api/shipping');
        if (res.ok) shippingRates = await res.json();
    } catch(err) { console.error(err); }
}

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    cartTotal  = 0;
    cartWeight = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color:var(--text-muted);">Varukorgen är tom.</p>';
        currentShippingCost = 0;
    } else {
        cart.forEach((item, index) => {
            cartTotal  += parseInt(item.price);
            cartWeight += parseInt(item.weight || 0);

            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} kr <span style="font-size:0.8rem;color:#888;">(${item.weight || 0}g)</span></p>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${index})">Ta bort</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        currentShippingCost = 0;
        if (shippingRates.length > 0) {
            const rate = shippingRates.find(r => cartWeight >= r.min_weight && cartWeight <= r.max_weight);
            currentShippingCost = rate ? rate.price : shippingRates[shippingRates.length - 1].price;
        }
    }

    if (document.getElementById('cart-subtotal'))   document.getElementById('cart-subtotal').textContent   = cartTotal;
    if (document.getElementById('cart-weight'))     document.getElementById('cart-weight').textContent     = cartWeight;
    if (document.getElementById('cart-shipping'))   document.getElementById('cart-shipping').textContent   = currentShippingCost;
    if (document.getElementById('cart-total-price'))document.getElementById('cart-total-price').textContent= cartTotal + currentShippingCost;
    if (document.getElementById('cart-badge'))      document.getElementById('cart-badge').textContent      = cart.length;
}

function flyToCart(buttonEl, imageUrl) {
    const cartIcon = document.getElementById('open-cart-btn');
    if (!cartIcon) return;
    const btnRect  = buttonEl.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    const flyingImg = document.createElement('img');
    flyingImg.src = imageUrl;
    flyingImg.className = 'flying-img';
    flyingImg.style.cssText = `width:60px;height:60px;left:${btnRect.left + btnRect.width/2 - 30}px;top:${btnRect.top + btnRect.height/2 - 30}px;`;
    document.body.appendChild(flyingImg);
    void flyingImg.offsetWidth;
    flyingImg.style.left    = `${cartRect.left + cartRect.width/2 - 10}px`;
    flyingImg.style.top     = `${cartRect.top  + cartRect.height/2 - 10}px`;
    flyingImg.style.width   = '20px';
    flyingImg.style.height  = '20px';
    flyingImg.style.opacity = '0.1';
    setTimeout(() => {
        flyingImg.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 300);
    }, 600);
}

window.addToCart = function(event, name, price, imageUrl, weight) {
    cart.push({ name, price, weight });
    updateCartUI();
    flyToCart(event.target, imageUrl);
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

// Stripe checkout
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) return alert('Varukorgen är tom!');
        checkoutBtn.textContent = 'Laddar säker kassa...';
        checkoutBtn.disabled    = true;
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: cart, shippingCost: currentShippingCost })
            });
            const data = await response.json();
            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert('Kunde inte starta betalningen: ' + (data.error || 'Okänt fel'));
                checkoutBtn.textContent = 'Gå till kassan (Stripe)';
                checkoutBtn.disabled    = false;
            }
        } catch(err) {
            alert('Kunde inte ansluta till servern.');
            checkoutBtn.textContent = 'Gå till kassan (Stripe)';
            checkoutBtn.disabled    = false;
        }
    });
}

// ============================================================
// HÄMTA PRODUKTER
// ============================================================
async function fetchProducts() {
    const shopGrid = document.getElementById('dynamic-shop-grid');
    if (!shopGrid) return;
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Gick inte att hämta produkter');
        const products = await res.json();
        shopGrid.innerHTML = '';
        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            const safeName = prod.name ? prod.name.replace(/'/g, "\\'") : '';
            card.innerHTML = `
                <img src="${prod.image_url}" alt="${prod.name}" loading="lazy" style="width:100%;height:250px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">
                <h3>${prod.name}</h3>
                <p style="font-size:1.4rem;color:var(--accent-primary);font-weight:bold;margin-bottom:1rem;">${prod.price} kr</p>
                <button class="btn buy-btn" onclick="addToCart(event,'${safeName}',${prod.price},'${prod.image_url}',${prod.weight||0})">Lägg i varukorg</button>
            `;
            shopGrid.appendChild(card);
        });
    } catch(err) { console.error('Kunde inte ladda produkter:', err); }
}

// ============================================================
// HÄMTA PROJEKT
// ============================================================
async function fetchProjects() {
    const projektGallery = document.getElementById('dynamic-project-gallery');
    const hemGallery     = document.getElementById('dynamic-project-gallery-home');

    try {
        const res      = await fetch('/api/projects');
        const projects = await res.json();

        function buildProjectCard(proj) {
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            card.style.cursor = 'pointer';
            card.onclick = () => window.location.href = `/project.html?id=${proj.id}`;
            card.innerHTML = `
                <img src="${proj.main_image}" alt="${proj.title}" loading="lazy" style="width:100%;height:250px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">
                <h3 style="color:var(--accent-primary);">${proj.title}</h3>
                <p style="color:var(--text-muted);font-size:0.9rem;">${proj.description ? proj.description.substring(0,80) + '...' : ''}</p>
                <p style="margin-top:1rem;font-weight:bold;font-size:0.8rem;text-transform:uppercase;">Läs mer &rarr;</p>
            `;
            return card;
        }

        // Full projects page
        if (projektGallery) {
            projektGallery.innerHTML = '';
            projects.forEach(proj => projektGallery.appendChild(buildProjectCard(proj)));
        }

        // Home preview (max 3)
        if (hemGallery) {
            hemGallery.innerHTML = '';
            projects.slice(0, 3).forEach(proj => hemGallery.appendChild(buildProjectCard(proj)));
        }
    } catch(err) { console.error('Kunde inte ladda projekt:', err); }
}

// ============================================================
// OMDÖMEN (TESTIMONIALS)
// ============================================================
async function fetchTestimonials() {
    const section = document.getElementById('testimonials-section');
    const grid    = document.getElementById('testimonials-grid');
    if (!section || !grid) return;
    try {
        const res = await fetch('/api/testimonials');
        if (!res.ok) return;
        const testimonials = await res.json();
        if (testimonials.length === 0) return; // Hide section if no testimonials
        grid.innerHTML = '';
        testimonials.forEach(t => {
            const stars = '★'.repeat(Math.min(5, Math.max(1, t.rating))) +
                          '☆'.repeat(5 - Math.min(5, Math.max(1, t.rating)));
            const card = document.createElement('div');
            card.className = 'testimonial-card fade-in appear';
            card.innerHTML = `
                <div class="testimonial-stars">${stars}</div>
                <p class="testimonial-text">"${t.text}"</p>
                <p class="testimonial-author">— ${t.author}</p>
            `;
            grid.appendChild(card);
        });
        section.style.display = 'block';
    } catch (err) { console.error('Kunde inte ladda omdömen:', err); }
}

// ============================================================
// HERO BILDSPEL
// ============================================================
async function fetchHeroSlides() {
    const container = document.getElementById('hero-slides-container');
    if (!container) return;
    try {
        const res = await fetch('/api/hero');
        if (!res.ok) return;
        const slides = await res.json();

        if (slides.length === 0) {
            container.innerHTML = `<div class="hero-slide active" style="background-color:#121212;"></div>`;
            return;
        }

        container.innerHTML = slides.map((slide, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}"
                 style="background-image:url('${slide.image_url}');background-size:cover;background-position:center;"></div>
        `).join('');

        if (slides.length > 1) {
            let currentIndex = 0;
            const slideEls = container.querySelectorAll('.hero-slide');
            setInterval(() => {
                slideEls[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % slideEls.length;
                slideEls[currentIndex].classList.add('active');
            }, 5000);
        }
    } catch(err) { console.error('Kunde inte ladda bildspel:', err); }
}

// ============================================================
// SCROLL ANIMATIONS (IntersectionObserver)
// ============================================================
function triggerVisibleAnimations() {
    const options = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            obs.unobserve(entry.target);
        });
    }, options);

    const targets = document.querySelectorAll(
        '.fade-in:not(.appear), .fade-in-section:not(.appear), .service-card:not(.appear), .testimonial-card:not(.appear)'
    );
    targets.forEach(el => observer.observe(el));
}

// ============================================================
// INITIERING
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Handle Stripe redirects
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        alert('Tack för din beställning! Betalningen är genomförd.');
        window.history.replaceState(null, '', window.location.pathname);
    }
    if (urlParams.get('canceled')) {
        alert('Betalningen avbröts. Din varukorg finns kvar om du vill försöka igen.');
        window.history.replaceState(null, '', window.location.pathname);
    }

    // Initialise tab from URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
        switchTab(hash);
    }

    bindTabs();
    fetchShippingRates();
    fetchHeroSlides();
    fetchProducts();
    fetchProjects();
    fetchTestimonials();

    // Run animations
    triggerVisibleAnimations();

    // Also add fade-in class to section titles dynamically
    document.querySelectorAll('.section-title').forEach(el => {
        if (!el.classList.contains('fade-in')) el.classList.add('fade-in');
    });
    triggerVisibleAnimations();
});
