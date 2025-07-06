#  Praktikum Pemrograman Website 2 - VueJS Manual

##  Profil Mahasiswa

| Nama | Kelas | NIM | 
|------|-------|-----|
| Muhammad Arif Mulyanto   |  TI.23.A.5     | 312310359 |

##  Deskripsi

Praktikum ini membahas cara penggunaan **VueJS secara manual (tanpa NPM)** menggunakan **CDN**, serta integrasi dengan **Axios** untuk melakukan call ke REST API. Fitur-fitur yang dibuat:
- Menampilkan data artikel
- Menambah data
- Mengubah data
- Menghapus data

---

## 🔧 Library yang Digunakan

### VueJS
```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```
## 📄 File: `index.html`

Berikut adalah kode HTML utama untuk menampilkan daftar artikel dan form tambah/ubah menggunakan VueJS dan Axios via CDN.

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vue.js Article Management</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
  <div id="app">
    <header>
      <h1>Daftar Artikel</h1>
      <p class="subtitle">Kelola artikel dengan mudah menggunakan Vue.js</p>

      <!-- Status Koneksi -->
      <div class="connection-status" v-if="isOnlineMode">
        <span class="status-online">
          🟢 Online - Mode {{ API_CONFIG.useSimpleAPI ? 'API Sederhana' : 'CodeIgniter' }}
        </span>
      </div>
    </header>

    <!-- Loading indicator -->
    <div v-if="loading" class="loading">
      <p>Memuat data...</p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Coba Lagi</button>
    </div>

    <!-- Main content -->
    <div v-if="!loading">
      <!-- Tombol Tambah -->
      <div class="action-bar">
        <button id="btn-tambah" @click="tambah" class="btn-primary">
          <span>+</span> Tambah Artikel
        </button>
        <div class="article-count">
          Total: {{ artikel.length }} artikel
        </div>
      </div>

      <!-- Tabel Data Artikel -->
      <div class="table-container">
        <table class="table" v-if="artikel.length > 0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Gambar</th>
              <th>Judul</th>
              <th>Isi</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in artikel" :key="row.id">
              <td class="center-text">{{ row.id }}</td>
              <td class="center-text">
                <div class="table-image-container">
                  <img v-if="row.gambar"
                       :src="row.gambar"
                       alt="Gambar artikel"
                       class="table-image"
                       @error="handleImageError($event)"
                       @click="openImageModal(row.gambar)"
                       title="Klik untuk melihat gambar penuh"
                  >
                  <div v-else class="no-image">
                    📷 No Image
                  </div>
                </div>
              </td>
              <td>
                <div class="article-title">{{ row.judul }}</div>
              </td>
              <td>
                <div class="article-preview" v-if="row.isi">
                  {{ row.isi.substring(0, 80) }}{{ row.isi.length > 80 ? '...' : '' }}
                </div>
              </td>
              <td>
                <span class="status-badge" :class="'status-' + row.status">
                  {{ statusText(row.status) }}
                </span>
              </td>
              <td class="center-text">
                <button @click="edit(row)" class="btn-edit" title="Edit artikel">
                  Edit
                </button>
                <button @click="hapus(index, row.id)" class="btn-delete" title="Hapus artikel">
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <h3>Belum ada artikel</h3>
          <p>Klik tombol "Tambah Artikel" untuk membuat artikel pertama Anda.</p>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal" v-if="showForm" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="form-title">{{ formTitle }}</h3>
          <span class="close" @click="closeModal" title="Tutup">&times;</span>
        </div>

        <div class="modal-body">
          <form id="form-data" @submit.prevent="saveData" novalidate>

            <!-- Judul Artikel -->
            <div class="form-group">
              <label for="judul">Judul Artikel <span class="required">*</span></label>
              <input
                type="text"
                name="judul"
                id="judul"
                v-model="formData.judul"
                placeholder="Masukkan judul artikel"
                required
                :class="{ 'error': errors.judul }"
                @input="clearError('judul')"
              >
              <span v-if="errors.judul" class="error-text">{{ errors.judul }}</span>
            </div>

            <!-- Isi Artikel -->
            <div class="form-group">
              <label for="isi">Isi Artikel</label>
              <textarea
                name="isi"
                id="isi"
                rows="6"
                v-model="formData.isi"
                placeholder="Tulis isi artikel di sini..."
                :class="{ 'error': errors.isi }"
                @input="clearError('isi')"
              ></textarea>
              <span v-if="errors.isi" class="error-text">{{ errors.isi }}</span>
              <small class="char-count">{{ formData.isi.length }}/5000 karakter</small>
            </div>

            <!-- Upload Gambar -->
            <div class="form-group">
              <label for="gambar">Gambar Artikel (Opsional)</label>
              <div class="image-upload-container">
                <!-- File input -->
                <input
                  type="file"
                  name="gambar"
                  id="gambar"
                  accept="image/*"
                  @change="handleImageUpload"
                  :class="{ 'error': errors.gambar }"
                  ref="fileInput"
                >

                <!-- Upload button -->
                <button type="button" @click="triggerFileInput" class="btn-upload">
                  <span>📁</span> Pilih Gambar
                </button>

                <!-- Image preview -->
                <div v-if="imagePreview" class="image-preview">
                  <img :src="imagePreview" alt="Preview" class="preview-image">
                  <button type="button" @click="removeImage" class="btn-remove-image" title="Hapus gambar">
                    ×
                  </button>
                </div>

                <!-- Upload progress -->
                <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ uploadProgress }}%</span>
                </div>
              </div>
              <span v-if="errors.gambar" class="error-text">{{ errors.gambar }}</span>
              <small class="help-text">Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.</small>
            </div>

            <!-- Status Publikasi -->
            <div class="form-group">
              <label for="status">Status Publikasi</label>
              <select name="status" id="status" v-model="formData.status">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
            </div>

            <input type="hidden" id="id" v-model="formData.id">

            <!-- Form Actions -->
            <div class="form-actions">
              <button type="submit" id="btnSimpan" :disabled="saving" class="btn-primary">
                <span v-if="saving">Menyimpan...</span>
                <span v-else>{{ formData.id ? 'Update' : 'Simpan' }}</span>
              </button>
              <button type="button" @click="closeModal" class="btn-secondary">Batal</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal" v-if="showConfirmation" @click.self="showConfirmation = false">
      <div class="modal-content confirmation-modal">
        <div class="modal-header">
          <h3>Konfirmasi Hapus</h3>
        </div>
        <div class="modal-body">
          <p>Apakah Anda yakin ingin menghapus artikel "{{ confirmationData.judul }}"?</p>
          <p class="warning-text">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div class="form-actions">
          <button @click="confirmDelete" class="btn-danger">Ya, Hapus</button>
          <button @click="showConfirmation = false" class="btn-secondary">Batal</button>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div class="modal" v-if="showImageModal" @click.self="closeImageModal">
      <div class="modal-content image-modal-content">
        <div class="modal-header">
          <h3>Preview Gambar</h3>
          <span class="close" @click="closeImageModal" title="Tutup">&times;</span>
        </div>
        <div class="modal-body image-modal-body">
          <img :src="selectedImage" alt="Preview gambar" class="full-image">
        </div>
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="debugInfo" class="debug-info">
      <h4>🔧 Debug Information</h4>
      <pre>{{ debugInfo }}</pre>
      <div class="debug-actions">
        <button @click="switchToOfflineMode" class="btn-warning">Mode Offline</button>
        <button @click="debugInfo = null" class="btn-secondary">Tutup Debug</button>
      </div>
    </div>
  </div>

  <script src="assets/js/app.js"></script>
</body>
</html>

```
## 📄 File: `assets/js/app.js`

Berikut adalah kode JavaScript utama menggunakan Vue 3 dan Axios, untuk mengatur data artikel melalui REST API.

```javascript
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

```
## 📸 Hasil Output
![{7E6B9726-BC00-41B4-BDB1-12CDE5846572}](https://github.com/user-attachments/assets/b6b5ee63-b52b-45e9-9e7c-57665bf89d4c)

## 🎨 File: `assets/css/style.css`

File ini berisi styling dasar untuk tampilan aplikasi artikel VueJS. Gaya yang digunakan bersifat minimalis dan responsif.

```css
/* Reset and base styles */
* {
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background-color: #f5f7fa;
    color: #333;
}

#app {
    margin: 0 auto;
    max-width: 1200px;
    width: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 30px;
}

/* Header styles */
header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e9ecef;
}

header h1 {
    color: #2c3e50;
    margin: 0 0 10px 0;
    font-size: 2.5rem;
    font-weight: 600;
}

.subtitle {
    color: #6c757d;
    margin: 0 0 15px 0;
    font-size: 1.1rem;
}

/* Connection Status */
.connection-status {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    transition: all 0.3s ease;
}

.connection-status.offline {
    background: #f8d7da;
    color: #721c24;
    border-color: #f5c6cb;
}

.status-online,
.status-offline {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Offline Info */
.offline-info {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    color: #856404;
}

.offline-info h4 {
    margin: 0 0 10px 0;
    color: #856404;
    font-size: 1.1rem;
}

.offline-info p {
    margin: 0 0 15px 0;
    line-height: 1.5;
}

.offline-info ul {
    margin: 0;
    padding-left: 20px;
}

.offline-info li {
    margin-bottom: 5px;
    line-height: 1.4;
}

/* Debug Info */
.debug-info {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    color: #495057;
}

.debug-info h4 {
    margin: 0 0 15px 0;
    color: #495057;
    font-size: 1.1rem;
}

.debug-info pre {
    background: #e9ecef;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    white-space: pre-wrap;
    font-size: 0.9rem;
    margin: 0 0 15px 0;
}

.debug-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.btn-warning {
    background: #ffc107;
    color: #212529;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-warning:hover {
    background: #e0a800;
}

/* Loading and error states */
.loading {
    text-align: center;
    padding: 40px;
    color: #6c757d;
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    border: 1px solid #f5c6cb;
}

.btn-retry {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}

.btn-retry:hover {
    background: #c82333;
}

/* Action bar */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    flex-wrap: wrap;
    gap: 15px;
}

.article-count {
    color: #6c757d;
    font-weight: 500;
}

/* Table styles */
.table-container {
    overflow-x: auto;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

th {
    padding: 15px 12px;
    background: #5778ff;
    color: #ffffff;
    text-align: left;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

tr td {
    border-bottom: 1px solid #e9ecef;
    transition: background-color 0.2s ease;
}

tbody tr:hover {
    background-color: #f8f9fa;
}

tr:nth-child(even) {
    background-color: #f8f9fa;
}

tr:nth-child(even):hover {
    background-color: #e9ecef;
}

td {
    padding: 15px 12px;
    vertical-align: top;
}

.center-text {
    text-align: center;
}

/* Table Image Styles */
.table-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80px;
    height: 60px;
    margin: 0 auto;
}

.table-image {
    max-width: 80px;
    max-height: 60px;
    width: auto;
    height: auto;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid #e9ecef;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.table-image:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    cursor: pointer;
}

.no-image {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 60px;
    background: #f8f9fa;
    border: 2px dashed #dee2e6;
    border-radius: 6px;
    color: #6c757d;
    font-size: 0.8rem;
    text-align: center;
}

/* Image Modal Styles */
.image-modal-content {
    max-width: 90vw;
    max-height: 90vh;
    width: auto;
    height: auto;
}

.image-modal-body {
    padding: 0;
    text-align: center;
    background: #000;
    border-radius: 0 0 8px 8px;
}

.full-image {
    max-width: 100%;
    max-height: 80vh;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    margin: 0 auto;
}

.article-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.article-image {
    flex-shrink: 0;
}

.article-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid #e9ecef;
}

.article-content {
    flex: 1;
    min-width: 0;
}

.article-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 5px;
    word-wrap: break-word;
}

.article-preview {
    color: #6c757d;
    font-size: 0.9rem;
    line-height: 1.4;
    word-wrap: break-word;
}

/* Status badges */
.status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-0 {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status-1 {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

/* Empty state */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6c757d;
}

.empty-state h3 {
    color: #495057;
    margin-bottom: 10px;
}

/* Button styles */
.btn-primary {
    background: #5778ff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary:hover {
    background: #4c6ef5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(87, 120, 255, 0.3);
}

.btn-primary:disabled {
    background: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-secondary:hover {
    background: #5a6268;
}

.btn-edit {
    background: #28a745;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    margin-right: 5px;
    transition: all 0.2s ease;
}

.btn-edit:hover {
    background: #218838;
}

.btn-delete {
    background: #dc3545;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
}

.btn-delete:hover {
    background: #c82333;
}

.btn-danger {
    background: #dc3545;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-danger:hover {
    background: #c82333;
}

/* Form styling */
#form-data {
    width: 100%;
}

/* Modern Form Styling */
.form-group {
    margin-bottom: 25px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95rem;
}

.required {
    color: #e74c3c;
    font-weight: 700;
}

.input-wrapper,
.textarea-wrapper,
.select-wrapper {
    position: relative;
}

.form-input,
.form-select,
.form-textarea {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    background: white;
    font-family: inherit;
}

.form-input {
    padding-right: 45px;
}

.form-textarea {
    resize: vertical;
    min-height: 140px;
    line-height: 1.6;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

.form-input.error,
.form-textarea.error {
    border-color: #e74c3c;
    box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.1);
}

.input-icon,
.select-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #6c757d;
    font-size: 1.1rem;
    pointer-events: none;
}

.textarea-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.char-count {
    color: #6c757d;
    font-size: 0.85rem;
    font-weight: 500;
}

.char-count.warning {
    color: #f39c12;
    font-weight: 600;
}

.error-text {
    color: #dc3545;
    font-size: 0.8rem;
    margin-top: 4px;
    display: block;
}

.char-count {
    color: #6c757d;
    font-size: 0.8rem;
    margin-top: 4px;
    display: block;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 25px;
    justify-content: flex-end;
}

/* Modern Image Upload Styles */
.image-upload-section {
    position: relative;
}

.image-upload-section input[type="file"] {
    display: none;
}

.upload-area {
    border: 3px dashed #dee2e6;
    border-radius: 12px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fafbfc;
    position: relative;
    overflow: hidden;
}

.upload-area:hover {
    border-color: #667eea;
    background: #f8f9ff;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
}

.upload-area.has-image {
    padding: 0;
    border: none;
    background: transparent;
}

.upload-placeholder {
    color: #6c757d;
}

.upload-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.7;
}

.upload-placeholder h5 {
    margin: 0 0 8px 0;
    color: #495057;
    font-weight: 600;
    font-size: 1.1rem;
}

.upload-placeholder p {
    margin: 0 0 10px 0;
    color: #6c757d;
    font-size: 0.9rem;
}

.upload-placeholder small {
    color: #adb5bd;
    font-size: 0.8rem;
}

.image-preview-container {
    position: relative;
    display: inline-block;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.image-preview-container:hover .image-overlay {
    opacity: 1;
}

.btn-remove-image,
.btn-change-image {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.btn-remove-image:hover {
    background: #e74c3c;
    color: white;
    transform: scale(1.1);
}

.btn-change-image:hover {
    background: #3498db;
    color: white;
    transform: scale(1.1);
}

.upload-progress {
    margin-top: 15px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: #e9ecef;
    border-radius: 5px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
    border-radius: 5px;
}

.progress-text {
    font-size: 0.85rem;
    color: #495057;
    font-weight: 500;
    text-align: center;
}

/* Form Actions */
.form-actions {
    display: flex;
    gap: 15px;
    margin-top: 30px;
    padding-top: 25px;
    border-top: 2px solid #f8f9fa;
    justify-content: flex-end;
}

.btn-save,
.btn-cancel {
    padding: 14px 28px;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
}

.btn-save {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
    background: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-cancel {
    background: #f8f9fa;
    color: #495057;
    border: 2px solid #e9ecef;
}

.btn-cancel:hover {
    background: #e9ecef;
    border-color: #dee2e6;
    transform: translateY(-1px);
}

/* Modal styling */
.modal {
    display: block;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background-color: white;
    margin: 2% auto;
    padding: 0;
    border: none;
    width: 95%;
    max-width: 900px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border-radius: 16px;
    animation: slideIn 0.3s ease;
    overflow: hidden;
}

.modal-content.modern-form {
    max-height: 90vh;
    overflow-y: auto;
}

@keyframes slideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
}

.modal-header::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-icon {
    font-size: 2rem;
    opacity: 0.9;
}

.header-text h3 {
    margin: 0 0 5px 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
}

.form-subtitle {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 400;
}

.close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.modal-body {
    padding: 30px;
    background: #fafbfc;
}

/* Form Grid Layout */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 30px;
    align-items: start;
}

.form-column {
    display: flex;
    flex-direction: column;
}

.form-section {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
    padding-bottom: 10px;
    border-bottom: 2px solid #f8f9fa;
}

.section-icon {
    font-size: 1.2rem;
}

.confirmation-modal {
    max-width: 450px;
}

.warning-text {
    color: #856404;
    font-size: 0.9rem;
    margin-top: 10px;
}

/* Responsive design */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }

    #app {
        padding: 20px;
    }

    header h1 {
        font-size: 2rem;
    }

    .action-bar {
        flex-direction: column;
        align-items: stretch;
    }

    .table-container {
        font-size: 0.9rem;
    }

    th, td {
        padding: 10px 8px;
    }

    .modal-content {
        width: 98%;
        margin: 5% auto;
        max-height: 95vh;
    }

    .modal-header {
        padding: 20px;
    }

    .header-content {
        gap: 12px;
    }

    .header-icon {
        font-size: 1.5rem;
    }

    .header-text h3 {
        font-size: 1.3rem;
    }

    .form-subtitle {
        font-size: 0.85rem;
    }

    .modal-body {
        padding: 20px;
    }

    .form-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .form-section {
        padding: 20px;
    }

    .section-title {
        font-size: 1rem;
    }

    .form-actions {
        flex-direction: column-reverse;
        gap: 10px;
    }

    .btn-save,
    .btn-cancel {
        width: 100%;
        justify-content: center;
    }

    .btn-edit, .btn-delete {
        display: block;
        margin: 2px 0;
        width: 100%;
    }

    .upload-area {
        padding: 20px 15px;
    }

    .upload-icon {
        font-size: 2.5rem;
    }

    .preview-image {
        height: 150px;
    }
}

@media (max-width: 480px) {
    .article-title {
        font-size: 0.9rem;
    }

    .article-preview {
        font-size: 0.8rem;
    }

    th {
        font-size: 0.8rem;
        padding: 8px 6px;
    }

    td {
        padding: 8px 6px;
    }

    .article-item {
        flex-direction: column;
        gap: 8px;
    }

    .article-thumbnail {
        width: 100%;
        height: 120px;
        max-width: 200px;
    }

    .preview-image {
        max-width: 150px;
        max-height: 150px;
    }

    .image-upload-container {
        font-size: 0.9rem;
    }
}

```
## 📸 Hasil Output
![{F85E1C3E-5EC7-48C7-BFA5-FFF895BA4896}](https://github.com/user-attachments/assets/406d8650-2c09-460a-abc8-7e2a662fe3ca)
