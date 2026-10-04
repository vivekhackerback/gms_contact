import AsyncStorage from '@react-native-async-storage/async-storage';
import { FullContact, ContactType, DashboardStats } from '../types/contact';

const STORAGE_KEY_CONTACTS = 'gms_school_contacts_local';
const STORAGE_KEY_SETTINGS = 'gms_school_settings';

// Seed demo data for instant first-time app launch
const DEFAULT_INITIAL_CONTACTS: FullContact[] = [
  {
    local_id: 'loc_student_1',
    server_id: 1,
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
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    student_details: {
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
      blood_group: 'B+',
      transport_required: 1,
      bus_route: 'Route 4 - City Center',
      pickup_point: 'Maliyabagh Chowk',
      emergency_contact: '9876543210'
    }
  },
  {
    local_id: 'loc_student_2',
    server_id: 2,
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
    notes: 'Active in dance & drama competitions',
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-12T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-12T10:00:00Z').toISOString(),
    student_details: {
      student_name: 'Priya Kumar',
      admission_number: 'ADM1099',
      class: '2',
      section: 'B',
      father_name: 'Raj Kumar',
      parent_mobile: '9876543210',
      academic_session: '2025-2026',
      roll_number: '05',
      gender: 'Female',
      blood_group: 'O+',
      transport_required: 1,
      bus_route: 'Route 4 - City Center'
    }
  },
  {
    local_id: 'loc_parent_1',
    server_id: 4,
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
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    updated_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    parent_details: {
      parent_name: 'Raj Kumar',
      relationship_with_student: 'Father',
      occupation: 'Business Owner (Retail & Agro)',
      emergency_contact: '9876543210',
      children: [
        { student_name: 'Rahul Kumar', student_admission_number: 'ADM1024', class_section: '5-A', relationship: 'Father' },
        { student_name: 'Priya Kumar', student_admission_number: 'ADM1099', class_section: '2-B', relationship: 'Father' }
      ]
    },
    children: [
      { student_name: 'Rahul Kumar', student_admission_number: 'ADM1024', class_section: '5-A', relationship: 'Father' },
      { student_name: 'Priya Kumar', student_admission_number: 'ADM1099', class_section: '2-B', relationship: 'Father' }
    ]
  },
  {
    local_id: 'loc_teacher_1',
    server_id: 6,
    contact_type: 'teacher',
    full_name: 'Neha Sharma',
    mobile_number: '9822334455',
    whatsapp_number: '9822334455',
    email: 'neha.sharma@school.edu',
    city: 'Rohtas',
    state: 'Bihar',
    status: 'Active',
    notes: 'Senior Mathematics faculty, Middle Wing',
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-05T09:00:00Z').toISOString(),
    updated_at: new Date('2026-01-05T09:00:00Z').toISOString(),
    teacher_details: {
      teacher_name: 'Neha Sharma',
      employee_id: 'TCH102',
      department_subject: 'Mathematics',
      joining_date: '2021-06-15',
      qualification: 'M.Sc (Mathematics), B.Ed',
      classes_assigned: '5, 6, 7',
      section_assigned: 'A, B',
      designation: 'Senior Math Teacher'
    }
  },
  {
    local_id: 'loc_staff_1',
    server_id: 8,
    contact_type: 'staff',
    full_name: 'Anita Singh',
    mobile_number: '9844556677',
    whatsapp_number: '9844556677',
    email: 'anita.accounts@school.edu',
    city: 'Rohtas',
    state: 'Bihar',
    status: 'Active',
    notes: 'In-charge of student fees and billing inquiries',
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-02T08:30:00Z').toISOString(),
    updated_at: new Date('2026-01-02T08:30:00Z').toISOString(),
    staff_details: {
      staff_name: 'Anita Singh',
      employee_id: 'STF201',
      designation: 'Accountant',
      department: 'Accounts & Finance',
      joining_date: '2020-02-01',
      qualification: 'M.Com, Tally ERP'
    }
  },
  {
    local_id: 'loc_driver_1',
    server_id: 9,
    contact_type: 'driver',
    full_name: 'Mahendra Yadav',
    mobile_number: '9855667788',
    whatsapp_number: '9855667788',
    city: 'Rohtas',
    state: 'Bihar',
    status: 'Active',
    notes: 'Bus Route 4 Morning & Evening route',
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-02T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-02T08:00:00Z').toISOString(),
    driver_details: {
      driver_name: 'Mahendra Yadav',
      driver_id: 'DRV04',
      license_number: 'DL-BR-2018-98441',
      vehicle_number: 'BR-24-EA-5541',
      vehicle_type: 'School Bus (42 Seater)',
      route: 'Route 4 - City Center to Campus',
      emergency_contact: '9855667700'
    }
  },
  {
    local_id: 'loc_mgmt_1',
    server_id: 10,
    contact_type: 'management',
    full_name: 'Dr. Vikram Malhotra',
    mobile_number: '9899001122',
    whatsapp_number: '9899001122',
    email: 'principal@school.edu',
    city: 'Rohtas',
    state: 'Bihar',
    status: 'Active',
    notes: 'School Principal & Academic Director',
    sync_status: 'synced',
    sync_version: 1,
    created_at: new Date('2026-01-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T08:00:00Z').toISOString(),
    management_details: {
      name: 'Dr. Vikram Malhotra',
      designation: 'Principal / Director',
      department: 'School Administration'
    }
  }
];

class LocalDatabase {
  private cache: FullContact[] | null = null;

  async init(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CONTACTS);
      if (!raw) {
        this.cache = [...DEFAULT_INITIAL_CONTACTS];
        await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(this.cache));
      } else {
        this.cache = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalDatabase init error:', e);
      this.cache = [...DEFAULT_INITIAL_CONTACTS];
    }
  }

  async getAll(): Promise<FullContact[]> {
    if (!this.cache) {
      await this.init();
    }
    return this.cache ? [...this.cache] : [];
  }

  async getById(idOrLocalId: string | number): Promise<FullContact | null> {
    const contacts = await this.getAll();
    const str = String(idOrLocalId);
    return contacts.find(c => c.local_id === str || String(c.server_id) === str || String(c.id) === str) || null;
  }

  async save(contact: FullContact): Promise<FullContact> {
    const contacts = await this.getAll();
    const index = contacts.findIndex(c => c.local_id === contact.local_id || (contact.server_id && c.server_id === contact.server_id));

    if (index >= 0) {
      contacts[index] = {
        ...contacts[index],
        ...contact,
        updated_at: new Date().toISOString()
      };
    } else {
      if (!contact.local_id) {
        contact.local_id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      contact.created_at = contact.created_at || new Date().toISOString();
      contact.updated_at = new Date().toISOString();
      contacts.unshift(contact);
    }

    this.cache = contacts;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    return contact;
  }

  async delete(idOrLocalId: string | number): Promise<boolean> {
    const contacts = await this.getAll();
    const str = String(idOrLocalId);
    const filtered = contacts.filter(c => c.local_id !== str && String(c.server_id) !== str);
    this.cache = filtered;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(filtered));
    return true;
  }

  async getPendingSync(): Promise<FullContact[]> {
    const contacts = await this.getAll();
    return contacts.filter(c => c.sync_status === 'pending_sync');
  }

  async markAsSynced(localId: string, serverId: number): Promise<void> {
    const contacts = await this.getAll();
    const contact = contacts.find(c => c.local_id === localId);
    if (contact) {
      contact.server_id = serverId;
      contact.sync_status = 'synced';
      contact.sync_version = (contact.sync_version || 1) + 1;
      this.cache = contacts;
      await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    }
  }

  async replaceAll(newContacts: FullContact[]): Promise<void> {
    this.cache = newContacts;
    await AsyncStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(newContacts));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const contacts = await this.getAll();
    const active = contacts.filter(c => c.status === 'Active');

    const byType = {
      student: 0,
      parent: 0,
      teacher: 0,
      staff: 0,
      driver: 0,
      management: 0,
      other: 0
    };

    active.forEach(c => {
      if (byType[c.contact_type] !== undefined) {
        byType[c.contact_type]++;
      } else {
        byType.other++;
      }
    });

    const pending = contacts.filter(c => c.sync_status === 'pending_sync').length;
    const synced = contacts.filter(c => c.sync_status === 'synced').length;

    return {
      total_contacts: active.length,
      by_type: byType,
      pending_sync: pending,
      synced: synced
    };
  }
}

export const localDb = new LocalDatabase();
