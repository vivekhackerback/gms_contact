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
import { localDb } from '../../../db/localDb';
import { syncService } from '../../../services/syncService';
import { DynamicForm } from '../../../components/DynamicForm';
import { FullContact } from '../../../types/contact';
import { isValidIndianMobile, isValidEmail, normalizeIndianMobile } from '../../../utils/validation';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [formData, setFormData] = useState<FullContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      const data = await localDb.getById(id);
      setFormData(data);
    } catch (e) {
      console.warn('Failed to load contact for edit:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleFieldChange = (field: string, val: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: val } : null));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    if (!formData) return false;
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!formData) return;
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check the required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const updated: FullContact = {
        ...formData,
        full_name: formData.full_name.trim(),
        mobile_number: normalizeIndianMobile(formData.mobile_number),
        alternate_mobile: normalizeIndianMobile(formData.alternate_mobile),
        whatsapp_number: normalizeIndianMobile(formData.whatsapp_number || formData.mobile_number),
        updated_at: new Date().toISOString(),
      };

      await syncService.saveContact(updated);
      setIsSaving(false);
      Alert.alert('Success', 'Contact updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Error', err.message || 'Failed to update contact');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (!formData) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Contact not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <DynamicForm
        contactType={formData.contact_type}
        formData={formData}
        onChangeField={handleFieldChange}
        errors={errors}
      />

      <TouchableOpacity
        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
        )}
        <Text style={styles.saveBtnText}>
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    fontSize: 15,
    color: '#64748B',
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
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
