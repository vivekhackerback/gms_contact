const db = require('./db');

console.log('Seeding School Contacts Database...');
const store = {
  contacts: [],
  students: [],
  parents: [],
  student_parent: [],
  teachers: [],
  staff: [],
  drivers: [],
  management: [],
  counters: {
    contacts: 10,
    students: 3,
    parents: 2,
    student_parent: 3,
    teachers: 2,
    staff: 1,
    drivers: 1,
    management: 1
  }
};

// 1. Student 1: Rahul Kumar
store.contacts.push({
  id: 1,
  local_id: 'loc_seed_1',
  contact_type: 'student',
  full_name: 'Rahul Kumar',
  mobile_number: '9876543210',
  alternate_mobile: '9876543219',
  whatsapp_number: '9876543210',
  email: 'rahul.k@school.edu',
  address: 'Maliyabagh, Near SBI',
  city: 'Rohtas',
  state: 'Bihar',
  pincode: '802218',
  status: 'Active',
  notes: 'Class monitor and cricket team captain',
  sync_version: 1,
  created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  updated_at: new Date('2026-01-10T10:00:00Z').toISOString()
});
store.students.push({
  id: 1,
  contact_id: 1,
  student_name: 'Rahul Kumar',
  admission_number: 'ADM1024',
  class: '5',
  section: 'A',
  father_name: 'Raj Kumar',
  parent_mobile: '9876543210',
  academic_session: '2025-2026',
  roll_number: '12',
  dob: '2015-08-14',
  gender: 'Male',
  mother_name: 'Sita Devi',
  mother_mobile: '9876543211',
  father_mobile: '9876543210',
  student_whatsapp: '9876543210',
  blood_group: 'B+',
  previous_school: 'St. Paul Academy',
  transport_required: 1,
  bus_route: 'Route 4 - City Center',
  pickup_point: 'Maliyabagh Chowk',
  emergency_contact: '9876543210'
});

// 2. Student 2: Priya Kumar (Sibling of Rahul Kumar)
store.contacts.push({
  id: 2,
  local_id: 'loc_seed_2',
  contact_type: 'student',
  full_name: 'Priya Kumar',
  mobile_number: '9876543210',
  whatsapp_number: '9876543210',
  email: 'priya.k@school.edu',
  address: 'Maliyabagh, Near SBI',
  city: 'Rohtas',
  state: 'Bihar',
  pincode: '802218',
  status: 'Active',
  notes: 'Active in cultural and dance events',
  sync_version: 1,
  created_at: new Date('2026-01-12T10:00:00Z').toISOString(),
  updated_at: new Date('2026-01-12T10:00:00Z').toISOString()
});
store.students.push({
  id: 2,
  contact_id: 2,
  student_name: 'Priya Kumar',
  admission_number: 'ADM1099',
  class: '2',
  section: 'B',
  father_name: 'Raj Kumar',
  parent_mobile: '9876543210',
  academic_session: '2025-2026',
  roll_number: '05',
  dob: '2018-03-22',
  gender: 'Female',
  mother_name: 'Sita Devi',
  blood_group: 'O+',
  transport_required: 1,
  bus_route: 'Route 4 - City Center',
  pickup_point: 'Maliyabagh Chowk',
  emergency_contact: '9876543210'
});

// 3. Student 3: Aarav Sharma
store.contacts.push({
  id: 3,
  local_id: 'loc_seed_3',
  contact_type: 'student',
  full_name: 'Aarav Sharma',
  mobile_number: '9811223344',
  whatsapp_number: '9811223344',
  email: 'aarav.sh@school.edu',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  status: 'Active',
  notes: 'National Science Olympiad qualifier',
  sync_version: 1,
  created_at: new Date('2026-01-15T11:00:00Z').toISOString(),
  updated_at: new Date('2026-01-15T11:00:00Z').toISOString()
});
store.students.push({
  id: 3,
  contact_id: 3,
  student_name: 'Aarav Sharma',
  admission_number: 'ADM1055',
  class: '8',
  section: 'A',
  father_name: 'Sunil Sharma',
  parent_mobile: '9811223344',
  academic_session: '2025-2026',
  roll_number: '01',
  gender: 'Male',
  blood_group: 'A+',
  transport_required: 0
});

// 4. Parent: Raj Kumar (Linked to Rahul Kumar & Priya Kumar)
store.contacts.push({
  id: 4,
  local_id: 'loc_seed_4',
  contact_type: 'parent',
  full_name: 'Raj Kumar',
  mobile_number: '9876543210',
  whatsapp_number: '9876543210',
  email: 'raj.kumar.biz@gmail.com',
  address: 'Maliyabagh, Near SBI',
  city: 'Rohtas',
  state: 'Bihar',
  pincode: '802218',
  status: 'Active',
  notes: 'PTA Vice President & Parent Representative',
  sync_version: 1,
  created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  updated_at: new Date('2026-01-10T10:00:00Z').toISOString()
});
store.parents.push({
  id: 1,
  contact_id: 4,
  parent_name: 'Raj Kumar',
  relationship_with_student: 'Father',
  father_name: 'Late H. Kumar',
  mother_name: 'Sita Devi',
  occupation: 'Business Owner (Retail & Agro)',
  emergency_contact: '9876543210'
});
store.student_parent.push(
  {
    id: 1,
    parent_contact_id: 4,
    student_contact_id: 1,
    student_name: 'Rahul Kumar',
    student_admission_number: 'ADM1024',
    class_section: '5-A',
    relationship: 'Father'
  },
  {
    id: 2,
    parent_contact_id: 4,
    student_contact_id: 2,
    student_name: 'Priya Kumar',
    student_admission_number: 'ADM1099',
    class_section: '2-B',
    relationship: 'Father'
  }
);

// 5. Parent: Sunil Sharma
store.contacts.push({
  id: 5,
  local_id: 'loc_seed_5',
  contact_type: 'parent',
  full_name: 'Sunil Sharma',
  mobile_number: '9811223344',
  whatsapp_number: '9811223344',
  email: 'sunil.sharma@gmail.com',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  status: 'Active',
  notes: 'Parent of Aarav Sharma',
  sync_version: 1,
  created_at: new Date('2026-01-15T11:00:00Z').toISOString(),
  updated_at: new Date('2026-01-15T11:00:00Z').toISOString()
});
store.parents.push({
  id: 2,
  contact_id: 5,
  parent_name: 'Sunil Sharma',
  relationship_with_student: 'Father',
  occupation: 'Senior Telecom Engineer',
  emergency_contact: '9811223344'
});
store.student_parent.push({
  id: 3,
  parent_contact_id: 5,
  student_contact_id: 3,
  student_name: 'Aarav Sharma',
  student_admission_number: 'ADM1055',
  class_section: '8-A',
  relationship: 'Father'
});

// 6. Teacher: Neha Sharma
store.contacts.push({
  id: 6,
  local_id: 'loc_seed_6',
  contact_type: 'teacher',
  full_name: 'Neha Sharma',
  mobile_number: '9822334455',
  whatsapp_number: '9822334455',
  email: 'neha.sharma@school.edu',
  city: 'Rohtas',
  state: 'Bihar',
  status: 'Active',
  notes: 'Senior Mathematics faculty, Middle Wing',
  sync_version: 1,
  created_at: new Date('2026-01-05T09:00:00Z').toISOString(),
  updated_at: new Date('2026-01-05T09:00:00Z').toISOString()
});
store.teachers.push({
  id: 1,
  contact_id: 6,
  teacher_name: 'Neha Sharma',
  employee_id: 'TCH102',
  department_subject: 'Mathematics',
  joining_date: '2021-06-15',
  qualification: 'M.Sc (Mathematics), B.Ed',
  classes_assigned: '5, 6, 7',
  section_assigned: 'A, B',
  designation: 'Senior Math Teacher',
  emergency_contact: '9822334400'
});

// 7. Teacher: Rajesh Verma
store.contacts.push({
  id: 7,
  local_id: 'loc_seed_7',
  contact_type: 'teacher',
  full_name: 'Rajesh Verma',
  mobile_number: '9833445566',
  whatsapp_number: '9833445566',
  email: 'rajesh.verma@school.edu',
  city: 'Rohtas',
  state: 'Bihar',
  status: 'Active',
  notes: 'Head of Science Department',
  sync_version: 1,
  created_at: new Date('2026-01-05T09:30:00Z').toISOString(),
  updated_at: new Date('2026-01-05T09:30:00Z').toISOString()
});
store.teachers.push({
  id: 2,
  contact_id: 7,
  teacher_name: 'Rajesh Verma',
  employee_id: 'TCH105',
  department_subject: 'Science',
  joining_date: '2019-04-10',
  qualification: 'M.Sc Physics, B.Ed',
  classes_assigned: '8, 9, 10',
  designation: 'HOD Science'
});

// 8. Staff: Anita Singh (Accountant)
store.contacts.push({
  id: 8,
  local_id: 'loc_seed_8',
  contact_type: 'staff',
  full_name: 'Anita Singh',
  mobile_number: '9844556677',
  whatsapp_number: '9844556677',
  email: 'anita.accounts@school.edu',
  city: 'Rohtas',
  state: 'Bihar',
  status: 'Active',
  notes: 'In-charge of student fees and billing inquiries',
  sync_version: 1,
  created_at: new Date('2026-01-02T08:30:00Z').toISOString(),
  updated_at: new Date('2026-01-02T08:30:00Z').toISOString()
});
store.staff.push({
  id: 1,
  contact_id: 8,
  staff_name: 'Anita Singh',
  employee_id: 'STF201',
  designation: 'Accountant',
  department: 'Accounts & Finance',
  joining_date: '2020-02-01',
  qualification: 'M.Com, Tally ERP'
});

// 9. Driver: Mahendra Yadav
store.contacts.push({
  id: 9,
  local_id: 'loc_seed_9',
  contact_type: 'driver',
  full_name: 'Mahendra Yadav',
  mobile_number: '9855667788',
  whatsapp_number: '9855667788',
  city: 'Rohtas',
  state: 'Bihar',
  status: 'Active',
  notes: 'Bus Route 4 Morning & Evening route',
  sync_version: 1,
  created_at: new Date('2026-01-02T08:00:00Z').toISOString(),
  updated_at: new Date('2026-01-02T08:00:00Z').toISOString()
});
store.drivers.push({
  id: 1,
  contact_id: 9,
  driver_name: 'Mahendra Yadav',
  driver_id: 'DRV04',
  license_number: 'DL-BR-2018-98441',
  vehicle_number: 'BR-24-EA-5541',
  vehicle_type: 'School Bus (42 Seater)',
  route: 'Route 4 - City Center to Campus',
  emergency_contact: '9855667700'
});

// 10. Management: Dr. Vikram Malhotra (Principal)
store.contacts.push({
  id: 10,
  local_id: 'loc_seed_10',
  contact_type: 'management',
  full_name: 'Dr. Vikram Malhotra',
  mobile_number: '9899001122',
  whatsapp_number: '9899001122',
  email: 'principal@school.edu',
  city: 'Rohtas',
  state: 'Bihar',
  status: 'Active',
  notes: 'School Principal & Academic Director',
  sync_version: 1,
  created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
  updated_at: new Date('2026-01-01T08:00:00Z').toISOString()
});
store.management.push({
  id: 1,
  contact_id: 10,
  name: 'Dr. Vikram Malhotra',
  designation: 'Principal / Director',
  department: 'School Administration'
});

const fs = require('fs');
const path = require('path');
const dbFilePath = path.join(__dirname, 'school_contacts_db.json');
fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2), 'utf8');

console.log('Seeded 10 school contacts successfully into school_contacts_db.json!');
