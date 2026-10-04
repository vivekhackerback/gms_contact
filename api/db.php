<?php
// CORS and Security Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = 'localhost';
$db_user = 'u109731178_gms_contact_u';
$db_pass = 'Vivek@8651615629';
$db_name = 'u109731178_gms_contact_db';

try {
    $pdo = new PDO(
        "mysql:host={$db_host};dbname={$db_name};charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

/**
 * Helper to normalize Indian phone number (removes +91 or leading 91)
 */
function normalizeMobile($phone) {
    if (!$phone) return '';
    $cleaned = preg_replace('/[^0-9+]/', '', (string)$phone);
    if (strpos($cleaned, '+91') === 0) {
        $cleaned = substr($cleaned, 3);
    } elseif (strpos($cleaned, '91') === 0 && strlen($cleaned) > 10) {
        $cleaned = substr($cleaned, 2);
    }
    return $cleaned;
}
