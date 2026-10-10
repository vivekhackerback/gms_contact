<?php
/**
 * ============================================================================
 * Central Database Connection & API Configuration File
 * ============================================================================
 * 
 * WHEN IS THIS FILE USED?
 * - Included by all mobile backend APIs (get_contacts.php, save_contact.php, etc.)
 * - Included by the web portal backend (web/actions.php)
 * 
 * WHY IS THIS FILE USED?
 * 1. Provides a single centralized place to manage MySQL database credentials.
 * 2. Enables Cross-Origin Resource Sharing (CORS) so the React Native mobile app
 *    and web browser can securely communicate with the server.
 * 3. Handles preflight HTTP requests (OPTIONS) required by modern browsers.
 * 4. Automatically detects whether you are running on:
 *      a) Live Production Server (Hostinger/cPanel)
 *      b) Local Development Server (XAMPP, WAMP, or Native Apache on laptop)
 *    so you never have to manually edit passwords when switching environments.
 * 5. Provides global utility helper functions (like phone number normalization).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CORS (Cross-Origin Resource Sharing) & Security Response Headers
// ----------------------------------------------------------------------------
// WHY: Modern web browsers and mobile apps block API calls from different domains/ports
// unless the server explicitly permits it using these HTTP headers.

// Prevent PHP warnings/notices from corrupting JSON API outputs
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Allow any client (React Native app, web browser, localhost, live domain) to connect
header('Access-Control-Allow-Origin: *');

// Allow standard REST API HTTP methods
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Allow common request headers like JSON Content-Type and custom auth/ngrok headers
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning');

// Ensure all responses are formatted as standard UTF-8 JSON
header('Content-Type: application/json; charset=utf-8');


// ----------------------------------------------------------------------------
// 2. Preflight (OPTIONS) Request Handling
// ----------------------------------------------------------------------------
// WHY: Before sending POST, PUT, or DELETE requests with custom headers, web browsers
// automatically send an "OPTIONS" request (a preflight check) to ask if the server permits it.
// If the server does not respond with HTTP 200 OK immediately, the real API call will fail.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// ----------------------------------------------------------------------------
// 3. Multi-Environment Database Configurations
// ----------------------------------------------------------------------------
// Detect if running on local environment (laptop / XAMPP / Apache)
$is_local_env = (
    in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1']) ||
    in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1']) ||
    php_sapi_name() === 'cli'
);

// Prioritize local credentials on localhost, and production credentials on live server
$db_configs = $is_local_env
    ? [
        // Localhost Development (XAMPP / Wamp - default root user)
        [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'name' => 'school_contacts_db'
        ],
        [
            'host' => '127.0.0.1',
            'user' => 'root',
            'pass' => '',
            'name' => 'school_contacts_db'
        ],
        [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'name' => 'u109731178_gms_contact_db'
        ],
        [
            'host' => 'localhost',
            'user' => 'u109731178_gms_contact_u',
            'pass' => 'Vivek@8651615629',
            'name' => 'u109731178_gms_contact_db'
        ]
    ]
    : [
        // Live Production Server (Hostinger / cPanel)
        [
            'host' => 'localhost',
            'user' => 'u109731178_gms_contact_u',
            'pass' => 'Vivek@8651615629',
            'name' => 'u109731178_gms_contact_db'
        ],
        [
            'host' => 'localhost',
            'user' => 'root',
            'pass' => '',
            'name' => 'school_contacts_db'
        ]
    ];


// ----------------------------------------------------------------------------
// 4. Establishing Database Connection (PDO)
// ----------------------------------------------------------------------------
// WHY: PDO (PHP Data Objects) is the modern, secure standard in PHP for database
// operations. It protects against SQL injection attacks when using prepared statements.

$pdo = null;
$last_error = null;

foreach ($db_configs as $cfg) {
    try {
        // Use @ to prevent PHP from printing warnings to standard output if a trial fails
        $pdo = @new PDO(
            "mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4",
            $cfg['user'],
            $cfg['pass'],
            [
                // Throw exceptions whenever an SQL error occurs (easier debugging)
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                
                // Return query results as associative arrays: $row['column_name']
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                
                // Use true prepared statements handled by MySQL for maximum security
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        // Connection succeeded! Stop trying remaining configurations
        break;
    } catch (PDOException $e) {
        // Record the error and try the next configuration in the list
        $last_error = $e->getMessage();
    }
}

// If none of the configurations connected successfully, return an HTTP 500 error response
if (!$pdo) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . ($last_error ?? 'Unknown error')
    ]);
    exit;
}


// ----------------------------------------------------------------------------
// 5. Helper Utilities
// ----------------------------------------------------------------------------

/**
 * Normalizes Indian Mobile Numbers
 * 
 * WHEN TO USE:
 * - When saving or searching mobile numbers entered by users or imported via Excel.
 * 
 * WHY:
 * - Users may enter numbers in various formats: "+91 9876543210", "919876543210", 
 *   or "98765-43210".
 * - This function strips spaces, hyphens, and the country code (+91) so all numbers
 *   are stored cleanly as standard 10-digit mobile numbers for consistent searching
 *   and WhatsApp direct messaging.
 * 
 * @param string|null $phone The raw input phone number
 * @return string Cleaned 10-digit phone number
 */
function normalizeMobile($phone) {
    if (!$phone) return '';
    
    // Remove all characters except digits and plus sign
    $cleaned = preg_replace('/[^0-9+]/', '', (string)$phone);
    
    // Remove leading '+91'
    if (strpos($cleaned, '+91') === 0) {
        $cleaned = substr($cleaned, 3);
    } 
    // Remove leading '91' if the length exceeds 10 digits
    elseif (strpos($cleaned, '91') === 0 && strlen($cleaned) > 10) {
        $cleaned = substr($cleaned, 2);
    }
    
    return $cleaned;
}
