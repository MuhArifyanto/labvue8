# 🔧 Troubleshooting Guide - Vue.js Article Management

Panduan lengkap untuk mengatasi masalah pada aplikasi Vue.js Article Management.

## 📋 Daftar Isi

1. [Masalah Umum](#masalah-umum)
2. [Masalah Server](#masalah-server)
3. [Masalah API](#masalah-api)
4. [Masalah CORS](#masalah-cors)
5. [Masalah Database](#masalah-database)
6. [Masalah Upload Gambar](#masalah-upload-gambar)
7. [Tools Debug](#tools-debug)

## 🚨 Masalah Umum

### Artikel Tidak Bisa Ditambah/Disimpan

**Gejala:**
- Form tersubmit tapi artikel tidak muncul di tabel
- Error di console browser
- Loading terus menerus

**Solusi:**
1. **Cek Console Browser** (F12 → Console)
   ```
   Lihat error message yang muncul
   ```

2. **Test dengan Debug Tool**
   ```
   Buka: debug-connection.html
   Klik: "Run All Tests"
   ```

3. **Gunakan Mode Offline**
   ```javascript
   // Di config.js, ubah:
   mode: 'offline'
   ```

### Gambar Tidak Muncul

**Gejala:**
- Upload berhasil tapi gambar tidak tampil di tabel
- Placeholder "No Image" terus muncul

**Solusi:**
1. **Cek Format File**
   - Hanya JPG, PNG, GIF yang didukung
   - Maksimal 5MB

2. **Cek Console Error**
   ```
   F12 → Console → Lihat error gambar
   ```

## 🌐 Masalah Server

### Server Tidak Berjalan

**Gejala:**
```
ERR_CONNECTION_REFUSED
Cannot connect to localhost:8080
```

**Solusi:**
1. **Start XAMPP/WAMP**
   ```
   - Buka XAMPP Control Panel
   - Start Apache
   ```

2. **Atau Gunakan PHP Built-in Server**
   ```bash
   cd C:\xampp\htdocs
   php -S localhost:8080
   ```

3. **Cek Port Bentrok**
   ```bash
   netstat -an | findstr :8080
   ```

### Port 8080 Sudah Digunakan

**Solusi:**
1. **Ganti Port di Config**
   ```javascript
   // config.js
   baseUrl: 'http://localhost:8081'
   ```

2. **Kill Process di Port 8080**
   ```bash
   netstat -ano | findstr :8080
   taskkill /PID [PID_NUMBER] /F
   ```

## 🔗 Masalah API

### API Endpoint 404

**Gejala:**
```
404 Not Found
/admin/artikel/api
```

**Solusi:**
1. **Copy Controller CodeIgniter**
   ```
   Copy: ArtikelApi.php → app/Controllers/Admin/
   ```

2. **Tambah Routes**
   ```php
   // app/Config/Routes.php
   $routes->group('admin/artikel', function($routes) {
       $routes->get('api', 'Admin\ArtikelApi::index');
       $routes->post('api', 'Admin\ArtikelApi::create');
       $routes->put('api/(:num)', 'Admin\ArtikelApi::update/$1');
       $routes->delete('api/(:num)', 'Admin\ArtikelApi::delete/$1');
   });
   ```

3. **Gunakan API Sederhana**
   ```javascript
   // config.js
   useSimpleAPI: true
   ```

### API Response Error

**Gejala:**
```
500 Internal Server Error
Unexpected token in JSON
```

**Solusi:**
1. **Cek Log Error**
   ```
   C:\xampp\apache\logs\error.log
   ```

2. **Test API Manual**
   ```
   http://localhost:8080/admin/artikel/api
   ```

## 🔒 Masalah CORS

### CORS Policy Error

**Gejala:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solusi:**
1. **Tambah CORS Headers di Controller**
   ```php
   public function __construct()
   {
       header('Access-Control-Allow-Origin: *');
       header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
       header('Access-Control-Allow-Headers: Content-Type, Authorization');
   }
   ```

2. **Gunakan API Sederhana** (sudah ada CORS)
   ```javascript
   useSimpleAPI: true
   ```

## 💾 Masalah Database

### Database Connection Error

**Gejala:**
```
Unable to connect to database
SQLSTATE[HY000] [2002]
```

**Solusi:**
1. **Start MySQL di XAMPP**
   ```
   XAMPP Control Panel → Start MySQL
   ```

2. **Cek Database Config**
   ```php
   // .env
   database.default.hostname = localhost
   database.default.database = artikel_db
   database.default.username = root
   database.default.password = 
   ```

3. **Buat Database dan Tabel**
   ```sql
   CREATE DATABASE artikel_db;
   USE artikel_db;
   
   CREATE TABLE artikel (
       id INT AUTO_INCREMENT PRIMARY KEY,
       judul VARCHAR(255) NOT NULL,
       isi TEXT,
       status TINYINT DEFAULT 0,
       gambar TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

### Table Doesn't Exist

**Solusi:**
1. **Import SQL File**
   ```
   phpMyAdmin → Import → artikel.sql
   ```

2. **Atau Gunakan Mode Offline**
   ```javascript
   mode: 'offline' // Data tersimpan di localStorage
   ```

## 📷 Masalah Upload Gambar

### File Too Large

**Gejala:**
```
Ukuran file maksimal 5MB
```

**Solusi:**
1. **Kompres Gambar**
   - Gunakan tools online: tinypng.com
   - Atau resize gambar

2. **Ubah Limit di Config**
   ```javascript
   // config.js
   upload: {
       maxFileSize: 10 * 1024 * 1024 // 10MB
   }
   ```

### Invalid File Format

**Solusi:**
1. **Gunakan Format yang Didukung**
   - JPG, JPEG, PNG, GIF

2. **Convert Format**
   - Gunakan paint/photoshop
   - Save as JPG/PNG

## 🛠️ Tools Debug

### 1. Debug Connection Tool
```
Buka: debug-connection.html
Fungsi: Test semua koneksi dan API
```

### 2. Simple Test App
```
Buka: test-simple.html
Fungsi: Test aplikasi minimal
```

### 3. Browser Console
```
F12 → Console
Lihat error messages dan logs
```

### 4. Network Tab
```
F12 → Network
Monitor request/response API
```

## 🚀 Solusi Cepat

### Jika Semua Gagal - Mode Offline
```javascript
// config.js
window.APP_CONFIG = {
    mode: 'offline',
    api: {
        useSimpleAPI: true
    }
};
```

### Reset Aplikasi
```javascript
// Console browser
localStorage.clear();
location.reload();
```

### Test API Manual
```bash
# GET
curl http://localhost:8080/test-api-simple.php

# POST
curl -X POST http://localhost:8080/test-api-simple.php \
  -H "Content-Type: application/json" \
  -d '{"judul":"Test","isi":"Test content","status":1}'
```

## 📞 Bantuan Lebih Lanjut

Jika masalah masih berlanjut:

1. **Cek File Log**
   - `C:\xampp\apache\logs\error.log`
   - `lab8_vuejs/data/api.log`

2. **Gunakan Debug Tool**
   - Jalankan semua test di `debug-connection.html`

3. **Mode Fallback**
   - Gunakan `test-simple.html` untuk test basic
   - Set `mode: 'offline'` untuk development

4. **Reset Environment**
   ```bash
   # Restart XAMPP
   # Clear browser cache
   # Clear localStorage
   ```

---

**💡 Tips:** Selalu mulai dengan debug tool untuk mengidentifikasi masalah spesifik!
