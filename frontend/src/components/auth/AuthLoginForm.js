import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard, GradientButton, GhostButton, Input } from '../ui';
import { colors, spacing, typography } from '../../theme/tokens';

export function AuthLoginForm({
  title,
  subtitle,
  phone,
  onChangePhone,
  password,
  onChangePassword,
  onContinue,
  onBack,
  onCreateAccount,
  footerText,
  primaryButtonLabel = 'Continue',
  secondaryButtonLabel,
  secondaryLinkLabel,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.brandSpacer} />
        {onBack ? <GhostButton label="Back" onPress={onBack} style={styles.backButton} /> : <View style={styles.backButtonPlaceholder} />}
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <Input value={phone} onChangeText={onChangePhone} placeholder="98XXXXXXXX" prefix="🇳🇵 +977" keyboardType="phone-pad" />
        </View>

        {onChangePassword ? (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>PASSWORD</Text>
            <Input
              value={password}
              onChangeText={onChangePassword}
              placeholder="••••••••"
              secureTextEntry
            />
          </View>
        ) : null}

        <GradientButton label={primaryButtonLabel} onPress={onContinue} />

        <View style={styles.separatorRow}>
          <View style={styles.separator} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.separator} />
        </View>

        {secondaryButtonLabel ? <GhostButton label={secondaryButtonLabel} onPress={onContinue} style={styles.secondaryButton} /> : null}

        {secondaryLinkLabel ? (
          <Pressable onPress={onCreateAccount} hitSlop={8}>
            <Text style={styles.linkText}>{secondaryLinkLabel}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.footer}>{footerText}</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 28,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandSpacer: {
    width: 1,
    height: 1,
  },
  backButton: {
    paddingHorizontal: 14,
    minWidth: 76,
  },
  backButtonPlaceholder: {
    width: 76,
  },
  card: {
    gap: spacing.md,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(18, 140, 68, 0.08)',
    padding: 28,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.onSurface,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 6,
  },
  fieldBlock: {
    gap: 10,
  },
  label: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccd8cd',
  },
  separatorText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 2,
  },
  linkText: {
    ...typography.bodyMd,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
  },
});