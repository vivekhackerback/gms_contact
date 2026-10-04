import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localDb } from '../../db/localDb';
import { syncService } from '../../services/syncService';
import { DashboardStats, FullContact } from '../../types/contact';
import { ROLE_COLORS } from '../../constants/theme';
import { makePhoneCall, openWhatsApp } from '../../services/communication';
import { formatIndianMobile } from '../../utils/validation';

interface ActiveCategory {
  type: string;
  label: string;
  icon: string;
  primaryColor: string;
  badgeColor: string;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allContacts, setAllContacts] = useState<FullContact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState('');

  // Modal State for showing contacts on card click
  const [activeCategory, setActiveCategory] = useState<ActiveCategory | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await localDb.getDashboardStats();
      const contacts = await localDb.getAll();
      setStats(data);
      setAllContacts(contacts);
    } catch (e) {
      console.warn('Failed to get dashboard data:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const unsub = syncService.subscribe((rep) => {
      setServerOnline(rep.serverOnline);
      setSyncing(rep.isSyncing);
      if (rep.lastMessage) setLastSyncMessage(rep.lastMessage);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Initial sync from server on mount
    handleSyncNow();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    const res = await syncService.triggerSync();
    setLastSyncMessage(res.message);
    await loadData();
    setSyncing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await syncService.triggerSync();
    await loadData();
  };

  // Contacts filtered for the selected modal card
  const modalContacts = useMemo(() => {
    if (!activeCategory) return [];

    let list = allContacts;
    if (activeCategory.type === 'pending') {
      list = allContacts.filter((c) => c.sync_status === 'pending_sync');
    } else if (activeCategory.type !== 'all') {
      list = allContacts.filter(
        (c) => c.status === 'Active' && c.contact_type === activeCategory.type
      );
    } else {
      list = allContacts.filter((c) => c.status === 'Active');
    }

    if (modalSearch.trim() !== '') {
      const q = modalSearch.trim().toLowerCase();
      list = list.filter((c) => {
        const name = (c.full_name || '').toLowerCase();
        const mob = (c.mobile_number || '').toLowerCase();
        const adm = (c.student_details?.admission_number || c.admission_number || '').toLowerCase();
        const emp = (c.teacher_details?.employee_id || c.staff_details?.employee_id || '').toLowerCase();
        return name.includes(q) || mob.includes(q) || adm.includes(q) || emp.includes(q);
      });
    }

    return list;
  }, [allContacts, activeCategory, modalSearch]);

  const handleOpenCardContacts = (category: ActiveCategory) => {
    setModalSearch('');
    setActiveCategory(category);
  };

  const handleNavigateToDirectory = (type: string) => {
    setActiveCategory(null);
    router.navigate({
      pathname: '/(tabs)',
      params: { type: type === 'pending' ? 'all' : type },
    });
  };

  if (!stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  const roleCards = [
    { type: 'student', label: 'Students', count: stats.by_type.student, config: ROLE_COLORS.student },
    { type: 'parent', label: 'Parents / Guardians', count: stats.by_type.parent, config: ROLE_COLORS.parent },
    { type: 'teacher', label: 'Teachers', count: stats.by_type.teacher, config: ROLE_COLORS.teacher },
    { type: 'staff', label: 'Non-Teaching Staff', count: stats.by_type.staff, config: ROLE_COLORS.staff },
    { type: 'driver', label: 'Drivers', count: stats.by_type.driver, config: ROLE_COLORS.driver },
    { type: 'management', label: 'Management', count: stats.by_type.management, config: ROLE_COLORS.management },
    { type: 'other', label: 'Other Contacts', count: stats.by_type.other, config: ROLE_COLORS.other },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
      >
        {/* 1. Header Overview Card - Clickable */}
        <TouchableOpacity
          style={styles.totalCard}
          activeOpacity={0.85}
          onPress={() =>
            handleOpenCardContacts({
              type: 'all',
              label: 'All Contacts',
              icon: 'people',
              primaryColor: '#0284C7',
              badgeColor: '#E0F2FE',
            })
          }
        >
          <View>
            <Text style={styles.totalLabel}>Total School Contacts</Text>
            <Text style={styles.totalNumber}>{stats.total_contacts.toLocaleString()}</Text>
            <View style={styles.tapToViewRow}>
              <Text style={styles.tapToViewText}>Tap to view all contacts</Text>
              <Ionicons name="arrow-forward" size={13} color="#94A3B8" />
            </View>
          </View>
          <View style={styles.schoolIconCircle}>
            <Ionicons name="school" size={32} color="#0284C7" />
          </View>
        </TouchableOpacity>

        {/* 2. Synchronization Status Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <View style={styles.syncTitleRow}>
              <Ionicons
                name={serverOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={22}
                color={serverOnline ? '#16A34A' : '#EAB308'}
              />
              <Text style={styles.syncTitle}>Sync Status</Text>
            </View>
            <View
              style={[
                styles.onlineBadge,
                { backgroundColor: serverOnline ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.onlineText,
                  { color: serverOnline ? '#15803D' : '#B45309' },
                ]}
              >
                {serverOnline ? 'Server Online' : 'Offline Mode'}
              </Text>
            </View>
          </View>

          <View style={styles.syncMetricsRow}>
            <TouchableOpacity
              style={styles.syncMetric}
              onPress={() =>
                handleOpenCardContacts({
                  type: 'all',
                  label: 'Synced Contacts',
                  icon: 'cloud-done-outline',
                  primaryColor: '#16A34A',
                  badgeColor: '#DCFCE7',
                })
              }
            >
              <Text style={styles.syncCount}>{stats.synced.toLocaleString()}</Text>
              <Text style={styles.syncLabel}>Synced (Tap)</Text>
            </TouchableOpacity>

            <View style={styles.syncDivider} />

            <TouchableOpacity
              style={styles.syncMetric}
              onPress={() =>
                handleOpenCardContacts({
                  type: 'pending',
                  label: 'Pending Sync Contacts',
                  icon: 'cloud-upload-outline',
                  primaryColor: '#D97706',
                  badgeColor: '#FEF3C7',
                })
              }
            >
              <Text
                style={[
                  styles.syncCount,
                  stats.pending_sync > 0 && { color: '#D97706' },
                ]}
              >
                {stats.pending_sync}
              </Text>
              <Text style={styles.syncLabel}>Pending (Tap)</Text>
            </TouchableOpacity>
          </View>

          {lastSyncMessage ? (
            <Text style={styles.syncStatusMsg}>{lastSyncMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.syncNowBtn, syncing && { opacity: 0.7 }]}
            onPress={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="sync" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.syncNowBtnText}>
              {syncing ? 'Synchronizing...' : 'Sync With Server Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Role Breakdown Cards Grid - Clickable */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Contacts by Role</Text>
          <Text style={styles.sectionHint}>Tap any card to view contacts</Text>
        </View>

        <View style={styles.grid}>
          {roleCards.map((rc) => (
            <TouchableOpacity
              key={rc.type}
              style={[
                styles.roleCard,
                { borderLeftColor: rc.config.primary },
              ]}
              activeOpacity={0.75}
              onPress={() =>
                handleOpenCardContacts({
                  type: rc.type,
                  label: rc.label,
                  icon: rc.config.icon,
                  primaryColor: rc.config.primary,
                  badgeColor: rc.config.badge,
                })
              }
            >
              <View style={styles.roleCardTopRow}>
                <View style={[styles.roleIconCircle, { backgroundColor: rc.config.badge }]}>
                  <Ionicons name={rc.config.icon as any} size={22} color={rc.config.primary} />
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
              <View style={styles.roleCardInfo}>
                <Text style={styles.roleCardCount}>{rc.count}</Text>
                <Text style={styles.roleCardLabel}>{rc.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 4. Interactive Bottom Sheet Modal for Card Contacts */}
      <Modal
        visible={!!activeCategory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                {activeCategory && (
                  <View style={[styles.modalCategoryIcon, { backgroundColor: activeCategory.badgeColor }]}>
                    <Ionicons name={activeCategory.icon as any} size={20} color={activeCategory.primaryColor} />
                  </View>
                )}
                <View>
                  <Text style={styles.modalTitle}>{activeCategory?.label}</Text>
                  <Text style={styles.modalSubtitle}>
                    {modalContacts.length} {modalContacts.length === 1 ? 'Contact' : 'Contacts'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveCategory(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Search inside Modal */}
            <View style={styles.modalSearchContainer}>
              <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                value={modalSearch}
                onChangeText={setModalSearch}
                placeholder={`Search ${activeCategory?.label || ''}...`}
                placeholderTextColor="#94A3B8"
              />
              {modalSearch ? (
                <TouchableOpacity onPress={() => setModalSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Contact List */}
            {modalContacts.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="people-outline" size={40} color="#CBD5E1" />
                <Text style={styles.modalEmptyTitle}>No contacts found</Text>
                <Text style={styles.modalEmptyDesc}>
                  {modalSearch ? 'No contacts match your search query.' : 'No contacts in this category yet.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={modalContacts}
                keyExtractor={(item) => item.local_id || String(item.id || item.server_id)}
                style={styles.modalList}
                renderItem={({ item }) => {
                  const s = item.student_details;
                  const t = item.teacher_details;
                  const st = item.staff_details;
                  const d = item.driver_details;

                  let subtitle = '';
                  if (item.contact_type === 'student') {
                    subtitle = `Class: ${s?.class || item.student_class || ''}-${s?.section || item.student_section || 'A'} • Adm: ${s?.admission_number || item.admission_number || ''}`;
                  } else if (item.contact_type === 'teacher') {
                    subtitle = `${t?.department_subject || item.department_subject || 'Faculty'} • ID: ${t?.employee_id || item.teacher_employee_id || ''}`;
                  } else if (item.contact_type === 'staff') {
                    subtitle = `${st?.designation || item.staff_designation || 'Staff'} • ${st?.department || item.staff_department || ''}`;
                  } else if (item.contact_type === 'driver') {
                    subtitle = `Route: ${d?.route || item.route || 'School Bus'} • Vehicle: ${d?.vehicle_number || item.vehicle_number || ''}`;
                  } else if (item.contact_type === 'parent') {
                    const kids = item.parent_details?.children || item.children || [];
                    subtitle = kids.length > 0 ? `Children: ${kids.map(k => k.student_name).join(', ')}` : 'Parent / Guardian';
                  }

                  return (
                    <TouchableOpacity
                      style={styles.modalContactItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveCategory(null);
                        router.push(`/contact/${item.local_id}`);
                      }}
                    >
                      <View style={styles.modalContactLeft}>
                        <Text style={styles.modalContactName}>{item.full_name}</Text>
                        {subtitle ? <Text style={styles.modalContactSub}>{subtitle}</Text> : null}
                        <Text style={styles.modalContactPhone}>
                          {formatIndianMobile(item.mobile_number)}
                        </Text>
                      </View>

                      <View style={styles.modalContactActions}>
                        <TouchableOpacity
                          style={[styles.miniActionBtn, styles.miniCallBtn]}
                          onPress={() => makePhoneCall(item.mobile_number, item.full_name)}
                        >
                          <Ionicons name="call" size={14} color="#0284C7" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniActionBtn, styles.miniWaBtn]}
                          onPress={() => openWhatsApp(item.whatsapp_number || item.mobile_number, item.full_name)}
                        >
                          <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Bottom Button to View Full Directory */}
            {activeCategory && (
              <TouchableOpacity
                style={[styles.modalViewAllBtn, { backgroundColor: activeCategory.primaryColor }]}
                onPress={() => handleNavigateToDirectory(activeCategory.type)}
              >
                <Text style={styles.modalViewAllText}>
                  Open All in Directory Filter
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  },
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalNumber: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  tapToViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tapToViewText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  schoolIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  syncCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  onlineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  syncMetric: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  syncCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  syncLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  syncDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  syncStatusMsg: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  syncNowBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  syncNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  roleCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardInfo: {},
  roleCardCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleCardLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalCategoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  modalList: {
    maxHeight: 320,
  },
  modalContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalContactLeft: {
    flex: 1,
    paddingRight: 8,
  },
  modalContactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalContactSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalContactPhone: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 4,
  },
  modalContactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCallBtn: {
    backgroundColor: '#E0F2FE',
  },
  miniWaBtn: {
    backgroundColor: '#DCFCE7',
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  modalEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  modalEmptyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 12,
  },
  modalViewAllText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
