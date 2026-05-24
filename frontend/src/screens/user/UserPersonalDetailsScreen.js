import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, ScreenEnter } from '../../components/ui';
import { endpoints } from '../../api/client';
import { colors, spacing, typography } from '../../theme/tokens';

const fallbackAvatar = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDrz09HLwR5oelKc5of58ps0MyGqCTvc_IcT68a1gl5GNCIyu_pEkxa6_pnCcIUoSJNLJb15d-tbHx1tDP1wlGRlIyd0si7z3VLdFlhzFXQaGvE0LtJ5GivveLXS67nllTMX6Q-E6pcmYktLfp1o5vCq2Wy5Fm94vNPSjFwG50ehbGGLVZb0a-YMYDDkasde3z5_ldJHtdplUp0hNOgNo3MjmelH6TXiy9Yo2WZf5swmvVc_kSsjs3YpwHYB-TEAhbPq82ge3FVYWd',
};

export default function UserPersonalDetailsScreen({ navigation, route }) {
  const [profile, setProfile] = useState(route?.params?.profile || null);
  const [loading, setLoading] = useState(!route?.params?.profile);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route?.params?.profile) {
      return;
    }

    let mounted = true;
    const load = async () => {
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
  }, [route?.params?.profile]);

  const avatar = useMemo(() => {
    return profile?.avatarUrl ? { uri: profile.avatarUrl } : fallbackAvatar;
  }, [profile?.avatarUrl]);

  const joinedLabel = profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Recently';

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button">
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.title}>Personal Details</Text>
          <View style={styles.spacer} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : error ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        ) : (
          <>
            <GlassCard style={styles.heroCard}>
              <View style={styles.avatarWrap}>
                <Image source={avatar} style={styles.avatar} />
              </View>
              <Text style={styles.name}>{profile?.name || 'Rushan'}</Text>
              <Text style={styles.subtitle}>{profile?.role || 'user'}</Text>
            </GlassCard>

            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Account Details</Text>
            </View>

            <GlassCard style={styles.detailsCard}>
              <DetailRow icon="account-outline" label="Name" value={profile?.name || '—'} />
              <DetailRow icon="email-outline" label="Email" value={profile?.email || 'Not added'} />
              <DetailRow icon="phone-outline" label="Phone" value={profile?.phone || '—'} />
              <DetailRow icon="account-badge-outline" label="Role" value={profile?.role || 'user'} />
              <DetailRow icon="calendar-outline" label="Joined" value={joinedLabel} border={false} />
            </GlassCard>

            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Eco Summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryPill label="Eco Points" value={profile?.ecoPoints ?? 0} />
                <SummaryPill label="Kg Recycled" value={profile?.stats?.kgRecycled ?? 0} />
                <SummaryPill label="Trees Saved" value={profile?.stats?.treesSaved ?? 0} />
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </ScreenEnter>
  );
}

function DetailRow({ icon, label, value, border = true }) {
  return (
    <View style={[styles.detailRow, border && styles.detailRowBorder]}>
      <View style={styles.detailLeft}>
        <View style={styles.detailIconWrap}>
          <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
    </View>
  );
}

function SummaryPill({ label, value }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 110,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  spacer: {
    width: 44,
    height: 44,
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
  heroCard: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 28,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.surfaceContainerLow,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    ...typography.headlineLg,
    color: colors.onSurface,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionLabelRow: {
    paddingHorizontal: 4,
  },
  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  detailsCard: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.22)',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.10)',
  },
  detailLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  detailValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: 28,
    gap: spacing.md,
  },
  summaryTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  summaryPill: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,107,44,0.06)',
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  summaryLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
