<!-- ================================ -->
<!-- FILE 4: database.js -->
<!-- Xử lý database với GitHub Gist -->
<!-- ================================ -->
<script>
// ============================================
// DATABASE HANDLER - GitHub Gist API
// ============================================

class GistDatabase {
    constructor() {
        this.gistId = localStorage.getItem('gistId') || CONFIG.GIST_ID;
        this.cache = null;
        this.isConfigured = CONFIG.GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' 
                         && CONFIG.GITHUB_USERNAME !== 'YOUR_USERNAME';
        this.GIST_FILENAME = 'shortlinks-database.json';
    }

    async init() {
        if (!this.isConfigured) {
            console.log('GitHub not configured, using localStorage');
            return false;
        }

        try {
            if (!this.gistId) {
                await this.createGist();
            } else {
                await this.loadData();
            }
            return true;
        } catch (error) {
            console.error('Gist init error:', error);
            return false;
        }
    }

    async createGist() {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: 'URL Shortener Database for Sea | Minh',
                public: false,
                files: {
                    [this.GIST_FILENAME]: {
                        content: JSON.stringify({})
                    }
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create gist: ${error.message}`);
        }

        const data = await response.json();
        this.gistId = data.id;
        localStorage.setItem('gistId', this.gistId);
        this.cache = {};
        
        console.log('✅ Gist created:', this.gistId);
    }

    async loadData() {
        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load gist');
        }

        const data = await response.json();
        const content = data.files[this.GIST_FILENAME]?.content || '{}';
        this.cache = JSON.parse(content);
        
        console.log('✅ Data loaded from Gist');
    }

    async saveData() {
        if (!this.isConfigured) return;

        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    [this.GIST_FILENAME]: {
                        content: JSON.stringify(this.cache, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save gist');
        }
        
        console.log('✅ Data saved to Gist');
    }

    async set(key, value) {
        this.cache[key] = value;
        
        if (this.isConfigured) {
            await this.saveData();
        } else {
            // Fallback to localStorage
            const urls = JSON.parse(localStorage.getItem('shortUrls') || '{}');
            urls[key] = value;
            localStorage.setItem('shortUrls', JSON.stringify(urls));
        }
    }

    async get(key) {
        if (this.isConfigured && this.cache) {
            return this.cache[key] || null;
        } else {
            // Fallback to localStorage
            const urls = JSON.parse(localStorage.getItem('shortUrls') || '{}');
            return urls[key] || null;
        }
    }

    async delete(key) {
        if (this.cache && this.cache[key]) {
            delete this.cache[key];
            
            if (this.isConfigured) {
                await this.saveData();
            } else {
                const urls = JSON.parse(localStorage.getItem('shortUrls') || '{}');
                delete urls[key];
                localStorage.setItem('shortUrls', JSON.stringify(urls));
            }
            return true;
        }
        return false;
    }

    async list() {
        if (this.isConfigured && this.cache) {
            return Object.keys(this.cache);
        } else {
            const urls = JSON.parse(localStorage.getItem('shortUrls') || '{}');
            return Object.keys(urls);
        }
    }
}

// Initialize database
const db = new GistDatabase();
</script>
