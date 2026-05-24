import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { ADMIN_KPIS, SCRAP_RATES } from '../data/mockData';
import { Sidebar, GlassCard, ChartMock, MapViewWrapper, Input, GhostButton } from '../components/ui';
import { colors, spacing, typography } from '../theme/tokens';
import { formatNPR } from '../utils/format';

const navItems = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'analytics', label: 'Analytics', icon: '📈' },
  { key: 'pickups', label: 'Pickups', icon: '📦' },
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'collectors', label: 'Collectors', icon: '🚴' },
  { key: 'rates', label: 'Scrap Rates', icon: '💰' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboardScreen() {
  const [active, setActive] = useState('overview');
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RecycleSathi Admin</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerMeta}>Admin: Priya</Text>
          <Text style={styles.headerMeta}>🔔 4</Text>
          <Text style={styles.headerMeta}>Logout</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Sidebar items={navItems} active={active} onSelect={setActive} />
        <ScrollView contentContainerStyle={[styles.main, !desktop && styles.mainNarrow]}>
          {active === 'overview' && <OverviewPage />}
          {active === 'analytics' && <AnalyticsPage />}
          {active === 'rates' && <RatesPage />}
          {active === 'users' && <UsersPage />}
          {active === 'collectors' && <CollectorsPage />}
          {active !== 'overview' && active !== 'analytics' && active !== 'rates' && active !== 'users' && active !== 'collectors' && (
            <GlassCard><Text style={styles.bodyText}>Page under development for MVP.</Text></GlassCard>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function OverviewPage() {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.kpiGrid}>
        {ADMIN_KPIS.map((kpi) => (
          <GlassCard key={kpi.label} style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{kpi.icon} {kpi.value}</Text>
            <Text style={styles.bodyText}>{kpi.label}</Text>
            <Text style={styles.subText}>{kpi.delta}</Text>
          </GlassCard>
        ))}
      </View>

      <GlassCard>
        <Text style={styles.heroText}>🌍 4.7 tonnes CO₂ avoided this month</Text>
      </GlassCard>

      <View style={styles.twoCol}>
        <GlassCard style={styles.cardGap}>
          <Text style={styles.bodyTextStrong}>Pickups (30d)</Text>
          <ChartMock bars={[24, 34, 29, 48, 54, 60, 58, 66]} />
        </GlassCard>
        <GlassCard style={styles.cardGap}>
          <Text style={styles.bodyTextStrong}>Waste Breakdown</Text>
          <Text style={styles.bodyText}>Plastic 42% | Metal 28% | Paper 18% | E-Waste 12%</Text>
          <ChartMock bars={[42, 28, 18, 12]} />
        </GlassCard>
      </View>

      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Recent Activity</Text>
        {['Hari · Balaju · 5.2kg · Completed', 'Ram · Kalanki · 2.3kg · En Route', 'Hari · Kirtipur · 8.1kg · Pending'].map((line) => (
          <Text key={line} style={styles.bodyText}>{line}</Text>
        ))}
      </GlassCard>
    </View>
  );
}

function AnalyticsPage() {
  return (
    <View style={styles.sectionStack}>
      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Date range: Last 30 days</Text>
        <View style={styles.filterRow}>
          <GhostButton label="7d" onPress={() => {}} />
          <GhostButton label="30d" onPress={() => {}} />
          <GhostButton label="90d" onPress={() => {}} />
          <GhostButton label="Custom" onPress={() => {}} />
        </View>
      </GlassCard>

      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Users Registered Over Time</Text>
        <ChartMock bars={[15, 30, 22, 38, 44, 52, 48]} />
      </GlassCard>

      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Pickup Density Heatmap</Text>
        <MapViewWrapper label="Kathmandu Valley Density" height={250} />
      </GlassCard>
    </View>
  );
}

function RatesPage() {
  return (
    <View style={styles.sectionStack}>
      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Scrap Rates Management</Text>
        {SCRAP_RATES.map((rate) => (
          <View key={rate.id} style={styles.tableRow}>
            <Text style={styles.bodyText}>{rate.icon} {rate.name}</Text>
            <Text style={styles.bodyTextStrong}>{formatNPR(rate.rate)}/kg</Text>
          </View>
        ))}
      </GlassCard>
      <GlassCard style={styles.cardGap}>
        <Text style={styles.bodyTextStrong}>Batch Update</Text>
        <GhostButton label="Upload CSV" onPress={() => {}} />
      </GlassCard>
    </View>
  );
}

function UsersPage() {
  return (
    <View style={styles.sectionStack}>
      <GlassCard style={styles.cardGap}>
        <Input placeholder="Search by name or city" value="" onChangeText={() => {}} />
        {['Priya Sharma · 18 pickups · 45.2 kg', 'Suman KC · 9 pickups · 21.4 kg'].map((row) => (
          <View key={row} style={styles.tableRow}><Text style={styles.bodyText}>{row}</Text><Text style={styles.subText}>Active</Text></View>
        ))}
      </GlassCard>
    </View>
  );
}

function CollectorsPage() {
  return (
    <View style={styles.sectionStack}>
      <GlassCard style={styles.cardGap}>
        {['Hari Bahadur · Balaju · ⭐4.8 · 124 pickups', 'Ram Kumar · Kalanki · ⭐4.5 · 78 pickups'].map((row) => (
          <View key={row} style={styles.tableRow}><Text style={styles.bodyText}>{row}</Text><GhostButton label="View" onPress={() => {}} /></View>
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,28,45,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerMeta: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  main: {
    flexGrow: 1,
    width: 0,
    maxWidth: 1280,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  mainNarrow: {
    width: 1,
  },
  sectionStack: {
    gap: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '49%',
    gap: 4,
  },
  kpiValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  bodyTextStrong: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  bodyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  subText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  heroText: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cardGap: {
    gap: spacing.sm,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,28,45,0.05)',
  },
});
