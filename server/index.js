const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Helper: Populate contact with role-specific tables
function getFullContact(contactId, store = db.getStore()) {
  const contact = store.contacts.find(c => c.id === Number(contactId) || c.id === contactId);
  if (!contact) return null;

  const result = { ...contact };

  if (contact.contact_type === 'student') {
    result.student_details = store.students.find(s => s.contact_id === contact.id) || null;
  } else if (contact.contact_type === 'parent') {
    result.parent_details = store.parents.find(p => p.contact_id === contact.id) || null;
    result.children = store.student_parent.filter(sp => sp.parent_contact_id === contact.id);
  } else if (contact.contact_type === 'teacher') {
    result.teacher_details = store.teachers.find(t => t.contact_id === contact.id) || null;
  } else if (contact.contact_type === 'staff') {
    result.staff_details = store.staff.find(st => st.contact_id === contact.id) || null;
  } else if (contact.contact_type === 'driver') {
    result.driver_details = store.drivers.find(d => d.contact_id === contact.id) || null;
  } else if (contact.contact_type === 'management') {
    result.management_details = store.management.find(m => m.contact_id === contact.id) || null;
  }

  return result;
}

// 1. Health check & Dashboard Stats
app.get('/api/dashboard', (req, res) => {
  try {
    const store = db.getStore();
    const activeContacts = store.contacts.filter(c => c.status === 'Active');
    const total = activeContacts.length;

    const byType = {
      student: 0,
      parent: 0,
      teacher: 0,
      staff: 0,
      driver: 0,
      management: 0,
      other: 0
    };

    activeContacts.forEach(c => {
      if (byType[c.contact_type] !== undefined) {
        byType[c.contact_type]++;
      } else {
        byType.other++;
      }
    });

    res.json({
      success: true,
      total_contacts: total,
      by_type: byType,
      server_time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Duplicate Detection Check
app.get('/api/contacts/check-duplicate', (req, res) => {
  const { mobile, admission_number, employee_id, exclude_id } = req.query;
  const store = db.getStore();
  const normalized = normalizeMobile(mobile);

  try {
    let duplicate = null;

    if (normalized) {
      duplicate = store.contacts.find(c => {
        if (exclude_id && c.id === Number(exclude_id)) return false;
        const cNorm = normalizeMobile(c.mobile_number);
        return cNorm === normalized;
      });
    }

    if (!duplicate && admission_number) {
      const student = store.students.find(s => {
        if (exclude_id && s.contact_id === Number(exclude_id)) return false;
        return (s.admission_number || '').trim().toLowerCase() === admission_number.trim().toLowerCase();
      });
      if (student) {
        duplicate = store.contacts.find(c => c.id === student.contact_id);
      }
    }

    if (!duplicate && employee_id) {
      const empId = employee_id.trim().toLowerCase();
      const teacher = store.teachers.find(t => {
        if (exclude_id && t.contact_id === Number(exclude_id)) return false;
        return (t.employee_id || '').trim().toLowerCase() === empId;
      });
      if (teacher) {
        duplicate = store.contacts.find(c => c.id === teacher.contact_id);
      } else {
        const staff = store.staff.find(st => {
          if (exclude_id && st.contact_id === Number(exclude_id)) return false;
          return (st.employee_id || '').trim().toLowerCase() === empId;
        });
        if (staff) {
          duplicate = store.contacts.find(c => c.id === staff.contact_id);
        }
      }
    }

    res.json({
      exists: !!duplicate,
      contact: duplicate ? getFullContact(duplicate.id, store) : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Contacts (with filter and search)
app.get('/api/contacts', (req, res) => {
  try {
    const { type, search, class_val, section, subject, department } = req.query;
    const store = db.getStore();

    let list = store.contacts.filter(c => c.status === 'Active');

    if (type && type !== 'all') {
      list = list.filter(c => c.contact_type === type);
    }

    // Populate all for filtering & rich display
    let enriched = list.map(c => getFullContact(c.id, store));

    if (class_val) {
      enriched = enriched.filter(c => c.student_details && c.student_details.class === class_val);
    }
    if (section) {
      enriched = enriched.filter(c => c.student_details && c.student_details.section === section);
    }
    if (subject) {
      enriched = enriched.filter(c => c.teacher_details && (c.teacher_details.department_subject || '').toLowerCase().includes(subject.toLowerCase()));
    }
    if (department) {
      enriched = enriched.filter(c => {
        const tDept = c.teacher_details && c.teacher_details.department_subject;
        const stDept = c.staff_details && c.staff_details.department;
        const mDept = c.management_details && c.management_details.department;
        return (tDept && tDept.toLowerCase().includes(department.toLowerCase())) ||
               (stDept && stDept.toLowerCase().includes(department.toLowerCase())) ||
               (mDept && mDept.toLowerCase().includes(department.toLowerCase()));
      });
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(c => {
        const nameMatch = (c.full_name || '').toLowerCase().includes(q);
        const mobileMatch = (c.mobile_number || '').includes(q);
        const altMobileMatch = (c.alternate_mobile || '').includes(q);
        const noteMatch = (c.notes || '').toLowerCase().includes(q);
        
        let subMatch = false;
        if (c.student_details) {
          const s = c.student_details;
          subMatch = (s.admission_number || '').toLowerCase().includes(q) ||
                     (s.father_name || '').toLowerCase().includes(q) ||
                     (s.class || '').toLowerCase().includes(q) ||
                     (s.section || '').toLowerCase().includes(q) ||
                     (s.bus_route || '').toLowerCase().includes(q);
        } else if (c.parent_details) {
          const p = c.parent_details;
          const childMatch = (c.children || []).some(ch => (ch.student_name || '').toLowerCase().includes(q) || (ch.student_admission_number || '').toLowerCase().includes(q));
          subMatch = childMatch || (p.occupation || '').toLowerCase().includes(q);
        } else if (c.teacher_details) {
          const t = c.teacher_details;
          subMatch = (t.employee_id || '').toLowerCase().includes(q) ||
                     (t.department_subject || '').toLowerCase().includes(q) ||
                     (t.designation || '').toLowerCase().includes(q) ||
                     (t.classes_assigned || '').toLowerCase().includes(q);
        } else if (c.staff_details) {
          const st = c.staff_details;
          subMatch = (st.employee_id || '').toLowerCase().includes(q) ||
                     (st.designation || '').toLowerCase().includes(q) ||
                     (st.department || '').toLowerCase().includes(q);
        } else if (c.driver_details) {
          const d = c.driver_details;
          subMatch = (d.driver_id || '').toLowerCase().includes(q) ||
                     (d.license_number || '').toLowerCase().includes(q) ||
                     (d.vehicle_number || '').toLowerCase().includes(q) ||
                     (d.route || '').toLowerCase().includes(q);
        } else if (c.management_details) {
          const m = c.management_details;
          subMatch = (m.designation || '').toLowerCase().includes(q) ||
                     (m.department || '').toLowerCase().includes(q);
        }

        return nameMatch || mobileMatch || altMobileMatch || noteMatch || subMatch;
      });
    }

    enriched.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Contact by ID
app.get('/api/contacts/:id', (req, res) => {
  try {
    const contact = getFullContact(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Create Contact
app.post('/api/contacts', (req, res) => {
  const data = req.body;
  const store = db.getStore();

  try {
    const contactId = db.nextId('contacts');
    const normalizedMobile = normalizeMobile(data.mobile_number);

    const contact = {
      id: contactId,
      local_id: data.local_id || null,
      contact_type: data.contact_type,
      full_name: data.full_name,
      mobile_number: normalizedMobile,
      alternate_mobile: normalizeMobile(data.alternate_mobile) || null,
      whatsapp_number: normalizeMobile(data.whatsapp_number || normalizedMobile),
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      profile_photo: data.profile_photo || null,
      status: data.status || 'Active',
      notes: data.notes || null,
      sync_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.contacts.push(contact);

    // Role-specific insert
    if (data.contact_type === 'student' && data.student_details) {
      const s = data.student_details;
      store.students.push({
        id: db.nextId('students'),
        contact_id: contactId,
        student_name: data.full_name,
        admission_number: s.admission_number,
        class: s.class,
        section: s.section,
        father_name: s.father_name,
        parent_mobile: normalizeMobile(s.parent_mobile),
        academic_session: s.academic_session,
        roll_number: s.roll_number || null,
        dob: s.dob || null,
        gender: s.gender || null,
        mother_name: s.mother_name || null,
        mother_mobile: normalizeMobile(s.mother_mobile) || null,
        father_mobile: normalizeMobile(s.father_mobile) || null,
        guardian_mobile: normalizeMobile(s.guardian_mobile) || null,
        student_whatsapp: normalizeMobile(s.student_whatsapp) || null,
        blood_group: s.blood_group || null,
        previous_school: s.previous_school || null,
        transport_required: s.transport_required ? 1 : 0,
        bus_route: s.bus_route || null,
        pickup_point: s.pickup_point || null,
        emergency_contact: s.emergency_contact || null
      });
    } else if (data.contact_type === 'parent' && data.parent_details) {
      const p = data.parent_details;
      store.parents.push({
        id: db.nextId('parents'),
        contact_id: contactId,
        parent_name: data.full_name,
        relationship_with_student: p.relationship_with_student,
        father_name: p.father_name || null,
        mother_name: p.mother_name || null,
        occupation: p.occupation || null,
        emergency_contact: p.emergency_contact || null
      });

      if (Array.isArray(p.children)) {
        p.children.forEach(child => {
          store.student_parent.push({
            id: db.nextId('student_parent'),
            parent_contact_id: contactId,
            student_name: child.student_name,
            student_admission_number: child.student_admission_number || '',
            class_section: child.class_section || '',
            relationship: p.relationship_with_student
          });
        });
      }
    } else if (data.contact_type === 'teacher' && data.teacher_details) {
      const t = data.teacher_details;
      store.teachers.push({
        id: db.nextId('teachers'),
        contact_id: contactId,
        teacher_name: data.full_name,
        employee_id: t.employee_id,
        department_subject: t.department_subject,
        joining_date: t.joining_date,
        qualification: t.qualification || null,
        classes_assigned: t.classes_assigned || null,
        section_assigned: t.section_assigned || null,
        designation: t.designation || 'Teacher',
        dob: t.dob || null,
        emergency_contact: t.emergency_contact || null
      });
    } else if (data.contact_type === 'staff' && data.staff_details) {
      const st = data.staff_details;
      store.staff.push({
        id: db.nextId('staff'),
        contact_id: contactId,
        staff_name: data.full_name,
        employee_id: st.employee_id,
        designation: st.designation,
        department: st.department,
        joining_date: st.joining_date || null,
        qualification: st.qualification || null,
        emergency_contact: st.emergency_contact || null
      });
    } else if (data.contact_type === 'driver' && data.driver_details) {
      const d = data.driver_details;
      store.drivers.push({
        id: db.nextId('drivers'),
        contact_id: contactId,
        driver_name: data.full_name,
        driver_id: d.driver_id,
        license_number: d.license_number,
        vehicle_number: d.vehicle_number,
        license_expiry_date: d.license_expiry_date || null,
        vehicle_type: d.vehicle_type || null,
        route: d.route || null,
        emergency_contact: d.emergency_contact || null
      });
    } else if (data.contact_type === 'management' && data.management_details) {
      const m = data.management_details;
      store.management.push({
        id: db.nextId('management'),
        contact_id: contactId,
        name: data.full_name,
        designation: m.designation,
        department: m.department || null
      });
    }

    db.save();

    res.status(201).json({
      success: true,
      server_id: contactId,
      local_id: data.local_id || null,
      message: 'Contact created successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Update Contact
app.put('/api/contacts/:id', (req, res) => {
  const contactId = Number(req.params.id);
  const data = req.body;
  const store = db.getStore();

  try {
    const contactIndex = store.contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const existing = store.contacts[contactIndex];
    store.contacts[contactIndex] = {
      ...existing,
      full_name: data.full_name || existing.full_name,
      mobile_number: normalizeMobile(data.mobile_number) || existing.mobile_number,
      alternate_mobile: normalizeMobile(data.alternate_mobile) || existing.alternate_mobile,
      whatsapp_number: normalizeMobile(data.whatsapp_number) || existing.whatsapp_number,
      email: data.email !== undefined ? data.email : existing.email,
      address: data.address !== undefined ? data.address : existing.address,
      city: data.city !== undefined ? data.city : existing.city,
      state: data.state !== undefined ? data.state : existing.state,
      pincode: data.pincode !== undefined ? data.pincode : existing.pincode,
      profile_photo: data.profile_photo !== undefined ? data.profile_photo : existing.profile_photo,
      status: data.status || existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      sync_version: (existing.sync_version || 1) + 1,
      updated_at: new Date().toISOString()
    };

    // Subtype update
    if (existing.contact_type === 'student' && data.student_details) {
      const idx = store.students.findIndex(s => s.contact_id === contactId);
      if (idx !== -1) {
        store.students[idx] = { ...store.students[idx], ...data.student_details, student_name: data.full_name || existing.full_name };
      }
    } else if (existing.contact_type === 'parent' && data.parent_details) {
      const idx = store.parents.findIndex(p => p.contact_id === contactId);
      if (idx !== -1) {
        store.parents[idx] = { ...store.parents[idx], ...data.parent_details, parent_name: data.full_name || existing.full_name };
      }
      if (Array.isArray(data.parent_details.children)) {
        store.student_parent = store.student_parent.filter(sp => sp.parent_contact_id !== contactId);
        data.parent_details.children.forEach(ch => {
          store.student_parent.push({
            id: db.nextId('student_parent'),
            parent_contact_id: contactId,
            student_name: ch.student_name,
            student_admission_number: ch.student_admission_number || '',
            class_section: ch.class_section || '',
            relationship: data.parent_details.relationship_with_student
          });
        });
      }
    } else if (existing.contact_type === 'teacher' && data.teacher_details) {
      const idx = store.teachers.findIndex(t => t.contact_id === contactId);
      if (idx !== -1) {
        store.teachers[idx] = { ...store.teachers[idx], ...data.teacher_details, teacher_name: data.full_name || existing.full_name };
      }
    } else if (existing.contact_type === 'staff' && data.staff_details) {
      const idx = store.staff.findIndex(st => st.contact_id === contactId);
      if (idx !== -1) {
        store.staff[idx] = { ...store.staff[idx], ...data.staff_details, staff_name: data.full_name || existing.full_name };
      }
    } else if (existing.contact_type === 'driver' && data.driver_details) {
      const idx = store.drivers.findIndex(d => d.contact_id === contactId);
      if (idx !== -1) {
        store.drivers[idx] = { ...store.drivers[idx], ...data.driver_details, driver_name: data.full_name || existing.full_name };
      }
    } else if (existing.contact_type === 'management' && data.management_details) {
      const idx = store.management.findIndex(m => m.contact_id === contactId);
      if (idx !== -1) {
        store.management[idx] = { ...store.management[idx], ...data.management_details, name: data.full_name || existing.full_name };
      }
    }

    db.save();
    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Delete Contact
app.delete('/api/contacts/:id', (req, res) => {
  try {
    const contactId = Number(req.params.id);
    const store = db.getStore();
    const idx = store.contacts.findIndex(c => c.id === contactId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    store.contacts.splice(idx, 1);
    store.students = store.students.filter(s => s.contact_id !== contactId);
    store.parents = store.parents.filter(p => p.contact_id !== contactId);
    store.student_parent = store.student_parent.filter(sp => sp.parent_contact_id !== contactId);
    store.teachers = store.teachers.filter(t => t.contact_id !== contactId);
    store.staff = store.staff.filter(st => st.contact_id !== contactId);
    store.drivers = store.drivers.filter(d => d.contact_id !== contactId);
    store.management = store.management.filter(m => m.contact_id !== contactId);

    db.save();
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Batch Sync Endpoint
app.post('/api/contacts/sync', (req, res) => {
  const { device_id, pending_contacts = [], last_sync_time } = req.body;
  const store = db.getStore();
  const syncResults = [];

  for (const item of pending_contacts) {
    try {
      let serverId = item.server_id ? Number(item.server_id) : null;
      const normalizedMobile = normalizeMobile(item.mobile_number);

      if (!serverId) {
        // Match existing by local_id if previously uploaded
        const existing = item.local_id ? store.contacts.find(c => c.local_id === item.local_id) : null;
        if (existing) {
          serverId = existing.id;
        } else {
          serverId = db.nextId('contacts');
          const newContact = {
            id: serverId,
            local_id: item.local_id || null,
            contact_type: item.contact_type,
            full_name: item.full_name,
            mobile_number: normalizedMobile,
            alternate_mobile: normalizeMobile(item.alternate_mobile) || null,
            whatsapp_number: normalizeMobile(item.whatsapp_number || normalizedMobile),
            email: item.email || null,
            address: item.address || null,
            city: item.city || null,
            state: item.state || null,
            pincode: item.pincode || null,
            profile_photo: item.profile_photo || null,
            status: item.status || 'Active',
            notes: item.notes || null,
            sync_version: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          store.contacts.push(newContact);

          if (item.contact_type === 'student' && item.student_details) {
            const s = item.student_details;
            store.students.push({
              id: db.nextId('students'),
              contact_id: serverId,
              student_name: item.full_name,
              admission_number: s.admission_number,
              class: s.class,
              section: s.section,
              father_name: s.father_name,
              parent_mobile: normalizeMobile(s.parent_mobile),
              academic_session: s.academic_session,
              roll_number: s.roll_number || null,
              dob: s.dob || null,
              gender: s.gender || null,
              mother_name: s.mother_name || null,
              blood_group: s.blood_group || null,
              transport_required: s.transport_required ? 1 : 0,
              bus_route: s.bus_route || null
            });
          } else if (item.contact_type === 'parent' && item.parent_details) {
            const p = item.parent_details;
            store.parents.push({
              id: db.nextId('parents'),
              contact_id: serverId,
              parent_name: item.full_name,
              relationship_with_student: p.relationship_with_student,
              occupation: p.occupation || null,
              emergency_contact: p.emergency_contact || null
            });
            if (Array.isArray(p.children)) {
              p.children.forEach(ch => {
                store.student_parent.push({
                  id: db.nextId('student_parent'),
                  parent_contact_id: serverId,
                  student_name: ch.student_name,
                  student_admission_number: ch.student_admission_number || '',
                  class_section: ch.class_section || '',
                  relationship: p.relationship_with_student
                });
              });
            }
          } else if (item.contact_type === 'teacher' && item.teacher_details) {
            const t = item.teacher_details;
            store.teachers.push({
              id: db.nextId('teachers'),
              contact_id: serverId,
              teacher_name: item.full_name,
              employee_id: t.employee_id,
              department_subject: t.department_subject,
              joining_date: t.joining_date,
              qualification: t.qualification || null,
              classes_assigned: t.classes_assigned || null,
              designation: t.designation || 'Teacher'
            });
          } else if (item.contact_type === 'staff' && item.staff_details) {
            const st = item.staff_details;
            store.staff.push({
              id: db.nextId('staff'),
              contact_id: serverId,
              staff_name: item.full_name,
              employee_id: st.employee_id,
              designation: st.designation,
              department: st.department
            });
          } else if (item.contact_type === 'driver' && item.driver_details) {
            const d = item.driver_details;
            store.drivers.push({
              id: db.nextId('drivers'),
              contact_id: serverId,
              driver_name: item.full_name,
              driver_id: d.driver_id,
              license_number: d.license_number,
              vehicle_number: d.vehicle_number,
              route: d.route || null
            });
          } else if (item.contact_type === 'management' && item.management_details) {
            const m = item.management_details;
            store.management.push({
              id: db.nextId('management'),
              contact_id: serverId,
              name: item.full_name,
              designation: m.designation,
              department: m.department || null
            });
          }
        }
      }

      syncResults.push({
        local_id: item.local_id,
        server_id: serverId,
        status: 'synced',
        synced_at: new Date().toISOString()
      });
    } catch (e) {
      syncResults.push({
        local_id: item.local_id,
        server_id: item.server_id || null,
        status: 'error',
        error: e.message
      });
    }
  }

  db.save();

  // Return server updates if any
  let serverUpdates = [];
  if (last_sync_time) {
    serverUpdates = store.contacts
      .filter(c => new Date(c.updated_at) > new Date(last_sync_time))
      .map(c => getFullContact(c.id, store));
  }

  res.json({
    success: true,
    synced_contacts: syncResults,
    server_updates: serverUpdates,
    sync_timestamp: new Date().toISOString(),
    message: 'Batch synchronization completed'
  });
});

app.listen(PORT, () => {
  console.log(`School Contact API Server running on port ${PORT}`);
});
