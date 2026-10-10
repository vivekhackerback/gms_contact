
<?php

// 1. Show errors only in server logs
ini_set('display_errors', '0');
error_reporting(E_ALL);

// 2. Allow API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// 3. Handle browser preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 4. Database settings
$isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', [
    'localhost',
    '127.0.0.1'
]);

if ($isLocal) {
    $host = 'localhost';
    $user = 'root';
    $pass = '';
    $dbname = 'school_contacts_db';
} else {
    $host = 'localhost';
    $user = 'YOUR_DATABASE_USERNAME';
    $pass = 'YOUR_DATABASE_PASSWORD';
    $dbname = 'YOUR_DATABASE_NAME';
}

// 5. Connect to MySQL
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);

    exit;
}

// 6. Clean Indian mobile numbers
function normalizeMobile($phone)
{
    $digits = preg_replace('/\D/', '', (string) $phone);

    // If starts with 91 and has 12 digits: remove 91
    if (strlen($digits) === 12 && substr($digits, 0, 2) === '91') {
        $digits = substr($digits, 2);
    }
    // If starts with 0 and has 11 digits: remove 0
    elseif (strlen($digits) === 11 && substr($digits, 0, 1) === '0') {
        $digits = substr($digits, 1);
    }

    return $digits;
}
