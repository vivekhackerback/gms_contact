import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactType, FullContact } from '../types/contact';

interface Props {
  contactType: ContactType;
  formData: Partial<FullContact>;
  onChangeField: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function DynamicForm({ contactType, formData, onChangeField, errors }: Props) {
  // Helpers for nested subtype updates
  const updateSubField = (subObjKey: string, key: string, val: any) => {
    const current = (formData as any)[subObjKey] || {};
    onChangeField(subObjKey, { ...current, [key]: val });
  };

  const renderInput = (
    label: string,
    value: string | undefined,
    onChange: (t: string) => void,
    options: {
      required?: boolean;
      keyboardType?: any;
      placeholder?: string;
      errorKey?: string;
      multiline?: boolean;
    } = {}
  ) => {
    const err = options.errorKey ? errors[options.errorKey] : null;
    return (
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {options.required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
        <TextInput
          style={[styles.input, options.multiline && styles.multilineInput, !!err && styles.inputError]}
          value={value || ''}
          onChangeText={onChange}
          placeholder={options.placeholder || label}
          placeholderTextColor="#94A3B8"
          keyboardType={options.keyboardType || 'default'}
          multiline={options.multiline}
          numberOfLines={options.multiline ? 3 : 1}
        />
        {err ? <Text style={styles.errorText}>{err}</Text> : null}
      </View>
    );
  };

  const s = (formData.student_details || {}) as any;
  const p = (formData.parent_details || {}) as any;
  const t = (formData.teacher_details || {}) as any;
  const st = (formData.staff_details || {}) as any;
  const d = (formData.driver_details || {}) as any;
  const m = (formData.management_details || {}) as any;

  return (
    <View style={styles.container}>
      {/* 1. Common Contact Information */}
      <View style={styles.sectionHeader}>
        <Ionicons name="person-circle-outline" size={20} color="#0284C7" />
        <Text style={styles.sectionTitle}>Basic Information</Text>
      </View>

      {renderInput(
        'Full Name',
        formData.full_name,
        (val) => onChangeField('full_name', val),
        { required: true, errorKey: 'full_name', placeholder: 'e.g. Raj Kumar' }
      )}

      {renderInput(
        'Mobile Number',
        formData.mobile_number,
        (val) => onChangeField('mobile_number', val),
        { required: true, keyboardType: 'phone-pad', errorKey: 'mobile_number', placeholder: '10-digit number e.g. 9876543210' }
      )}

      {renderInput(
        'Alternate Mobile Number',
        formData.alternate_mobile || '',
        (val) => onChangeField('alternate_mobile', val),
        { keyboardType: 'phone-pad', placeholder: 'Optional second number' }
      )}

      {renderInput(
        'WhatsApp Number',
        formData.whatsapp_number || '',
        (val) => onChangeField('whatsapp_number', val),
        { keyboardType: 'phone-pad', placeholder: 'Defaults to mobile number' }
      )}

      {renderInput(
        'Email Address',
        formData.email || '',
        (val) => onChangeField('email', val),
        { keyboardType: 'email-address', errorKey: 'email', placeholder: 'user@example.com' }
      )}

      {/* 2. Dynamic Role-Specific Fields */}
      <View style={styles.sectionHeader}>
        <Ionicons name="albums-outline" size={20} color="#0284C7" />
        <Text style={styles.sectionTitle}>Role Specific Details</Text>
      </View>

      {contactType === 'student' && (
        <View>
          {renderInput(
            'Admission Number',
            s.admission_number,
            (v) => updateSubField('student_details', 'admission_number', v),
            { required: true, errorKey: 'admission_number', placeholder: 'e.g. ADM1024' }
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderInput(
                'Class',
                s.class,
                (v) => updateSubField('student_details', 'class', v),
                { required: true, errorKey: 'class', placeholder: 'e.g. 5' }
              )}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput(
                'Section',
                s.section,
                (v) => updateSubField('student_details', 'section', v),
                { required: true, errorKey: 'section', placeholder: 'e.g. A' }
              )}
            </View>
          </View>

          {renderInput(
            "Father's / Guardian Name",
            s.father_name,
            (v) => updateSubField('student_details', 'father_name', v),
            { required: true, errorKey: 'father_name', placeholder: 'Guardian full name' }
          )}

          {renderInput(
            'Parent Mobile Number',
            s.parent_mobile,
            (v) => updateSubField('student_details', 'parent_mobile', v),
            { required: true, keyboardType: 'phone-pad', errorKey: 'parent_mobile', placeholder: 'Parent contact' }
          )}

          {renderInput(
            'Academic Session',
            s.academic_session || '2025-2026',
            (v) => updateSubField('student_details', 'academic_session', v),
            { required: true, errorKey: 'academic_session', placeholder: 'e.g. 2025-2026' }
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              {renderInput('Roll Number', s.roll_number || '', (v) => updateSubField('student_details', 'roll_number', v), { placeholder: 'e.g. 12' })}
            </View>
            <View style={{ flex: 1 }}>
              {renderInput('Blood Group', s.blood_group || '', (v) => updateSubField('student_details', 'blood_group', v), { placeholder: 'e.g. B+' })}
            </View>
          </View>

          {renderInput("Mother's Name", s.mother_name || '', (v) => updateSubField('student_details', 'mother_name', v))}
          {renderInput("Mother's Mobile", s.mother_mobile || '', (v) => updateSubField('student_details', 'mother_mobile', v), { keyboardType: 'phone-pad' })}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>School Transport Required?</Text>
            <Switch
              value={!!s.transport_required}
              onValueChange={(val) => updateSubField('student_details', 'transport_required', val ? 1 : 0)}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={s.transport_required ? '#2563EB' : '#F8FAFC'}
            />
          </View>

          {!!s.transport_required && (
            <View>
              {renderInput('Bus Route', s.bus_route || '', (v) => updateSubField('student_details', 'bus_route', v), { placeholder: 'Route 4' })}
              {renderInput('Pickup Point', s.pickup_point || '', (v) => updateSubField('student_details', 'pickup_point', v), { placeholder: 'Chowk' })}
            </View>
          )}
        </View>
      )}

      {contactType === 'parent' && (
        <View>
          {renderInput(
            'Relationship with Student',
            p.relationship_with_student || 'Father',
            (v) => updateSubField('parent_details', 'relationship_with_student', v),
            { required: true, errorKey: 'relationship_with_student', placeholder: 'Father / Mother / Guardian' }
          )}

          <Text style={styles.subHeading}>Linked Student Information *</Text>
          {renderInput(
            'Student Name',
            p.children?.[0]?.student_name || '',
            (v) => {
              const children = [...(p.children || [])];
              if (!children[0]) children[0] = { student_name: '', student_admission_number: '', relationship: p.relationship_with_student || 'Father' };
              children[0].student_name = v;
              updateSubField('parent_details', 'children', children);
            },
            { required: true, errorKey: 'student_name', placeholder: 'Child full name' }
          )}

          {renderInput(
            'Student Admission Number',
            p.children?.[0]?.student_admission_number || '',
            (v) => {
              const children = [...(p.children || [])];
              if (!children[0]) children[0] = { student_name: '', student_admission_number: '', relationship: p.relationship_with_student || 'Father' };
              children[0].student_admission_number = v;
              updateSubField('parent_details', 'children', children);
            },
            { required: true, errorKey: 'student_admission_number', placeholder: 'e.g. ADM1024' }
          )}

          {renderInput(
            'Class & Section',
            p.children?.[0]?.class_section || '',
            (v) => {
              const children = [...(p.children || [])];
              if (!children[0]) children[0] = { student_name: '', student_admission_number: '', relationship: p.relationship_with_student || 'Father' };
              children[0].class_section = v;
              updateSubField('parent_details', 'children', children);
            },
            { placeholder: 'e.g. 5-A' }
          )}

          {renderInput('Occupation', p.occupation || '', (v) => updateSubField('parent_details', 'occupation', v), { placeholder: 'e.g. Business / Service' })}
          {renderInput('Emergency Contact', p.emergency_contact || '', (v) => updateSubField('parent_details', 'emergency_contact', v), { keyboardType: 'phone-pad' })}
        </View>
      )}

      {contactType === 'teacher' && (
        <View>
          {renderInput(
            'Employee ID',
            t.employee_id,
            (v) => updateSubField('teacher_details', 'employee_id', v),
            { required: true, errorKey: 'employee_id', placeholder: 'e.g. TCH102' }
          )}

          {renderInput(
            'Department / Subject',
            t.department_subject,
            (v) => updateSubField('teacher_details', 'department_subject', v),
            { required: true, errorKey: 'department_subject', placeholder: 'e.g. Mathematics' }
          )}

          {renderInput(
            'Joining Date',
            t.joining_date || '2022-01-01',
            (v) => updateSubField('teacher_details', 'joining_date', v),
            { required: true, errorKey: 'joining_date', placeholder: 'YYYY-MM-DD' }
          )}

          {renderInput('Designation', t.designation || '', (v) => updateSubField('teacher_details', 'designation', v), { placeholder: 'e.g. Senior Math Teacher' })}
          {renderInput('Qualification', t.qualification || '', (v) => updateSubField('teacher_details', 'qualification', v), { placeholder: 'e.g. M.Sc, B.Ed' })}
          {renderInput('Classes Assigned', t.classes_assigned || '', (v) => updateSubField('teacher_details', 'classes_assigned', v), { placeholder: 'e.g. 5, 6, 7' })}
          {renderInput('Emergency Contact', t.emergency_contact || '', (v) => updateSubField('teacher_details', 'emergency_contact', v), { keyboardType: 'phone-pad' })}
        </View>
      )}

      {contactType === 'staff' && (
        <View>
          {renderInput(
            'Employee ID',
            st.employee_id,
            (v) => updateSubField('staff_details', 'employee_id', v),
            { required: true, errorKey: 'employee_id', placeholder: 'e.g. STF201' }
          )}

          {renderInput(
            'Designation',
            st.designation,
            (v) => updateSubField('staff_details', 'designation', v),
            { required: true, errorKey: 'designation', placeholder: 'e.g. Accountant, Clerk, Peon, Librarian' }
          )}

          {renderInput(
            'Department',
            st.department,
            (v) => updateSubField('staff_details', 'department', v),
            { required: true, errorKey: 'department', placeholder: 'e.g. Accounts & Finance, Library' }
          )}

          {renderInput('Joining Date', st.joining_date || '', (v) => updateSubField('staff_details', 'joining_date', v), { placeholder: 'YYYY-MM-DD' })}
          {renderInput('Qualification', st.qualification || '', (v) => updateSubField('staff_details', 'qualification', v))}
          {renderInput('Emergency Contact', st.emergency_contact || '', (v) => updateSubField('staff_details', 'emergency_contact', v), { keyboardType: 'phone-pad' })}
        </View>
      )}

      {contactType === 'driver' && (
        <View>
          {renderInput(
            'Driver ID',
            d.driver_id,
            (v) => updateSubField('driver_details', 'driver_id', v),
            { required: true, errorKey: 'driver_id', placeholder: 'e.g. DRV04' }
          )}

          {renderInput(
            'License Number',
            d.license_number,
            (v) => updateSubField('driver_details', 'license_number', v),
            { required: true, errorKey: 'license_number', placeholder: 'e.g. DL-BR-2018-98441' }
          )}

          {renderInput(
            'Vehicle Number',
            d.vehicle_number,
            (v) => updateSubField('driver_details', 'vehicle_number', v),
            { required: true, errorKey: 'vehicle_number', placeholder: 'e.g. BR-24-EA-5541' }
          )}

          {renderInput('Vehicle Type', d.vehicle_type || '', (v) => updateSubField('driver_details', 'vehicle_type', v), { placeholder: 'e.g. Bus, Van' })}
          {renderInput('Route', d.route || '', (v) => updateSubField('driver_details', 'route', v), { placeholder: 'e.g. Route 4' })}
          {renderInput('Emergency Contact', d.emergency_contact || '', (v) => updateSubField('driver_details', 'emergency_contact', v), { keyboardType: 'phone-pad' })}
        </View>
      )}

      {contactType === 'management' && (
        <View>
          {renderInput(
            'Designation',
            m.designation,
            (v) => updateSubField('management_details', 'designation', v),
            { required: true, errorKey: 'designation', placeholder: 'e.g. Principal / Director / Chairman' }
          )}

          {renderInput('Department', m.department || '', (v) => updateSubField('management_details', 'department', v), { placeholder: 'School Administration' })}
        </View>
      )}

      {/* 3. Address & Notes */}
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={20} color="#0284C7" />
        <Text style={styles.sectionTitle}>Address & Notes</Text>
      </View>

      {renderInput('Address / Landmark', formData.address || '', (v) => onChangeField('address', v), { placeholder: 'House/Street name' })}

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {renderInput('City', formData.city || '', (v) => onChangeField('city', v), { placeholder: 'e.g. Rohtas' })}
        </View>
        <View style={{ flex: 1 }}>
          {renderInput('State', formData.state || '', (v) => onChangeField('state', v), { placeholder: 'e.g. Bihar' })}
        </View>
      </View>

      {renderInput('Pincode', formData.pincode || '', (v) => onChangeField('pincode', v), { keyboardType: 'numeric', placeholder: '6-digit pincode' })}

      {renderInput(
        'Notes',
        formData.notes || '',
        (v) => onChangeField('notes', v),
        { multiline: true, placeholder: 'Any additional notes or reminders...' }
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 4,
    marginBottom: 8,
  },
});
