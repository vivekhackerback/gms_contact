<?php
require_once __DIR__ . '/db.php';

$mobile = isset($_GET['mobile']) ? normalizeMobile($_GET['mobile']) : '';
$adm = isset($_GET['admission_number']) ? trim($_GET['admission_number']) : '';
$emp = isset($_GET['employee_id']) ? trim($_GET['employee_id']) : '';
$excludeId = isset($_GET['exclude_id']) ? (int)$_GET['exclude_id'] : 0;

try {
    $duplicateContactId = null;

    if (!empty($mobile)) {
        $stmt = $pdo->prepare("SELECT id FROM contacts WHERE mobile_number = :mob AND id != :ex LIMIT 1");
        $stmt->execute([':mob' => $mobile, ':ex' => $excludeId]);
        $row = $stmt->fetch();
        if ($row) {
            $duplicateContactId = (int)$row['id'];
        }
    }

    if (!$duplicateContactId && !empty($adm)) {
        $stmt = $pdo->prepare("SELECT contact_id FROM students WHERE LOWER(TRIM(admission_number)) = LOWER(TRIM(:adm)) AND contact_id != :ex LIMIT 1");
        $stmt->execute([':adm' => $adm, ':ex' => $excludeId]);
        $row = $stmt->fetch();
        if ($row) {
            $duplicateContactId = (int)$row['contact_id'];
        }
    }

    if (!$duplicateContactId && !empty($emp)) {
        $stmt = $pdo->prepare("SELECT contact_id FROM teachers WHERE LOWER(TRIM(employee_id)) = LOWER(TRIM(:emp)) AND contact_id != :ex LIMIT 1");
        $stmt->execute([':emp' => $emp, ':ex' => $excludeId]);
        $row = $stmt->fetch();
        if ($row) {
            $duplicateContactId = (int)$row['contact_id'];
        } else {
            $stmt = $pdo->prepare("SELECT contact_id FROM staff WHERE LOWER(TRIM(employee_id)) = LOWER(TRIM(:emp)) AND contact_id != :ex LIMIT 1");
            $stmt->execute([':emp' => $emp, ':ex' => $excludeId]);
            $row = $stmt->fetch();
            if ($row) {
                $duplicateContactId = (int)$row['contact_id'];
            }
        }
    }

    $duplicate = null;
    if ($duplicateContactId) {
        $stmt = $pdo->prepare("SELECT * FROM contacts WHERE id = ?");
        $stmt->execute([$duplicateContactId]);
        $duplicate = $stmt->fetch();
    }

    echo json_encode([
        'exists' => !empty($duplicate),
        'contact' => $duplicate
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'exists' => false,
        'error' => $e->getMessage()
    ]);
}
