// --- Mobilmeny Logik ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// --- Flik-navigering (Tabs) Logik ---
function bindTabs() {
    const tabs = document.querySelectorAll('.nav-tab');

    tabs.forEach(tab => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);

        newTab.addEventListener('click', (e) => {
            const targetId = newTab.getAttribute('data-tab');
            if (!targetId) return;

            e.preventDefault();
            
            // Uppdaterar URL:en så att direktlänkar (t.ex. /#butik) fungerar
            history.pushState(null, null, `#${targetId}`);
            
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
            
            newTab.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active-tab');

            const hamburger = document.querySelector('.hamburger');
            const navLinks = document.querySelector('.nav-links');
            if (hamburger) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
}

// Kollar om adressen innehåller t.ex. #butik och öppnar fliken
function checkHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const targetTab = document.querySelector(`.nav-tab[data-tab="${hash}"]`);
        if (targetTab) {
            targetTab.click();
        }
    }
}

// Lyssna på webbläsarens "Bakåt/Framåt"-knappar
window.addEventListener('popstate', checkHashRoute);
// --- Kundvagn & Frakt Logik ---
const modal = document.getElementById('swish-modal');
const closeBtn = document.querySelector('.close-btn');

const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = [];
let cartTotal = 0;
let cartWeight = 0;
let shippingRates = [];
let currentShippingCost = 0;

function toggleCart() {
    if (cartSidebar) cartSidebar.classList.toggle('open');
    if (cartOverlay) cartOverlay.classList.toggle('show');
}

if (openCartBtn) openCartBtn.addEventListener('click', toggleCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

async function fetchShippingRates() {
    try {
        const res = await fetch('/api/shipping');
        if (res.ok) shippingRates = await res.json();
    } catch(err) { console.error(err); }
}

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    cartTotal = 0;
    cartWeight = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color:var(--text-muted);">Varukorgen är tom.</p>';
        currentShippingCost = 0;
    } else {
        cart.forEach((item, index) => {
            cartTotal += parseInt(item.price);
            cartWeight += parseInt(item.weight || 0);
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} kr <span style="font-size:0.8rem; color:#888;">(${item.weight || 0}g)</span></p>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${index})">Ta bort</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        // Räkna ut frakt baserat på totalvikt
        currentShippingCost = 0;
        if (shippingRates.length > 0) {
            const applicableRate = shippingRates.find(r => cartWeight >= r.min_weight && cartWeight <= r.max_weight);
            if (applicableRate) {
                currentShippingCost = applicableRate.price;
            } else {
                // Om vikten är över max, ta den dyraste frakten
                currentShippingCost = shippingRates[shippingRates.length - 1].price;
            }
        }
    }

    if (document.getElementById('cart-subtotal')) document.getElementById('cart-subtotal').textContent = cartTotal;
    if (document.getElementById('cart-weight')) document.getElementById('cart-weight').textContent = cartWeight;
    if (document.getElementById('cart-shipping')) document.getElementById('cart-shipping').textContent = currentShippingCost;
    if (document.getElementById('cart-total-price')) document.getElementById('cart-total-price').textContent = cartTotal + currentShippingCost;
    if (document.getElementById('cart-badge')) document.getElementById('cart-badge').textContent = cart.length;
}

function flyToCart(buttonEl, imageUrl) {
    const cartIcon = document.getElementById('open-cart-btn');
    if (!cartIcon) return;

    const btnRect = buttonEl.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const flyingImg = document.createElement('img');
    flyingImg.src = imageUrl;
    flyingImg.className = 'flying-img';
    
    flyingImg.style.width = '60px';
    flyingImg.style.height = '60px';
    flyingImg.style.left = `${btnRect.left + btnRect.width / 2 - 30}px`;
    flyingImg.style.top = `${btnRect.top + btnRect.height / 2 - 30}px`;
    
    document.body.appendChild(flyingImg);

    void flyingImg.offsetWidth;

    flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 10}px`;
    flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 10}px`;
    flyingImg.style.width = '20px';
    flyingImg.style.height = '20px';
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

// --- Starta Stripe Checkout ---
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        if (cart.length === 0) return alert("Varukorgen är tom!");

        checkoutBtn.textContent = 'Laddar säker kassa...';
        checkoutBtn.disabled = true;

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
                alert("Kunde inte starta betalningen: " + (data.error || "Okänt fel"));
                checkoutBtn.textContent = 'Gå till kassan (Stripe)';
                checkoutBtn.disabled = false;
            }
        } catch (error) {
            alert("Kunde inte ansluta till servern.");
            checkoutBtn.textContent = 'Gå till kassan (Stripe)';
            checkoutBtn.disabled = false;
        }
    });
}

// --- Hämta och visa Produkter ---
async function fetchProducts() {
    const shopGrid = document.getElementById('dynamic-shop-grid');
    if (!shopGrid) return;

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error("Gick inte att hämta produkter");
        
        const products = await res.json();
        shopGrid.innerHTML = ''; 

        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            const safeName = prod.name ? prod.name.replace(/'/g, "\\'") : '';
            // Vi skickar nu med vikten i addToCart!
            card.innerHTML = `
                <img src="${prod.image_url}" alt="${prod.name}" loading="lazy" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
                <h3>${prod.name}</h3>
                <p style="font-size:1.4rem; color:var(--accent-primary); font-weight:bold; margin-bottom:1rem;">${prod.price} kr</p>
                <button class="btn buy-btn" onclick="addToCart(event, '${safeName}', ${prod.price}, '${prod.image_url}', ${prod.weight || 0})">Lägg i varukorg</button>
            `;
            shopGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Kunde inte ladda produkter:", err);
    }
}

// --- Hämta och visa Projekt ---
async function fetchProjects() {
    const projectGallery = document.getElementById('dynamic-project-gallery');
    if (!projectGallery) return;

    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        projectGallery.innerHTML = '';

        projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            card.style.cursor = 'pointer';
            card.onclick = () => window.location.href = `/project.html?id=${proj.id}`;
            
            card.innerHTML = `
                <img src="${proj.main_image}" alt="${proj.title}" loading="lazy" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
                <h3 style="color:var(--accent-primary);">${proj.title}</h3>
                <p style="color:var(--text-muted); font-size:0.9rem;">${proj.description ? proj.description.substring(0, 80) + '...' : ''}</p>
                <p style="margin-top:1rem; font-weight:bold; font-size:0.8rem; text-transform:uppercase;">Läs mer →</p>
            `;
            projectGallery.appendChild(card);
        });
    } catch (err) {
        console.error("Kunde inte ladda projekt:", err);
    }
}

// --- Hämta Bildspel ---
async function fetchHeroSlides() {
    const container = document.getElementById('hero-slides-container');
    if (!container) return;

    try {
        const res = await fetch('/api/hero');
        if (!res.ok) return;
        const slides = await res.json();

        if (slides.length === 0) {
            container.innerHTML = `<div class="hero-slide active" style="background-color: #121212;"></div>`;
            return;
        }

        container.innerHTML = slides.map((slide, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image_url}');"></div>
        `).join('');

        if (slides.length > 1) {
            let currentIndex = 0;
            const slideElements = container.querySelectorAll('.hero-slide');
            setInterval(() => {
                slideElements[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % slideElements.length;
                slideElements[currentIndex].classList.add('active');
            }, 5000); 
        }
    } catch (err) {
        console.error("Kunde inte ladda bildspel:", err);
    }
}

// --- Hämta Egna Sidor (CMS) ---
async function fetchCustomPages() {
    const container = document.getElementById('dynamic-pages-container');
    const navLinksList = document.querySelector('.nav-links');
    if (!container || !navLinksList) return;




    try {
        const res = await fetch('/api/pages');
        if (res.ok) {
            const pages = await res.json();
            pages.forEach(page => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${page.slug}" class="nav-tab" data-tab="${page.slug}">${page.title}</a>`;
                navLinksList.appendChild(li);




                const section = document.createElement('section');
                section.id = page.slug;
                section.className = 'tab-content';
                section.innerHTML = `
                    <h2 class="section-title">${page.title}</h2>
                    <div class="custom-content" style="max-width:900px; margin:0 auto; padding: 0 1rem; line-height:1.7;">
                        ${page.content}
                    </div>
                `;
                container.appendChild(section);
            });
        }
    } catch (err) { 
        console.error("Kunde inte ladda egna sidor:", err); 
    } finally {
        bindTabs(); // Binder alla länk-knappar
        checkHashRoute(); // Tvingar fram rätt flik om man anländer via direktlänk!
    }
}

// Kör vid sidladdning
document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        alert("Tack för din beställning! Betalningen är genomförd.");
        window.history.replaceState(null, '', window.location.pathname);
    }
    if (urlParams.get('canceled')) {
        alert("Betalningen avbröts. Din varukorg finns kvar om du vill försöka igen.");
        window.history.replaceState(null, '', window.location.pathname);
    }

    bindTabs(); 
    fetchShippingRates(); // Hämtar fraktkostnaderna direkt
    fetchHeroSlides();
    fetchCustomPages();
    fetchProducts();
    fetchProjects();
    
    const appearOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
        });
    }, appearOptions);

    const faders = document.querySelectorAll('.service-card, .section-title');
    faders.forEach(fader => {
        fader.classList.add('fade-in');
        appearOnScroll.observe(fader);
    });
});

// --- Kontaktformulär Logik ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const fornamn = document.getElementById('fornamn').value;
        const efternamn = document.getElementById('efternamn').value;
        const epost = document.getElementById('epost').value;
        const meddelande = document.getElementById('meddelande').value;
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        submitBtn.textContent = 'Skickar...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fornamn, efternamn, epost, meddelande })
            });

            if (res.ok) {
                alert('Tack! Ditt meddelande har skickats till oss.');
                contactForm.reset(); 
            } else {
                alert('Något gick fel när meddelandet skulle skickas. Försök igen.');
            }
        } catch (err) {
            alert('Kunde inte ansluta till servern.');
        } finally {
            submitBtn.textContent = 'Skicka Meddelande';
            submitBtn.disabled = false;
        }
    });
}