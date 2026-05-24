import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GhostButton, GlassCard } from '../ui';
import { AuthPrimaryButton } from './AuthPrimaryButton';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function AuthLandingView({
  title,
  subtitle,
  languageLabel,
  onToggleLanguage,
  goalLabel,
  goalText,
  primaryLabel,
  loginLabel,
  signUpLabel,
  onGetStarted,
  onLogin,
  onSignUp,
  footerText,
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <GhostButton label={languageLabel} onPress={onToggleLanguage} style={styles.languageButton} />
      </View>

      <View style={styles.heroBlock}>
        <View style={styles.logoHalo}>
          <View style={styles.logoTile}>
            <Text style={styles.logoLeaf}>🌱</Text>
            <Text style={styles.logoGlobe}>🌍</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <GlassCard style={styles.featureCard}>
        <View style={styles.featureIconWrap}>
          <Text style={styles.featureIcon}>♻️</Text>
        </View>
        <View style={styles.featureCopy}>
          <Text style={styles.featureLabel}>{goalLabel}</Text>
          <Text style={styles.featureText}>{goalText}</Text>
        </View>
      </GlassCard>

      <View style={styles.actionsWrap}>
        <AuthPrimaryButton label={primaryLabel} onPress={onGetStarted} />
        <View style={styles.secondaryRow}>
          <GhostButton label={loginLabel} onPress={onLogin} style={styles.secondaryButton} />
          <GhostButton label={signUpLabel} onPress={onSignUp} style={styles.secondaryButton} />
        </View>
      </View>

      <Text style={styles.footer}>{footerText}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'flex-end',
    paddingTop: 28,
  },
  languageButton: {
    alignSelf: 'flex-end',
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: 36,
  },
  logoHalo: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoTile: {
    width: 198,
    height: 198,
    borderRadius: 18,
    backgroundColor: '#0d1b0f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b1b0c',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 16 },
  },
  logoLeaf: {
    position: 'absolute',
    top: 34,
    left: 26,
    fontSize: 28,
  },
  logoGlobe: {
    fontSize: 86,
    textShadowColor: 'rgba(94, 255, 136, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  title: {
    ...typography.displayHero,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 48,
  },
  subtitle: {
    ...typography.bodyLg,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 64,
    borderRadius: 32,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.24)',
  },
  featureIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(202,255,175,0.22)',
  },
  featureIcon: {
    fontSize: 28,
  },
  featureCopy: {
    flex: 1,
  },
  featureLabel: {
    ...typography.labelMd,
    color: '#d4f268',
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  featureText: {
    ...typography.headlineMd,
    color: '#ffffff',
    marginTop: 6,
    fontWeight: '600',
  },
  actionsWrap: {
    marginTop: 64,
    gap: spacing.md,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  footer: {
    ...typography.labelMd,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 8,
    fontWeight: '600',
  },
});
