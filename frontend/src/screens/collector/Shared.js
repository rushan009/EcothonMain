import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme/tokens';

/* ─────────────────────────────────────────
   Dashboard task data
───────────────────────────────────────── */
export const dashboardTasks = [
  {
    title: 'Morning Route Check',
    subtitle: 'Completed · 7:30 AM',
    icon: 'check-circle-outline',
    state: 'done',
  },
  {
    title: 'Pick up · Sector 7',
    subtitle: 'Completed · 9:15 AM',
    icon: 'check-circle-outline',
    state: 'done',
  },
  {
    title: 'Active — Green Glen',
    subtitle: 'In progress · Est. 11:00 AM',
    icon: 'truck-outline',
    state: 'active',
  },
  {
    title: 'Drop-off · Sorting Facility',
    subtitle: 'Pending · 1:00 PM',
    icon: 'map-marker-outline',
    state: 'pending',
  },
];

/* ─────────────────────────────────────────
   Bottom Nav
───────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Home', icon: 'home-outline', route: 'CollectorDashboard' },
  { label: 'Requests', icon: 'clipboard-list-outline', route: 'CollectorRequests' },
  { label: 'Routes', icon: 'map-outline', route: 'CollectorRoutes' },
  { label: 'Earnings', icon: 'wallet-outline', route: 'CollectorEarnings' },
  { label: 'Profile', icon: 'account-outline', route: 'CollectorProfile' },
];

export function CollectorBottomNav({ navigation, activeRoute }) {
  const navState = navigation?.getState?.();
  const currentRouteName = navigation?.getCurrentRoute?.()?.name || navState?.routes?.[navState?.index || 0]?.name;
  const resolvedActiveRoute = activeRoute || currentRouteName || 'CollectorDashboard';

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.route === resolvedActiveRoute;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={20}
              color={isActive ? colors.primary : '#9aafA0'}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
export const styles = StyleSheet.create({
  /* ── Scaffold ── */
  screen: {
    flex: 1,
  },
  screenBg: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },

  /* ── Top Bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  welcomeBlock: {
    flex: 1,
  },
  welcomeGreeting: {
    ...typography.labelSm,
    color: '#5a7a62',
  },
  welcomeName: {
    ...typography.headlineMd,
    color: '#1a3d24',
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#e84040',
    borderWidth: 1.5,
    borderColor: '#f8fbf9',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.labelSm,
    color: '#ffffff',
  },

  /* ── Hero Grid ── */
  heroGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    padding: 12,
  },
  earningsCard: {
    flex: 1,
    padding: 12,
  },

  /* ── Section Labels ── */
  sectionLabel: {
    ...typography.labelSm,
    color: '#6b8a72',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  /* ── Status Card ── */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: colors.primary,
  },
  statusDotOffline: {
    backgroundColor: '#aaa',
  },
  statusText: {
    ...typography.labelMd,
  },
  statusTextOnline: {
    color: colors.primary,
  },
  statusTextOffline: {
    color: '#888',
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },

  /* ── Earnings Card ── */
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsValue: {
    ...typography.bodyLg,
    color: '#1a3d24',
  },
  earningsIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e6f2ea',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Section Header Row ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: '#1a3d24',
  },
  sectionTitleSmall: {
    ...typography.labelMd,
    color: '#1a3d24',
  },
  sectionMeta: {
    ...typography.labelSm,
    color: colors.primary,
    backgroundColor: '#e0f0e6',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
  },

  /* ── Card Stack ── */
  cardStack: {
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  /* ── Request Card ── */
  requestCard: {
    padding: 12,
    position: 'relative',
  },
  requestCardFeatured: {
    borderColor: 'rgba(26,122,66,0.25)',
    borderWidth: 1,
  },
  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  featuredBadgeText: {
    ...typography.labelSm,
    color: '#ffffff',
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  locationIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#e0f0e6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  requestTextBlock: {
    flex: 1,
  },
  requestDistance: {
    ...typography.labelSm,
    color: '#5a7a62',
  },
  requestArea: {
    ...typography.bodyMd,
    color: '#1a3d24',
    marginTop: 1,
  },
  payoutBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
  },
  payoutLabel: {
    ...typography.labelSm,
    color: '#6b8a72',
  },
  payoutValue: {
    ...typography.bodyLg,
    color: '#1a3d24',
  },

  /* ── Tags ── */
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f6f1',
    borderWidth: 0.5,
    borderColor: '#c0dac8',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    ...typography.labelSm,
    color: '#2d5a38',
  },

  /* ── Primary Action Button ── */
  primaryAction: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    ...typography.labelSm,
    color: '#ffffff',
  },

  /* ── Tasks Card ── */
  tasksCard: {
    marginHorizontal: 16,
    padding: 12,
  },
  progressRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f0e6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  progressRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    ...typography.labelSm,
    color: '#1a3d24',
  },

  /* ── Timeline ── */
  timeline: {
    marginTop: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineRail: {
    alignItems: 'center',
    width: 26,
    flexShrink: 0,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: {
    backgroundColor: colors.primary,
  },
  timelineNodeActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  timelineNodePending: {
    backgroundColor: '#f0f6f1',
    borderWidth: 0.5,
    borderColor: '#c0dac8',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    minHeight: 10,
    marginVertical: 3,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineLineMuted: {
    backgroundColor: '#c0dac8',
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTitle: {
    ...typography.labelMd,
    color: '#1a3d24',
  },
  timelineTitleActive: {
    color: colors.primary,
  },
  timelineTitleMuted: {
    color: '#8aaa92',
  },
  timelineSubtitle: {
    ...typography.labelSm,
    color: '#8aaa92',
    marginTop: 2,
  },

  /* ── Bottom Nav ── */
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 8,
    paddingBottom: 20, // safe area buffer
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  navLabel: {
    ...typography.labelSm,
    color: '#9aafa0',
  },
  navLabelActive: {
    color: colors.primary,
  },
});