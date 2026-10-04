<?php
require_once __DIR__ . '/db.php';

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

$pendingContacts = $body['pending_contacts'] ?? [];
$lastSyncTime = $body['last_sync_time'] ?? null;
$syncResults = [];

foreach ($pendingContacts as $item) {
    try {
        $serverId = !empty($item['server_id']) ? (int)$item['server_id'] : null;
        $localId = $item['local_id'] ?? null;

        if (!$serverId && !empty($localId)) {
            $chk = $pdo->prepare("SELECT id FROM contacts WHERE local_id = ? LIMIT 1");
            $chk->execute([$localId]);
            $found = $chk->fetch();
            if ($found) {
                $serverId = (int)$found['id'];
            }
        }

        $fullName = trim($item['full_name'] ?? '');
        $mobile = normalizeMobile($item['mobile_number'] ?? '');
        $altMobile = normalizeMobile($item['alternate_mobile'] ?? null);
        $whatsapp = normalizeMobile($item['whatsapp_number'] ?? $mobile);
        $contactType = $item['contact_type'] ?? 'student';

        if ($serverId) {
            // Update
            $up = $pdo->prepare("
                UPDATE contacts SET
                    full_name = :fname,
                    mobile_number = :mob,
                    alternate_mobile = :alt,
                    whatsapp_number = :wa,
                    email = :email,
                    address = :addr,
                    city = :city,
                    state = :state,
                    pincode = :pin,
                    profile_photo = :photo,
                    status = :status,
                    notes = :notes,
                    sync_version = sync_version + 1,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $up->execute([
                ':fname' => $fullName,
                ':mob' => $mobile,
                ':alt' => $altMobile,
                ':wa' => $whatsapp,
                ':email' => $item['email'] ?? null,
                ':addr' => $item['address'] ?? null,
                ':city' => $item['city'] ?? null,
                ':state' => $item['state'] ?? null,
                ':pin' => $item['pincode'] ?? null,
                ':photo' => $item['profile_photo'] ?? null,
                ':status' => $item['status'] ?? 'Active',
                ':notes' => $item['notes'] ?? null,
                ':id' => $serverId
            ]);
        } else {
            // Insert
            $ins = $pdo->prepare("
                INSERT INTO contacts (
                    local_id, contact_type, full_name, mobile_number, alternate_mobile,
                    whatsapp_number, email, address, city, state, pincode, profile_photo,
                    status, notes, sync_version, created_at, updated_at
                ) VALUES (
                    :lid, :ctype, :fname, :mob, :alt,
                    :wa, :email, :addr, :city, :state, :pin, :photo,
                    :status, :notes, 1, NOW(), NOW()
                )
            ");
            $ins->execute([
                ':lid' => $localId,
                ':ctype' => $contactType,
                ':fname' => $fullName,
                ':mob' => $mobile,
                ':alt' => $altMobile,
                ':wa' => $whatsapp,
                ':email' => $item['email'] ?? null,
                ':addr' => $item['address'] ?? null,
                ':city' => $item['city'] ?? null,
                ':state' => $item['state'] ?? null,
                ':pin' => $item['pincode'] ?? null,
                ':photo' => $item['profile_photo'] ?? null,
                ':status' => $item['status'] ?? 'Active',
                ':notes' => $item['notes'] ?? null
            ]);
            $serverId = (int)$pdo->lastInsertId();

            // Insert subtype
            if ($contactType === 'student' && !empty($item['student_details'])) {
                $s = $item['student_details'];
                $sIns = $pdo->prepare("
                    INSERT INTO students (
                        contact_id, student_name, admission_number, class, section,
                        father_name, parent_mobile, academic_session, roll_number, dob,
                        gender, mother_name, transport_required, bus_route
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $sIns->execute([
                    $serverId,
                    $fullName,
                    $s['admission_number'] ?? '',
                    $s['class'] ?? '',
                    $s['section'] ?? '',
                    $s['father_name'] ?? '',
                    normalizeMobile($s['parent_mobile'] ?? ''),
                    $s['academic_session'] ?? '2025-2026',
                    $s['roll_number'] ?? null,
                    $s['dob'] ?? null,
                    $s['gender'] ?? null,
                    $s['mother_name'] ?? null,
                    !empty($s['transport_required']) ? 1 : 0,
                    $s['bus_route'] ?? null
                ]);
            }
        }

        $syncResults[] = [
            'local_id' => $localId,
            'server_id' => $serverId,
            'status' => 'synced',
            'synced_at' => date('c')
        ];
    } catch (Exception $e) {
        $syncResults[] = [
            'local_id' => $item['local_id'] ?? null,
            'server_id' => $item['server_id'] ?? null,
            'status' => 'error',
            'error' => $e->getMessage()
        ];
    }
}

// Check for updates on server since lastSyncTime
$serverUpdates = [];
if (!empty($lastSyncTime)) {
    try {
        $updStmt = $pdo->prepare("SELECT id FROM contacts WHERE updated_at > :lst ORDER BY updated_at ASC");
        $updStmt->execute([':lst' => $lastSyncTime]);
        $updateIds = $updStmt->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($updateIds)) {
            // Load full contact details for each updated ID
            // Simple select
            $placeholders = implode(',', array_fill(0, count($updateIds), '?'));
            $rowsStmt = $pdo->prepare("SELECT * FROM contacts WHERE id IN ({$placeholders})");
            $rowsStmt->execute($updateIds);
            $serverUpdates = $rowsStmt->fetchAll();
        }
    } catch (Exception $e) {
        // Ignore update fetch errors
    }
}

echo json_encode([
    'success' => true,
    'synced_contacts' => $syncResults,
    'server_updates' => $serverUpdates,
    'sync_timestamp' => date('c'),
    'message' => 'Batch synchronization completed'
], JSON_UNESCAPED_UNICODE);
