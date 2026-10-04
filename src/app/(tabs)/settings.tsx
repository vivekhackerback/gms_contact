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
import { apiService, DEFAULT_API_BASE } from '../../services/api';
import { syncService } from '../../services/syncService';
import { localDb } from '../../db/localDb';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(apiService.getBaseUrl());
  const [testing, setTesting] = useState(false);
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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    apiService.setBaseUrl(apiUrl);
    const ok = await apiService.checkServerHealth();
    setTesting(false);
    if (ok) {
      setTestResult('Success: Server is reachable and responding.');
    } else {
      setTestResult('Failed: Could not reach server at this address. App will operate in offline mode.');
    }
  };

  const handleResetSeedData = async () => {
    Alert.alert(
      'Reset Local Data',
      'This will re-seed your local contacts database with demo school records. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await localDb.init();
            Alert.alert('Done', 'Local contacts reset.');
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
          Configure the REST API endpoint used for uploading and synchronizing school contacts.
        </Text>

        <Text style={styles.inputLabel}>Server Base URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://localhost:4000/api"
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
            <Text style={styles.testBtnText}>Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSaveUrl}>
            <Ionicons name="save-outline" size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

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

      {/* 2. Role-Based Access Control (RBAC) Simulator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0284C7" />
          <Text style={styles.cardTitle}>Role-Based Access (Security)</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Select your current active school staff role to simulate role permissions:
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

      {/* 3. Maintenance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="build-outline" size={20} color="#64748B" />
          <Text style={styles.cardTitle}>Maintenance & Data Reset</Text>
        </View>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetSeedData}>
          <Ionicons name="refresh-circle-outline" size={18} color="#DC2626" />
          <Text style={styles.dangerBtnText}>Reset Local Database to Demo Data</Text>
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
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
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
  testResultBox: {
    marginTop: 12,
    padding: 10,
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
    fontSize: 12,
    lineHeight: 16,
  },
  textSuccess: {
    color: '#15803D',
  },
  textError: {
    color: '#B91C1C',
  },
  rolePicker: {
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  dangerBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
});
