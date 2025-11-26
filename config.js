<!-- ================================ -->
<!-- FILE 3: config.js -->
<!-- Chứa cấu hình nhạy cảm (BẢO MẬT) -->
<!-- ================================ -->
<script>
// ============================================
// CONFIGURATION FILE - KEEP THIS SECURE!
// ============================================
// IMPORTANT: Add this file to .gitignore to prevent token exposure

const CONFIG = {
    // GitHub Personal Access Token
    // Get from: https://github.com/settings/tokens
    // Required permissions: gist (full access)
    GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',
    
    // Your GitHub username
    GITHUB_USERNAME: 'sea-minhhub',
    
    // Gist ID (leave empty for auto-creation)
    GIST_ID: 'd366816d0515d267a3d639c2173d044e',
    
    // Base URL for shortened links
    BASE_URL: 'http://sea-minhhub.github.io/Shortlink/',
    
    // Rate limiting (URLs per hour)
    RATE_LIMIT: 5,
    
    // Short code length
    CODE_LENGTH: 6
};

// Export config (for module systems)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
</script>
