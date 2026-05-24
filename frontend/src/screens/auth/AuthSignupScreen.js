import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthBackdrop } from '../../components/auth';
import { AuthPrimaryButton } from '../../components/auth/AuthPrimaryButton';
import { useTranslation } from '../../i18n/LanguageContext';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { GlassCard, Input } from '../../components/ui';
import { useAuthForm } from '../../features/auth';
import Toast from 'react-native-toast-message';

const earthIcon = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR2NbpRfPm60qgo7oyeBuNSsiTAd6yW5NmWv2nuHkwuHHX3H7fJU07E6ISHkmetJM0oNTKTpaWubxhg3uYURf5NXF1f9dIrEZSTWH2kuAbScMEFrUgSOnrQx3949klgmEhVjXkgbQYQ6CbzXS-KZAKNSiVcePq3iUMAbBE1OGM_Fthn3sHvhXtrjjIri0Vz0eaG56AN-dYeOaqXY1bmL92cgbRIqp4ubC4esYQxlWlW_qbcJSJs7znLAYCmzLNYba27C3gNSFbpQ-O',
};

export default function AuthSignupScreen({ navigation, onBack, onContinue, auth }) {
  const { t } = useTranslation();
  const splashIcon = require('../../../assets/icon.png');
  const authState = auth || useAuthForm();
  const { form, setField } = authState;
  const handleContinue = () => {
    if (!form.phone?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Phone number is required',
      });
      return;
    }

    if (onContinue) {
      onContinue();
      return;
    }

    navigation?.navigate?.('AuthRegistrationDetails');
  };

  return (
    <AuthBackdrop variant="soft">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Image source={splashIcon} style={styles.brandImage} resizeMode="contain" />
            <Text style={styles.brand}>{t('appName')}</Text>
          </View>
          <Pressable onPress={onBack || (() => navigation?.goBack?.())} hitSlop={8}>
            <Text style={styles.language}>EN | NP</Text>
          </Pressable>
        </View>

        <View style={styles.imageBand}>
          <View style={styles.imageHalo} />
          <Image source={earthIcon} style={styles.heroImage} resizeMode="contain" />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join RecycleSathi and start making an impact.</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.fieldBlock}>
            <Input value={form.phone} onChangeText={(value) => setField('phone', value)} placeholder="98765 43210" prefix="+977" keyboardType="phone-pad" />
        
          </View>

          <AuthPrimaryButton style={styles.continueButton} label="Continue" onPress={handleContinue} />

          <Pressable onPress={onBack || (() => navigation?.navigate?.('UserLogin'))}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkStrong}>Log In</Text></Text>
          </Pressable>
        </GlassCard>

        <Text style={styles.footer}>By signing up, you agree to our <Text style={styles.footerLink}>Terms of Service</Text> and <Text style={styles.footerLink}>Privacy Policy</Text></Text>
      </ScrollView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandImage: {
    width: 22,
    height: 22,
  },
  brand: {
    ...typography.headlineMd,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  language: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 20,
  },
  imageBand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  imageHalo: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(52, 201, 92, 0.08)',
  },
  heroImage: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  fieldBlock: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.1,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  linkStrong: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 320,
    alignSelf: 'center',
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
