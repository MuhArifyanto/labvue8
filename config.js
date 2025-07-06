// Konfigurasi aplikasi Vue.js Article Management
window.APP_CONFIG = {
    // Mode aplikasi: 'online' atau 'offline'
    mode: 'offline', // Default offline untuk development
    
    // Konfigurasi API
    api: {
        baseUrl: 'http://localhost:8080',
        endpoints: {
            artikel: '/admin/artikel/api',
            artikelSimple: '/test-api-simple.php',
            upload: '/admin/artikel/upload'
        },
        timeout: 10000,
        retryAttempts: 3,
        useSimpleAPI: true // Set true untuk menggunakan API sederhana
    },
    
    // Konfigurasi UI
    ui: {
        itemsPerPage: 10,
        showDebugInfo: true,
        enableKeyboardShortcuts: true,
        autoSave: true
    },
    
    // Konfigurasi upload
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
        enablePreview: true
    },
    
    // Konfigurasi validasi
    validation: {
        judul: {
            minLength: 3,
            maxLength: 200,
            required: true
        },
        isi: {
            maxLength: 5000,
            required: false
        }
    },
    
    // Konfigurasi localStorage
    storage: {
        prefix: 'vuejs_artikel_',
        enableBackup: true,
        maxBackups: 5
    }
};

// Export untuk Node.js jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.APP_CONFIG;
}
