
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
    $phone = preg_replace('/\D/', '', (string) $phone);

    if (strlen($phone) === 12 && substr($phone, 0, 2) === '91') {
        $phone = substr($phone, 2);
    }

    return $phone;
}
