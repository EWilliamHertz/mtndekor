// --- Mobile Menu Logic ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links li a');

// Toggle mobile menu open/close
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu automatically when a link is clicked
links.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// --- Scroll Animations (Intersection Observer) ---
// Select all elements we want to animate on scroll
const faders = document.querySelectorAll('.service-card, .gallery img, .section-title');

const appearOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        
        // Add the 'appear' class to trigger the CSS animation
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
    });
}, appearOptions);

// --- Hämta och visa Produkter ---
async function fetchProducts() {
    const shopGrid = document.getElementById('dynamic-shop-grid');
    if (!shopGrid) return;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        shopGrid.innerHTML = ''; 

        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            card.innerHTML = `
                <img src="${prod.image_url}" alt="${prod.name}" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
                <h3>${prod.name}</h3>
                <p style="font-size:1.4rem; color:var(--accent-primary); font-weight:bold; margin-bottom:1rem;">${prod.price} kr</p>
                <button class="btn buy-btn" data-service="${prod.name}">Köp med Swish</button>
            `;
            shopGrid.appendChild(card);
        });

        // Koppla Swish-knapparna
        setupSwishListeners();
    } catch (err) {
        console.error("Kunde inte ladda produkter:", err);
    }
}

// --- Hämta och visa Projekt (Före & Efter) ---
async function fetchProjects() {
    const projectGallery = document.getElementById('dynamic-project-gallery');
    if (!projectGallery) return;

    try {
        const res = await fetch('/api/projects');
        const projects = await res.json();
        projectGallery.innerHTML = '';

        projects.forEach(proj => {
            const container = document.createElement('div');
            container.className = 'project-item fade-in appear';
            container.style.marginBottom = '3rem';
            container.innerHTML = `
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <div style="text-align:center;">
                        <p style="color:var(--text-muted); font-size:0.8rem; margin-bottom:0.5rem;">FÖRE</p>
                        <img src="${proj.before_image_url}" style="width:100%; max-width:400px; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    </div>
                    <div style="text-align:center;">
                        <p style="color:var(--accent-primary); font-size:0.8rem; margin-bottom:0.5rem;">EFTER</p>
                        <img src="${proj.after_image_url}" style="width:100%; max-width:400px; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid var(--accent-primary);">
                    </div>
                </div>
            `;
            projectGallery.appendChild(container);
        });
    } catch (err) {
        console.error("Kunde inte ladda projekt:", err);
    }
}

// Koppla Swish-modalens funktioner
function setupSwishListeners() {
    const modal = document.getElementById('swish-modal');
    const serviceNameDisplay = document.getElementById('selected-service-name');
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-service');
            serviceNameDisplay.textContent = name;
            modal.style.display = 'flex';
        });
    });
}

// Kör vid sidladdning
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchProjects();
    
    // Behåll scroll-animeringarna
    const faders = document.querySelectorAll('.service-card, .gallery img, .section-title');
    faders.forEach(fader => {
        fader.classList.add('fade-in');
        // Intersection observer logik här...
    });
});

// --- Shop & Swish Modal Logic ---
const modal = document.getElementById('swish-modal');
const closeBtn = document.querySelector('.close-btn');
const buyButtons = document.querySelectorAll('.buy-btn');
const serviceNameDisplay = document.getElementById('selected-service-name');
const confirmBtn = document.getElementById('confirm-payment-btn');
const phoneInput = document.getElementById('customer-phone');
const successMsg = document.getElementById('payment-success-msg');

let currentSelectedService = "";

// Open modal when clicking a service
buyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSelectedService = e.target.getAttribute('data-service');
        serviceNameDisplay.textContent = currentSelectedService;
        modal.style.display = 'flex';
        successMsg.style.display = 'none';
        confirmBtn.style.display = 'block';
        phoneInput.value = '';
    });
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle "Jag har betalat" click
confirmBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    if (!phone) {
        alert("Vänligen ange ditt telefonnummer så vi kan matcha betalningen.");
        return;
    }

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                service_name: currentSelectedService,
                customer_phone: phone 
            })
        });

        if (response.ok) {
            confirmBtn.style.display = 'none';
            successMsg.style.display = 'block';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 3000);
        } else {
            alert("Något gick fel. Försök igen.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Kunde inte ansluta till servern.");
    }
});