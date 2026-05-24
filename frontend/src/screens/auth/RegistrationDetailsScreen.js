import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthBackdrop } from '../../components/auth';
import { AuthPrimaryButton } from '../../components/auth/AuthPrimaryButton';
import { colors, spacing } from '../../theme/tokens';
import { GlassCard, Input } from '../../components/ui';
import { useAuthForm } from '../../features/auth';
import Toast from 'react-native-toast-message';

export default function RegistrationDetailsScreen({ navigation, onBack, onComplete, auth }) {
  const appIcon = require('../../../assets/icon.png');
  const earthIcon = {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR2NbpRfPm60qgo7oyeBuNSsiTAd6yW5NmWv2nuHkwuHHX3H7fJU07E6ISHkmetJM0oNTKTpaWubxhg3uYURf5NXF1f9dIrEZSTWH2kuAbScMEFrUgSOnrQx3949klgmEhVjXkgbQYQ6CbzXS-KZAKNSiVcePq3iUMAbBE1OGM_Fthn3sHvhXtrjjIri0Vz0eaG56AN-dYeOaqXY1bmL92cgbRIqp4ubC4esYQxlWlW_qbcJSJs7znLAYCmzLNYba27C3gNSFbpQ-O',
  };
  const authState = auth || useAuthForm();
  const { form, setField } = authState;
  const handleComplete = () => {
    if (!form.name?.trim() || !form.phone?.trim() || !form.password?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields',
        text2: 'Name, phone, and password are required. Email is optional.',
      });
      return;
    }

    if (onComplete) {
      onComplete();
      return;
    }

    navigation?.replace?.('UserApp');
  };

  return (
    <AuthBackdrop variant="soft">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Image source={appIcon} style={styles.brandImage} resizeMode="contain" />
            <Text style={styles.brand}>RecycleSathi</Text>
          </View>
          <Pressable onPress={onBack || (() => navigation?.replace?.('AuthLanding'))} hitSlop={8}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.heroStrip}>
          <View style={styles.heroTile}>
            <Text style={styles.heroEmoji}>📄</Text>
          </View>
          <View style={styles.heroTileAlt}>
            <Text style={styles.heroEmoji}>🔐</Text>
          </View>
          <View style={styles.heroTile}>
            <Text style={styles.heroEmoji}>🌿</Text>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>FINAL STEP</Text>
            <Text style={styles.progressCount}>3 of 3</Text>
          </View>
          <View style={styles.progressBar}><View style={styles.progressFill} /></View>
        </View>

        <View style={styles.headingWrap}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit more about you to start your eco-friendly journey.</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>FULL NAME</Text>
            <Input value={form.name} onChangeText={(value) => setField('name', value)} placeholder="John Doe" keyboardType="default" />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <Input value={form.email} onChangeText={(value) => setField('email', value)} placeholder="john@example.com" keyboardType="email-address" />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.verifiedInputWrap}>
              <Input value={form.phone} onChangeText={(value) => setField('phone', value)} prefix="" placeholder="+1 (555) 000-1234" keyboardType="phone-pad" />
              <View style={styles.verifiedChip}><Text style={styles.verifiedText}>✓ VERIFIED</Text></View>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>CREATE PASSWORD</Text>
            <Input value={form.password} onChangeText={(value) => setField('password', value)} placeholder="••••••••" secureTextEntry />
            <Text style={styles.helper}>Must be at least 8 characters with a number.</Text>
          </View>

          <View style={styles.termsRow}>
            <View style={styles.checkbox} />
            <Text style={styles.termsText}>I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text> of RecycleSathi.</Text>
          </View>

          <AuthPrimaryButton label="Complete Registration" onPress={handleComplete} />
        </GlassCard>

        <View style={styles.securityRow}>
          <Text style={styles.securityText}>SSL Secure</Text>
          <View style={styles.dot} />
          <Text style={styles.securityText}>Data Protected</Text>
        </View>
      </ScrollView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 22,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
    fontWeight: '700',
  },
  close: {
    fontSize: 26,
    lineHeight: 26,
    color: colors.primary,
    fontWeight: '300',
  },
  progressWrap: {
    marginBottom: 20,
  },
  heroStrip: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'center',
    marginBottom: 14,
  },
  heroTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 201, 92, 0.08)',
  },
  heroTileAlt: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  heroEmoji: {
    fontSize: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  progressCount: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d8e5d6',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  headingWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1.1,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  verifiedInputWrap: {
    position: 'relative',
  },
  verifiedChip: {
    position: 'absolute',
    right: 10,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  verifiedText: {
    fontSize: 10,
    lineHeight: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  helper: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.onSurfaceVariant,
    paddingLeft: 2,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#c3cfc2',
    borderRadius: 4,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: colors.onSurfaceVariant,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  securityText: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    fontWeight: '700',
    color: 'rgba(78,93,78,0.6)',
    textTransform: 'uppercase',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c4cec2',
  },
});
