import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Badge,
  GlassCard,
  GradientButton,
  ScreenEnter,
} from '../../components/ui';
import { endpoints } from '../../api/client';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatKg, formatNPR } from '../../utils/format';

const avatarPlaceholder = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6S10xU2QG3WsIAXYQChmA0b4hp8ag4J7qk9GhsjqS5pB4czq_2h6sD5mN8pn25JmH9A3V9B8W0muH0cZGq9p48dH-XK2D3t1I4vP10OgD0G1wqE4kK2On0gFa1x7f1Gv3Dw2D0p6cL3d3E9kM5xJXWw4JtR1F7yAQbQGfJ3svqNNG2z7fZTK2v3lPmA55QmEri1x7aKQmK8y7tbZ1Q',
};

export default function UserHomeScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await endpoints.getUserDashboard();
        if (mounted) setDashboard(response.data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const ecoScore = dashboard?.ecoScore ?? 0;
  const ecoTier = dashboard?.ecoTier ?? 'Eco Warrior';
  const prices = dashboard?.scrapPrices || [];
  const impact = dashboard?.impact || { co2SavedKg: 0, treesSaved: 0 };
  const pickups = dashboard?.recentPickups || [];
  const user = dashboard?.user || { name: 'User', phone: '' };

  const progress = useMemo(() => {
    if (!ecoScore) return 0.35;
    return Math.min(0.95, Math.max(0.2, ecoScore / 1000));
  }, [ecoScore]);

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.greetingWrap}>
            <View style={styles.avatarWrap}>
              <Image source={avatarPlaceholder} style={styles.avatar} />
            </View>
            <View>
              <Text style={styles.greetingLabel}>Namaste,</Text>
              <Text style={styles.greetingName}>{user.name}!</Text>
            </View>
          </View>
          <View style={styles.bellWrap}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
          </View>
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
            <GlassCard style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.sectionLabel}>MY ECO SCORE</Text>
                  <Text style={styles.scoreValue}>{ecoScore}</Text>
                  <View style={styles.tierChip}>
                    <Text style={styles.tierText}>{ecoTier}</Text>
                  </View>
                </View>
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { transform: [{ rotate: `${progress * 360}deg` }] }]} />
                    <MaterialCommunityIcons name="leaf" size={24} color={colors.primary} />
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={styles.actionsGrid}>
              <ActionCard
                title="Call Pickup"
                subtitle="Capture a photo and request a collector"
                icon="qrcode-scan"
                onPress={() => navigation.navigate('Call')}
              />
              <View style={styles.actionRow}>
                <ActionMini
                  title="Schedule Pickup"
                  icon="truck-delivery-outline"
                  onPress={() => navigation.navigate('UserTabs', { screen: 'Pickup' })}
                />
                <ActionMini
                  title="Redeem Rewards"
                  icon="gift-outline"
                  onPress={() => navigation.navigate('Rewards')}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Scrap Prices</Text>
              <Text style={styles.sectionMeta}>Today ↗</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priceRow}>
              {prices.map((price) => (
                <GlassCard key={price.id} style={styles.priceCard}>
                  <View style={styles.priceIconWrap}>
                    <MaterialCommunityIcons name={getPriceIcon(price.label)} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.priceLabel}>{price.label}</Text>
                  <Text style={styles.priceValue}>Rs {price.rate}<Text style={styles.priceUnit}>/{price.unit}</Text></Text>
                  <Text style={[styles.priceTrend, price.trend >= 0 ? styles.trendUp : styles.trendDown]}>
                    {price.trend >= 0 ? '▲' : '▼'} {Math.abs(price.trend)}%
                  </Text>
                </GlassCard>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Your Impact</Text>
            <View style={styles.impactGrid}>
              <GlassCard style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                  <MaterialCommunityIcons name="cloud-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.impactValue}>{formatKg(impact.co2SavedKg)}</Text>
                <Text style={styles.impactLabel}>CO2 Saved</Text>
              </GlassCard>
              <GlassCard style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                  <MaterialCommunityIcons name="tree-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.impactValue}>{impact.treesSaved}</Text>
                <Text style={styles.impactLabel}>Trees Saved</Text>
              </GlassCard>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Pickups</Text>
              <Text style={styles.sectionMeta}>View All</Text>
            </View>
            <View style={styles.pickupsList}>
              {pickups.map((pickup) => (
                <GlassCard key={pickup.id} style={styles.pickupCard}>
                  <View>
                    <Text style={styles.pickupTitle}>{pickup.title}</Text>
                    <Text style={styles.pickupMeta}>{pickup.date} • {formatNPR(pickup.amount)} earned</Text>
                  </View>
                  <Badge label={pickup.status.toUpperCase()} tone={pickup.status === 'completed' ? 'success' : 'default'} />
                </GlassCard>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenEnter>
  );
}

function ActionCard({ title, subtitle, icon, onPress }) {
  return (
    <LinearGradient colors={[colors.primary, colors.primaryContainer]} style={styles.actionCard}>
      <View style={styles.actionIconWrap}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.onPrimary} />
      </View>
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <GradientButton label="Open" onPress={onPress} style={styles.actionButton} textStyle={styles.actionButtonText} />
    </LinearGradient>
  );
}

function ActionMini({ title, icon, onPress }) {
  return (
    <GlassCard style={styles.actionMini}>
      <View style={styles.actionMiniIconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.actionMiniTitle}>{title}</Text>
      <GradientButton label="Go" onPress={onPress} style={styles.actionMiniButton} textStyle={styles.actionMiniText} />
    </GlassCard>
  );
}

function getPriceIcon(label = '') {
  const normalized = label.toLowerCase();
  if (normalized.includes('paper')) return 'file-document-outline';
  if (normalized.includes('plastic')) return 'bottle-soda-classic-outline';
  if (normalized.includes('metal') || normalized.includes('iron') || normalized.includes('steel') || normalized.includes('aluminium') || normalized.includes('aluminum') || normalized.includes('copper')) {
    return 'hammer-screwdriver';
  }
  if (normalized.includes('glass')) return 'glass-fragile';
  if (normalized.includes('ewaste') || normalized.includes('e-waste')) return 'memory';
  return 'recycle';
}

const styles = StyleSheet.create({
  page: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  greetingLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  greetingName: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  bell: {
    fontSize: 18,
  },
  loadingWrap: {
    paddingVertical: 60,
  },
  errorCard: {
    padding: spacing.md,
  },
  errorText: {
    color: colors.error,
    ...typography.bodyMd,
  },
  scoreCard: {
    padding: spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  scoreValue: {
    ...typography.displayHero,
    color: colors.primary,
  },
  tierChip: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(191,243,101,0.4)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  tierText: {
    ...typography.labelMd,
    color: colors.secondary,
    fontWeight: '700',
  },
  progressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
    borderColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 8,
    borderColor: colors.primary,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressIcon: {
    position: 'absolute',
    fontSize: 24,
  },
  actionsGrid: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 170,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  actionTitle: {
    ...typography.headlineMd,
    color: colors.onPrimary,
  },
  actionSubtitle: {
    ...typography.bodySm,
    color: colors.onPrimary,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 10,
  },
  actionMini: {
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.sm,
    flex: 1,
    minHeight: 120,
  },
  actionMiniIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  actionMiniTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  actionMiniButton: {
    alignSelf: 'flex-start',
  },
  actionMiniText: {
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  sectionMeta: {
    ...typography.labelSm,
    color: colors.primary,
  },
  priceRow: {
    gap: spacing.md,
  },
  priceCard: {
    width: 130,
    padding: spacing.md,
    gap: 6,
  },
  priceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  priceLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  priceValue: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '700',
  },
  priceUnit: {
    fontSize: 10,
  },
  priceTrend: {
    ...typography.labelSm,
  },
  trendUp: {
    color: colors.primary,
  },
  trendDown: {
    color: colors.error,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  impactCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  impactIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  impactValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  impactLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  pickupsList: {
    gap: spacing.sm,
  },
  pickupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  pickupTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  pickupMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
