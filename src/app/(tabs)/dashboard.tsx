import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { localDb } from '../../db/localDb';
import { syncService } from '../../services/syncService';
import { DashboardStats } from '../../types/contact';
import { ROLE_COLORS } from '../../constants/theme';

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const data = await localDb.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.warn('Failed to get dashboard stats:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
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
    await loadStats();
    setSyncing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await syncService.triggerSync();
    await loadStats();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
      }
    >
      {/* 1. Header Overview Card */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalLabel}>Total School Contacts</Text>
          <Text style={styles.totalNumber}>{stats.total_contacts.toLocaleString()}</Text>
        </View>
        <View style={styles.schoolIconCircle}>
          <Ionicons name="school" size={32} color="#0284C7" />
        </View>
      </View>

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
          <View style={styles.syncMetric}>
            <Text style={styles.syncCount}>{stats.synced.toLocaleString()}</Text>
            <Text style={styles.syncLabel}>Synced</Text>
          </View>

          <View style={styles.syncDivider} />

          <View style={styles.syncMetric}>
            <Text
              style={[
                styles.syncCount,
                stats.pending_sync > 0 && { color: '#D97706' },
              ]}
            >
              {stats.pending_sync}
            </Text>
            <Text style={styles.syncLabel}>Pending Sync</Text>
          </View>
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

      {/* 3. Role Breakdown Cards Grid */}
      <Text style={styles.sectionHeader}>Contacts by Role</Text>
      <View style={styles.grid}>
        {roleCards.map((rc) => (
          <View
            key={rc.type}
            style={[
              styles.roleCard,
              { borderLeftColor: rc.config.primary },
            ]}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: rc.config.badge }]}>
              <Ionicons name={rc.config.icon as any} size={22} color={rc.config.primary} />
            </View>
            <View style={styles.roleCardInfo}>
              <Text style={styles.roleCardCount}>{rc.count}</Text>
              <Text style={styles.roleCardLabel}>{rc.label}</Text>
            </View>
          </View>
        ))}
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
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
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
});
