import { StyleSheet, Text, View } from 'react-native';
import { ScreenEnter } from '../../components/ui';
import { colors, spacing, typography } from '../../theme/tokens';

export default function UserRewardsScreen() {
  return (
    <ScreenEnter>
      <View style={styles.page}>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.subtitle}>Coming soon.</Text>
      </View>
    </ScreenEnter>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
