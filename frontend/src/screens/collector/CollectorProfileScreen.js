import { useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, GradientButton, ScreenEnter } from '../../components/ui';
import { clearAuthTokens, getRefreshToken } from '../../features/auth/authStorage';
import { emitAuthLogout } from '../../features/auth/authEvents';
import { logoutUser } from '../../features/auth/authApi';
import { setAccessToken } from '../../api/client';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatKg, formatNPR } from '../../utils/format';
import { CollectorBottomNav } from './Shared';

const headerAvatar = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDrz09HLwR5oelKc5of58ps0MyGqCTvc_IcT68a1gl5GNCIyu_pEkxa6_pnCcIUoSJNLJb15d-tbHx1tDP1wlGRlIyd0si7z3VLdFlhzFXQaGvE0LtJ5GivveLXS67nllTMX6Q-E6pcmYktLfp1o5vCq2Wy5Fm94vNPSjFwG50ehbGGLVZb0a-YMYDDkasde3z5_ldJHtdplUp0hNOgNo3MjmelH6TXiy9Yo2WZf5swmvVc_kSsjs3YpwHYB-TEAhbPq82ge3FVYWd',
};

const defaultProfile = {
  name: 'Collector',
  tier: 'Trusted Collector',
  avatarUrl: null,
  stats: {
    kgRecycled: 0,
    pickupsCompleted: 0,
    earnings: 0,
  },
  features: [
    { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', route: 'CollectorDashboard', tint: 'primary' },
    { key: 'history', label: 'Pickup History', icon: 'history', route: 'CollectorHistory', tint: 'secondary' },
    { key: 'earnings', label: 'Earnings', icon: 'wallet-outline', route: 'CollectorEarnings', tint: 'tertiary' },
    { key: 'support', label: 'Support', icon: 'headset', tint: 'muted' },
  ],
};

export function CollectorProfileScreen({ navigation, route }) {
  const profile = route?.params?.profile || defaultProfile;

  const profileImage = useMemo(() => {
    return profile?.avatarUrl ? { uri: profile.avatarUrl } : headerAvatar;
  }, [profile?.avatarUrl]);

  const stats = profile?.stats || defaultProfile.stats;
  const features = profile?.features || defaultProfile.features;

  const handleSignOut = () => {
    const doLogout = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          await logoutUser({ refreshToken });
        }
      } catch (error) {
        Alert.alert('Logout failed', error?.response?.data?.message || 'Please try again.');
      } finally {
        await clearAuthTokens();
        setAccessToken(null);
        emitAuthLogout();
      }
    };

    doLogout();
  };

  const handleFeaturePress = (item) => {
    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    Alert.alert('Support', 'Our support team will contact you shortly.');
  };

  return (
    <ScreenEnter>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandAvatarWrap}>
              <Image source={profileImage} style={styles.brandAvatar} />
            </View>
            <Text style={styles.brandText}>RecycleSathi</Text>
          </View>

          <Pressable style={styles.bellButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Image source={profileImage} style={styles.avatar} />
            <View style={styles.editBadge}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.onPrimary} />
            </View>
          </View>

          <Text style={styles.name}>{profile?.name || 'Collector'}</Text>

          <View style={styles.tierPill}>
            <MaterialCommunityIcons name="medal-outline" size={18} color={colors.onSecondaryContainer} />
            <Text style={styles.tierText}>{profile?.tier || 'Trusted Collector'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={formatKg(stats.kgRecycled || 0)} label="Kg Recycled" accent="primary" />
          <StatCard value={Number(stats.pickupsCompleted || 0)} label="Pickups" accent="secondary" />
          <StatCard value={formatNPR(stats.earnings || 0)} label="Earnings" accent="tertiary" />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Collector Features</Text>
          <GlassCard style={styles.settingsCard}>
            {features.map((item, index) => (
              <Pressable
                key={item.key}
                style={[styles.settingRow, index !== features.length - 1 && styles.settingRowBorder]}
                accessibilityRole="button"
                onPress={() => handleFeaturePress(item)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconWrap, styles[`settingIconWrap${item.tint}`]]}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={settingTintColor(item.tint)} />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description || defaultFeatureDescription(item.route, item.key)}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            ))}
          </GlassCard>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut} accessibilityRole="button">
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <GlassCard style={styles.helpCard}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpBody}>If you face an issue on a pickup or payment, our support team can help you right away.</Text>
          <GradientButton label="Contact Support" onPress={() => Alert.alert('Support', 'Please contact the admin team for collector support.')} style={styles.helpButton} />
        </GlassCard>
      </ScrollView>

      <CollectorBottomNav navigation={navigation} activeRoute="CollectorProfile" />
    </ScreenEnter>
  );
}

function StatCard({ value, label, accent }) {
  return (
    <GlassCard style={styles.statCard}>
      <Text style={[styles.statValue, styles[`statValue${accent}`]]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function settingTintColor(tint) {
  if (tint === 'tertiary') return colors.tertiary;
  if (tint === 'secondary') return colors.secondary;
  if (tint === 'muted') return colors.onSurfaceVariant;
  return colors.primary;
}

function defaultFeatureDescription(route, key) {
  if (route === 'CollectorDashboard') return 'Review live pickup requests and status.';
  if (route === 'CollectorHistory') return 'See your completed pickup history.';
  if (route === 'CollectorEarnings') return 'Check your wallet and collection totals.';
  if (key === 'support') return 'Get help from the support team.';
  return 'Open this section.';
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  brandAvatar: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: colors.surfaceContainerLow,
    overflow: 'visible',
    shadowColor: 'rgba(22,163,74,0.08)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 66,
  },
  editBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surfaceContainerLow,
  },
  name: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondaryContainer,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  tierText: {
    ...typography.labelMd,
    color: colors.onSecondaryContainer,
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statCard: {
    flex: 1,
    minHeight: 120,
    paddingVertical: spacing.md,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 24,
  },
  statValue: {
    ...typography.headlineMd,
    fontWeight: '700',
  },
  statValueprimary: {
    color: colors.primary,
  },
  statValuetertiary: {
    color: colors.tertiary,
  },
  statValuesecondary: {
    color: colors.secondary,
  },
  sectionBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  settingsCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconWrapprimary: {
    backgroundColor: 'rgba(0,107,44,0.10)',
  },
  settingIconWraptertiary: {
    backgroundColor: 'rgba(0,104,93,0.10)',
  },
  settingIconWrapsecondary: {
    backgroundColor: 'rgba(191,243,101,0.18)',
  },
  settingIconWrapmuted: {
    backgroundColor: 'rgba(62,74,61,0.08)',
  },
  settingLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  settingDescription: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 3,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(186,26,26,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(186,26,26,0.04)',
  },
  logoutText: {
    ...typography.labelLg,
    color: colors.error,
    fontWeight: '700',
  },
  helpCard: {
    padding: spacing.lg,
    borderRadius: 24,
    marginBottom: 16,
  },
  helpTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    marginBottom: 8,
  },
  helpBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  helpButton: {
    marginTop: spacing.md,
  },
});

export default CollectorProfileScreen;
