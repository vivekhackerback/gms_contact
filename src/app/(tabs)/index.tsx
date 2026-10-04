import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { localDb } from '../../db/localDb';
import { syncService } from '../../services/syncService';
import { makePhoneCall, openWhatsApp } from '../../services/communication';
import { FullContact } from '../../types/contact';
import { ContactCard } from '../../components/ContactCard';
import { SearchInput } from '../../components/SearchInput';
import { FilterBar } from '../../components/FilterBar';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const [contacts, setContacts] = useState<FullContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubFilter, setSelectedSubFilter] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Listen to params when navigated from Dashboard cards
  useEffect(() => {
    if (params.type) {
      setSelectedType(params.type);
      setSelectedSubFilter('');
    }
  }, [params.type]);

  const loadData = useCallback(async (shouldSyncServer = false) => {
    try {
      if (shouldSyncServer) {
        setRefreshing(true);
        await syncService.triggerSync();
      }
      const all = await localDb.getAll();
      setContacts(all);
      const stats = await localDb.getDashboardStats();
      setPendingCount(stats.pending_sync);
    } catch (e: any) {
      console.warn('Failed to load contacts:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch from server on first launch/mount
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Reload local cache when focused
  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData])
  );

  useEffect(() => {
    const unsub = syncService.subscribe((report) => {
      setServerOnline(report.serverOnline);
      setPendingCount(report.pendingCount);
      if (report.lastMessage) {
        setSyncStatusMsg(report.lastMessage);
      }
    });
    return unsub;
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncService.triggerSync();
    await loadData(false);
  };

  // Filter and search computation
  const filteredContacts = useMemo(() => {
    let result = contacts.filter((c) => c.status === 'Active');

    // Role Filter
    if (selectedType !== 'all') {
      result = result.filter((c) => c.contact_type === selectedType);
    }

    // Role-specific SubFilter
    if (selectedSubFilter) {
      if (selectedType === 'student') {
        result = result.filter(
          (c) =>
            c.student_details?.class === selectedSubFilter ||
            c.student_class === selectedSubFilter
        );
      } else if (selectedType === 'teacher') {
        result = result.filter((c) => {
          const subj =
            c.teacher_details?.department_subject || c.department_subject || '';
          return subj.toLowerCase().includes(selectedSubFilter.toLowerCase());
        });
      } else if (selectedType === 'staff') {
        result = result.filter((c) => {
          const dept =
            c.staff_details?.department || c.staff_department || '';
          return dept.toLowerCase().includes(selectedSubFilter.toLowerCase());
        });
      }
    }

    // Search Query (Multi-field: name, mobile, admission no, employee id, etc.)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => {
        const name = (c.full_name || '').toLowerCase();
        const mobile = (c.mobile_number || '').toLowerCase();
        const altMobile = (c.alternate_mobile || '').toLowerCase();
        const notes = (c.notes || '').toLowerCase();

        // Student fields
        const s = c.student_details;
        const adm = (s?.admission_number || c.admission_number || '').toLowerCase();
        const father = (s?.father_name || c.father_name || '').toLowerCase();
        const cls = (s?.class || c.student_class || '').toLowerCase();
        const sec = (s?.section || c.student_section || '').toLowerCase();

        // Parent fields
        const children = c.parent_details?.children || c.children || [];
        const childMatch = children.some(
          (ch) =>
            (ch.student_name || '').toLowerCase().includes(q) ||
            (ch.student_admission_number || '').toLowerCase().includes(q)
        );

        // Teacher & Staff fields
        const empId = (
          c.teacher_details?.employee_id ||
          c.staff_details?.employee_id ||
          c.teacher_employee_id ||
          c.staff_employee_id ||
          ''
        ).toLowerCase();
        const dept = (
          c.teacher_details?.department_subject ||
          c.staff_details?.department ||
          c.department_subject ||
          ''
        ).toLowerCase();
        const desig = (
          c.staff_details?.designation ||
          c.management_details?.designation ||
          c.staff_designation ||
          ''
        ).toLowerCase();

        // Driver fields
        const veh = (c.driver_details?.vehicle_number || c.vehicle_number || '').toLowerCase();
        const route = (c.driver_details?.route || c.route || '').toLowerCase();

        return (
          name.includes(q) ||
          mobile.includes(q) ||
          altMobile.includes(q) ||
          adm.includes(q) ||
          empId.includes(q) ||
          father.includes(q) ||
          cls.includes(q) ||
          sec.includes(q) ||
          dept.includes(q) ||
          desig.includes(q) ||
          veh.includes(q) ||
          route.includes(q) ||
          notes.includes(q) ||
          childMatch
        );
      });
    }

    return result;
  }, [contacts, selectedType, selectedSubFilter, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Network & Sync Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.bannerItem}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: serverOnline ? '#16A34A' : '#EAB308' },
            ]}
          />
          <Text style={styles.bannerText}>
            {serverOnline ? 'Connected to MySQL Server' : 'Working Offline'}
          </Text>
        </View>

        {pendingCount > 0 ? (
          <TouchableOpacity style={styles.pendingBtn} onPress={onRefresh}>
            <Ionicons name="cloud-upload-outline" size={13} color="#B45309" />
            <Text style={styles.pendingBtnText}>{pendingCount} pending sync</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.syncedTag} onPress={onRefresh}>
            <Ionicons name="checkmark-done" size={13} color="#15803D" />
            <Text style={styles.syncedTagText}>Synced</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input Container */}
      <View style={styles.searchSection}>
        <SearchInput value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Role and Sub-Filters */}
      <FilterBar
        selectedType={selectedType}
        onSelectType={setSelectedType}
        selectedSubFilter={selectedSubFilter}
        onSelectSubFilter={setSelectedSubFilter}
      />

      {/* Contact Cards List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Fetching contacts from server database...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.local_id || String(item.id || item.server_id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onPress={() => router.push(`/contact/${item.local_id}`)}
              onCall={() => makePhoneCall(item.mobile_number, item.full_name)}
              onWhatsApp={() => openWhatsApp(item.whatsapp_number || item.mobile_number, item.full_name)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0284C7']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="server-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try modifying your search query or filters.'
                  : 'No contacts retrieved from the server. Tap below to fetch directly from your server.'}
              </Text>
              <TouchableOpacity style={styles.fetchBtn} onPress={onRefresh}>
                <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.fetchBtnText}>Fetch From Server</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Add Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + Math.max(insets.bottom, 8) }]}
        onPress={() => router.push('/contact/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  pendingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  pendingBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  syncedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  syncedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
  },
  fetchBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
