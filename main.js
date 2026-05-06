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