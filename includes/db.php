<?php
/* =====================================================
   FESTPRO - Database Configuration
   Place this project in: C:/xampp/htdocs/festpro/
   ===================================================== */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Default XAMPP user
define('DB_PASS', '');             // Default XAMPP password (empty)
define('DB_NAME', 'festpro_db');

function getDB() {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            http_response_code(500);
            die(json_encode(['error' => 'DB connection failed: ' . $conn->connect_error]));
        }
        $conn->set_charset('utf8mb4');
    }
    return $conn;
}

// CORS headers for API
function setCORSHeaders() {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}