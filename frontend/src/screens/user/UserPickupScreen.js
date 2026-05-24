import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard, GradientButton, ScreenEnter } from '../../components/ui';
import { endpoints } from '../../api/client';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';

export default function UserPickupScreen() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await endpoints.getUserPickups();
        if (mounted) setPickups(response.data?.pickups || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>Pickups</Text>
        <Text style={styles.subtitle}>Schedule and track your collections.</Text>
        <GradientButton label="Schedule Pickup" onPress={() => {}} />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          pickups.map((pickup) => (
            <GlassCard key={pickup.id} style={styles.pickupCard}>
              <View>
                <Text style={styles.pickupTitle}>{pickup.title}</Text>
                <Text style={styles.pickupMeta}>{pickup.date} • {formatNPR(pickup.amount)} earned</Text>
              </View>
              <Text style={styles.pickupStatus}>{pickup.status}</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </ScreenEnter>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  loading: {
    marginTop: spacing.lg,
  },
  pickupCard: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  pickupMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  pickupStatus: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
  },
});
