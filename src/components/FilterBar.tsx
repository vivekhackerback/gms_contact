import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ContactType } from '../types/contact';
import { ROLE_COLORS } from '../constants/theme';

interface FilterOption {
  key: string;
  label: string;
}

const MAIN_FILTERS: { key: string; label: string; type?: ContactType }[] = [
  { key: 'all', label: 'All Contacts' },
  { key: 'student', label: 'Students', type: 'student' },
  { key: 'parent', label: 'Parents', type: 'parent' },
  { key: 'teacher', label: 'Teachers', type: 'teacher' },
  { key: 'staff', label: 'Staff', type: 'staff' },
  { key: 'driver', label: 'Drivers', type: 'driver' },
  { key: 'management', label: 'Management', type: 'management' },
  { key: 'other', label: 'Other', type: 'other' },
];

const STUDENT_CLASSES = ['All Classes', 'PRE-NUR', 'NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const TEACHER_SUBJECTS = ['All Subjects', 'Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer'];
const STAFF_DEPTS = ['All Depts', 'Accounts & Finance', 'Administration', 'Transport', 'Library', 'Security'];

interface Props {
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedSubFilter: string;
  onSelectSubFilter: (subFilter: string) => void;
}

export function FilterBar({
  selectedType,
  onSelectType,
  selectedSubFilter,
  onSelectSubFilter,
}: Props) {
  // Determine subfilters based on selected role
  let subFilters: string[] = [];
  let subLabel = '';

  if (selectedType === 'student') {
    subFilters = STUDENT_CLASSES;
    subLabel = 'Class:';
  } else if (selectedType === 'teacher') {
    subFilters = TEACHER_SUBJECTS;
    subLabel = 'Subject:';
  } else if (selectedType === 'staff') {
    subFilters = STAFF_DEPTS;
    subLabel = 'Dept:';
  }

  return (
    <View style={styles.wrapper}>
      {/* Primary Role Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MAIN_FILTERS.map((item) => {
          const isSelected = selectedType === item.key;
          const roleConfig = item.type ? ROLE_COLORS[item.type] : null;

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tab,
                isSelected && styles.tabActive,
                isSelected && roleConfig && { backgroundColor: roleConfig.primary, borderColor: roleConfig.primary },
              ]}
              onPress={() => {
                onSelectType(item.key);
                onSelectSubFilter('');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Secondary role-specific pills */}
      {subFilters.length > 0 && (
        <View style={styles.subFilterWrapper}>
          <Text style={styles.subFilterLabel}>{subLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subScrollContent}>
            {subFilters.map((opt) => {
              const cleanOpt = opt.startsWith('All') ? '' : opt;
              const isSelected = selectedSubFilter === cleanOpt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.subPill, isSelected && styles.subPillActive]}
                  onPress={() => onSelectSubFilter(cleanOpt)}
                >
                  <Text style={[styles.subPillText, isSelected && styles.subPillTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subFilterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  subScrollContent: {
    gap: 6,
    alignItems: 'center',
  },
  subPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  subPillActive: {
    backgroundColor: '#334155',
  },
  subPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  subPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
