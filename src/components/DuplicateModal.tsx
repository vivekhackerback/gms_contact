import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FullContact } from '../types/contact';
import { formatIndianMobile } from '../utils/validation';
import { RoleBadge } from './RoleBadge';

interface Props {
  visible: boolean;
  duplicateContact: FullContact | null;
  duplicateReason?: string;
  onViewExisting: () => void;
  onUpdateExisting: () => void;
  onCreateAnyway: () => void;
  onCancel: () => void;
}

export function DuplicateModal({
  visible,
  duplicateContact,
  duplicateReason = 'This mobile number already exists in the system.',
  onViewExisting,
  onUpdateExisting,
  onCreateAnyway,
  onCancel,
}: Props) {
  if (!duplicateContact) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={32} color="#D97706" />
          </View>

          <Text style={styles.title}>Possible Duplicate Contact</Text>
          <Text style={styles.message}>{duplicateReason}</Text>

          {/* Existing contact card preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName}>{duplicateContact.full_name}</Text>
              <RoleBadge type={duplicateContact.contact_type} size="small" />
            </View>
            <Text style={styles.previewMobile}>
              📱 {formatIndianMobile(duplicateContact.mobile_number)}
            </Text>
            {duplicateContact.admission_number || duplicateContact.student_details?.admission_number ? (
              <Text style={styles.previewSub}>
                Adm No: {duplicateContact.admission_number || duplicateContact.student_details?.admission_number}
              </Text>
            ) : null}
            {duplicateContact.teacher_employee_id || duplicateContact.teacher_details?.employee_id ? (
              <Text style={styles.previewSub}>
                Emp ID: {duplicateContact.teacher_employee_id || duplicateContact.teacher_details?.employee_id}
              </Text>
            ) : null}
          </View>

          {/* Action buttons as specified in requirements */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.viewBtn]} onPress={onViewExisting}>
              <Ionicons name="eye-outline" size={16} color="#0284C7" />
              <Text style={styles.viewBtnText}>View Existing</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.updateBtn]} onPress={onUpdateExisting}>
              <Ionicons name="create-outline" size={16} color="#059669" />
              <Text style={styles.updateBtnText}>Update Existing</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.forceBtn]} onPress={onCreateAnyway}>
              <Ionicons name="add-circle-outline" size={16} color="#64748B" />
              <Text style={styles.forceBtnText}>Create Anyway</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  previewCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewMobile: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginTop: 2,
  },
  previewSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    width: '100%',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  viewBtn: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  updateBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  forceBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  forceBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
