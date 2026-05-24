import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/tokens';

export function userTabBar({ state, navigation }) {
  const items = {
    Home: { icon: 'home' },
    Scan: { icon: 'qrcode-scan' },
    Pickup: { icon: 'truck-delivery' },
    Rewards: { icon: 'medal' },
    Profile: { icon: 'account' },
  };

  return (
    <BlurView intensity={28} tint="light" style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = route.name;
        const iconName = items[route.name]?.icon || 'circle-outline';
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.tab, focused && styles.tabActive]}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={20}
              color={focused ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 58,
  },
  tabActive: {
    backgroundColor: 'rgba(191,243,101,0.92)',
    borderRadius: 14,
  },
  label: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  labelActive: {
    color: colors.onSecondaryContainer,
  },
});
