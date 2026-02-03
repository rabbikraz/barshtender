// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Fade in animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initialize Datepicker
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        flatpickr(eventDateInput, {
            minDate: "today",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "F j, Y",
            disableMobile: "true"
        });
    }

    document.querySelectorAll('.feature-card, .drink-card, .menu-item, .wishlist-item, .pesach-item').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Add fade-in animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .fade-in-visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Form handling for quote page
// Form handling for quote page
const quoteForm = document.getElementById('quoteForm');
const serviceTypeSelect = document.getElementById('serviceType');
const eventTypeContainer = document.getElementById('eventTypeContainer');
const eventTypeSelect = document.getElementById('eventType');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

if (quoteForm && serviceTypeSelect) {
    // Handle service type change
    serviceTypeSelect.addEventListener('change', function () {
        if (this.value === 'bar-services') {
            eventTypeContainer.classList.remove('hidden');
            eventTypeSelect.required = true;
        } else {
            eventTypeContainer.classList.add('hidden');
            eventTypeSelect.required = false;
        }
    });

    // Handle form submission
    quoteForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending request...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        const formData = new FormData(quoteForm);
        // Convert FormData to plain object
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        // Send to Cloudflare Pages Function
        const scriptURL = '/api/submit';

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(async response => {
                const result = await response.json();
                if (response.ok) {
                    // Hide Form
                    quoteForm.style.display = 'none';

                    // Show Success Message
                    formStatus.innerHTML = `
                        <div class="success-message">
                            <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Request Received!</h3>
                            <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 500;">Thank you so much for your quote request.</p>
                            <p style="margin-bottom: 1rem;">We're looking forward to making this an unforgettable event.</p>
                            <p style="font-style: italic; color: #047857;">Get ready to experience the art of kosher mixology.</p>
                            <a href="index.html" class="btn btn-secondary" style="margin-top: 1.5rem; display: inline-block;">Return Home</a>
                        </div>
                    `;
                    formStatus.className = 'form-status success';
                    quoteForm.reset();
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                formStatus.textContent = 'Something went wrong. Please try again later or contact us directly.';
                formStatus.classList.add('error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Request';
            });
    });
}
