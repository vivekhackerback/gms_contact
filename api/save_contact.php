<?php
require_once __DIR__ . '/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

try {
    $pdo->beginTransaction();

    $contactId = isset($data['id']) && (int)$data['id'] > 0 ? (int)$data['id'] : 0;
    if (!$contactId && isset($data['server_id']) && (int)$data['server_id'] > 0) {
        $contactId = (int)$data['server_id'];
    }

    $localId = $data['local_id'] ?? null;
    $contactType = $data['contact_type'] ?? 'student';
    $fullName = trim($data['full_name'] ?? '');
    $mobile = normalizeMobile($data['mobile_number'] ?? '');
    $altMobile = normalizeMobile($data['alternate_mobile'] ?? null);
    $whatsapp = normalizeMobile($data['whatsapp_number'] ?? $mobile);
    $email = $data['email'] ?? null;
    $address = $data['address'] ?? null;
    $city = $data['city'] ?? null;
    $state = $data['state'] ?? null;
    $pincode = $data['pincode'] ?? null;
    $photo = $data['profile_photo'] ?? null;
    $status = $data['status'] ?? 'Active';
    $notes = $data['notes'] ?? null;

    if (empty($fullName) || empty($mobile)) {
        throw new Exception('Full name and mobile number are required.');
    }

    if ($contactId > 0) {
        // UPDATE existing contact
        $stmt = $pdo->prepare("
            UPDATE contacts SET
                contact_type = :ctype,
                full_name = :fname,
                mobile_number = :mobile,
                alternate_mobile = :alt,
                whatsapp_number = :wa,
                email = :email,
                address = :address,
                city = :city,
                state = :state,
                pincode = :pincode,
                profile_photo = :photo,
                status = :status,
                notes = :notes,
                sync_version = sync_version + 1,
                updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':ctype' => $contactType,
            ':fname' => $fullName,
            ':mobile' => $mobile,
            ':alt' => $altMobile,
            ':wa' => $whatsapp,
            ':email' => $email,
            ':address' => $address,
            ':city' => $city,
            ':state' => $state,
            ':pincode' => $pincode,
            ':photo' => $photo,
            ':status' => $status,
            ':notes' => $notes,
            ':id' => $contactId
        ]);
    } else {
        // INSERT new contact
        $stmt = $pdo->prepare("
            INSERT INTO contacts (
                local_id, contact_type, full_name, mobile_number, alternate_mobile,
                whatsapp_number, email, address, city, state, pincode, profile_photo,
                status, notes, sync_version, created_at, updated_at
            ) VALUES (
                :local_id, :ctype, :fname, :mobile, :alt,
                :wa, :email, :address, :city, :state, :pincode, :photo,
                :status, :notes, 1, NOW(), NOW()
            )
        ");
        $stmt->execute([
            ':local_id' => $localId,
            ':ctype' => $contactType,
            ':fname' => $fullName,
            ':mobile' => $mobile,
            ':alt' => $altMobile,
            ':wa' => $whatsapp,
            ':email' => $email,
            ':address' => $address,
            ':city' => $city,
            ':state' => $state,
            ':pincode' => $pincode,
            ':photo' => $photo,
            ':status' => $status,
            ':notes' => $notes
        ]);
        $contactId = (int)$pdo->lastInsertId();
    }

    // Role-specific upsert
    if ($contactType === 'student' && !empty($data['student_details'])) {
        $s = $data['student_details'];
        $check = $pdo->prepare("SELECT id FROM students WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE students SET
                    student_name = :sname,
                    admission_number = :adm,
                    class = :class,
                    section = :sec,
                    father_name = :fname,
                    parent_mobile = :pmob,
                    academic_session = :session,
                    roll_number = :roll,
                    dob = :dob,
                    gender = :gender,
                    mother_name = :mname,
                    mother_mobile = :mmob,
                    father_mobile = :fmob,
                    guardian_mobile = :gmob,
                    student_whatsapp = :swa,
                    blood_group = :bg,
                    previous_school = :prev,
                    transport_required = :trans,
                    bus_route = :route,
                    pickup_point = :pickup,
                    emergency_contact = :emg
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':sname' => $fullName,
                ':adm' => $s['admission_number'] ?? '',
                ':class' => $s['class'] ?? '',
                ':sec' => $s['section'] ?? '',
                ':fname' => $s['father_name'] ?? '',
                ':pmob' => normalizeMobile($s['parent_mobile'] ?? ''),
                ':session' => $s['academic_session'] ?? '2025-2026',
                ':roll' => $s['roll_number'] ?? null,
                ':dob' => $s['dob'] ?? null,
                ':gender' => $s['gender'] ?? null,
                ':mname' => $s['mother_name'] ?? null,
                ':mmob' => normalizeMobile($s['mother_mobile'] ?? null),
                ':fmob' => normalizeMobile($s['father_mobile'] ?? null),
                ':gmob' => normalizeMobile($s['guardian_mobile'] ?? null),
                ':swa' => normalizeMobile($s['student_whatsapp'] ?? null),
                ':bg' => $s['blood_group'] ?? null,
                ':prev' => $s['previous_school'] ?? null,
                ':trans' => !empty($s['transport_required']) ? 1 : 0,
                ':route' => $s['bus_route'] ?? null,
                ':pickup' => $s['pickup_point'] ?? null,
                ':emg' => $s['emergency_contact'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO students (
                    contact_id, student_name, admission_number, class, section,
                    father_name, parent_mobile, academic_session, roll_number, dob,
                    gender, mother_name, mother_mobile, father_mobile, guardian_mobile,
                    student_whatsapp, blood_group, previous_school, transport_required,
                    bus_route, pickup_point, emergency_contact
                ) VALUES (
                    :cid, :sname, :adm, :class, :sec,
                    :fname, :pmob, :session, :roll, :dob,
                    :gender, :mname, :mmob, :fmob, :gmob,
                    :swa, :bg, :prev, :trans,
                    :route, :pickup, :emg
                )
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':sname' => $fullName,
                ':adm' => $s['admission_number'] ?? '',
                ':class' => $s['class'] ?? '',
                ':sec' => $s['section'] ?? '',
                ':fname' => $s['father_name'] ?? '',
                ':pmob' => normalizeMobile($s['parent_mobile'] ?? ''),
                ':session' => $s['academic_session'] ?? '2025-2026',
                ':roll' => $s['roll_number'] ?? null,
                ':dob' => $s['dob'] ?? null,
                ':gender' => $s['gender'] ?? null,
                ':mname' => $s['mother_name'] ?? null,
                ':mmob' => normalizeMobile($s['mother_mobile'] ?? null),
                ':fmob' => normalizeMobile($s['father_mobile'] ?? null),
                ':gmob' => normalizeMobile($s['guardian_mobile'] ?? null),
                ':swa' => normalizeMobile($s['student_whatsapp'] ?? null),
                ':bg' => $s['blood_group'] ?? null,
                ':prev' => $s['previous_school'] ?? null,
                ':trans' => !empty($s['transport_required']) ? 1 : 0,
                ':route' => $s['bus_route'] ?? null,
                ':pickup' => $s['pickup_point'] ?? null,
                ':emg' => $s['emergency_contact'] ?? null
            ]);
        }
    } elseif ($contactType === 'parent' && !empty($data['parent_details'])) {
        $p = $data['parent_details'];
        $check = $pdo->prepare("SELECT id FROM parents WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE parents SET
                    parent_name = :pname,
                    relationship_with_student = :rel,
                    father_name = :faname,
                    mother_name = :moname,
                    occupation = :occ,
                    emergency_contact = :emg
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':pname' => $fullName,
                ':rel' => $p['relationship_with_student'] ?? 'Parent',
                ':faname' => $p['father_name'] ?? null,
                ':moname' => $p['mother_name'] ?? null,
                ':occ' => $p['occupation'] ?? null,
                ':emg' => $p['emergency_contact'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO parents (
                    contact_id, parent_name, relationship_with_student,
                    father_name, mother_name, occupation, emergency_contact
                ) VALUES (:cid, :pname, :rel, :faname, :moname, :occ, :emg)
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':pname' => $fullName,
                ':rel' => $p['relationship_with_student'] ?? 'Parent',
                ':faname' => $p['father_name'] ?? null,
                ':moname' => $p['mother_name'] ?? null,
                ':occ' => $p['occupation'] ?? null,
                ':emg' => $p['emergency_contact'] ?? null
            ]);
        }

        // Children mapping
        $kids = $p['children'] ?? ($data['children'] ?? []);
        if (is_array($kids)) {
            $delKids = $pdo->prepare("DELETE FROM student_parent WHERE parent_contact_id = ?");
            $delKids->execute([$contactId]);

            $insKid = $pdo->prepare("
                INSERT INTO student_parent (
                    parent_contact_id, student_contact_id, student_name,
                    student_admission_number, class_section, relationship
                ) VALUES (:pcid, :scid, :sname, :adm, :cs, :rel)
            ");
            foreach ($kids as $k) {
                $insKid->execute([
                    ':pcid' => $contactId,
                    ':scid' => $k['student_contact_id'] ?? null,
                    ':sname' => $k['student_name'] ?? '',
                    ':adm' => $k['student_admission_number'] ?? '',
                    ':cs' => $k['class_section'] ?? '',
                    ':rel' => $p['relationship_with_student'] ?? 'Parent'
                ]);
            }
        }
    } elseif ($contactType === 'teacher' && !empty($data['teacher_details'])) {
        $t = $data['teacher_details'];
        $check = $pdo->prepare("SELECT id FROM teachers WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE teachers SET
                    teacher_name = :tname,
                    employee_id = :empid,
                    department_subject = :subj,
                    joining_date = :jdate,
                    qualification = :qual,
                    classes_assigned = :cls,
                    section_assigned = :sec,
                    designation = :desig,
                    dob = :dob,
                    emergency_contact = :emg
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':tname' => $fullName,
                ':empid' => $t['employee_id'] ?? '',
                ':subj' => $t['department_subject'] ?? '',
                ':jdate' => $t['joining_date'] ?? null,
                ':qual' => $t['qualification'] ?? null,
                ':cls' => $t['classes_assigned'] ?? null,
                ':sec' => $t['section_assigned'] ?? null,
                ':desig' => $t['designation'] ?? 'Teacher',
                ':dob' => $t['dob'] ?? null,
                ':emg' => $t['emergency_contact'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO teachers (
                    contact_id, teacher_name, employee_id, department_subject,
                    joining_date, qualification, classes_assigned, section_assigned,
                    designation, dob, emergency_contact
                ) VALUES (
                    :cid, :tname, :empid, :subj,
                    :jdate, :qual, :cls, :sec,
                    :desig, :dob, :emg
                )
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':tname' => $fullName,
                ':empid' => $t['employee_id'] ?? '',
                ':subj' => $t['department_subject'] ?? '',
                ':jdate' => $t['joining_date'] ?? null,
                ':qual' => $t['qualification'] ?? null,
                ':cls' => $t['classes_assigned'] ?? null,
                ':sec' => $t['section_assigned'] ?? null,
                ':desig' => $t['designation'] ?? 'Teacher',
                ':dob' => $t['dob'] ?? null,
                ':emg' => $t['emergency_contact'] ?? null
            ]);
        }
    } elseif ($contactType === 'staff' && !empty($data['staff_details'])) {
        $st = $data['staff_details'];
        $check = $pdo->prepare("SELECT id FROM staff WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE staff SET
                    staff_name = :sname,
                    employee_id = :empid,
                    designation = :desig,
                    department = :dept,
                    joining_date = :jdate,
                    qualification = :qual,
                    emergency_contact = :emg
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':sname' => $fullName,
                ':empid' => $st['employee_id'] ?? '',
                ':desig' => $st['designation'] ?? '',
                ':dept' => $st['department'] ?? '',
                ':jdate' => $st['joining_date'] ?? null,
                ':qual' => $st['qualification'] ?? null,
                ':emg' => $st['emergency_contact'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO staff (
                    contact_id, staff_name, employee_id, designation,
                    department, joining_date, qualification, emergency_contact
                ) VALUES (:cid, :sname, :empid, :desig, :dept, :jdate, :qual, :emg)
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':sname' => $fullName,
                ':empid' => $st['employee_id'] ?? '',
                ':desig' => $st['designation'] ?? '',
                ':dept' => $st['department'] ?? '',
                ':jdate' => $st['joining_date'] ?? null,
                ':qual' => $st['qualification'] ?? null,
                ':emg' => $st['emergency_contact'] ?? null
            ]);
        }
    } elseif ($contactType === 'driver' && !empty($data['driver_details'])) {
        $d = $data['driver_details'];
        $check = $pdo->prepare("SELECT id FROM drivers WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE drivers SET
                    driver_name = :dname,
                    driver_id = :dnum,
                    license_number = :lic,
                    vehicle_number = :veh,
                    license_expiry_date = :exp,
                    vehicle_type = :type,
                    route = :route,
                    emergency_contact = :emg
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':dname' => $fullName,
                ':dnum' => $d['driver_id'] ?? '',
                ':lic' => $d['license_number'] ?? '',
                ':veh' => $d['vehicle_number'] ?? '',
                ':exp' => $d['license_expiry_date'] ?? null,
                ':type' => $d['vehicle_type'] ?? null,
                ':route' => $d['route'] ?? null,
                ':emg' => $d['emergency_contact'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO drivers (
                    contact_id, driver_name, driver_id, license_number,
                    vehicle_number, license_expiry_date, vehicle_type, route, emergency_contact
                ) VALUES (:cid, :dname, :dnum, :lic, :veh, :exp, :type, :route, :emg)
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':dname' => $fullName,
                ':dnum' => $d['driver_id'] ?? '',
                ':lic' => $d['license_number'] ?? '',
                ':veh' => $d['vehicle_number'] ?? '',
                ':exp' => $d['license_expiry_date'] ?? null,
                ':type' => $d['vehicle_type'] ?? null,
                ':route' => $d['route'] ?? null,
                ':emg' => $d['emergency_contact'] ?? null
            ]);
        }
    } elseif ($contactType === 'management' && !empty($data['management_details'])) {
        $m = $data['management_details'];
        $check = $pdo->prepare("SELECT id FROM management WHERE contact_id = ?");
        $check->execute([$contactId]);
        $exists = $check->fetch();

        if ($exists) {
            $up = $pdo->prepare("
                UPDATE management SET
                    name = :name,
                    designation = :desig,
                    department = :dept
                WHERE contact_id = :cid
            ");
            $up->execute([
                ':name' => $fullName,
                ':desig' => $m['designation'] ?? 'Director',
                ':dept' => $m['department'] ?? null,
                ':cid' => $contactId
            ]);
        } else {
            $ins = $pdo->prepare("
                INSERT INTO management (contact_id, name, designation, department)
                VALUES (:cid, :name, :desig, :dept)
            ");
            $ins->execute([
                ':cid' => $contactId,
                ':name' => $fullName,
                ':desig' => $m['designation'] ?? 'Director',
                ':dept' => $m['department'] ?? null
            ]);
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'server_id' => $contactId,
        'local_id' => $localId,
        'message' => 'Contact saved successfully'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
