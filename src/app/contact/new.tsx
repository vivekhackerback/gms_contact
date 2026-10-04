import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ContactType, FullContact } from '../../types/contact';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants/theme';
import { DynamicForm } from '../../components/DynamicForm';
import { DuplicateModal } from '../../components/DuplicateModal';
import { isValidIndianMobile, isValidEmail, normalizeIndianMobile } from '../../utils/validation';
import { localDb } from '../../db/localDb';
import { syncService } from '../../services/syncService';
import { apiService } from '../../services/api';

const CONTACT_TYPES: ContactType[] = [
  'student',
  'parent',
  'teacher',
  'staff',
  'driver',
  'management',
  'other',
];

export default function NewContactScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [contactType, setContactType] = useState<ContactType>('student');
  const [formData, setFormData] = useState<Partial<FullContact>>({
    contact_type: 'student',
    status: 'Active',
    student_details: {
      student_name: '',
      admission_number: '',
      class: '',
      section: 'A',
      father_name: '',
      parent_mobile: '',
      academic_session: '2025-2026',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Duplicate Modal State
  const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
  const [duplicateContact, setDuplicateContact] = useState<FullContact | null>(null);
  const [duplicateReason, setDuplicateReason] = useState('');

  const handleSelectType = (type: ContactType) => {
    setContactType(type);
    const initial: Partial<FullContact> = {
      contact_type: type,
      status: 'Active',
      full_name: formData.full_name || '',
      mobile_number: formData.mobile_number || '',
      email: formData.email || '',
    };

    if (type === 'student') {
      initial.student_details = {
        student_name: formData.full_name || '',
        admission_number: '',
        class: '',
        section: 'A',
        father_name: '',
        parent_mobile: formData.mobile_number || '',
        academic_session: '2025-2026',
      };
    } else if (type === 'parent') {
      initial.parent_details = {
        parent_name: formData.full_name || '',
        relationship_with_student: 'Father',
        children: [{ student_name: '', student_admission_number: '', class_section: '', relationship: 'Father' }],
      };
    } else if (type === 'teacher') {
      initial.teacher_details = {
        teacher_name: formData.full_name || '',
        employee_id: '',
        department_subject: '',
        joining_date: new Date().toISOString().split('T')[0],
      };
    } else if (type === 'staff') {
      initial.staff_details = {
        staff_name: formData.full_name || '',
        employee_id: '',
        designation: '',
        department: '',
      };
    } else if (type === 'driver') {
      initial.driver_details = {
        driver_name: formData.full_name || '',
        driver_id: '',
        license_number: '',
        vehicle_number: '',
      };
    } else if (type === 'management') {
      initial.management_details = {
        name: formData.full_name || '',
        designation: '',
        department: 'School Administration',
      };
    }

    setFormData(initial);
    setStep(2);
  };

  const handleFieldChange = (field: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.full_name || formData.full_name.trim() === '') {
      errs.full_name = 'Full Name is required';
    }

    if (!formData.mobile_number || formData.mobile_number.trim() === '') {
      errs.mobile_number = 'Mobile number is required';
    } else if (!isValidIndianMobile(formData.mobile_number)) {
      errs.mobile_number = 'Enter a valid 10-digit Indian mobile number';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      errs.email = 'Enter a valid email address';
    }

    // Role-specific validations
    if (contactType === 'student') {
      const s = formData.student_details;
      if (!s?.admission_number?.trim()) errs.admission_number = 'Admission number is required';
      if (!s?.class?.trim()) errs.class = 'Class is required';
      if (!s?.section?.trim()) errs.section = 'Section is required';
      if (!s?.father_name?.trim()) errs.father_name = "Father's name is required";
      if (!s?.parent_mobile?.trim()) {
        errs.parent_mobile = 'Parent mobile is required';
      } else if (!isValidIndianMobile(s.parent_mobile)) {
        errs.parent_mobile = 'Enter a valid 10-digit mobile number';
      }
      if (!s?.academic_session?.trim()) errs.academic_session = 'Academic session is required';
    } else if (contactType === 'parent') {
      const p = formData.parent_details;
      if (!p?.relationship_with_student?.trim()) errs.relationship_with_student = 'Relationship is required';
      const child = p?.children?.[0];
      if (!child?.student_name?.trim()) errs.student_name = 'Student Name is required';
      if (!child?.student_admission_number?.trim()) errs.student_admission_number = 'Admission number is required';
    } else if (contactType === 'teacher') {
      const t = formData.teacher_details;
      if (!t?.employee_id?.trim()) errs.employee_id = 'Employee ID is required';
      if (!t?.department_subject?.trim()) errs.department_subject = 'Department / Subject is required';
      if (!t?.joining_date?.trim()) errs.joining_date = 'Joining Date is required';
    } else if (contactType === 'staff') {
      const st = formData.staff_details;
      if (!st?.employee_id?.trim()) errs.employee_id = 'Employee ID is required';
      if (!st?.designation?.trim()) errs.designation = 'Designation is required';
      if (!st?.department?.trim()) errs.department = 'Department is required';
    } else if (contactType === 'driver') {
      const d = formData.driver_details;
      if (!d?.driver_id?.trim()) errs.driver_id = 'Driver ID is required';
      if (!d?.license_number?.trim()) errs.license_number = 'License number is required';
      if (!d?.vehicle_number?.trim()) errs.vehicle_number = 'Vehicle number is required';
    } else if (contactType === 'management') {
      const m = formData.management_details;
      if (!m?.designation?.trim()) errs.designation = 'Designation is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Duplicate Check before saving
  const checkDuplicateAndSave = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please complete all required fields correctly before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const normMobile = normalizeIndianMobile(formData.mobile_number);
      const allLocal = await localDb.getAll();

      // 1. Check local duplicates
      const localDup = allLocal.find((c) => {
        const cMobile = normalizeIndianMobile(c.mobile_number);
        if (cMobile && cMobile === normMobile) return true;

        if (formData.contact_type === 'student' && formData.student_details?.admission_number) {
          const adm = formData.student_details.admission_number.trim().toLowerCase();
          if ((c.student_details?.admission_number || c.admission_number || '').trim().toLowerCase() === adm) {
            return true;
          }
        }
        if (formData.contact_type === 'teacher' && formData.teacher_details?.employee_id) {
          const emp = formData.teacher_details.employee_id.trim().toLowerCase();
          if ((c.teacher_details?.employee_id || c.teacher_employee_id || '').trim().toLowerCase() === emp) {
            return true;
          }
        }
        return false;
      });

      if (localDup) {
        setIsSaving(false);
        setDuplicateContact(localDup);
        setDuplicateReason(
          normalizeIndianMobile(localDup.mobile_number) === normMobile
            ? `A contact with mobile number +91 ${normMobile} already exists.`
            : `A contact with the same Admission / Employee ID already exists.`
        );
        setDuplicateModalVisible(true);
        return;
      }

      // 2. Check remote duplicates if server is online
      const remoteDup = await apiService.checkDuplicate({
        mobile: normMobile,
        admission_number: formData.student_details?.admission_number,
        employee_id: formData.teacher_details?.employee_id || formData.staff_details?.employee_id,
      });

      if (remoteDup.exists && remoteDup.contact) {
        setIsSaving(false);
        setDuplicateContact(remoteDup.contact);
        setDuplicateReason(`A contact with this mobile number or ID is already registered on the school server.`);
        setDuplicateModalVisible(true);
        return;
      }

      // No duplicate: Save immediately
      await performSave();
    } catch (e: any) {
      console.warn('Error during duplicate check:', e);
      await performSave();
    }
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      const newContact: FullContact = {
        ...formData,
        local_id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        contact_type: contactType,
        full_name: formData.full_name!.trim(),
        mobile_number: normalizeIndianMobile(formData.mobile_number!),
        alternate_mobile: normalizeIndianMobile(formData.alternate_mobile),
        whatsapp_number: normalizeIndianMobile(formData.whatsapp_number || formData.mobile_number!),
        status: formData.status || 'Active',
        sync_status: 'pending_sync',
        sync_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await syncService.saveContact(newContact);

      setIsSaving(false);
      Alert.alert(
        'Contact Saved',
        result.synced
          ? 'Contact was saved and synchronized with the school server!'
          : 'Contact saved locally. It will automatically sync once the server is available.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Error', err.message || 'Failed to save contact');
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepHeader}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step >= 1 && styles.stepNumberActive]}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Select Role</Text>
        </View>

        <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, step === 2 && styles.stepActive]}>
            <Text style={[styles.stepNumber, step === 2 && styles.stepNumberActive]}>2</Text>
          </View>
          <Text style={styles.stepLabel}>Contact Details</Text>
        </View>
      </View>

      {/* STEP 1: Select Contact Type */}
      {step === 1 ? (
        <ScrollView contentContainerStyle={styles.typeSelectionContent}>
          <Text style={styles.heading}>Select Contact Type</Text>
          <Text style={styles.subheading}>
            Select the role of the person to display appropriate required fields.
          </Text>

          <View style={styles.typeGrid}>
            {CONTACT_TYPES.map((type) => {
              const config = ROLE_COLORS[type] || ROLE_COLORS.other;
              const label = ROLE_LABELS[type] || type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeCard, { borderLeftColor: config.primary }]}
                  onPress={() => handleSelectType(type)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.typeIconCircle, { backgroundColor: config.badge }]}>
                    <Ionicons name={config.icon as any} size={24} color={config.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.typeTitle}>{label}</Text>
                    <Text style={styles.typeDesc}>
                      {type === 'student' && 'Requires admission no, class, guardian info'}
                      {type === 'parent' && 'Link with one or multiple student children'}
                      {type === 'teacher' && 'Subject, employee ID, assigned classes'}
                      {type === 'staff' && 'Accountant, clerk, librarian, security'}
                      {type === 'driver' && 'Vehicle number, license & route'}
                      {type === 'management' && 'Principal, trustees & school director'}
                      {type === 'other' && 'Vendors, alumni, guests'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* STEP 2: Dynamic Form */
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formTopBar}>
            <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={18} color="#0284C7" />
              <Text style={styles.backStepText}>Change Role</Text>
            </TouchableOpacity>

            <View style={[styles.selectedRoleBadge, { backgroundColor: ROLE_COLORS[contactType]?.badge }]}>
              <Ionicons
                name={ROLE_COLORS[contactType]?.icon as any}
                size={14}
                color={ROLE_COLORS[contactType]?.primary}
              />
              <Text style={[styles.selectedRoleText, { color: ROLE_COLORS[contactType]?.primary }]}>
                {ROLE_LABELS[contactType]}
              </Text>
            </View>
          </View>

          <DynamicForm
            contactType={contactType}
            formData={formData}
            onChangeField={handleFieldChange}
            errors={errors}
          />

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={checkDuplicateAndSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.saveBtnText}>
              {isSaving ? 'Checking & Saving...' : 'Save Contact'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Duplicate Resolution Modal */}
      <DuplicateModal
        visible={duplicateModalVisible}
        duplicateContact={duplicateContact}
        duplicateReason={duplicateReason}
        onViewExisting={() => {
          setDuplicateModalVisible(false);
          if (duplicateContact) {
            router.push(`/contact/${duplicateContact.local_id || duplicateContact.id}`);
          }
        }}
        onUpdateExisting={() => {
          setDuplicateModalVisible(false);
          if (duplicateContact) {
            router.push(`/contact/edit/${duplicateContact.local_id || duplicateContact.id}`);
          }
        }}
        onCreateAnyway={async () => {
          setDuplicateModalVisible(false);
          await performSave();
        }}
        onCancel={() => setDuplicateModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: '#0284C7',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  stepLineActive: {
    backgroundColor: '#0284C7',
  },
  typeSelectionContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  typeGrid: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  formContent: {
    padding: 16,
    paddingBottom: 50,
  },
  formTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  selectedRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
