import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { localDb } from '../../db/localDb';
import { apiService } from '../../services/api';
import { makePhoneCall, openWhatsApp, sendEmail } from '../../services/communication';
import { FullContact } from '../../types/contact';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants/theme';
import { RoleBadge } from '../../components/RoleBadge';
import { formatIndianMobile } from '../../utils/validation';

export default function ContactDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<FullContact | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      let data = await localDb.getById(id);
      if (!data) {
        data = await apiService.getContact(id);
        if (data) {
          await localDb.save(data);
        }
      }
      setContact(data);
    } catch (e) {
      console.warn('Error fetching contact:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleDelete = () => {
    if (!contact) return;
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${contact.full_name} from the school directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (contact.server_id) {
                apiService.deleteContact(contact.server_id).catch(() => {});
              }
              await localDb.delete(contact.local_id);
              Alert.alert('Deleted', 'Contact has been deleted from your directory.');
              router.replace('/(tabs)');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={styles.notFoundText}>Contact Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleConfig = ROLE_COLORS[contact.contact_type] || ROLE_COLORS.other;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header Profile Banner */}
      <View style={styles.headerCard}>
        <View style={[styles.avatarCircle, { backgroundColor: roleConfig.badge }]}>
          <Ionicons name={roleConfig.icon as any} size={36} color={roleConfig.primary} />
        </View>

        <Text style={styles.name}>{contact.full_name}</Text>
        <View style={styles.badgeWrap}>
          <RoleBadge type={contact.contact_type} size="medium" />
        </View>

        {contact.sync_status === 'pending_sync' && (
          <View style={styles.pendingTag}>
            <Ionicons name="cloud-upload-outline" size={12} color="#B45309" />
            <Text style={styles.pendingTagText}>Sync Status: Pending Upload</Text>
          </View>
        )}
      </View>

      {/* 2. Primary Communication Action Bar */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => makePhoneCall(contact.mobile_number, contact.full_name)}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.whatsAppButton]}
          onPress={() => openWhatsApp(contact.whatsapp_number || contact.mobile_number, contact.full_name)}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        {contact.email ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.emailButton]}
            onPress={() => sendEmail(contact.email!, contact.full_name)}
          >
            <Ionicons name="mail" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. Role-Specific Details Section */}
      {contact.contact_type === 'student' && contact.student_details && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>Student Academic Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admission No:</Text>
            <Text style={styles.infoValueBold}>{contact.student_details.admission_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Class & Section:</Text>
            <Text style={styles.infoValue}>Class {contact.student_details.class} - {contact.student_details.section}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll Number:</Text>
            <Text style={styles.infoValue}>{contact.student_details.roll_number || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Session:</Text>
            <Text style={styles.infoValue}>{contact.student_details.academic_session}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Father / Guardian:</Text>
            <Text style={styles.infoValueBold}>{contact.student_details.father_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Parent Mobile:</Text>
            <Text style={styles.infoValue}>{formatIndianMobile(contact.student_details.parent_mobile)}</Text>
          </View>
          {contact.student_details.mother_name ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mother's Name:</Text>
              <Text style={styles.infoValue}>{contact.student_details.mother_name}</Text>
            </View>
          ) : null}
          {contact.student_details.blood_group ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group:</Text>
              <Text style={styles.infoValue}>{contact.student_details.blood_group}</Text>
            </View>
          ) : null}
          {!!contact.student_details.transport_required && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transport Route:</Text>
              <Text style={styles.infoValue}>{contact.student_details.bus_route || 'Yes (Standard Route)'}</Text>
            </View>
          )}
        </View>
      )}

      {contact.contact_type === 'parent' && contact.parent_details && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Parent / Guardian Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Relationship:</Text>
            <Text style={styles.infoValueBold}>{contact.parent_details.relationship_with_student}</Text>
          </View>
          {contact.parent_details.occupation ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Occupation:</Text>
              <Text style={styles.infoValue}>{contact.parent_details.occupation}</Text>
            </View>
          ) : null}

          {/* Linked children */}
          <Text style={styles.subSectionTitle}>Linked Students (Children)</Text>
          {(contact.parent_details.children || contact.children || []).map((ch, idx) => (
            <View key={idx} style={styles.childBox}>
              <Ionicons name="person-outline" size={16} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{ch.student_name}</Text>
                <Text style={styles.childSub}>
                  Adm: {ch.student_admission_number || 'N/A'} • {ch.class_section || 'Class N/A'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {contact.contact_type === 'teacher' && contact.teacher_details && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={18} color="#9333EA" />
            <Text style={styles.sectionTitle}>Teacher Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID:</Text>
            <Text style={styles.infoValueBold}>{contact.teacher_details.employee_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subject / Dept:</Text>
            <Text style={styles.infoValue}>{contact.teacher_details.department_subject}</Text>
          </View>
          {contact.teacher_details.designation ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Designation:</Text>
              <Text style={styles.infoValue}>{contact.teacher_details.designation}</Text>
            </View>
          ) : null}
          {contact.teacher_details.classes_assigned ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Classes Assigned:</Text>
              <Text style={styles.infoValue}>{contact.teacher_details.classes_assigned}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joining Date:</Text>
            <Text style={styles.infoValue}>{contact.teacher_details.joining_date}</Text>
          </View>
        </View>
      )}

      {contact.contact_type === 'staff' && contact.staff_details && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={18} color="#EA580C" />
            <Text style={styles.sectionTitle}>Non-Teaching Staff Info</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee ID:</Text>
            <Text style={styles.infoValueBold}>{contact.staff_details.employee_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Designation:</Text>
            <Text style={styles.infoValue}>{contact.staff_details.designation}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{contact.staff_details.department}</Text>
          </View>
        </View>
      )}

      {contact.contact_type === 'driver' && contact.driver_details && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bus-outline" size={18} color="#0D9488" />
            <Text style={styles.sectionTitle}>Driver & Route Info</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver ID:</Text>
            <Text style={styles.infoValueBold}>{contact.driver_details.driver_id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Number:</Text>
            <Text style={styles.infoValueBold}>{contact.driver_details.vehicle_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License No:</Text>
            <Text style={styles.infoValue}>{contact.driver_details.license_number}</Text>
          </View>
          {contact.driver_details.route ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Route:</Text>
              <Text style={styles.infoValue}>{contact.driver_details.route}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 4. Contact Numbers & Address Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="call-outline" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Contact & Location</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Primary Mobile:</Text>
          <Text style={styles.infoValueBold}>{formatIndianMobile(contact.mobile_number)}</Text>
        </View>
        {contact.alternate_mobile ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alt Mobile:</Text>
            <Text style={styles.infoValue}>{formatIndianMobile(contact.alternate_mobile)}</Text>
          </View>
        ) : null}
        {contact.whatsapp_number ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>WhatsApp:</Text>
            <Text style={styles.infoValue}>{formatIndianMobile(contact.whatsapp_number)}</Text>
          </View>
        ) : null}
        {contact.email ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{contact.email}</Text>
          </View>
        ) : null}
        {contact.address ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{contact.address}</Text>
          </View>
        ) : null}
        {contact.city || contact.state ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City / State:</Text>
            <Text style={styles.infoValue}>
              {[contact.city, contact.state, contact.pincode].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 5. Notes */}
      {contact.notes ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color="#64748B" />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{contact.notes}</Text>
        </View>
      ) : null}

      {/* 6. Edit & Delete Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/contact/edit/${contact.local_id}`)}
        >
          <Ionicons name="create-outline" size={18} color="#0284C7" />
          <Text style={styles.editBtnText}>Edit Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 10,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0284C7',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  badgeWrap: {
    marginBottom: 8,
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pendingTagText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#0284C7',
  },
  whatsAppButton: {
    backgroundColor: '#16A34A',
  },
  emailButton: {
    backgroundColor: '#6366F1',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1.5,
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1.5,
    textAlign: 'right',
  },
  childBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  childName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  childSub: {
    fontSize: 11,
    color: '#64748B',
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  editBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
