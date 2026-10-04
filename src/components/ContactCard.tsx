import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FullContact } from '../types/contact';
import { ROLE_COLORS } from '../constants/theme';
import { RoleBadge } from './RoleBadge';
import { formatIndianMobile } from '../utils/validation';

interface Props {
  contact: FullContact;
  onPress: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
}

export function ContactCard({ contact, onPress, onCall, onWhatsApp }: Props) {
  const roleConfig = ROLE_COLORS[contact.contact_type] || ROLE_COLORS.other;

  // Extract role specific summary line
  const renderRoleSubtitle = () => {
    switch (contact.contact_type) {
      case 'student': {
        const s = contact.student_details;
        const cls = s?.class || contact.student_class;
        const sec = s?.section || contact.student_section;
        const adm = s?.admission_number || contact.admission_number;
        const father = s?.father_name || contact.father_name;
        return (
          <View style={styles.detailRow}>
            {cls ? (
              <Text style={styles.detailText}>
                Class: <Text style={styles.boldText}>{cls}-{sec || 'A'}</Text>
                {adm ? ` • Adm: ${adm}` : ''}
              </Text>
            ) : null}
            {father ? <Text style={styles.subDetailText}>Parent: {father}</Text> : null}
          </View>
        );
      }
      case 'parent': {
        const children = contact.parent_details?.children || contact.children || [];
        const rel = contact.parent_details?.relationship_with_student || contact.relationship_with_student || 'Parent';
        return (
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>
              Relation: <Text style={styles.boldText}>{rel}</Text>
            </Text>
            {children.length > 0 ? (
              <View style={styles.childrenContainer}>
                <Text style={styles.subDetailText}>
                  Children: {children.map(c => `${c.student_name} (${c.class_section || 'Student'})`).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        );
      }
      case 'teacher': {
        const t = contact.teacher_details;
        const dept = t?.department_subject || contact.department_subject || 'Faculty';
        const classes = t?.classes_assigned || contact.classes_assigned;
        const empId = t?.employee_id || contact.teacher_employee_id;
        return (
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>
              <Text style={styles.boldText}>{dept}</Text>
              {classes ? ` • Classes: ${classes}` : ''}
            </Text>
            {empId ? <Text style={styles.subDetailText}>Emp ID: {empId}</Text> : null}
          </View>
        );
      }
      case 'staff': {
        const st = contact.staff_details;
        const desig = st?.designation || contact.staff_designation || 'Staff';
        const dept = st?.department || contact.staff_department;
        const empId = st?.employee_id || contact.staff_employee_id;
        return (
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>
              <Text style={styles.boldText}>{desig}</Text> {dept ? `• ${dept}` : ''}
            </Text>
            {empId ? <Text style={styles.subDetailText}>Emp ID: {empId}</Text> : null}
          </View>
        );
      }
      case 'driver': {
        const d = contact.driver_details;
        const veh = d?.vehicle_number || contact.vehicle_number;
        const route = d?.route || contact.route;
        return (
          <View style={styles.detailRow}>
            {veh ? (
              <Text style={styles.detailText}>
                Vehicle: <Text style={styles.boldText}>{veh}</Text>
              </Text>
            ) : null}
            {route ? <Text style={styles.subDetailText}>Route: {route}</Text> : null}
          </View>
        );
      }
      case 'management': {
        const m = contact.management_details;
        const desig = m?.designation || contact.management_designation || 'Director/Board';
        return (
          <View style={styles.detailRow}>
            <Text style={styles.boldText}>{desig}</Text>
          </View>
        );
      }
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: roleConfig.primary }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: roleConfig.badge }]}>
            <Ionicons name={roleConfig.icon as any} size={20} color={roleConfig.primary} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.fullName} numberOfLines={1}>{contact.full_name}</Text>
            <View style={styles.badgeRow}>
              <RoleBadge type={contact.contact_type} size="small" />
              {contact.sync_status === 'pending_sync' && (
                <View style={styles.pendingBadge}>
                  <Ionicons name="cloud-upload-outline" size={10} color="#D97706" />
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Role specific detail information */}
      <View style={styles.cardBody}>
        {renderRoleSubtitle()}

        <View style={styles.mobileRow}>
          <Ionicons name="phone-portrait-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.mobileNumber}>{formatIndianMobile(contact.mobile_number)}</Text>
        </View>
      </View>

      {/* Action Buttons: Call & WhatsApp */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.callBtn]}
          onPress={onCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={15} color="#0284C7" />
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.whatsAppBtn]}
          onPress={onWhatsApp}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
          <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nameBlock: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  pendingText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
  },
  cardBody: {
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 4,
  },
  detailRow: {
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
  },
  boldText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  subDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  childrenContainer: {
    marginTop: 2,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  mobileNumber: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  callBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  callBtnText: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 13,
  },
  whatsAppBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsAppBtnText: {
    color: '#15803D',
    fontWeight: '600',
    fontSize: 13,
  },
});
