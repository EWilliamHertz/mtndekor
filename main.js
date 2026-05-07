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
const tabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Om det är en länk till en annan sida (som admin), hindra inte standardbeteendet
        if (!targetTab) return;

        e.preventDefault();
        
        // Ta bort aktiv status från alla flikar och sektioner
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active-tab'));
        
        // Aktivera vald flik och sektion
        tab.classList.add('active');
        const targetSection = document.getElementById(targetTab);
        if (targetSection) {
            targetSection.classList.add('active-tab');
        }

        // Stäng mobilmenyn
        if (hamburger) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
});

// --- Kundvagn (Cart) & Modal Logik ---
const modal = document.getElementById('swish-modal');
const closeBtn = document.querySelector('.close-btn');
const serviceNameDisplay = document.getElementById('selected-service-name');
const confirmBtn = document.getElementById('confirm-payment-btn');
const phoneInput = document.getElementById('customer-phone');
const successMsg = document.getElementById('payment-success-msg');

const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartBadge = document.getElementById('cart-badge');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = [];
let cartTotal = 0;

function toggleCart() {
    if (cartSidebar) cartSidebar.classList.toggle('open');
    if (cartOverlay) cartOverlay.classList.toggle('show');
}

if (openCartBtn) openCartBtn.addEventListener('click', toggleCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    cartTotal = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color:var(--text-muted);">Varukorgen är tom.</p>';
    } else {
        cart.forEach((item, index) => {
            cartTotal += parseInt(item.price);
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} kr</p>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${index})">Ta bort</button>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }

    if (cartTotalPrice) cartTotalPrice.textContent = cartTotal;
    if (cartBadge) cartBadge.textContent = cart.length;
}

window.addToCart = function(name, price) {
    cart.push({ name, price });
    updateCartUI();
    toggleCart(); 
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return alert("Varukorgen är tom!");
        serviceNameDisplay.textContent = cartTotal;
        toggleCart(); 
        modal.style.display = 'flex';
        successMsg.style.display = 'none';
        confirmBtn.style.display = 'block';
        phoneInput.value = '';
    });
}

if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (!phone) return alert("Vänligen ange ditt telefonnummer.");

        const itemNames = cart.map(item => item.name).join(", ");
        const orderSummary = `Varukorg: ${itemNames} (Totalt: ${cartTotal}kr)`;

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_name: orderSummary, customer_phone: phone })
            });

            if (response.ok) {
                confirmBtn.style.display = 'none';
                successMsg.style.display = 'block';
                cart = [];
                updateCartUI();
                setTimeout(() => { modal.style.display = 'none'; }, 3000);
            } else {
                alert("Något gick fel.");
            }
        } catch (error) {
            alert("Kunde inte ansluta till servern.");
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
            card.innerHTML = `
                <img src="${prod.image_url}" alt="${prod.name}" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
                <h3>${prod.name}</h3>
                <p style="font-size:1.4rem; color:var(--accent-primary); font-weight:bold; margin-bottom:1rem;">${prod.price} kr</p>
                <button class="btn buy-btn" onclick="addToCart('${prod.name}', ${prod.price})">Lägg i varukorg</button>
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
                <img src="${proj.main_image}" alt="${proj.title}" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
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

// Kör vid sidladdning
document.addEventListener('DOMContentLoaded', () => {
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