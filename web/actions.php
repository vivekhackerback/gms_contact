<?php
/**
 * Backend actions handler for Web Management Portal
 */
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../api/db.php';

header('Content-Type: application/json; charset=utf-8');

/**
 * Cleanly sends JSON response, discarding any accidental HTML/PHP warning output
 */
function sendJsonResponse($data, $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'stats':
            getStats($pdo);
            break;
        case 'list':
            getContactsList($pdo);
            break;
        case 'get':
            getSingleContact($pdo);
            break;
        case 'save':
            saveContact($pdo);
            break;
        case 'delete':
            deleteContact($pdo);
            break;
        case 'delete_by_categories':
            deleteByCategories($pdo);
            break;
        case 'import_batch':
            importBatch($pdo);
            break;
        default:
            sendJsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
            break;
    }
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'data' => [],
        'error' => $e->getMessage()
    ], 500);
}

function getStats($pdo) {
    $total = (int)$pdo->query("SELECT COUNT(*) FROM contacts WHERE status = 'Active'")->fetchColumn();
    $typeStmt = $pdo->query("SELECT contact_type, COUNT(*) as cnt FROM contacts WHERE status = 'Active' GROUP BY contact_type");
    $byType = ['student' => 0, 'parent' => 0, 'teacher' => 0, 'staff' => 0, 'driver' => 0, 'management' => 0, 'other' => 0];
    while ($r = $typeStmt->fetch()) {
        $byType[$r['contact_type']] = (int)$r['cnt'];
    }
    sendJsonResponse(['success' => true, 'total' => $total, 'by_type' => $byType]);
}

function getContactsList($pdo) {
    $sql = "
        SELECT 
            c.*,
            s.admission_number, s.class as student_class, s.section as student_section, s.father_name as student_father_name, s.bus_route,
            p.relationship_with_student,
            t.employee_id as teacher_employee_id, t.department_subject, t.designation as teacher_designation,
            st.employee_id as staff_employee_id, st.designation as staff_designation, st.department as staff_department,
            d.driver_id, d.vehicle_number, d.route as driver_route,
            m.designation as management_designation, m.department as management_department
        FROM contacts c
        LEFT JOIN students s ON s.contact_id = c.id
        LEFT JOIN parents p ON p.contact_id = c.id
        LEFT JOIN teachers t ON t.contact_id = c.id
        LEFT JOIN staff st ON st.contact_id = c.id
        LEFT JOIN drivers d ON d.contact_id = c.id
        LEFT JOIN management m ON m.contact_id = c.id
        WHERE c.status = 'Active'
        ORDER BY c.id DESC
    ";
    $rows = $pdo->query($sql)->fetchAll();

    // Fetch children for parents
    $parentIds = array_column(array_filter($rows, fn($r) => $r['contact_type'] === 'parent'), 'id');
    $kidsMap = [];
    if (!empty($parentIds)) {
        $placeholders = implode(',', array_fill(0, count($parentIds), '?'));
        $stmt = $pdo->prepare("SELECT * FROM student_parent WHERE parent_contact_id IN ($placeholders)");
        $stmt->execute($parentIds);
        while ($kid = $stmt->fetch()) {
            $kidsMap[$kid['parent_contact_id']][] = $kid;
        }
    }

    foreach ($rows as &$r) {
        $r['children'] = $kidsMap[$r['id']] ?? [];
    }

    sendJsonResponse(['success' => true, 'data' => $rows]);
}

function getSingleContact($pdo) {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) throw new Exception('Invalid Contact ID');

    $stmt = $pdo->prepare("
        SELECT 
            c.*,
            s.admission_number, s.class as student_class, s.section as student_section, s.father_name as student_father_name,
            s.parent_mobile as student_parent_mobile, s.academic_session, s.roll_number, s.dob as student_dob, s.gender,
            s.mother_name as student_mother_name, s.mother_mobile, s.father_mobile, s.student_whatsapp, s.blood_group,
            s.previous_school, s.transport_required, s.bus_route, s.pickup_point, s.emergency_contact as student_emergency_contact,
            p.relationship_with_student, p.father_name as parent_father_name, p.mother_name as parent_mother_name,
            p.occupation as parent_occupation, p.emergency_contact as parent_emergency_contact,
            t.employee_id as teacher_employee_id, t.department_subject, t.joining_date as teacher_joining_date,
            t.qualification as teacher_qualification, t.classes_assigned, t.section_assigned, t.designation as teacher_designation,
            st.employee_id as staff_employee_id, st.designation as staff_designation, st.department as staff_department,
            st.qualification as staff_qualification, st.joining_date as staff_joining_date,
            d.driver_id, d.license_number, d.vehicle_number, d.vehicle_type, d.route as driver_route,
            m.designation as management_designation, m.department as management_department
        FROM contacts c
        LEFT JOIN students s ON s.contact_id = c.id
        LEFT JOIN parents p ON p.contact_id = c.id
        LEFT JOIN teachers t ON t.contact_id = c.id
        LEFT JOIN staff st ON st.contact_id = c.id
        LEFT JOIN drivers d ON d.contact_id = c.id
        LEFT JOIN management m ON m.contact_id = c.id
        WHERE c.id = ?
        LIMIT 1
    ");
    $stmt->execute([$id]);
    $contact = $stmt->fetch();
    if (!$contact) throw new Exception('Contact not found');

    if ($contact['contact_type'] === 'parent') {
        $cStmt = $pdo->prepare("SELECT * FROM student_parent WHERE parent_contact_id = ?");
        $cStmt->execute([$id]);
        $contact['children'] = $cStmt->fetchAll();
    }

    sendJsonResponse(['success' => true, 'data' => $contact]);
}

function saveContact($pdo) {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? $_POST;

    $id = !empty($data['id']) ? (int)$data['id'] : 0;
    $type = $data['contact_type'] ?? 'student';
    $name = trim($data['full_name'] ?? '');
    $mobile = normalizeMobile($data['mobile_number'] ?? '');
    $altMobile = normalizeMobile($data['alternate_mobile'] ?? '');
    $whatsapp = normalizeMobile($data['whatsapp_number'] ?? $mobile);
    $email = trim($data['email'] ?? '') ?: null;
    $address = trim($data['address'] ?? '') ?: null;
    $city = trim($data['city'] ?? '') ?: null;
    $state = trim($data['state'] ?? '') ?: null;
    $pincode = trim($data['pincode'] ?? '') ?: null;
    $notes = trim($data['notes'] ?? '') ?: null;

    if (empty($name) || empty($mobile)) {
        throw new Exception('Full Name and Mobile Number are required.');
    }

    $pdo->beginTransaction();

    if ($id > 0) {
        $stmt = $pdo->prepare("
            UPDATE contacts SET
                contact_type = ?, full_name = ?, mobile_number = ?, alternate_mobile = ?,
                whatsapp_number = ?, email = ?, address = ?, city = ?, state = ?,
                pincode = ?, notes = ?, sync_version = sync_version + 1, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$type, $name, $mobile, $altMobile ?: null, $whatsapp ?: null, $email, $address, $city, $state, $pincode, $notes, $id]);
    } else {
        $localId = 'web_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6);
        $stmt = $pdo->prepare("
            INSERT INTO contacts (
                local_id, contact_type, full_name, mobile_number, alternate_mobile,
                whatsapp_number, email, address, city, state, pincode, status, notes,
                sync_version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, 1, NOW(), NOW())
        ");
        $stmt->execute([$localId, $type, $name, $mobile, $altMobile ?: null, $whatsapp ?: null, $email, $address, $city, $state, $pincode, $notes]);
        $id = (int)$pdo->lastInsertId();
    }

    // Role-specific upsert
    if ($type === 'student') {
        $adm = trim($data['admission_number'] ?? '');
        $class = trim($data['student_class'] ?? $data['class'] ?? '');
        $sec = trim($data['student_section'] ?? $data['section'] ?? '');
        $father = trim($data['student_father_name'] ?? $data['father_name'] ?? '');
        $pmob = normalizeMobile($data['parent_mobile'] ?? $mobile);
        $route = trim($data['bus_route'] ?? '') ?: null;

        $chk = $pdo->prepare("SELECT id FROM students WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("
                UPDATE students SET
                    student_name = ?, admission_number = ?, class = ?, section = ?,
                    father_name = ?, parent_mobile = ?, bus_route = ?
                WHERE contact_id = ?
            ")->execute([$name, $adm, $class, $sec, $father, $pmob, $route, $id]);
        } else {
            $pdo->prepare("
                INSERT INTO students (contact_id, student_name, admission_number, class, section, father_name, parent_mobile, academic_session, bus_route)
                VALUES (?, ?, ?, ?, ?, ?, ?, '2025-2026', ?)
            ")->execute([$id, $name, $adm, $class, $sec, $father, $pmob, $route]);
        }
    } elseif ($type === 'parent') {
        $rel = trim($data['relationship_with_student'] ?? 'Father');
        $occ = trim($data['occupation'] ?? '') ?: null;
        $chk = $pdo->prepare("SELECT id FROM parents WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("UPDATE parents SET parent_name = ?, relationship_with_student = ?, occupation = ? WHERE contact_id = ?")
                ->execute([$name, $rel, $occ, $id]);
        } else {
            $pdo->prepare("INSERT INTO parents (contact_id, parent_name, relationship_with_student, occupation) VALUES (?, ?, ?, ?)")
                ->execute([$id, $name, $rel, $occ]);
        }
    } elseif ($type === 'teacher') {
        $emp = trim($data['teacher_employee_id'] ?? $data['employee_id'] ?? '');
        $subj = trim($data['department_subject'] ?? '');
        $desig = trim($data['teacher_designation'] ?? 'Teacher');
        $chk = $pdo->prepare("SELECT id FROM teachers WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("UPDATE teachers SET teacher_name = ?, employee_id = ?, department_subject = ?, designation = ? WHERE contact_id = ?")
                ->execute([$name, $emp, $subj, $desig, $id]);
        } else {
            $pdo->prepare("INSERT INTO teachers (contact_id, teacher_name, employee_id, department_subject, designation) VALUES (?, ?, ?, ?, ?)")
                ->execute([$id, $name, $emp, $subj, $desig]);
        }
    } elseif ($type === 'staff') {
        $emp = trim($data['staff_employee_id'] ?? $data['employee_id'] ?? '');
        $desig = trim($data['staff_designation'] ?? 'Staff');
        $dept = trim($data['staff_department'] ?? $data['department'] ?? 'Administration');
        $chk = $pdo->prepare("SELECT id FROM staff WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("UPDATE staff SET staff_name = ?, employee_id = ?, designation = ?, department = ? WHERE contact_id = ?")
                ->execute([$name, $emp, $desig, $dept, $id]);
        } else {
            $pdo->prepare("INSERT INTO staff (contact_id, staff_name, employee_id, designation, department) VALUES (?, ?, ?, ?, ?)")
                ->execute([$id, $name, $emp, $desig, $dept]);
        }
    } elseif ($type === 'driver') {
        $did = trim($data['driver_id'] ?? '');
        $veh = trim($data['vehicle_number'] ?? '');
        $lic = trim($data['license_number'] ?? '');
        $route = trim($data['driver_route'] ?? $data['route'] ?? '');
        $chk = $pdo->prepare("SELECT id FROM drivers WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("UPDATE drivers SET driver_name = ?, driver_id = ?, vehicle_number = ?, license_number = ?, route = ? WHERE contact_id = ?")
                ->execute([$name, $did, $veh, $lic, $route, $id]);
        } else {
            $pdo->prepare("INSERT INTO drivers (contact_id, driver_name, driver_id, vehicle_number, license_number, route) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$id, $name, $did, $veh, $lic, $route]);
        }
    } elseif ($type === 'management') {
        $desig = trim($data['management_designation'] ?? $data['designation'] ?? 'Director');
        $dept = trim($data['management_department'] ?? $data['department'] ?? 'Management');
        $chk = $pdo->prepare("SELECT id FROM management WHERE contact_id = ?");
        $chk->execute([$id]);
        if ($chk->fetch()) {
            $pdo->prepare("UPDATE management SET name = ?, designation = ?, department = ? WHERE contact_id = ?")
                ->execute([$name, $desig, $dept, $id]);
        } else {
            $pdo->prepare("INSERT INTO management (contact_id, name, designation, department) VALUES (?, ?, ?, ?)")
                ->execute([$id, $name, $desig, $dept]);
        }
    }

    $pdo->commit();
    sendJsonResponse(['success' => true, 'id' => $id, 'message' => 'Contact saved successfully!']);
}

function deleteContact($pdo) {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    if ($id <= 0) throw new Exception('Invalid contact ID');

    $stmt = $pdo->prepare("DELETE FROM contacts WHERE id = ?");
    $stmt->execute([$id]);
    sendJsonResponse(['success' => true, 'message' => 'Contact deleted successfully']);
}

function deleteByCategories($pdo) {
    $types = $_POST['categories'] ?? [];
    if (!is_array($types) || empty($types)) {
        throw new Exception('Please select at least one category to delete.');
    }

    $validTypes = ['student', 'parent', 'teacher', 'staff', 'driver', 'management', 'other'];
    $sanitized = [];
    foreach ($types as $t) {
        $t = strtolower(trim((string)$t));
        if (in_array($t, $validTypes, true)) {
            $sanitized[] = $t;
        }
    }

    if (empty($sanitized)) {
        throw new Exception('No valid categories selected.');
    }

    $placeholders = implode(',', array_fill(0, count($sanitized), '?'));

    $pdo->beginTransaction();
    try {
        // Find how many will be deleted
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM contacts WHERE contact_type IN ($placeholders)");
        $countStmt->execute($sanitized);
        $count = (int)$countStmt->fetchColumn();

        if ($count > 0) {
            $deleteStmt = $pdo->prepare("DELETE FROM contacts WHERE contact_type IN ($placeholders)");
            $deleteStmt->execute($sanitized);
        }

        $pdo->commit();

        $catNames = implode(', ', array_map('ucfirst', $sanitized));
        sendJsonResponse([
            'success' => true,
            'deleted_count' => $count,
            'message' => "Successfully deleted $count contact(s) across categories: $catNames."
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function importBatch($pdo) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $rows = $body['rows'] ?? [];

    if (!is_array($rows) || empty($rows)) {
        throw new Exception('No rows provided for import.');
    }

    $imported = 0;
    $skipped = 0;
    $errors = [];

    $pdo->beginTransaction();

    foreach ($rows as $index => $row) {
        try {
            $name = trim($row['full_name'] ?? $row['Name'] ?? '');
            $mob = normalizeMobile($row['mobile_number'] ?? $row['Mobile'] ?? $row['Phone'] ?? '');
            $type = strtolower(trim($row['contact_type'] ?? $row['Role'] ?? $row['Type'] ?? 'student'));

            if (!in_array($type, ['student', 'parent', 'teacher', 'staff', 'driver', 'management', 'other'])) {
                $type = 'student';
            }

            if (empty($name) || empty($mob)) {
                $skipped++;
                continue;
            }

            // If mobile is too short (< 6 digits, e.g. placeholder 59), generate a unique dummy mobile or allow it
            if (empty($mob) || strlen($mob) < 5) {
                $mob = '00000' . rand(10000, 99999);
            }

            // Check duplicate by BOTH mobile and full_name (so siblings sharing parent's mobile won't overwrite each other)
            $chk = $pdo->prepare("SELECT id FROM contacts WHERE mobile_number = ? AND LOWER(full_name) = LOWER(?) LIMIT 1");
            $chk->execute([$mob, $name]);
            $existing = $chk->fetch();

            $contactId = null;
            if ($existing) {
                // Update existing record
                $contactId = (int)$existing['id'];
                $pdo->prepare("
                    UPDATE contacts SET
                        contact_type = ?, full_name = ?,
                        alternate_mobile = ?, email = ?, address = ?, city = ?,
                        updated_at = NOW()
                    WHERE id = ?
                ")->execute([
                    $type, $name,
                    normalizeMobile($row['alternate_mobile'] ?? '') ?: null,
                    $row['email'] ?? null,
                    $row['address'] ?? null,
                    $row['city'] ?? null,
                    $contactId
                ]);
            } else {
                // Insert new contact
                $localId = 'excel_' . time() . '_' . $index . '_' . rand(100, 999);
                $ins = $pdo->prepare("
                    INSERT INTO contacts (
                        local_id, contact_type, full_name, mobile_number, alternate_mobile,
                        email, address, city, state, pincode, status, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, NOW(), NOW())
                ");
                $ins->execute([
                    $localId, $type, $name, $mob,
                    normalizeMobile($row['alternate_mobile'] ?? '') ?: null,
                    $row['email'] ?? null,
                    $row['address'] ?? null,
                    $row['city'] ?? null,
                    $row['state'] ?? null,
                    $row['pincode'] ?? null,
                    $row['notes'] ?? 'Imported from Excel'
                ]);
                $contactId = (int)$pdo->lastInsertId();
            }

            // Role details
            if ($type === 'student') {
                $rawClass = trim($row['class'] ?? $row['Class'] ?? '');
                // Clean class: e.g. "1st" -> "1", "2nd" -> "2", "3rd" -> "3", "4th" -> "4", "5th" -> "5", "6th" -> "6", "7th" -> "7"
                // But preserve NUR, Pre Nur, LKG, UKG
                $cleanClass = $rawClass;
                if (preg_match('/^(\d+)(st|nd|rd|th)$/i', $cleanClass, $m)) {
                    $cleanClass = $m[1];
                } elseif (strcasecmp($cleanClass, 'pre nur') === 0 || strcasecmp($cleanClass, 'prenur') === 0) {
                    $cleanClass = 'PRE-NUR';
                } elseif (strcasecmp($cleanClass, 'nur') === 0) {
                    $cleanClass = 'NUR';
                } elseif (strcasecmp($cleanClass, 'lkg') === 0) {
                    $cleanClass = 'LKG';
                } elseif (strcasecmp($cleanClass, 'ukg') === 0) {
                    $cleanClass = 'UKG';
                }
                if ($cleanClass === '') {
                    $cleanClass = 'NUR';
                }

                $rawAdm = trim($row['admission_number'] ?? $row['Admission_No'] ?? '');
                $adm = !empty($rawAdm) ? $rawAdm : ('ADM' . str_pad((string)$contactId, 4, '0', STR_PAD_LEFT));

                // If admission number is already taken by another student, make it unique
                $admCheck = $pdo->prepare("SELECT id FROM students WHERE admission_number = ? AND contact_id != ? LIMIT 1");
                $admCheck->execute([$adm, $contactId]);
                if ($admCheck->fetch()) {
                    $adm = 'ADM' . $contactId . '_' . rand(100, 999);
                }

                $sec = trim($row['section'] ?? $row['Section'] ?? 'A');
                $father = trim($row['father_name'] ?? $row['Father_Name'] ?? '');
                $route = trim($row['bus_route'] ?? $row['Route'] ?? '') ?: null;

                $sChk = $pdo->prepare("SELECT id FROM students WHERE contact_id = ?");
                $sChk->execute([$contactId]);
                if ($sChk->fetch()) {
                    $pdo->prepare("UPDATE students SET student_name = ?, admission_number = ?, class = ?, section = ?, father_name = ?, parent_mobile = ?, bus_route = ? WHERE contact_id = ?")
                        ->execute([$name, $adm, $cleanClass, $sec, $father, $mob, $route, $contactId]);
                } else {
                    $pdo->prepare("INSERT INTO students (contact_id, student_name, admission_number, class, section, father_name, parent_mobile, academic_session, bus_route) VALUES (?, ?, ?, ?, ?, ?, ?, '2025-2026', ?)")
                        ->execute([$contactId, $name, $adm, $cleanClass, $sec, $father, $mob, $route]);
                }
            } elseif ($type === 'teacher') {
                $emp = trim($row['employee_id'] ?? $row['Emp_ID'] ?? "TCH" . rand(100, 999));
                $subj = trim($row['department_subject'] ?? $row['Subject'] ?? 'General');
                $desig = trim($row['designation'] ?? 'Teacher');

                $tChk = $pdo->prepare("SELECT id FROM teachers WHERE contact_id = ?");
                $tChk->execute([$contactId]);
                if ($tChk->fetch()) {
                    $pdo->prepare("UPDATE teachers SET employee_id = ?, department_subject = ?, designation = ? WHERE contact_id = ?")
                        ->execute([$emp, $subj, $desig, $contactId]);
                } else {
                    $pdo->prepare("INSERT INTO teachers (contact_id, teacher_name, employee_id, department_subject, designation) VALUES (?, ?, ?, ?, ?)")
                        ->execute([$contactId, $name, $emp, $subj, $desig]);
                }
            } elseif ($type === 'parent') {
                $rel = trim($row['relationship_with_student'] ?? $row['Relation'] ?? 'Father');
                $pChk = $pdo->prepare("SELECT id FROM parents WHERE contact_id = ?");
                $pChk->execute([$contactId]);
                if (!$pChk->fetch()) {
                    $pdo->prepare("INSERT INTO parents (contact_id, parent_name, relationship_with_student) VALUES (?, ?, ?)")
                        ->execute([$contactId, $name, $rel]);
                }
            }

            $imported++;
        } catch (Exception $rowErr) {
            $errors[] = "Row #" . ($index + 1) . ": " . $rowErr->getMessage();
        }
    }

    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'imported_count' => $imported,
        'skipped_count' => $skipped,
        'errors' => $errors,
        'message' => "Successfully imported {$imported} contacts" . ($skipped > 0 ? " ({$skipped} skipped)" : "")
    ]);
}
