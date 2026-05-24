import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GlassCard,
  GradientButton,
  GhostButton,
  ScreenEnter,
} from '../../components/ui';
import { colors, spacing, typography } from '../../theme/tokens';

export default function UserScanScreen() {
  const [captured, setCaptured] = useState(false);

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page}>
        <LinearGradient colors={[colors.primary, colors.primaryContainer]} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Scan Waste</Text>
          <Text style={styles.heroSubtitle}>Identify material and earn eco points instantly.</Text>
          <GradientButton label={captured ? 'Rescan' : 'Open Camera'} onPress={() => setCaptured(!captured)} style={styles.heroButton} />
        </LinearGradient>

        <GlassCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <Text style={styles.sectionBody}>1. Point your camera at the waste item.</Text>
          <Text style={styles.sectionBody}>2. We classify and estimate weight.</Text>
          <Text style={styles.sectionBody}>3. Earn points and schedule pickup.</Text>
        </GlassCard>

        <View style={styles.actionsRow}>
          <GradientButton label="Schedule Pickup" onPress={() => {}} />
          <GhostButton label="View Prices" onPress={() => {}} />
        </View>
      </ScrollView>
    </ScreenEnter>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    ...typography.headlineLg,
    color: colors.onPrimary,
  },
  heroSubtitle: {
    ...typography.bodyMd,
    color: colors.onPrimary,
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  sectionBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
