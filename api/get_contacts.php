<?php
require_once __DIR__ . '/db.php';

try {
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $class_val = isset($_GET['class_val']) ? trim($_GET['class_val']) : '';
    $section = isset($_GET['section']) ? trim($_GET['section']) : '';
    $subject = isset($_GET['subject']) ? trim($_GET['subject']) : '';
    $department = isset($_GET['department']) ? trim($_GET['department']) : '';

    $where = ["c.status = 'Active'"];
    $params = [];

    if ($type !== '' && $type !== 'all') {
        $where[] = "c.contact_type = :type";
        $params[':type'] = $type;
    }

    if ($class_val !== '') {
        $where[] = "s.class = :class_val";
        $params[':class_val'] = $class_val;
    }

    if ($section !== '') {
        $where[] = "s.section = :section";
        $params[':section'] = $section;
    }

    if ($subject !== '') {
        $where[] = "t.department_subject LIKE :subject";
        $params[':subject'] = "%{$subject}%";
    }

    if ($department !== '') {
        $where[] = "(t.department_subject LIKE :dept1 OR st.department LIKE :dept2 OR m.department LIKE :dept3)";
        $params[':dept1'] = "%{$department}%";
        $params[':dept2'] = "%{$department}%";
        $params[':dept3'] = "%{$department}%";
    }

    if ($search !== '') {
        $where[] = "(
            c.full_name LIKE :s1 OR 
            c.mobile_number LIKE :s2 OR 
            c.alternate_mobile LIKE :s3 OR 
            c.notes LIKE :s4 OR 
            s.admission_number LIKE :s5 OR 
            s.father_name LIKE :s6 OR 
            s.bus_route LIKE :s7 OR 
            t.employee_id LIKE :s8 OR 
            t.department_subject LIKE :s9 OR 
            st.employee_id LIKE :s10 OR 
            st.designation LIKE :s11 OR 
            d.driver_id LIKE :s12 OR 
            d.vehicle_number LIKE :s13 OR 
            d.route LIKE :s14 OR 
            m.designation LIKE :s15
        )";
        $searchTerm = "%{$search}%";
        for ($i = 1; $i <= 15; $i++) {
            $params[":s{$i}"] = $searchTerm;
        }
    }

    $whereSql = implode(' AND ', $where);

    $sql = "
        SELECT 
            c.*,
            -- Student fields
            s.id AS student_id, s.student_name, s.admission_number, s.class AS student_class, s.section AS student_section,
            s.father_name AS student_father_name, s.parent_mobile AS student_parent_mobile, s.academic_session,
            s.roll_number, s.dob AS student_dob, s.gender, s.mother_name AS student_mother_name,
            s.mother_mobile, s.father_mobile, s.guardian_mobile, s.student_whatsapp, s.blood_group,
            s.previous_school, s.transport_required, s.bus_route, s.pickup_point, s.emergency_contact AS student_emergency_contact,
            -- Parent fields
            p.id AS parent_id, p.parent_name, p.relationship_with_student AS parent_relationship, p.father_name AS parent_father_name,
            p.mother_name AS parent_mother_name, p.occupation, p.emergency_contact AS parent_emergency_contact,
            -- Teacher fields
            t.id AS teacher_id, t.teacher_name, t.employee_id AS teacher_employee_id, t.department_subject, t.joining_date AS teacher_joining_date,
            t.qualification AS teacher_qualification, t.classes_assigned, t.section_assigned, t.designation AS teacher_designation,
            t.dob AS teacher_dob, t.emergency_contact AS teacher_emergency_contact,
            -- Staff fields
            st.id AS staff_id, st.staff_name, st.employee_id AS staff_employee_id, st.designation AS staff_designation,
            st.department AS staff_department, st.joining_date AS staff_joining_date,
            st.qualification AS staff_qualification, st.emergency_contact AS staff_emergency_contact,
            -- Driver fields
            d.id AS driver_id_col, d.driver_name, d.driver_id, d.license_number, d.vehicle_number, d.license_expiry_date,
            d.vehicle_type, d.route AS driver_route, d.emergency_contact AS driver_emergency_contact,
            -- Management fields
            m.id AS management_id, m.name AS management_name, m.designation AS management_designation, m.department AS management_department
        FROM contacts c
        LEFT JOIN students s ON s.contact_id = c.id
        LEFT JOIN parents p ON p.contact_id = c.id
        LEFT JOIN teachers t ON t.contact_id = c.id
        LEFT JOIN staff st ON st.contact_id = c.id
        LEFT JOIN drivers d ON d.contact_id = c.id
        LEFT JOIN management m ON m.contact_id = c.id
        WHERE {$whereSql}
        ORDER BY c.full_name ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Collect parent IDs to fetch their children in a single query
    $parentIds = [];
    foreach ($rows as $r) {
        if ($r['contact_type'] === 'parent') {
            $parentIds[] = (int)$r['id'];
        }
    }

    $childrenMap = [];
    if (!empty($parentIds)) {
        $placeholders = implode(',', array_fill(0, count($parentIds), '?'));
        $childStmt = $pdo->prepare("SELECT * FROM student_parent WHERE parent_contact_id IN ({$placeholders})");
        $childStmt->execute($parentIds);
        while ($ch = $childStmt->fetch()) {
            $pid = (int)$ch['parent_contact_id'];
            if (!isset($childrenMap[$pid])) {
                $childrenMap[$pid] = [];
            }
            $childrenMap[$pid][] = $ch;
        }
    }

    $contacts = [];
    foreach ($rows as $row) {
        $contactId = (int)$row['id'];
        $c = [
            'id' => $contactId,
            'server_id' => $contactId,
            'local_id' => $row['local_id'] ?: "loc_srv_{$contactId}",
            'contact_type' => $row['contact_type'],
            'full_name' => $row['full_name'],
            'mobile_number' => $row['mobile_number'],
            'alternate_mobile' => $row['alternate_mobile'],
            'whatsapp_number' => $row['whatsapp_number'],
            'email' => $row['email'],
            'address' => $row['address'],
            'city' => $row['city'],
            'state' => $row['state'],
            'pincode' => $row['pincode'],
            'profile_photo' => $row['profile_photo'],
            'status' => $row['status'],
            'notes' => $row['notes'],
            'sync_status' => 'synced',
            'sync_version' => (int)($row['sync_version'] ?: 1),
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];

        if ($row['contact_type'] === 'student' && !empty($row['admission_number'])) {
            $c['student_details'] = [
                'id' => (int)$row['student_id'],
                'contact_id' => $contactId,
                'student_name' => $row['student_name'] ?: $row['full_name'],
                'admission_number' => $row['admission_number'],
                'class' => $row['student_class'],
                'section' => $row['student_section'],
                'father_name' => $row['student_father_name'],
                'parent_mobile' => $row['student_parent_mobile'],
                'academic_session' => $row['academic_session'],
                'roll_number' => $row['roll_number'],
                'dob' => $row['student_dob'],
                'gender' => $row['gender'],
                'mother_name' => $row['student_mother_name'],
                'mother_mobile' => $row['mother_mobile'],
                'father_mobile' => $row['father_mobile'],
                'guardian_mobile' => $row['guardian_mobile'],
                'student_whatsapp' => $row['student_whatsapp'],
                'blood_group' => $row['blood_group'],
                'previous_school' => $row['previous_school'],
                'transport_required' => (int)$row['transport_required'],
                'bus_route' => $row['bus_route'],
                'pickup_point' => $row['pickup_point'],
                'emergency_contact' => $row['student_emergency_contact']
            ];
            $c['admission_number'] = $row['admission_number'];
            $c['student_class'] = $row['student_class'];
            $c['student_section'] = $row['student_section'];
            $c['father_name'] = $row['student_father_name'];
            $c['parent_mobile'] = $row['student_parent_mobile'];
        } elseif ($row['contact_type'] === 'parent') {
            $kids = $childrenMap[$contactId] ?? [];
            $c['parent_details'] = [
                'id' => (int)$row['parent_id'],
                'contact_id' => $contactId,
                'parent_name' => $row['parent_name'] ?: $row['full_name'],
                'relationship_with_student' => $row['parent_relationship'],
                'father_name' => $row['parent_father_name'],
                'mother_name' => $row['parent_mother_name'],
                'occupation' => $row['occupation'],
                'emergency_contact' => $row['parent_emergency_contact'],
                'children' => $kids
            ];
            $c['children'] = $kids;
            $c['relationship_with_student'] = $row['parent_relationship'];
        } elseif ($row['contact_type'] === 'teacher' && !empty($row['teacher_employee_id'])) {
            $c['teacher_details'] = [
                'id' => (int)$row['teacher_id'],
                'contact_id' => $contactId,
                'teacher_name' => $row['teacher_name'] ?: $row['full_name'],
                'employee_id' => $row['teacher_employee_id'],
                'department_subject' => $row['department_subject'],
                'joining_date' => $row['teacher_joining_date'],
                'qualification' => $row['teacher_qualification'],
                'classes_assigned' => $row['classes_assigned'],
                'section_assigned' => $row['section_assigned'],
                'designation' => $row['teacher_designation'] ?: 'Teacher',
                'dob' => $row['teacher_dob'],
                'emergency_contact' => $row['teacher_emergency_contact']
            ];
            $c['teacher_employee_id'] = $row['teacher_employee_id'];
            $c['department_subject'] = $row['department_subject'];
            $c['classes_assigned'] = $row['classes_assigned'];
        } elseif ($row['contact_type'] === 'staff' && !empty($row['staff_employee_id'])) {
            $c['staff_details'] = [
                'id' => (int)$row['staff_id'],
                'contact_id' => $contactId,
                'staff_name' => $row['staff_name'] ?: $row['full_name'],
                'employee_id' => $row['staff_employee_id'],
                'designation' => $row['staff_designation'],
                'department' => $row['staff_department'],
                'joining_date' => $row['staff_joining_date'],
                'qualification' => $row['staff_qualification'],
                'emergency_contact' => $row['staff_emergency_contact']
            ];
            $c['staff_employee_id'] = $row['staff_employee_id'];
            $c['staff_designation'] = $row['staff_designation'];
            $c['staff_department'] = $row['staff_department'];
        } elseif ($row['contact_type'] === 'driver' && !empty($row['driver_id'])) {
            $c['driver_details'] = [
                'id' => (int)$row['driver_id_col'],
                'contact_id' => $contactId,
                'driver_name' => $row['driver_name'] ?: $row['full_name'],
                'driver_id' => $row['driver_id'],
                'license_number' => $row['license_number'],
                'vehicle_number' => $row['vehicle_number'],
                'license_expiry_date' => $row['license_expiry_date'],
                'vehicle_type' => $row['vehicle_type'],
                'route' => $row['driver_route'],
                'emergency_contact' => $row['driver_emergency_contact']
            ];
            $c['driver_id'] = $row['driver_id'];
            $c['vehicle_number'] = $row['vehicle_number'];
            $c['route'] = $row['driver_route'];
        } elseif ($row['contact_type'] === 'management') {
            $c['management_details'] = [
                'id' => (int)$row['management_id'],
                'contact_id' => $contactId,
                'name' => $row['management_name'] ?: $row['full_name'],
                'designation' => $row['management_designation'],
                'department' => $row['management_department']
            ];
            $c['management_designation'] = $row['management_designation'];
        }

        $contacts[] = $c;
    }

    echo json_encode([
        'success' => true,
        'count' => count($contacts),
        'data' => $contacts
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
