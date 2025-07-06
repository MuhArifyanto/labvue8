/**
 * Vue.js Article Management System
 * Unified JavaScript Application
 *
 * Features:
 * - CRUD Operations (Create, Read, Update, Delete)
 * - Image Upload with Preview
 * - Online/Offline Mode
 * - Form Validation
 * - Keyboard Shortcuts
 * - Debug Information
 */

const { createApp } = Vue;

// ============================================================================
// CONFIGURATION & SETUP
// ============================================================================

// Default configuration
let API_CONFIG = {
    baseUrl: 'http://localhost:8080',
    endpoints: {
        artikel: '/admin/artikel/api',
        artikelSimple: '/test-api-simple.php',
        upload: '/admin/artikel/upload'
    },
    timeout: 10000,
    retryAttempts: 3,
    offlineMode: false,
    useSimpleAPI: true
};

// Update configuration from window.APP_CONFIG if available
if (typeof window !== 'undefined' && window.APP_CONFIG) {
    API_CONFIG = {
        ...API_CONFIG,
        ...window.APP_CONFIG.api,
        offlineMode: window.APP_CONFIG.mode === 'offline'
    };
}

// Get the correct API endpoint
function getAPIEndpoint() {
    if (API_CONFIG.useSimpleAPI) {
        return API_CONFIG.baseUrl + API_CONFIG.endpoints.artikelSimple;
    } else {
        return API_CONFIG.baseUrl + API_CONFIG.endpoints.artikel;
    }
}

// ============================================================================
// INITIAL DATA
// ============================================================================

// Dummy data for offline mode or initial setup
const initialData = [
    {
        id: 1,
        judul: "Artikel Pertama",
        isi: "Ini adalah isi dari artikel pertama. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        status: 1,
        gambar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        judul: "Artikel Kedua",
        isi: "Ini adalah isi dari artikel kedua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        status: 0,
        gambar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        judul: "Artikel Ketiga",
        isi: "Ini adalah isi dari artikel ketiga. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        status: 1,
        gambar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const utils = {
    // Debounce function for optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Form validation
    validateForm(data) {
        const errors = {};

        if (!data.judul || data.judul.trim().length === 0) {
            errors.judul = 'Judul artikel wajib diisi';
        } else if (data.judul.trim().length < 3) {
            errors.judul = 'Judul minimal 3 karakter';
        } else if (data.judul.trim().length > 200) {
            errors.judul = 'Judul maksimal 200 karakter';
        }

        if (data.isi && data.isi.length > 5000) {
            errors.isi = 'Isi artikel maksimal 5000 karakter';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Image file validation
    validateImage(file) {
        const errors = {};
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

        if (file.size > maxSize) {
            errors.gambar = 'Ukuran file maksimal 5MB';
        }

        if (!allowedTypes.includes(file.type)) {
            errors.gambar = 'Format file harus JPG, PNG, atau GIF';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // Format error message for user display
    formatErrorMessage(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;

            switch (status) {
                case 400:
                    return 'Data yang dikirim tidak valid';
                case 401:
                    return 'Anda tidak memiliki akses';
                case 403:
                    return 'Akses ditolak';
                case 404:
                    return 'Data tidak ditemukan';
                case 500:
                    return 'Terjadi kesalahan pada server';
                default:
                    return `Error ${status}: ${message}`;
            }
        } else if (error.request) {
            return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else {
            return error.message || 'Terjadi kesalahan yang tidak diketahui';
        }
    },

    // Generate unique ID
    generateId() {
        return Date.now() + Math.random().toString(36).substring(2, 11);
    },

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Truncate text
    truncateText(text, maxLength = 100) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
};

// ============================================================================
// VUE.JS APPLICATION
// ============================================================================

createApp({
    data() {
        return {
            // ========== DATA STATE ==========
            artikel: [],

            // ========== FORM STATE ==========
            formData: {
                id: null,
                judul: '',
                isi: '',
                status: 0,
                gambar: null
            },

            // ========== UI STATE ==========
            showForm: false,
            showConfirmation: false,
            showImageModal: false,
            confirmationData: {},
            selectedImage: null,
            formTitle: 'Tambah Data',

            // ========== LOADING STATE ==========
            loading: false,
            saving: false,

            // ========== ERROR STATE ==========
            error: null,
            errors: {},
            debugInfo: null,

            // ========== IMAGE STATE ==========
            imagePreview: null,
            uploadProgress: 0,

            // ========== OPTIONS ==========
            statusOptions: [
                { text: 'Draft', value: 0 },
                { text: 'Publish', value: 1 }
            ],

            // ========== CONFIGURATION ==========
            nextId: 4,
            isOnlineMode: !API_CONFIG.offlineMode,
            API_CONFIG: API_CONFIG,
            apiUrl: getAPIEndpoint()
        };
    },
    mounted() {
        this.loadData();
        document.addEventListener('keydown', this.handleKeydown);
    },

    beforeUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    },

    methods: {
        // ========================================================================
        // DATA LOADING METHODS
        // ========================================================================

        async loadData(retryCount = 0) {
            this.loading = true;
            this.error = null;

            // Check if offline mode or no internet
            if (API_CONFIG.offlineMode || !navigator.onLine) {
                await this.loadOfflineData();
                return;
            }

            try {
                const apiUrl = getAPIEndpoint();
                console.log('Loading data from:', apiUrl);
                console.log('Using simple API:', API_CONFIG.useSimpleAPI);

                const response = await axios.get(apiUrl, {
                    timeout: API_CONFIG.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                console.log('API Response:', response.data);

                // Handle different response structures
                if (response.data.success) {
                    this.artikel = response.data.data || response.data.artikel || [];
                } else if (Array.isArray(response.data)) {
                    this.artikel = response.data;
                } else {
                    this.artikel = response.data.data || [];
                }

                this.loading = false;
                this.isOnlineMode = true;

            } catch (error) {
                console.error('Error loading data:', error);

                if (retryCount < API_CONFIG.retryAttempts) {
                    // Retry after delay
                    setTimeout(() => {
                        this.loadData(retryCount + 1);
                    }, 1000 * (retryCount + 1));
                } else {
                    // Fallback to offline mode
                    console.log('Switching to offline mode...');
                    await this.loadOfflineData();
                    this.isOnlineMode = false;
                }
            }
        },

        async loadOfflineData() {
            // Simulate loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                // Load from localStorage or use initial data
                const savedData = localStorage.getItem('artikel_data');
                const savedNextId = localStorage.getItem('next_id');

                if (savedData) {
                    this.artikel = JSON.parse(savedData);
                } else {
                    this.artikel = [...initialData];
                    this.saveToLocalStorage();
                }

                if (savedNextId) {
                    this.nextId = parseInt(savedNextId);
                } else {
                    this.nextId = Math.max(...this.artikel.map(a => a.id)) + 1;
                }

                this.loading = false;
                this.error = null;

            } catch (error) {
                console.error('Error loading offline data:', error);
                this.artikel = [...initialData];
                this.nextId = 4;
                this.loading = false;
            }
        },

        saveToLocalStorage() {
            try {
                localStorage.setItem('artikel_data', JSON.stringify(this.artikel));
                localStorage.setItem('next_id', this.nextId.toString());
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        },

        loadFromLocalStorage() {
            try {
                const savedData = localStorage.getItem('artikel_data');
                const savedNextId = localStorage.getItem('next_id');

                if (savedData) {
                    this.artikel = JSON.parse(savedData);
                }

                if (savedNextId) {
                    this.nextId = parseInt(savedNextId);
                }
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        },

        // ========================================================================
        // FORM METHODS
        // ========================================================================

        // Open form for adding new article
        tambah() {
            this.resetForm();
            this.showForm = true;
            this.formTitle = 'Tambah Artikel Baru';

            // Focus on first input after modal opens
            this.$nextTick(() => {
                const firstInput = document.querySelector('#judul');
                if (firstInput) firstInput.focus();
            });
        },

        // Open form for editing article
        edit(data) {
            this.resetForm();
            this.showForm = true;
            this.formTitle = 'Edit Artikel';
            this.formData = { ...data };

            // Set image preview if exists
            if (data.gambar) {
                this.imagePreview = data.gambar;
            }

            this.$nextTick(() => {
                const firstInput = document.querySelector('#judul');
                if (firstInput) firstInput.focus();
            });
        },

        // Show confirmation dialog for delete
        hapus(index, id) {
            const artikel = this.artikel[index];
            this.confirmationData = {
                index,
                id,
                judul: artikel.judul
            };
            this.showConfirmation = true;
        },

        // Confirm delete action
        async confirmDelete() {
            const { index, id } = this.confirmationData;
            this.showConfirmation = false;

            if (this.isOnlineMode && !API_CONFIG.offlineMode) {
                try {
                    const apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.artikel}/${id}`;
                    console.log('Deleting article:', id, 'from:', apiUrl);

                    const response = await axios.delete(apiUrl, {
                        timeout: API_CONFIG.timeout,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    console.log('Delete response:', response.data);
                    this.artikel.splice(index, 1);
                    this.showSuccessMessage('Artikel berhasil dihapus');
                } catch (error) {
                    console.error('Error deleting article:', error);
                    this.showErrorMessage(utils.formatErrorMessage(error));
                }
            } else {
                // Offline mode
                this.artikel.splice(index, 1);
                this.saveToLocalStorage();
                this.showSuccessMessage('Artikel berhasil dihapus (mode offline)');
            }
        },
        // Save data with validation
        async saveData() {
            // Validate form data
            const validation = utils.validateForm(this.formData);

            if (!validation.isValid) {
                this.errors = validation.errors;
                return;
            }

            this.saving = true;
            this.errors = {};

            try {
                const data = {
                    judul: this.formData.judul.trim(),
                    isi: this.formData.isi.trim(),
                    status: parseInt(this.formData.status),
                    gambar: this.formData.gambar
                };

                if (this.isOnlineMode && !API_CONFIG.offlineMode) {
                    // Online mode
                    const apiUrl = getAPIEndpoint();
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    console.log('Saving to:', apiUrl);
                    console.log('Data to save:', data);

                    if (this.formData.id) {
                        // Update existing article
                        console.log('Updating article:', this.formData.id, data);
                        const response = await axios.put(`${apiUrl}/${this.formData.id}`, data, {
                            timeout: API_CONFIG.timeout,
                            headers
                        });
                        console.log('Update response:', response.data);
                        this.showSuccessMessage('Artikel berhasil diperbarui');
                    } else {
                        // Create new article
                        console.log('Creating new article:', data);
                        const response = await axios.post(apiUrl, data, {
                            timeout: API_CONFIG.timeout,
                            headers
                        });
                        console.log('Create response:', response.data);
                        this.showSuccessMessage('Artikel berhasil ditambahkan');
                    }

                    await this.loadData();
                } else {
                    // Offline mode
                    if (this.formData.id) {
                        // Update existing article
                        const index = this.artikel.findIndex(a => a.id === this.formData.id);
                        if (index !== -1) {
                            this.artikel[index] = { ...this.artikel[index], ...data };
                        }
                        this.showSuccessMessage('Artikel berhasil diperbarui (mode offline)');
                    } else {
                        // Create new article
                        const newArticle = {
                            id: this.nextId++,
                            ...data
                        };
                        this.artikel.unshift(newArticle);
                        localStorage.setItem('next_id', this.nextId.toString());
                        this.showSuccessMessage('Artikel berhasil ditambahkan (mode offline)');
                    }

                    this.saveToLocalStorage();
                }

                this.closeModal();
            } catch (error) {
                console.error('Error saving data:', error);

                // Detailed error debugging
                const debugData = {
                    error: error.message,
                    url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.artikel}`,
                    method: this.formData.id ? 'PUT' : 'POST',
                    data: data,
                    response: error.response ? {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    } : 'No response',
                    config: API_CONFIG
                };

                if (error.response && error.response.status === 422) {
                    // Validation errors from server
                    this.errors = error.response.data.errors || {};
                    this.showErrorMessage('Validasi gagal dari server', debugData);
                } else {
                    this.showErrorMessage(utils.formatErrorMessage(error), debugData);
                }
            } finally {
                this.saving = false;
            }
        },

        // Close modal and reset form
        closeModal() {
            this.showForm = false;
            this.resetForm();
        },

        // Reset form data and errors
        resetForm() {
            this.formData = {
                id: null,
                judul: '',
                isi: '',
                status: 0,
                gambar: null
            };
            this.errors = {};
            this.imagePreview = null;
            this.uploadProgress = 0;

            // Reset file input
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        clearError(field) {
            if (this.errors[field]) {
                delete this.errors[field];
            }
        },

        // ========================================================================
        // UTILITY METHODS
        // ========================================================================

        statusText(status) {
            return status === 1 ? 'Publish' : 'Draft';
        },

        showSuccessMessage(message) {
            console.log('Success:', message);
            alert('✅ ' + message);
            this.debugInfo = null;
        },

        showErrorMessage(message, debugData = null) {
            console.error('Error:', message);
            alert('❌ ' + message);

            if (debugData) {
                this.debugInfo = JSON.stringify(debugData, null, 2);
            }
        },

        // ========================================================================
        // IMAGE HANDLING METHODS
        // ========================================================================

        async handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const validation = utils.validateImage(file);
            if (!validation.isValid) {
                this.errors = { ...this.errors, ...validation.errors };
                return;
            }

            this.clearError('gambar');

            try {
                this.uploadProgress = 0;

                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    this.uploadProgress += 10;
                    if (this.uploadProgress >= 90) {
                        clearInterval(progressInterval);
                    }
                }, 100);

                const base64 = await utils.fileToBase64(file);

                this.uploadProgress = 100;
                setTimeout(() => {
                    this.uploadProgress = 0;
                }, 500);

                this.formData.gambar = base64;
                this.imagePreview = base64;

            } catch (error) {
                console.error('Error uploading image:', error);
                this.errors.gambar = 'Gagal mengupload gambar';
                this.uploadProgress = 0;
            }
        },

        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        removeImage() {
            this.formData.gambar = null;
            this.imagePreview = null;
            this.uploadProgress = 0;

            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        openImageModal(imageSrc) {
            this.selectedImage = imageSrc;
            this.showImageModal = true;
        },

        closeImageModal() {
            this.showImageModal = false;
            this.selectedImage = null;
        },

        handleImageError(event) {
            console.log('Image failed to load:', event.target.src);
            event.target.style.display = 'none';
            const placeholder = event.target.parentNode.querySelector('.no-image');
            if (!placeholder) {
                const noImageDiv = document.createElement('div');
                noImageDiv.className = 'no-image';
                noImageDiv.textContent = '❌ Error';
                event.target.parentNode.appendChild(noImageDiv);
            }
        },

        // ========================================================================
        // API & MODE SWITCHING METHODS
        // ========================================================================

        switchToSimpleAPI() {
            API_CONFIG.useSimpleAPI = true;
            this.apiUrl = getAPIEndpoint();
            this.debugInfo = null;
            this.showSuccessMessage('Beralih ke API sederhana. Mencoba memuat data...');
            this.loadData();
        },

        switchToOfflineMode() {
            this.isOnlineMode = false;
            API_CONFIG.offlineMode = true;
            this.debugInfo = null;
            this.showSuccessMessage('Beralih ke mode offline');
            this.loadOfflineData();
        },

        // ========================================================================
        // KEYBOARD & EVENT HANDLING METHODS
        // ========================================================================

        handleKeydown(event) {
            if (event.key === 'Escape') {
                if (this.showImageModal) {
                    this.closeImageModal();
                } else if (this.showForm) {
                    this.closeModal();
                } else if (this.showConfirmation) {
                    this.showConfirmation = false;
                }
            }

            if (event.ctrlKey && event.key === 'n' && !this.showForm) {
                event.preventDefault();
                this.tambah();
            }
        },

        // ========================================================================
        // DEBUG & DEVELOPMENT METHODS
        // ========================================================================

        exportData() {
            const data = {
                artikel: this.artikel,
                config: API_CONFIG,
                timestamp: new Date().toISOString()
            };
            console.log('Exported data:', data);
            return data;
        },

        importData(data) {
            if (data && data.artikel) {
                this.artikel = data.artikel;
                this.saveToLocalStorage();
                this.showSuccessMessage('Data berhasil diimport');
            }
        },

        clearAllData() {
            if (confirm('Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
                localStorage.removeItem('artikel_data');
                localStorage.removeItem('next_id');
                this.artikel = [];
                this.nextId = 1;
                this.showSuccessMessage('Semua data berhasil dihapus');
            }
        },

        resetToInitialData() {
            if (confirm('Yakin ingin reset ke data awal?')) {
                this.artikel = [...initialData];
                this.nextId = 4;
                this.saveToLocalStorage();
                this.showSuccessMessage('Data berhasil direset ke data awal');
            }
        }
    }

// ============================================================================
// MOUNT APPLICATION
// ============================================================================

}).mount('#app');

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============================================================================
// CONSOLE HELPERS FOR DEVELOPMENT
// ============================================================================

if (typeof window !== 'undefined') {
    window.VueApp = {
        exportData: () => {
            const app = document.querySelector('#app').__vue_app__;
            return app._instance.proxy.exportData();
        },
        clearData: () => {
            const app = document.querySelector('#app').__vue_app__;
            app._instance.proxy.clearAllData();
        },
        resetData: () => {
            const app = document.querySelector('#app').__vue_app__;
            app._instance.proxy.resetToInitialData();
        }
    };

    console.log('🚀 Vue.js Article Management System loaded!');
    console.log('💡 Available console commands:');
    console.log('   VueApp.exportData() - Export all data');
    console.log('   VueApp.clearData() - Clear all data');
    console.log('   VueApp.resetData() - Reset to initial data');
}
