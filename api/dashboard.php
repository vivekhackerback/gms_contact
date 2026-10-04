<?php
require_once __DIR__ . '/db.php';

try {
    // Total active contacts
    $totalStmt = $pdo->query("SELECT COUNT(*) AS total FROM contacts WHERE status = 'Active'");
    $total = (int)$totalStmt->fetch()['total'];

    // Group by contact_type
    $typeStmt = $pdo->query("
        SELECT contact_type, COUNT(*) AS count 
        FROM contacts 
        WHERE status = 'Active' 
        GROUP BY contact_type
    ");

    $byType = [
        'student' => 0,
        'parent' => 0,
        'teacher' => 0,
        'staff' => 0,
        'driver' => 0,
        'management' => 0,
        'other' => 0
    ];

    while ($row = $typeStmt->fetch()) {
        $t = $row['contact_type'];
        if (isset($byType[$t])) {
            $byType[$t] = (int)$row['count'];
        } else {
            $byType['other'] += (int)$row['count'];
        }
    }

    echo json_encode([
        'success' => true,
        'total_contacts' => $total,
        'by_type' => $byType,
        'server_time' => date('c')
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
