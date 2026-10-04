<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$user = 'u109731178_gms_contact_u';
$pass = 'Vivek@8651615629';
$db = 'u109731178_gms_contact_db';

$response = [
  'server_php' => phpversion(),
  'mysql_connection' => false,
  'database_exists' => false,
  'tables' => []
];

try {
  $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);
  $response['mysql_connection'] = true;

  // Check if school_contacts_db exists
  $stmt = $pdo->query("SHOW DATABASES LIKE '$db'");
  if ($stmt->fetch()) {
    $response['database_exists'] = true;
    $pdo->query("USE `$db`");
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $response['tables'] = $tables;
  }
} catch (Exception $e) {
  $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);
