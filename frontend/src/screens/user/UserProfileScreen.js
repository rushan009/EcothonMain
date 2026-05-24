import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenEnter, GlassCard, GradientButton } from '../../components/ui';
import { endpoints, setAccessToken } from '../../api/client';
import { clearAuthTokens, getRefreshToken } from '../../features/auth/authStorage';
import { emitAuthLogout } from '../../features/auth/authEvents';
import { logoutUser } from '../../features/auth/authApi';
import { colors, spacing, typography } from '../../theme/tokens';

const headerAvatar = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDrz09HLwR5oelKc5of58ps0MyGqCTvc_IcT68a1gl5GNCIyu_pEkxa6_pnCcIUoSJNLJb15d-tbHx1tDP1wlGRlIyd0si7z3VLdFlhzFXQaGvE0LtJ5GivveLXS67nllTMX6Q-E6pcmYktLfp1o5vCq2Wy5Fm94vNPSjFwG50ehbGGLVZb0a-YMYDDkasde3z5_ldJHtdplUp0hNOgNo3MjmelH6TXiy9Yo2WZf5swmvVc_kSsjs3YpwHYB-TEAhbPq82ge3FVYWd',
};

export default function UserProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await endpoints.getUserProfile();
        if (mounted) setProfile(response.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = profile?.stats || { kgRecycled: 0, coins: 0, treesSaved: 0 };
  const accountSettings = profile?.accountSettings || [];
  const support = profile?.support || {
    title: 'Need Help?',
    description: 'Our support team is available 24/7 to help you with your recycling journey.',
    cta: 'Contact Support',
  };

  const openPersonalDetails = () => {
    const parentNavigation = navigation.getParent?.();
    if (parentNavigation) {
      parentNavigation.navigate('PersonalDetails', { profile: profile || null });
      return;
    }

    navigation.navigate('PersonalDetails', { profile: profile || null });
  };

  const profileImage = useMemo(() => {
    return profile?.avatarUrl ? { uri: profile.avatarUrl } : headerAvatar;
  }, [profile?.avatarUrl]);

  const handleSignOut = () => {
    const doLogout = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          await logoutUser({ refreshToken });
        }
      } finally {
        await clearAuthTokens();
        setAccessToken(null);
        emitAuthLogout();
      }
    };

    doLogout();
  };

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandAvatarWrap}>
              <Image source={profileImage} style={styles.brandAvatar} />
            </View>
            <Text style={styles.brandText}>RecycleSathi</Text>
          </View>

          <Pressable style={styles.bellButton} accessibilityRole="button" accessibilityLabel="Notifications">
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <Image source={profileImage} style={styles.avatar} />
                <View style={styles.editBadge}>
                  <MaterialCommunityIcons name="pencil" size={14} color={colors.onPrimary} />
                </View>
              </View>

              <Text style={styles.name}>{profile?.name || 'Aarav Sharma'}</Text>

              <View style={styles.tierPill}>
                <MaterialCommunityIcons name="medal-outline" size={18} color={colors.onSecondaryContainer} />
                <Text style={styles.tierText}>{profile?.tier || 'Eco Warrior'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard value={stats.kgRecycled} label="Kg Recycled" accent="primary" />
              <StatCard value={formatCompactNumber(stats.coins)} label="Sathi Coins" accent="tertiary" />
              <StatCard value={stats.treesSaved} label="Trees Saved" accent="secondary" />
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              <GlassCard style={styles.settingsCard}>
                {accountSettings.map((item, index) => (
                  <Pressable
                    key={item.key}
                    style={[styles.settingRow, index !== accountSettings.length - 1 && styles.settingRowBorder]}
                    accessibilityRole="button"
                    onPress={item.key === 'details' ? openPersonalDetails : undefined}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIconWrap, styles[`settingIconWrap${item.iconTint}`]]}>
                        <MaterialCommunityIcons name={item.icon} size={22} color={settingTintColor(item.iconTint)} />
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={26} color={colors.onSurfaceVariant} />
                  </Pressable>
                ))}
              </GlassCard>
            </View>

            <Pressable style={styles.logoutButton} onPress={handleSignOut} accessibilityRole="button">
              <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>

            <GlassCard style={styles.helpCard}>
              <Text style={styles.helpTitle}>{support.title}</Text>
              <Text style={styles.helpBody}>{support.description}</Text>
              <GradientButton label={support.cta} onPress={() => {}} style={styles.helpButton} />
            </GlassCard>
          </>
        )}
      </ScrollView>
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

function formatCompactNumber(value) {
  const numericValue = Number(value) || 0;
  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(numericValue >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  }
  return String(numericValue);
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 110,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,107,44,0.18)',
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
  loadingWrap: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  errorCard: {
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
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
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    textAlign: 'center',
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
  logoutButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(186,26,26,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(186,26,26,0.02)',
  },
  logoutText: {
    ...typography.bodyMd,
    color: colors.error,
    fontWeight: '700',
  },
  helpCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: 28,
  },
  helpTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  helpBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  helpButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});