require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper: Normalize Indian mobile number
function normalizeMobile(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

// Helper: Format contact row from SQL join into standardized object
function formatContactRow(row, childrenMap = new Map()) {
  const contact = {
    id: row.id,
    server_id: row.id,
    local_id: row.local_id,
    contact_type: row.contact_type,
    full_name: row.full_name,
    mobile_number: row.mobile_number,
    alternate_mobile: row.alternate_mobile || null,
    whatsapp_number: row.whatsapp_number || null,
    email: row.email || null,
    address: row.address || null,
    city: row.city || null,
    state: row.state || null,
    pincode: row.pincode || null,
    profile_photo: row.profile_photo || null,
    status: row.status,
    notes: row.notes || null,
    sync_version: row.sync_version || 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

  if (row.contact_type === 'student' && row.admission_number) {
    contact.student_details = {
      id: row.student_id,
      contact_id: row.id,
      student_name: row.student_name || row.full_name,
      admission_number: row.admission_number,
      class: row.student_class,
      section: row.student_section,
      father_name: row.student_father_name,
      parent_mobile: row.student_parent_mobile,
      academic_session: row.academic_session,
      roll_number: row.roll_number,
      dob: row.student_dob,
      gender: row.gender,
      mother_name: row.student_mother_name,
      mother_mobile: row.mother_mobile,
      father_mobile: row.father_mobile,
      guardian_mobile: row.guardian_mobile,
      student_whatsapp: row.student_whatsapp,
      blood_group: row.blood_group,
      previous_school: row.previous_school,
      transport_required: row.transport_required ? 1 : 0,
      bus_route: row.bus_route,
      pickup_point: row.pickup_point,
      emergency_contact: row.student_emergency_contact
    };
    contact.admission_number = row.admission_number;
    contact.student_class = row.student_class;
    contact.student_section = row.student_section;
    contact.father_name = row.student_father_name;
    contact.parent_mobile = row.student_parent_mobile;
  } else if (row.contact_type === 'parent') {
    contact.parent_details = {
      id: row.parent_id,
      contact_id: row.id,
      parent_name: row.parent_name || row.full_name,
      relationship_with_student: row.parent_relationship,
      father_name: row.parent_father_name,
      mother_name: row.parent_mother_name,
      occupation: row.occupation,
      emergency_contact: row.parent_emergency_contact,
      children: childrenMap.get(row.id) || []
    };
    contact.children = childrenMap.get(row.id) || [];
    contact.relationship_with_student = row.parent_relationship;
  } else if (row.contact_type === 'teacher' && row.teacher_employee_id) {
    contact.teacher_details = {
      id: row.teacher_id,
      contact_id: row.id,
      teacher_name: row.teacher_name || row.full_name,
      employee_id: row.teacher_employee_id,
      department_subject: row.department_subject,
      joining_date: row.teacher_joining_date,
      qualification: row.teacher_qualification,
      classes_assigned: row.classes_assigned,
      section_assigned: row.section_assigned,
      designation: row.teacher_designation,
      dob: row.teacher_dob,
      emergency_contact: row.teacher_emergency_contact
    };
    contact.teacher_employee_id = row.teacher_employee_id;
    contact.department_subject = row.department_subject;
    contact.classes_assigned = row.classes_assigned;
  } else if (row.contact_type === 'staff' && row.staff_employee_id) {
    contact.staff_details = {
      id: row.staff_id,
      contact_id: row.id,
      staff_name: row.staff_name || row.full_name,
      employee_id: row.staff_employee_id,
      designation: row.staff_designation,
      department: row.staff_department,
      joining_date: row.staff_joining_date,
      qualification: row.staff_qualification,
      emergency_contact: row.staff_emergency_contact
    };
    contact.staff_employee_id = row.staff_employee_id;
    contact.staff_designation = row.staff_designation;
    contact.staff_department = row.staff_department;
  } else if (row.contact_type === 'driver' && row.driver_id) {
    contact.driver_details = {
      id: row.driver_id_col,
      contact_id: row.id,
      driver_name: row.driver_name || row.full_name,
      driver_id: row.driver_id,
      license_number: row.license_number,
      vehicle_number: row.vehicle_number,
      license_expiry_date: row.license_expiry_date,
      vehicle_type: row.vehicle_type,
      route: row.driver_route,
      emergency_contact: row.driver_emergency_contact
    };
    contact.driver_id = row.driver_id;
    contact.vehicle_number = row.vehicle_number;
    contact.route = row.driver_route;
  } else if (row.contact_type === 'management') {
    contact.management_details = {
      id: row.management_id,
      contact_id: row.id,
      name: row.management_name || row.full_name,
      designation: row.management_designation,
      department: row.management_department
    };
    contact.management_designation = row.management_designation;
  }

  return contact;
}

// Full SELECT query combining contacts with respective role tables
const BASE_SELECT_QUERY = `
  SELECT 
    c.*,
    -- Student fields
    s.id as student_id, s.student_name, s.admission_number, s.class as student_class, s.section as student_section,
    s.father_name as student_father_name, s.parent_mobile as student_parent_mobile, s.academic_session,
    s.roll_number, s.dob as student_dob, s.gender, s.mother_name as student_mother_name,
    s.mother_mobile, s.father_mobile, s.guardian_mobile, s.student_whatsapp, s.blood_group,
    s.previous_school, s.transport_required, s.bus_route, s.pickup_point, s.emergency_contact as student_emergency_contact,
    -- Parent fields
    p.id as parent_id, p.parent_name, p.relationship_with_student as parent_relationship, p.father_name as parent_father_name,
    p.mother_name as parent_mother_name, p.occupation, p.emergency_contact as parent_emergency_contact,
    -- Teacher fields
    t.id as teacher_id, t.teacher_name, t.employee_id as teacher_employee_id, t.department_subject, t.joining_date as teacher_joining_date,
    t.qualification as teacher_qualification, t.classes_assigned, t.section_assigned, t.designation as teacher_designation,
    t.dob as teacher_dob, t.emergency_contact as teacher_emergency_contact,
    -- Staff fields
    st.id as staff_id, st.staff_name, st.employee_id as staff_employee_id, st.designation as staff_designation,
    st.department as staff_department, st.joining_date as staff_joining_date,
    st.qualification as staff_qualification, st.emergency_contact as staff_emergency_contact,
    -- Driver fields
    d.id as driver_id_col, d.driver_name, d.driver_id, d.license_number, d.vehicle_number, d.license_expiry_date,
    d.vehicle_type, d.route as driver_route, d.emergency_contact as driver_emergency_contact,
    -- Management fields
    m.id as management_id, m.name as management_name, m.designation as management_designation, m.department as management_department
  FROM contacts c
  LEFT JOIN students s ON s.contact_id = c.id
  LEFT JOIN parents p ON p.contact_id = c.id
  LEFT JOIN teachers t ON t.contact_id = c.id
  LEFT JOIN staff st ON st.contact_id = c.id
  LEFT JOIN drivers d ON d.contact_id = c.id
  LEFT JOIN management m ON m.contact_id = c.id
`;

// Helper: Fetch single full contact by ID
async function getFullContactById(contactId) {
  const rows = await query(`${BASE_SELECT_QUERY} WHERE c.id = ?`, [contactId]);
  if (!rows || rows.length === 0) return null;

  const childrenRows = await query(
    `SELECT * FROM student_parent WHERE parent_contact_id = ?`,
    [contactId]
  );
  const childrenMap = new Map();
  childrenMap.set(Number(contactId), childrenRows);

  return formatContactRow(rows[0], childrenMap);
}

// ---------------------------------------------------------------------
// 1. Health check & Dashboard Stats
// ---------------------------------------------------------------------
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalRows = await query(
      `SELECT COUNT(*) as total FROM contacts WHERE status = 'Active'`
    );
    const total = totalRows[0]?.total || 0;

    const typeRows = await query(
      `SELECT contact_type, COUNT(*) as count FROM contacts WHERE status = 'Active' GROUP BY contact_type`
    );

    const byType = {
      student: 0,
      parent: 0,
      teacher: 0,
      staff: 0,
      driver: 0,
      management: 0,
      other: 0
    };

    typeRows.forEach(r => {
      if (byType[r.contact_type] !== undefined) {
        byType[r.contact_type] = r.count;
      } else {
        byType.other += r.count;
      }
    });

    res.json({
      success: true,
      total_contacts: total,
      by_type: byType,
      server_time: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// 2. Duplicate Detection Check
// ---------------------------------------------------------------------
app.get('/api/contacts/check-duplicate', async (req, res) => {
  const { mobile, admission_number, employee_id, exclude_id } = req.query;
  const normalized = normalizeMobile(mobile);
  const excludeIdNum = exclude_id ? Number(exclude_id) : 0;

  try {
    let duplicateContact = null;

    if (normalized) {
      const rows = await query(
        `SELECT id FROM contacts WHERE mobile_number = ? AND id != ? LIMIT 1`,
        [normalized, excludeIdNum]
      );
      if (rows.length > 0) {
        duplicateContact = await getFullContactById(rows[0].id);
      }
    }

    if (!duplicateContact && admission_number) {
      const rows = await query(
        `SELECT contact_id FROM students WHERE LOWER(TRIM(admission_number)) = LOWER(TRIM(?)) AND contact_id != ? LIMIT 1`,
        [admission_number, excludeIdNum]
      );
      if (rows.length > 0) {
        duplicateContact = await getFullContactById(rows[0].contact_id);
      }
    }

    if (!duplicateContact && employee_id) {
      const empTrimmed = employee_id.trim();
      const teacherRows = await query(
        `SELECT contact_id FROM teachers WHERE LOWER(TRIM(employee_id)) = LOWER(TRIM(?)) AND contact_id != ? LIMIT 1`,
        [empTrimmed, excludeIdNum]
      );
      if (teacherRows.length > 0) {
        duplicateContact = await getFullContactById(teacherRows[0].contact_id);
      } else {
        const staffRows = await query(
          `SELECT contact_id FROM staff WHERE LOWER(TRIM(employee_id)) = LOWER(TRIM(?)) AND contact_id != ? LIMIT 1`,
          [empTrimmed, excludeIdNum]
        );
        if (staffRows.length > 0) {
          duplicateContact = await getFullContactById(staffRows[0].contact_id);
        }
      }
    }

    res.json({
      exists: !!duplicateContact,
      contact: duplicateContact
    });
  } catch (err) {
    console.error('Check duplicate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// 3. Get Contacts (with filter and search)
// ---------------------------------------------------------------------
app.get('/api/contacts', async (req, res) => {
  try {
    const { type, search, class_val, section, subject, department } = req.query;

    let whereClauses = [`c.status = 'Active'`];
    let params = [];

    if (type && type !== 'all') {
      whereClauses.push(`c.contact_type = ?`);
      params.push(type);
    }

    if (class_val) {
      whereClauses.push(`s.class = ?`);
      params.push(class_val);
    }

    if (section) {
      whereClauses.push(`s.section = ?`);
      params.push(section);
    }

    if (subject) {
      whereClauses.push(`t.department_subject LIKE ?`);
      params.push(`%${subject}%`);
    }

    if (department) {
      whereClauses.push(`(t.department_subject LIKE ? OR st.department LIKE ? OR m.department LIKE ?)`);
      params.push(`%${department}%`, `%${department}%`, `%${department}%`);
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      whereClauses.push(`(
        c.full_name LIKE ? OR 
        c.mobile_number LIKE ? OR 
        c.alternate_mobile LIKE ? OR 
        c.notes LIKE ? OR
        s.admission_number LIKE ? OR
        s.father_name LIKE ? OR
        s.bus_route LIKE ? OR
        t.employee_id LIKE ? OR
        t.department_subject LIKE ? OR
        st.employee_id LIKE ? OR
        st.designation LIKE ? OR
        d.driver_id LIKE ? OR
        d.vehicle_number LIKE ? OR
        d.route LIKE ? OR
        m.designation LIKE ?
      )`);
      for (let i = 0; i < 15; i++) params.push(q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const rows = await query(`${BASE_SELECT_QUERY} ${whereSql} ORDER BY c.full_name ASC`, params);

    // Fetch children for parents
    const parentContactIds = rows.filter(r => r.contact_type === 'parent').map(r => r.id);
    const childrenMap = new Map();
    if (parentContactIds.length > 0) {
      const placeholders = parentContactIds.map(() => '?').join(',');
      const childrenRows = await query(
        `SELECT * FROM student_parent WHERE parent_contact_id IN (${placeholders})`,
        parentContactIds
      );
      childrenRows.forEach(ch => {
        if (!childrenMap.has(ch.parent_contact_id)) {
          childrenMap.set(ch.parent_contact_id, []);
        }
        childrenMap.get(ch.parent_contact_id).push(ch);
      });
    }

    const data = rows.map(r => formatContactRow(r, childrenMap));

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// 4. Get Contact by ID
// ---------------------------------------------------------------------
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await getFullContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (err) {
    console.error('Error fetching contact by ID:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// 5. Create Contact
// ---------------------------------------------------------------------
app.post('/api/contacts', async (req, res) => {
  const data = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const normalizedMobile = normalizeMobile(data.mobile_number);
    const altMobile = normalizeMobile(data.alternate_mobile) || null;
    const whatsappMobile = normalizeMobile(data.whatsapp_number || normalizedMobile);

    const [contactResult] = await conn.query(
      `INSERT INTO contacts (
        local_id, contact_type, full_name, mobile_number, alternate_mobile,
        whatsapp_number, email, address, city, state, pincode, profile_photo,
        status, notes, sync_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        data.local_id || null,
        data.contact_type,
        data.full_name,
        normalizedMobile,
        altMobile,
        whatsappMobile,
        data.email || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.pincode || null,
        data.profile_photo || null,
        data.status || 'Active',
        data.notes || null
      ]
    );

    const contactId = contactResult.insertId;

    // Role-specific inserts
    if (data.contact_type === 'student' && data.student_details) {
      const s = data.student_details;
      await conn.query(
        `INSERT INTO students (
          contact_id, student_name, admission_number, class, section,
          father_name, parent_mobile, academic_session, roll_number, dob,
          gender, mother_name, mother_mobile, father_mobile, guardian_mobile,
          student_whatsapp, blood_group, previous_school, transport_required,
          bus_route, pickup_point, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          s.admission_number,
          s.class,
          s.section,
          s.father_name,
          normalizeMobile(s.parent_mobile),
          s.academic_session,
          s.roll_number || null,
          s.dob || null,
          s.gender || null,
          s.mother_name || null,
          normalizeMobile(s.mother_mobile) || null,
          normalizeMobile(s.father_mobile) || null,
          normalizeMobile(s.guardian_mobile) || null,
          normalizeMobile(s.student_whatsapp) || null,
          s.blood_group || null,
          s.previous_school || null,
          s.transport_required ? 1 : 0,
          s.bus_route || null,
          s.pickup_point || null,
          s.emergency_contact || null
        ]
      );
    } else if (data.contact_type === 'parent' && data.parent_details) {
      const p = data.parent_details;
      await conn.query(
        `INSERT INTO parents (
          contact_id, parent_name, relationship_with_student, father_name,
          mother_name, occupation, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          p.relationship_with_student,
          p.father_name || null,
          p.mother_name || null,
          p.occupation || null,
          p.emergency_contact || null
        ]
      );

      if (Array.isArray(p.children) && p.children.length > 0) {
        for (const child of p.children) {
          await conn.query(
            `INSERT INTO student_parent (
              parent_contact_id, student_contact_id, student_name,
              student_admission_number, class_section, relationship
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              contactId,
              child.student_contact_id || null,
              child.student_name,
              child.student_admission_number || null,
              child.class_section || null,
              p.relationship_with_student
            ]
          );
        }
      }
    } else if (data.contact_type === 'teacher' && data.teacher_details) {
      const t = data.teacher_details;
      await conn.query(
        `INSERT INTO teachers (
          contact_id, teacher_name, employee_id, department_subject,
          joining_date, qualification, classes_assigned, section_assigned,
          designation, dob, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          t.employee_id,
          t.department_subject,
          t.joining_date || null,
          t.qualification || null,
          t.classes_assigned || null,
          t.section_assigned || null,
          t.designation || 'Teacher',
          t.dob || null,
          t.emergency_contact || null
        ]
      );
    } else if (data.contact_type === 'staff' && data.staff_details) {
      const st = data.staff_details;
      await conn.query(
        `INSERT INTO staff (
          contact_id, staff_name, employee_id, designation,
          department, joining_date, qualification, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          st.employee_id,
          st.designation,
          st.department,
          st.joining_date || null,
          st.qualification || null,
          st.emergency_contact || null
        ]
      );
    } else if (data.contact_type === 'driver' && data.driver_details) {
      const d = data.driver_details;
      await conn.query(
        `INSERT INTO drivers (
          contact_id, driver_name, driver_id, license_number,
          vehicle_number, license_expiry_date, vehicle_type, route, emergency_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          d.driver_id,
          d.license_number,
          d.vehicle_number,
          d.license_expiry_date || null,
          d.vehicle_type || null,
          d.route || null,
          d.emergency_contact || null
        ]
      );
    } else if (data.contact_type === 'management' && data.management_details) {
      const m = data.management_details;
      await conn.query(
        `INSERT INTO management (
          contact_id, name, designation, department
        ) VALUES (?, ?, ?, ?)`,
        [
          contactId,
          data.full_name,
          m.designation,
          m.department || null
        ]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      server_id: contactId,
      local_id: data.local_id || null,
      message: 'Contact created successfully'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating contact:', err);
    res.status(400).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------
// 6. Update Contact
// ---------------------------------------------------------------------
app.put('/api/contacts/:id', async (req, res) => {
  const contactId = Number(req.params.id);
  const data = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.query(`SELECT * FROM contacts WHERE id = ?`, [contactId]);
    if (existingRows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const existing = existingRows[0];
    const fullName = data.full_name || existing.full_name;

    await conn.query(
      `UPDATE contacts SET
        full_name = ?,
        mobile_number = ?,
        alternate_mobile = ?,
        whatsapp_number = ?,
        email = ?,
        address = ?,
        city = ?,
        state = ?,
        pincode = ?,
        profile_photo = ?,
        status = ?,
        notes = ?,
        sync_version = sync_version + 1,
        updated_at = NOW()
      WHERE id = ?`,
      [
        fullName,
        normalizeMobile(data.mobile_number) || existing.mobile_number,
        normalizeMobile(data.alternate_mobile) || existing.alternate_mobile,
        normalizeMobile(data.whatsapp_number) || existing.whatsapp_number,
        data.email !== undefined ? data.email : existing.email,
        data.address !== undefined ? data.address : existing.address,
        data.city !== undefined ? data.city : existing.city,
        data.state !== undefined ? data.state : existing.state,
        data.pincode !== undefined ? data.pincode : existing.pincode,
        data.profile_photo !== undefined ? data.profile_photo : existing.profile_photo,
        data.status || existing.status,
        data.notes !== undefined ? data.notes : existing.notes,
        contactId
      ]
    );

    // Update role tables
    if (existing.contact_type === 'student' && data.student_details) {
      const s = data.student_details;
      await conn.query(
        `UPDATE students SET
          student_name = ?,
          admission_number = COALESCE(?, admission_number),
          class = COALESCE(?, class),
          section = COALESCE(?, section),
          father_name = COALESCE(?, father_name),
          parent_mobile = COALESCE(?, parent_mobile),
          academic_session = COALESCE(?, academic_session),
          roll_number = ?,
          dob = ?,
          gender = ?,
          mother_name = ?,
          mother_mobile = ?,
          father_mobile = ?,
          guardian_mobile = ?,
          student_whatsapp = ?,
          blood_group = ?,
          previous_school = ?,
          transport_required = ?,
          bus_route = ?,
          pickup_point = ?,
          emergency_contact = ?
        WHERE contact_id = ?`,
        [
          fullName,
          s.admission_number,
          s.class,
          s.section,
          s.father_name,
          normalizeMobile(s.parent_mobile),
          s.academic_session,
          s.roll_number || null,
          s.dob || null,
          s.gender || null,
          s.mother_name || null,
          normalizeMobile(s.mother_mobile) || null,
          normalizeMobile(s.father_mobile) || null,
          normalizeMobile(s.guardian_mobile) || null,
          normalizeMobile(s.student_whatsapp) || null,
          s.blood_group || null,
          s.previous_school || null,
          s.transport_required ? 1 : 0,
          s.bus_route || null,
          s.pickup_point || null,
          s.emergency_contact || null,
          contactId
        ]
      );
    } else if (existing.contact_type === 'parent' && data.parent_details) {
      const p = data.parent_details;
      await conn.query(
        `UPDATE parents SET
          parent_name = ?,
          relationship_with_student = COALESCE(?, relationship_with_student),
          father_name = ?,
          mother_name = ?,
          occupation = ?,
          emergency_contact = ?
        WHERE contact_id = ?`,
        [
          fullName,
          p.relationship_with_student,
          p.father_name || null,
          p.mother_name || null,
          p.occupation || null,
          p.emergency_contact || null,
          contactId
        ]
      );

      if (Array.isArray(p.children)) {
        await conn.query(`DELETE FROM student_parent WHERE parent_contact_id = ?`, [contactId]);
        for (const ch of p.children) {
          await conn.query(
            `INSERT INTO student_parent (
              parent_contact_id, student_contact_id, student_name,
              student_admission_number, class_section, relationship
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              contactId,
              ch.student_contact_id || null,
              ch.student_name,
              ch.student_admission_number || null,
              ch.class_section || null,
              p.relationship_with_student
            ]
          );
        }
      }
    } else if (existing.contact_type === 'teacher' && data.teacher_details) {
      const t = data.teacher_details;
      await conn.query(
        `UPDATE teachers SET
          teacher_name = ?,
          employee_id = COALESCE(?, employee_id),
          department_subject = COALESCE(?, department_subject),
          joining_date = ?,
          qualification = ?,
          classes_assigned = ?,
          section_assigned = ?,
          designation = ?,
          dob = ?,
          emergency_contact = ?
        WHERE contact_id = ?`,
        [
          fullName,
          t.employee_id,
          t.department_subject,
          t.joining_date || null,
          t.qualification || null,
          t.classes_assigned || null,
          t.section_assigned || null,
          t.designation || 'Teacher',
          t.dob || null,
          t.emergency_contact || null,
          contactId
        ]
      );
    } else if (existing.contact_type === 'staff' && data.staff_details) {
      const st = data.staff_details;
      await conn.query(
        `UPDATE staff SET
          staff_name = ?,
          employee_id = COALESCE(?, employee_id),
          designation = COALESCE(?, designation),
          department = COALESCE(?, department),
          joining_date = ?,
          qualification = ?,
          emergency_contact = ?
        WHERE contact_id = ?`,
        [
          fullName,
          st.employee_id,
          st.designation,
          st.department,
          st.joining_date || null,
          st.qualification || null,
          st.emergency_contact || null,
          contactId
        ]
      );
    } else if (existing.contact_type === 'driver' && data.driver_details) {
      const d = data.driver_details;
      await conn.query(
        `UPDATE drivers SET
          driver_name = ?,
          driver_id = COALESCE(?, driver_id),
          license_number = COALESCE(?, license_number),
          vehicle_number = COALESCE(?, vehicle_number),
          license_expiry_date = ?,
          vehicle_type = ?,
          route = ?,
          emergency_contact = ?
        WHERE contact_id = ?`,
        [
          fullName,
          d.driver_id,
          d.license_number,
          d.vehicle_number,
          d.license_expiry_date || null,
          d.vehicle_type || null,
          d.route || null,
          d.emergency_contact || null,
          contactId
        ]
      );
    } else if (existing.contact_type === 'management' && data.management_details) {
      const m = data.management_details;
      await conn.query(
        `UPDATE management SET
          name = ?,
          designation = COALESCE(?, designation),
          department = ?
        WHERE contact_id = ?`,
        [
          fullName,
          m.designation,
          m.department || null,
          contactId
        ]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating contact:', err);
    res.status(400).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ---------------------------------------------------------------------
// 7. Delete Contact
// ---------------------------------------------------------------------
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contactId = Number(req.params.id);
    const result = await query(`DELETE FROM contacts WHERE id = ?`, [contactId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------
// 8. Batch Sync Endpoint
// ---------------------------------------------------------------------
app.post('/api/contacts/sync', async (req, res) => {
  const { device_id, pending_contacts = [], last_sync_time } = req.body;
  const syncResults = [];

  for (const item of pending_contacts) {
    try {
      let serverId = item.server_id ? Number(item.server_id) : null;

      if (!serverId && item.local_id) {
        const rows = await query(`SELECT id FROM contacts WHERE local_id = ? LIMIT 1`, [item.local_id]);
        if (rows.length > 0) {
          serverId = rows[0].id;
        }
      }

      if (serverId) {
        // Update existing contact
        await query(
          `UPDATE contacts SET
            full_name = ?,
            mobile_number = ?,
            alternate_mobile = ?,
            whatsapp_number = ?,
            email = ?,
            address = ?,
            city = ?,
            state = ?,
            pincode = ?,
            profile_photo = ?,
            status = ?,
            notes = ?,
            sync_version = sync_version + 1,
            updated_at = NOW()
          WHERE id = ?`,
          [
            item.full_name,
            normalizeMobile(item.mobile_number),
            normalizeMobile(item.alternate_mobile) || null,
            normalizeMobile(item.whatsapp_number || item.mobile_number),
            item.email || null,
            item.address || null,
            item.city || null,
            item.state || null,
            item.pincode || null,
            item.profile_photo || null,
            item.status || 'Active',
            item.notes || null,
            serverId
          ]
        );
      } else {
        // Insert new contact
        const [insertRes] = await query(
          `INSERT INTO contacts (
            local_id, contact_type, full_name, mobile_number, alternate_mobile,
            whatsapp_number, email, address, city, state, pincode, profile_photo,
            status, notes, sync_version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
          [
            item.local_id || null,
            item.contact_type,
            item.full_name,
            normalizeMobile(item.mobile_number),
            normalizeMobile(item.alternate_mobile) || null,
            normalizeMobile(item.whatsapp_number || item.mobile_number),
            item.email || null,
            item.address || null,
            item.city || null,
            item.state || null,
            item.pincode || null,
            item.profile_photo || null,
            item.status || 'Active',
            item.notes || null
          ]
        );
        serverId = insertRes.insertId;

        if (item.contact_type === 'student' && item.student_details) {
          const s = item.student_details;
          await query(
            `INSERT INTO students (
              contact_id, student_name, admission_number, class, section,
              father_name, parent_mobile, academic_session, roll_number, dob,
              gender, mother_name, transport_required, bus_route
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              serverId,
              item.full_name,
              s.admission_number,
              s.class,
              s.section,
              s.father_name,
              normalizeMobile(s.parent_mobile),
              s.academic_session,
              s.roll_number || null,
              s.dob || null,
              s.gender || null,
              s.mother_name || null,
              s.transport_required ? 1 : 0,
              s.bus_route || null
            ]
          );
        } else if (item.contact_type === 'parent' && item.parent_details) {
          const p = item.parent_details;
          await query(
            `INSERT INTO parents (contact_id, parent_name, relationship_with_student, occupation, emergency_contact)
             VALUES (?, ?, ?, ?, ?)`,
            [
              serverId,
              item.full_name,
              p.relationship_with_student,
              p.occupation || null,
              p.emergency_contact || null
            ]
          );
          if (Array.isArray(p.children)) {
            for (const ch of p.children) {
              await query(
                `INSERT INTO student_parent (parent_contact_id, student_name, student_admission_number, class_section, relationship)
                 VALUES (?, ?, ?, ?, ?)`,
                [serverId, ch.student_name, ch.student_admission_number || '', ch.class_section || '', p.relationship_with_student]
              );
            }
          }
        } else if (item.contact_type === 'teacher' && item.teacher_details) {
          const t = item.teacher_details;
          await query(
            `INSERT INTO teachers (contact_id, teacher_name, employee_id, department_subject, joining_date, qualification, classes_assigned, designation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [serverId, item.full_name, t.employee_id, t.department_subject, t.joining_date || null, t.qualification || null, t.classes_assigned || null, t.designation || 'Teacher']
          );
        } else if (item.contact_type === 'staff' && item.staff_details) {
          const st = item.staff_details;
          await query(
            `INSERT INTO staff (contact_id, staff_name, employee_id, designation, department)
             VALUES (?, ?, ?, ?, ?)`,
            [serverId, item.full_name, st.employee_id, st.designation, st.department]
          );
        } else if (item.contact_type === 'driver' && item.driver_details) {
          const d = item.driver_details;
          await query(
            `INSERT INTO drivers (contact_id, driver_name, driver_id, license_number, vehicle_number, route)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [serverId, item.full_name, d.driver_id, d.license_number, d.vehicle_number, d.route || null]
          );
        } else if (item.contact_type === 'management' && item.management_details) {
          const m = item.management_details;
          await query(
            `INSERT INTO management (contact_id, name, designation, department)
             VALUES (?, ?, ?, ?)`,
            [serverId, item.full_name, m.designation, m.department || null]
          );
        }
      }

      syncResults.push({
        local_id: item.local_id,
        server_id: serverId,
        status: 'synced',
        synced_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Sync item error:', e);
      syncResults.push({
        local_id: item.local_id,
        server_id: item.server_id || null,
        status: 'error',
        error: e.message
      });
    }
  }

  // Return server updates modified since last_sync_time
  let serverUpdates = [];
  try {
    if (last_sync_time) {
      const updatedRows = await query(
        `${BASE_SELECT_QUERY} WHERE c.updated_at > ? ORDER BY c.updated_at ASC`,
        [last_sync_time]
      );
      serverUpdates = updatedRows.map(r => formatContactRow(r));
    }
  } catch (e) {
    console.warn('Could not fetch server updates:', e.message);
  }

  res.json({
    success: true,
    synced_contacts: syncResults,
    server_updates: serverUpdates,
    sync_timestamp: new Date().toISOString(),
    message: 'Batch synchronization completed'
  });
});

app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`School Contact API Server running on port ${PORT}`);
  console.log(`=======================================================`);
  await testConnection();
});
