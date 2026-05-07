// --- Mobile Menu Logic ---
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links li a');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// --- Tab Navigation Logic ---
const tabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault(); // Stoppar sidan från att hoppa
        
        // Ta bort 'active' från alla flikar och innehåll
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active-tab'));
        
        // Lägg till 'active' på den klickade fliken och dess innehåll
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active-tab');

        // Stäng mobilmenyn automatiskt
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// --- Modal & Global Variables ---
const modal = document.getElementById('swish-modal');
const closeBtn = document.querySelector('.close-btn');
const serviceNameDisplay = document.getElementById('selected-service-name');
const confirmBtn = document.getElementById('confirm-payment-btn');
const phoneInput = document.getElementById('customer-phone');
const successMsg = document.getElementById('payment-success-msg');
let currentSelectedService = "";

// Stäng Modal Logik
if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Bekräfta Betalning (Skicka till databas)
if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.trim();
        if (!phone) return alert("Vänligen ange ditt telefonnummer så vi kan matcha betalningen.");

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service_name: currentSelectedService, customer_phone: phone })
            });

            if (response.ok) {
                confirmBtn.style.display = 'none';
                successMsg.style.display = 'block';
                setTimeout(() => { modal.style.display = 'none'; }, 3000);
            } else {
                alert("Något gick fel. Försök igen.");
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
                <button class="btn buy-btn" data-service="${prod.name}">Köp med Swish</button>
            `;
            shopGrid.appendChild(card);
        });

        // Koppla klick-funktioner till de nya knapparna
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentSelectedService = e.target.getAttribute('data-service');
                serviceNameDisplay.textContent = currentSelectedService;
                modal.style.display = 'flex';
                successMsg.style.display = 'none';
                confirmBtn.style.display = 'block';
                phoneInput.value = '';
            });
        });
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
            const card = document.createElement('div');
            card.className = 'service-card fade-in appear';
            card.style.cursor = 'pointer';
            // Gör hela kortet klickbart
            card.onclick = () => window.location.href = `/project.html?id=${proj.id}`;
            
            card.innerHTML = `
                <img src="${proj.main_image}" alt="${proj.title}" style="width:100%; height:250px; object-fit:cover; border-radius:8px; margin-bottom:1rem;">
                <h3 style="color:var(--accent-primary);">${proj.title}</h3>
                <p style="color:var(--text-muted); font-size:0.9rem;">${proj.description.substring(0, 100)}...</p>
                <p style="margin-top:1rem; font-weight:bold; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px;">Läs mer och se bilder →</p>
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
    
    // Scroll Animations
    const appearOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
        });
    }, appearOptions);

    const faders = document.querySelectorAll('.service-card, .gallery img, .section-title');
    faders.forEach(fader => {
        fader.classList.add('fade-in');
        appearOnScroll.observe(fader);
    });
});