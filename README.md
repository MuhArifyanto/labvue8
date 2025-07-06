# VueJS 

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

```
## 📸 Hasil Output
![{F85E1C3E-5EC7-48C7-BFA5-FFF895BA4896}](https://github.com/user-attachments/assets/406d8650-2c09-460a-abc8-7e2a662fe3ca)
