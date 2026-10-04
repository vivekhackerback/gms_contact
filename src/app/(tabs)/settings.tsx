import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { syncService } from '../../services/syncService';
import { localDb } from '../../db/localDb';
import { DEFAULT_API_BASE_URL, DOMAIN_URL } from '../../config/appConfig';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(apiService.getBaseUrl());
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'teacher' | 'staff'>('super_admin');

  useEffect(() => {
    setApiUrl(apiService.getBaseUrl());
  }, []);

  const handleSaveUrl = () => {
    apiService.setBaseUrl(apiUrl);
    syncService.checkServer();
    Alert.alert('Saved', 'API server endpoint updated successfully.');
  };

  const handleResetToConfigDefault = () => {
    setApiUrl(DEFAULT_API_BASE_URL);
    apiService.setBaseUrl(DEFAULT_API_BASE_URL);
    syncService.checkServer();
    Alert.alert('Reset', `Reset to configured default:\n${DEFAULT_API_BASE_URL}`);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    apiService.setBaseUrl(apiUrl);
    const ok = await apiService.checkServerHealth();
    setTesting(false);
    if (ok) {
      setTestResult('Success: Server and MySQL database are reachable and responding.');
    } else {
      setTestResult('Failed: Could not reach server at this address. Please ensure ngrok / server is active.');
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    const res = await syncService.triggerSync();
    setSyncing(false);
    Alert.alert(res.success ? 'Sync Completed' : 'Sync Notice', res.message);
  };

  const handleClearCacheAndReload = async () => {
    Alert.alert(
      'Refresh Server Contacts',
      'This will clear the local device cache and fetch all contacts fresh from your server database. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refresh',
          onPress: async () => {
            await localDb.clear();
            const res = await syncService.triggerSync();
            Alert.alert('Done', res.message || 'Contacts fetched from server.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Server Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={20} color="#0284C7" />
          <Text style={styles.cardTitle}>Backend Server Configuration</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Configured domain URL from <Text style={{ fontWeight: '600', color: '#0284C7' }}>src/config/appConfig.ts</Text>.
        </Text>

        <Text style={styles.inputLabel}>Current API Endpoint</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder={DEFAULT_API_BASE_URL}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.testBtn]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#0284C7" />
            ) : (
              <Ionicons name="pulse-outline" size={16} color="#0284C7" />
            )}
            <Text style={styles.testBtnText}>Test Server</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSaveUrl}>
            <Ionicons name="save-outline" size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.defaultResetBtn} onPress={handleResetToConfigDefault}>
          <Ionicons name="refresh-outline" size={14} color="#64748B" />
          <Text style={styles.defaultResetBtnText}>Reset to default ({DOMAIN_URL})</Text>
        </TouchableOpacity>

        {testResult ? (
          <View
            style={[
              styles.testResultBox,
              testResult.startsWith('Success') ? styles.resultSuccess : styles.resultError,
            ]}
          >
            <Text
              style={[
                styles.resultText,
                testResult.startsWith('Success') ? styles.textSuccess : styles.textError,
              ]}
            >
              {testResult}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Live Synchronization */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sync-outline" size={20} color="#0284C7" />
          <Text style={styles.cardTitle}>Database Synchronization</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Fetch all latest contacts directly from your MySQL database or push pending local edits.
        </Text>

        <TouchableOpacity
          style={[styles.syncActionBtn, syncing && { opacity: 0.7 }]}
          onPress={handleForceSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cloud-download-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.syncActionBtnText}>
            {syncing ? 'Synchronizing...' : 'Sync All Contacts Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearCacheAndReload}>
          <Ionicons name="refresh-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.dangerBtnText}>Clear Local Cache & Re-fetch from Server</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Role-Based Access Control (RBAC) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
          <Text style={styles.cardTitle}>Role-Based Access (Security)</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Select your active school role for access simulation:
        </Text>

        <View style={styles.rolePicker}>
          {[
            { key: 'super_admin', label: 'Super Admin', desc: 'Full Access (Add / Edit / Delete)' },
            { key: 'admin', label: 'Admin', desc: 'Add / Edit / View contacts' },
            { key: 'teacher', label: 'Teacher', desc: 'View student & parent contacts' },
            { key: 'staff', label: 'Staff', desc: 'View permitted department contacts' },
          ].map((r) => {
            const isSelected = userRole === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleOption, isSelected && styles.roleOptionActive]}
                onPress={() => setUserRole(r.key as any)}
              >
                <View style={styles.roleRadio}>
                  {isSelected && <View style={styles.roleRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  testBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  testBtnText: {
    color: '#0284C7',
    fontWeight: '600',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  defaultResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  defaultResetBtnText: {
    fontSize: 11,
    color: '#64748B',
  },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  syncActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  testResultBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textSuccess: {
    color: '#16A34A',
  },
  textError: {
    color: '#DC2626',
  },
  rolePicker: {
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  roleOptionActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  roleRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  roleLabelActive: {
    color: '#0284C7',
  },
  roleDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  dangerBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
});
