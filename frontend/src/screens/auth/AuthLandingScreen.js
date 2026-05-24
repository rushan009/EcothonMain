import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthBackdrop } from '../../components/auth';
import { AuthPrimaryButton } from '../../components/auth/AuthPrimaryButton';
import { useTranslation } from '../../i18n/LanguageContext';
import { GlassCard } from '../../components/ui';
import { colors, spacing, typography } from '../../theme/tokens';

const heroImage = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR2NbpRfPm60qgo7oyeBuNSsiTAd6yW5NmWv2nuHkwuHHX3H7fJU07E6ISHkmetJM0oNTKTpaWubxhg3uYURf5NXF1f9dIrEZSTWH2kuAbScMEFrUgSOnrQx3949klgmEhVjXkgbQYQ6CbzXS-KZAKNSiVcePq3iUMAbBE1OGM_Fthn3sHvhXtrjjIri0Vz0eaG56AN-dYeOaqXY1bmL92cgbRIqp4ubC4esYQxlWlW_qbcJSJs7znLAYCmzLNYba27C3gNSFbpQ-O',
};

export default function AuthLandingScreen({ navigation, onGetStarted }) {
  const { t, language, setLanguage } = useTranslation();

  return (
    <AuthBackdrop>
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <View />
          <Pressable onPress={() => setLanguage(language === 'np' ? 'en' : 'np')} hitSlop={8}>
            <Text style={styles.language}>{language === 'np' ? 'EN | नेपाली' : 'EN | NP'}</Text>
          </Pressable>
        </View>

        <View style={styles.heroArea}>
          <View style={styles.heroGlow} />
          <View style={styles.heroRing} />
          <View style={styles.heroFrame}>
            <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{t('welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('welcomeSubtitle')}</Text>
        </View>

        <GlassCard style={styles.featureCard}>
          <View style={styles.featureIconWrap}>
            <Text style={styles.featureIcon}>♻️</Text>
          </View>
          <View style={styles.featureCopy}>
            <Text style={styles.featureLabel}>{t('welcomeGoalLabel')}</Text>
            <Text style={styles.featureText}>{t('welcomeGoalText')}</Text>
          </View>
        </GlassCard>

        <View style={styles.actionArea}>
          <AuthPrimaryButton label={t('getStarted')} onPress={onGetStarted || (() => navigation.navigate('UserLogin'))} />
          <Text style={styles.footer}>{t('builtForEarth')}</Text>
        </View>
      </View>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  language: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  heroArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  heroGlow: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroFrame: {
    width: 170,
    height: 170,
    backgroundColor: '#050b05',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 132,
    height: 132,
  },
  copyBlock: {
    alignItems: 'center',
    marginTop: 32,
  },
  title: {
    ...typography.headlineXL,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.72,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.94)',
    marginTop: 14,
    textAlign: 'center',
  },
  featureCard: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(191,243,101,0.22)',
  },
  featureIcon: {
    fontSize: 20,
  },
  featureCopy: {
    flex: 1,
  },
  featureLabel: {
    ...typography.labelMd,
    fontSize: 12,
    lineHeight: 16,
    color: '#d8f47a',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  featureText: {
    ...typography.bodyMd,
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  actionArea: {
    marginTop: 'auto',
    gap: 10,
    paddingTop: 24,
  },
  footer: {
    ...typography.labelMd,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    fontWeight: '600',
  },
});