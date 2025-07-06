<?php
/**
 * API Sederhana untuk Vue.js Article Management
 * Fallback API jika CodeIgniter bermasalah
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// File untuk menyimpan data
$dataFile = __DIR__ . '/data/artikel.json';
$logFile = __DIR__ . '/data/api.log';

// Pastikan folder data ada
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

// Function untuk logging
function logRequest($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

// Function untuk membaca data
function readData() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        // Data dummy awal
        $initialData = [
            [
                'id' => 1,
                'judul' => 'Artikel Pertama',
                'isi' => 'Ini adalah isi dari artikel pertama. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                'status' => 1,
                'gambar' => null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 2,
                'judul' => 'Artikel Kedua',
                'isi' => 'Ini adalah isi dari artikel kedua. Ut enim ad minim veniam, quis nostrud exercitation.',
                'status' => 0,
                'gambar' => null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]
        ];
        writeData($initialData);
        return $initialData;
    }
    
    $data = file_get_contents($dataFile);
    return json_decode($data, true) ?: [];
}

// Function untuk menulis data
function writeData($data) {
    global $dataFile;
    return file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Function untuk response JSON
function jsonResponse($data, $success = true, $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Get request method dan path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Log request
logRequest("$method $path - " . json_encode($_REQUEST));

try {
    switch ($method) {
        case 'GET':
            // GET /test-api-simple.php - Get all articles
            $articles = readData();
            jsonResponse($articles, true, 'Data berhasil diambil');
            break;
            
        case 'POST':
            // POST /test-api-simple.php - Create new article
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                jsonResponse(null, false, 'Data tidak valid', 400);
            }
            
            if (empty($input['judul'])) {
                jsonResponse(null, false, 'Judul artikel wajib diisi', 400);
            }
            
            $articles = readData();
            $maxId = 0;
            foreach ($articles as $article) {
                if ($article['id'] > $maxId) {
                    $maxId = $article['id'];
                }
            }
            
            $newArticle = [
                'id' => $maxId + 1,
                'judul' => trim($input['judul']),
                'isi' => trim($input['isi'] ?? ''),
                'status' => (int)($input['status'] ?? 0),
                'gambar' => $input['gambar'] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            array_unshift($articles, $newArticle);
            writeData($articles);
            
            jsonResponse($newArticle, true, 'Artikel berhasil ditambahkan');
            break;
            
        case 'PUT':
            // PUT /test-api-simple.php/{id} - Update article
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                jsonResponse(null, false, 'Data tidak valid', 400);
            }
            
            // Extract ID from URL or input
            $id = null;
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];
            } elseif (isset($input['id'])) {
                $id = (int)$input['id'];
            }
            
            if (!$id) {
                jsonResponse(null, false, 'ID artikel tidak ditemukan', 400);
            }
            
            $articles = readData();
            $found = false;
            
            for ($i = 0; $i < count($articles); $i++) {
                if ($articles[$i]['id'] == $id) {
                    $articles[$i]['judul'] = trim($input['judul']);
                    $articles[$i]['isi'] = trim($input['isi'] ?? '');
                    $articles[$i]['status'] = (int)($input['status'] ?? 0);
                    $articles[$i]['gambar'] = $input['gambar'] ?? $articles[$i]['gambar'];
                    $articles[$i]['updated_at'] = date('Y-m-d H:i:s');
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                jsonResponse(null, false, 'Artikel tidak ditemukan', 404);
            }
            
            writeData($articles);
            jsonResponse($articles[$i], true, 'Artikel berhasil diperbarui');
            break;
            
        case 'DELETE':
            // DELETE /test-api-simple.php/{id} - Delete article
            $id = null;
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];
            }
            
            if (!$id) {
                jsonResponse(null, false, 'ID artikel tidak ditemukan', 400);
            }
            
            $articles = readData();
            $found = false;
            
            for ($i = 0; $i < count($articles); $i++) {
                if ($articles[$i]['id'] == $id) {
                    array_splice($articles, $i, 1);
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                jsonResponse(null, false, 'Artikel tidak ditemukan', 404);
            }
            
            writeData($articles);
            jsonResponse(null, true, 'Artikel berhasil dihapus');
            break;
            
        default:
            jsonResponse(null, false, 'Method tidak didukung', 405);
            break;
    }
    
} catch (Exception $e) {
    logRequest("ERROR: " . $e->getMessage());
    jsonResponse(null, false, 'Terjadi kesalahan server: ' . $e->getMessage(), 500);
}
?>
