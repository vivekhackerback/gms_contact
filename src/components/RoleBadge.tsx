import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactType } from '../types/contact';
import { ROLE_COLORS, ROLE_LABELS } from '../constants/theme';

interface Props {
  type: ContactType;
  size?: 'small' | 'medium';
}

export function RoleBadge({ type, size = 'small' }: Props) {
  const config = ROLE_COLORS[type] || ROLE_COLORS.other;
  const label = ROLE_LABELS[type] || type;

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.badge,
          borderColor: config.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <Ionicons
        name={config.icon as any}
        size={isSmall ? 12 : 15}
        color={config.text}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 11 : 13,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    letterSpacing: 0.2,
  },
});
