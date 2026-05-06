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

// Apply base hidden class and observe each element
faders.forEach(fader => {
    fader.classList.add('fade-in');
    appearOnScroll.observe(fader);
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