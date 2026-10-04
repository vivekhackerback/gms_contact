export type ContactType = 
  | 'student' 
  | 'parent' 
  | 'teacher' 
  | 'staff' 
  | 'driver' 
  | 'management' 
  | 'other';

export type ContactStatus = 'Active' | 'Inactive';
export type SyncStatus = 'synced' | 'pending_sync' | 'error';

export interface BaseContact {
  id?: number;
  local_id: string;
  server_id?: number | null;
  contact_type: ContactType;
  full_name: string;
  mobile_number: string;
  alternate_mobile?: string | null;
  whatsapp_number?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  profile_photo?: string | null;
  status: ContactStatus;
  notes?: string | null;
  sync_status: SyncStatus;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

export interface StudentDetails {
  id?: number;
  contact_id?: number;
  student_name: string;
  admission_number: string;
  class: string;
  section: string;
  father_name: string;
  parent_mobile: string;
  academic_session: string;
  roll_number?: string | null;
  dob?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  mother_name?: string | null;
  mother_mobile?: string | null;
  father_mobile?: string | null;
  guardian_mobile?: string | null;
  student_whatsapp?: string | null;
  blood_group?: string | null;
  previous_school?: string | null;
  transport_required?: boolean | number;
  bus_route?: string | null;
  pickup_point?: string | null;
  emergency_contact?: string | null;
}

export interface StudentParentLink {
  id?: number;
  parent_contact_id?: number;
  student_contact_id?: number | null;
  student_name: string;
  student_admission_number?: string;
  class_section?: string;
  relationship: string;
}

export interface ParentDetails {
  id?: number;
  contact_id?: number;
  parent_name: string;
  relationship_with_student: string;
  father_name?: string | null;
  mother_name?: string | null;
  occupation?: string | null;
  emergency_contact?: string | null;
  children?: StudentParentLink[];
}

export interface TeacherDetails {
  id?: number;
  contact_id?: number;
  teacher_name: string;
  employee_id: string;
  department_subject: string;
  joining_date: string;
  qualification?: string | null;
  classes_assigned?: string | null;
  section_assigned?: string | null;
  designation?: string | null;
  dob?: string | null;
  emergency_contact?: string | null;
}

export interface StaffDetails {
  id?: number;
  contact_id?: number;
  staff_name: string;
  employee_id: string;
  designation: string;
  department: string;
  joining_date?: string | null;
  qualification?: string | null;
  emergency_contact?: string | null;
}

export interface DriverDetails {
  id?: number;
  contact_id?: number;
  driver_name: string;
  driver_id: string;
  license_number: string;
  vehicle_number: string;
  license_expiry_date?: string | null;
  vehicle_type?: string | null;
  route?: string | null;
  emergency_contact?: string | null;
}

export interface ManagementDetails {
  id?: number;
  contact_id?: number;
  name: string;
  designation: string;
  department?: string | null;
}

export interface FullContact extends BaseContact {
  student_details?: StudentDetails | null;
  parent_details?: ParentDetails | null;
  children?: StudentParentLink[];
  teacher_details?: TeacherDetails | null;
  staff_details?: StaffDetails | null;
  driver_details?: DriverDetails | null;
  management_details?: ManagementDetails | null;
  // flat convenience fields
  admission_number?: string;
  student_class?: string;
  student_section?: string;
  father_name?: string;
  parent_mobile?: string;
  teacher_employee_id?: string;
  department_subject?: string;
  classes_assigned?: string;
  staff_employee_id?: string;
  staff_designation?: string;
  staff_department?: string;
  driver_id?: string;
  vehicle_number?: string;
  route?: string;
  management_designation?: string;
  relationship_with_student?: string;
}

export interface DashboardStats {
  total_contacts: number;
  by_type: {
    student: number;
    parent: number;
    teacher: number;
    staff: number;
    driver: number;
    management: number;
    other: number;
  };
  pending_sync: number;
  synced: number;
}
