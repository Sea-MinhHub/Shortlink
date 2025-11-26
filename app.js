<!-- ================================ -->
<!-- FILE 5: app.js -->
<!-- Logic chính của ứng dụng -->
<!-- ================================ -->
<script>
// ============================================
// MAIN APPLICATION LOGIC
// ============================================

// Captcha system
let currentCaptcha = null;

function generateCaptcha() {
    const captchas = [
        { question: "What is 5 + 3?", answer: "8" },
        { question: "What is 10 - 4?", answer: "6" },
        { question: "What is 2 × 4?", answer: "8" },
        { question: "What is 9 + 2?", answer: "11" },
        { question: "What is 15 - 7?", answer: "8" },
        { question: "How many letters in 'LINK'?", answer: "4" },
        { question: "What color is the sky? (blue/red)", answer: "blue" },
        { question: "What is 3 + 7?", answer: "10" }
    ];
    
    currentCaptcha = captchas[Math.floor(Math.random() * captchas.length)];
    document.getElementById('captchaQuestion').textContent = currentCaptcha.question;
    document.getElementById('captchaAnswer').value = '';
}

function verifyCaptcha() {
    const answer = document.getElementById('captchaAnswer').value.trim().toLowerCase();
    return answer === currentCaptcha.answer.toLowerCase();
}

// Rate limiting
function checkRateLimit() {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const limits = JSON.parse(localStorage.getItem('rateLimits') || '[]');
    
    const recent = limits.filter(time => now - time < hour);
    
    if (recent.length >= CONFIG.RATE_LIMIT) {
        return false;
    }
    
    recent.push(now);
    localStorage.setItem('rateLimits', JSON.stringify(recent));
    return true;
}

// URL utilities
function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < CONFIG.CODE_LENGTH; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// UI utilities
function showMessage(type, message) {
    const errorEl = document.getElementById('error');
    const successEl = document.getElementById('success');
    
    errorEl.classList.remove('show');
    successEl.classList.remove('show');
    
    if (type === 'error') {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    } else {
        successEl.textContent = message;
        successEl.classList.add('show');
    }
}

// Redirect handling
function checkRedirect() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);
    const shortCode = parts[parts.length - 1];
    
    if (shortCode && shortCode !== 'index.html' && shortCode.length === CONFIG.CODE_LENGTH) {
        showRedirectUI(shortCode);
        return true;
    }
    return false;
}

function showRedirectUI(shortCode) {
    document.getElementById('mainContainer').innerHTML = `
        <div class="redirect-message">
            <div class="logo">
                <img src="Logo.jpg" alt="Sea Minh Logo">
            </div>
            <h2>🔄 Redirecting...</h2>
            <div class="spinner"></div>
            <div class="countdown" id="countdown">3</div>
            <p style="font-size: 1.1em; color: #666;">Please wait while we take you to your destination</p>
            <div class="redirect-url" id="redirectUrl">Loading...</div>
            <div class="info-box">
                <p>🔒 <strong>Security Check:</strong> We're verifying this is a safe link</p>
                <p>⚡ <strong>Short Code:</strong> ${shortCode}</p>
            </div>
        </div>
    `;

    loadAndRedirect(shortCode);
}

async function loadAndRedirect(shortCode) {
    try {
        await db.init();
        const urlData = await db.get(shortCode);
        
        if (urlData) {
            const url = typeof urlData === 'string' ? urlData : urlData.url;
            redirectToUrl(url);
        } else {
            showNotFound();
        }
    } catch (error) {
        console.error('Redirect error:', error);
        showNotFound();
    }
}

function redirectToUrl(url) {
    document.getElementById('redirectUrl').textContent = url;
    
    let count = 3;
    const countdownEl = document.getElementById('countdown');
    const interval = setInterval(() => {
        count--;
        if (countdownEl) countdownEl.textContent = count;
        if (count <= 0) {
            clearInterval(interval);
            window.location.href = url;
        }
    }, 1000);
}

function showNotFound() {
    document.getElementById('mainContainer').innerHTML = `
        <div class="not-found">
            <div class="logo">
                <img src="Logo.jpg" alt="Sea Minh Logo">
            </div>
            <h2>❌ Link Not Found</h2>
            <p>This short link doesn't exist or has expired.</p>
            <p style="color: #999;">The link may have been deleted or never created.</p>
            <button class="btn" onclick="window.location.href='/Shortlink/'" style="margin-top: 20px; max-width: 300px;">
                🏠 Go to Homepage
            </button>
        </div>
    `;
}

// Main shortening function
async function shortenUrl() {
    const longUrl = document.getElementById('longUrl').value.trim();
    const btn = document.getElementById('shortenBtn');
    const result = document.getElementById('result');
    
    if (!longUrl) {
        showMessage('error', '❌ Please enter a URL');
        return;
    }
    
    if (!isValidUrl(longUrl)) {
        showMessage('error', '❌ Please enter a valid URL (must start with http:// or https://)');
        return;
    }

    if (!verifyCaptcha()) {
        showMessage('error', '❌ Incorrect answer. Please try again.');
        generateCaptcha();
        return;
    }

    if (!checkRateLimit()) {
        showMessage('error', `⚠️ Rate limit exceeded. Maximum ${CONFIG.RATE_LIMIT} URLs per hour.`);
        document.getElementById('rateLimit').style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating...';
    result.classList.remove('show');

    try {
        await db.init();
        
        let shortCode = generateShortCode();
        
        const urlData = {
            url: longUrl,
            created: new Date().toISOString(),
            clicks: 0
        };

        await db.set(shortCode, urlData);

        const shortUrl = CONFIG.BASE_URL + shortCode;
        
        document.getElementById('shortUrl').textContent = shortUrl;
        document.getElementById('originalUrl').textContent = longUrl.length > 50 ? longUrl.substring(0, 50) + '...' : longUrl;
        document.getElementById('createdDate').textContent = new Date().toLocaleString();
        result.classList.add('show');
        
        showMessage('success', db.isConfigured ? '✅ Short link created and saved to cloud!' : '✅ Short link created (local storage only)');
        
        document.getElementById('longUrl').value = '';
        generateCaptcha();
        
    } catch (error) {
        showMessage('error', '❌ Error creating short link. Please try again.');
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Shorten URL';
    }
}

function copyUrl() {
    const shortUrl = document.getElementById('shortUrl').textContent;
    const copyBtn = document.getElementById('copyBtn');
    
    navigator.clipboard.writeText(shortUrl).then(() => {
        copyBtn.textContent = '✅ Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        alert('Failed to copy. Please copy manually.');
    });
}

// Initialize application
if (!checkRedirect()) {
    generateCaptcha();
    
    // Hide setup notice if configured
    db.init().then(configured => {
        if (configured) {
            document.getElementById('setupNotice').style.display = 'none';
        }
    });
    
    document.getElementById('longUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            shortenUrl();
        }
    });
}
</script>
