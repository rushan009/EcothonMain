import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthBackdrop } from '../../components/auth';
import { AuthPrimaryButton } from '../../components/auth/AuthPrimaryButton';
import { getAppRouteForRole, useAuthForm } from '../../features/auth';
import { colors, spacing, typography } from '../../theme/tokens';

const earthIcon = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR2NbpRfPm60qgo7oyeBuNSsiTAd6yW5NmWv2nuHkwuHHX3H7fJU07E6ISHkmetJM0oNTKTpaWubxhg3uYURf5NXF1f9dIrEZSTWH2kuAbScMEFrUgSOnrQx3949klgmEhVjXkgbQYQ6CbzXS-KZAKNSiVcePq3iUMAbBE1OGM_Fthn3sHvhXtrjjIri0Vz0eaG56AN-dYeOaqXY1bmL92cgbRIqp4ubC4esYQxlWlW_qbcJSJs7znLAYCmzLNYba27C3gNSFbpQ-O',
};

const roles = [
  {
    key: 'user',
    title: 'I am a User',
    body: 'Manage your waste, schedule doorstep pickups, and earn premium rewards for your ecological impact.',
    icon: '🌱',
    accent: '#e8f6ea',
    titleColor: colors.onSurface,
  },
  {
    key: 'collector',
    title: 'I am a Collector',
    body: 'Optimize your routes, manage pickup requests, and scale your recycling business with our digital tools.',
    icon: '🚚',
    accent: '#eef6db',
    titleColor: colors.onSurface,
  },
  {
    key: 'admin',
    title: 'I am an Admin',
    body: 'Monitor urban impact reports, manage user databases, and oversee city-wide waste management operations.',
    icon: '🏛️',
    accent: '#e2f0f0',
    titleColor: colors.onSurface,
  },
];

export default function RoleSelectionScreen({ navigation, onBack, onContinue, auth }) {
  const appIcon = require('../../../assets/icon.png');
  const authState = auth || useAuthForm();
  const { form = {}, selectRole, submitRegistration, loading, error } = authState;
  const activeRole = form.role;

  const handleSelectRole = (roleKey) => {
    if (selectRole) {
      selectRole(roleKey);
    }
  };

  const handleContinue = async () => {
    try {
      const selectedRoute = getAppRouteForRole(activeRole || form.role);
      if (submitRegistration) {
        await submitRegistration();
      }

      if (onContinue) {
        onContinue(selectedRoute);
        return;
      }

      navigation?.replace?.(selectedRoute);
    } catch {
      // Error state is already set by the shared auth hook.
    }
  };

  return (
    <AuthBackdrop variant="soft">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Image source={appIcon} style={styles.brandImage} resizeMode="contain" />
            <Text style={styles.brand}>RecycleSathi</Text>
          </View>
          <Pressable onPress={onBack} hitSlop={8}>
            <Text style={styles.signOut}>Sign Out ↗</Text>
          </Pressable>
        </View>

        <View style={styles.heroIcons}>
          <View style={styles.heroCircle}>
            <Image source={earthIcon} style={styles.heroImage} resizeMode="contain" />
          </View>
          <View style={styles.heroCircle}><Text style={styles.heroEmoji}>🚛</Text></View>
          <View style={styles.heroCircle}><Text style={styles.heroEmoji}>🏙️</Text></View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Choose your path</Text>
          <Text style={styles.subtitle}>Join our ecosystem of sustainable waste management. Select the role that best defines how you'll interact with RecycleSathi.</Text>
        </View>

        <View style={styles.cards}>
          {roles.map((role) => (
            <Pressable
              key={role.key}
              style={[styles.card, activeRole === role.key && styles.cardSelected]}
              onPress={() => handleSelectRole(role.key)}
            >
              <View style={[styles.imageBlock, { backgroundColor: role.accent }]}>
                <Image source={earthIcon} style={styles.cardImage} resizeMode="contain" />
              </View>
              <View style={[styles.iconBubble, { backgroundColor: role.accent }]}>
                <Text style={styles.icon}>{role.icon}</Text>
              </View>
              <Text style={[styles.roleTitle, { color: role.titleColor }]}>{role.title}</Text>
              <Text style={styles.roleBody}>{role.body}</Text>
              <View style={[styles.radio, activeRole === role.key && styles.radioSelected]} />
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.footerWrap}>
          <AuthPrimaryButton
            label={loading ? 'Saving…' : 'Continue to Dashboard'}
            onPress={handleContinue}
            style={styles.continueButton}
          />
          {loading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
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
    paddingBottom: 20,
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
  signOut: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.onSurfaceVariant,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  heroCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  heroEmoji: {
    fontSize: 20,
  },
  heroImage: {
    width: 30,
    height: 30,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 300,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  imageBlock: {
    width: '100%',
    aspectRatio: 1.55,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '58%',
    height: '58%',
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  roleTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c5d1c4',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  errorText: {
    marginTop: 10,
    color: '#c81e1e',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  footerWrap: {
    marginTop: 16,
    paddingTop: 4,
  },
  continueButton: {
    width: '100%',
  },
  loading: {
    marginTop: 10,
  },
});
