import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../components/ui';
import { COLLECTOR_REQUESTS } from '../data/mockData';
import { colors, spacing, typography } from '../theme/tokens';
import { formatNPR } from '../utils/format';

const collectorAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDreTFFIz0i6MDRxRUXUyZN7cgP0Dd_-d2dJIunk88eEYjShqmmpKvH1ro4CvJIcMfCucj6skQPD7Ho3Yzf6XoeF9rr4_fi-9-_nPhLP_FRLeXDufq4N6_YWb8jMzqfSKMQtZNgso62KAEEEYtb3yieYdmzijJ5S-8TcNzFNQOhy-88yqbDDED2KkYkVdpdXSZO9EpfJwqy0YOTkym7qFziDZTkWQYglbvKSy1Hk94u-98zwrofpdrjjfMxj5H2ol9Y4CgcDqnhvp3b';

const dashboardTasks = [
  { title: 'Morning Pickup: Sector 2', subtitle: 'Completed at 09:30 AM', state: 'done', icon: 'check' },
  { title: 'Current: Mid-day Run', subtitle: '2 requests accepted', state: 'active', icon: 'sync' },
  { title: 'Evening Drop-off', subtitle: 'Pending completion', state: 'pending', icon: 'clock-outline' },
];

const earningsBars = [42, 58, 74, 48, 64, 82, 36];
const collections = [
  { title: 'Plastic & Metal Batch', meta: 'Oct 24, 2023 • 14.5 kg', amount: '+₹ 420', note: 'Bonus +12%', accent: colors.secondaryContainer, tone: colors.primary },
  { title: 'Paper & Cardboard', meta: 'Oct 23, 2023 • 28.0 kg', amount: '+₹ 310', note: 'Standard', accent: colors.surfaceContainerHigh, tone: colors.onSurface },
  { title: 'E-Waste Pickup', meta: 'Oct 22, 2023 • 2.2 kg', amount: '+₹ 850', note: 'Premium Rate', accent: 'rgba(134,242,228,0.25)', tone: colors.primary },
];

const bottomRoutes = [
  { key: 'CollectorDashboard', label: 'Requests', icon: 'moped' },
  { key: 'CollectorActivePickup', label: 'Tasks', icon: 'clipboard-text-outline' },
  { key: 'CollectorEarnings', label: 'Earnings', icon: 'cash-multiple' },
  { key: 'CollectorProfile', label: 'Profile', icon: 'account-circle-outline' },
];

export function CollectorLoginScreen({ navigation }) {
  return (
    <View style={styles.loginShell}>
      <Text style={styles.loginTitle}>Collector access</Text>
      <Text style={styles.loginBody}>This entry point is retained for manual testing. Collector users should land on the dashboard after login.</Text>
      <GhostButton label="Go to Dashboard" onPress={() => navigation.replace('CollectorDashboard')} style={styles.loginButton} />
    </View>
  );
}

export function CollectorDashboardScreen({ navigation }) {
  const [online, setOnline] = useState(true);

  return (
    <ScreenEnter>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient colors={['#f8fbf9', '#eef5ef', '#f7f9fb']} style={styles.screenBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CollectorTopBar />

            <View style={styles.heroGrid}>
              <GlassCard style={styles.statusCard}>
                <Text style={styles.sectionLabel}>Duty Status</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusCopy}>
                    <View style={styles.statusDotRow}>
                      <View style={[styles.statusDot, online ? styles.statusDotOnline : styles.statusDotOffline]} />
                      <Text style={[styles.statusText, online ? styles.statusTextOnline : styles.statusTextOffline]}>{online ? 'Online' : 'Offline'}</Text>
                    </View>
                  </View>
                  <Switch value={online} onValueChange={setOnline} trackColor={{ false: '#d7ddd8', true: colors.primary }} thumbColor="#ffffff" />
                </View>
              </GlassCard>

              <GlassCard style={styles.earningsCard}>
                <Text style={styles.sectionLabel}>Daily Earnings</Text>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsValue}>{formatNPR(1250)}</Text>
                  <View style={styles.earningsIconBubble}>
                    <MaterialCommunityIcons name="credit-card-outline" size={22} color={colors.secondary} />
                  </View>
                </View>
              </GlassCard>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nearby Requests</Text>
              <Text style={styles.sectionMeta}>3 Live</Text>
            </View>

            <View style={styles.cardStack}>
              {COLLECTOR_REQUESTS.map((request, index) => (
                <GlassCard key={request.id} style={[styles.requestCard, index === 0 && styles.requestCardFeatured]}>
                  <View style={styles.requestTopRow}>
                    <View style={styles.requestLeft}>
                      <View style={styles.locationIconWrap}>
                        <MaterialCommunityIcons name="map-marker-outline" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.requestTextBlock}>
                        <Text style={styles.requestDistance}>{request.distance.toFixed(1)} km away</Text>
                        <Text style={styles.requestArea}>{request.area}</Text>
                      </View>
                    </View>
                    <View style={styles.payoutBlock}>
                      <Text style={styles.payoutLabel}>Est. Payout</Text>
                      <Text style={styles.payoutValue}>{formatNPR(request.est)}</Text>
                    </View>
                  </View>

                  <View style={styles.tagRow}>
                    {request.items.split(' + ').map((item) => (
                      <View key={`${request.id}-${item}`} style={styles.tagChip}>
                        <MaterialCommunityIcons name={item.toLowerCase().includes('plastic') ? 'recycle' : item.toLowerCase().includes('paper') ? 'newspaper-variant-outline' : 'package-variant-closed'} size={16} color={colors.onSurface} />
                        <Text style={styles.tagText}>{item.replace('🥤 ', '').replace('📦 ', '').replace('⚡ ', '').replace('🔩 ', '')}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable style={styles.primaryAction} onPress={() => navigation.navigate('CollectorActivePickup')}>
                    <Text style={styles.primaryActionText}>Accept Request</Text>
                  </Pressable>
                </GlassCard>
              ))}
            </View>

            <GlassCard style={styles.tasksCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleSmall}>Today's Tasks</Text>
                <View style={styles.progressRing}>
                  <View style={styles.progressRingInner}>
                    <Text style={styles.progressText}>70%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.timeline}>
                {dashboardTasks.map((task, index) => {
                  const isLast = index === dashboardTasks.length - 1;
                  return (
                    <View key={task.title} style={styles.timelineRow}>
                      <View style={styles.timelineRail}>
                        <View
                          style={[
                            styles.timelineNode,
                            task.state === 'done' && styles.timelineNodeDone,
                            task.state === 'active' && styles.timelineNodeActive,
                            task.state === 'pending' && styles.timelineNodePending,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={task.icon}
                            size={18}
                            color={task.state === 'pending' ? colors.onSurfaceVariant : '#ffffff'}
                          />
                        </View>
                        {!isLast ? <View style={[styles.timelineLine, task.state === 'done' ? styles.timelineLineDone : styles.timelineLineMuted]} /> : null}
                      </View>
                      <View style={styles.timelineCopy}>
                        <Text style={[styles.timelineTitle, task.state === 'active' && styles.timelineTitleActive, task.state === 'pending' && styles.timelineTitleMuted]}>{task.title}</Text>
                        <Text style={styles.timelineSubtitle}>{task.subtitle}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </ScrollView>

          <CollectorBottomNav navigation={navigation} activeRoute="CollectorDashboard" />
        </LinearGradient>
      </View>
    </ScreenEnter>
  );
}

export function CollectorMapScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Request Map</Text>
      <Text style={styles.loginBody}>This screen is kept for navigation parity. The dashboard now matches the collector reference and is the default landing screen.</Text>
      <GhostButton label="Accept Selected Request" onPress={() => navigation.navigate('CollectorActivePickup')} style={styles.fullWidthButton} />
    </View>
  );
}

export function CollectorActivePickupScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient colors={['#f8fbf9', '#eef5ef', '#f7f9fb']} style={styles.screenBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CollectorTopBar title="Task Details" showBack onBack={() => navigation.goBack()} />

            <View style={styles.mapHero}>
              <View style={styles.mapGrid} />
              <View style={styles.mapGlow} />
              <View style={styles.mapRoute} />
              <View style={styles.mapPin}>
                <MaterialCommunityIcons name="map-marker" size={28} color={colors.primary} />
              </View>
            </View>

            <View style={styles.floatingMapTools}>
              <Pressable style={styles.mapToolButton}>
                <MaterialCommunityIcons name="target" size={22} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.mapToolButton}>
                <MaterialCommunityIcons name="layers-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <GlassCard style={styles.taskCard}>
              <View style={styles.taskHeaderRow}>
                <View>
                  <Text style={styles.sectionLabel}>Pick Up From</Text>
                  <Text style={styles.taskName}>Anish Prajapati</Text>
                  <View style={styles.inlineLocationRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.onSurfaceVariant} />
                    <Text style={styles.taskLocation}>Sector 4, Green Valley Estate</Text>
                  </View>
                </View>
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressText}>In Progress</Text>
                </View>
              </View>

              <View style={styles.actionGrid}>
                <Pressable style={styles.secondaryAction}>
                  <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>Call User</Text>
                </Pressable>
                <Pressable style={styles.primaryAction}>
                  <MaterialCommunityIcons name="navigation-variant-outline" size={20} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Navigate</Text>
                </Pressable>
              </View>
            </GlassCard>

            <GlassCard style={styles.summaryCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleSmall}>Waste Summary</Text>
                <View style={styles.estimateBadge}>
                  <Text style={styles.estimateText}>Estimated 12kg</Text>
                </View>
              </View>

              <View style={styles.summaryList}>
                <SummaryRow icon="file-document-outline" title="Paper & Cardboard" subtitle="Recyclable Grade A" value="5kg" tone={colors.secondary} valueTone={colors.secondary} />
                <SummaryRow icon="recycle" title="Plastic Bottles" subtitle="PET / HDPE Mixed" value="4kg" tone={colors.tertiary} valueTone={colors.tertiary} />
                <SummaryRow icon="factory" title="Metal Scraps" subtitle="Aluminum & Iron" value="3kg" tone={colors.error} valueTone={colors.error} />
              </View>
            </GlassCard>

            <GlassCard style={styles.notesCard}>
              <View style={styles.notesHeaderRow}>
                <MaterialCommunityIcons name="note-text-outline" size={22} color={colors.primary} />
                <Text style={styles.notesTitle}>User Notes</Text>
              </View>
              <Text style={styles.notesText}>"Please call before reaching. The gate code is 4421. The waste is sorted and packed in green bags."</Text>
            </GlassCard>
          </ScrollView>

          <View style={styles.bottomActionWrap}>
            <Pressable style={styles.completeButton} onPress={() => setShowModal(true)}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.completeButtonText}>Verify & Complete</Text>
            </Pressable>
          </View>

          <CollectorBottomNav navigation={navigation} activeRoute="CollectorActivePickup" />
        </LinearGradient>
      </View>

      <Modal transparent visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalBody}>The pickup has been verified and the points are ready to credit to the collector wallet.</Text>
            <Pressable
              style={styles.primaryAction}
              onPress={() => {
                setShowModal(false);
                navigation.navigate('CollectorDashboard');
              }}
            >
              <Text style={styles.primaryActionText}>Return to Tasks</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

export function CollectorConfirmCollectionScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Pickup Verified</Text>
      <Text style={styles.loginBody}>This route is preserved for backwards compatibility. Use the task-details screen to verify pickups and return to the dashboard.</Text>
      <GhostButton label="Go to Earnings" onPress={() => navigation.navigate('CollectorEarnings')} style={styles.fullWidthButton} />
    </View>
  );
}

export function CollectorEarningsScreen({ navigation }) {
  return (
    <ScreenEnter>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient colors={['#f8fbf9', '#eef5ef', '#f7f9fb']} style={styles.screenBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CollectorTopBar title="RecycleSathi" />

            <GlassCard style={styles.walletCard}>
              <Text style={styles.walletLabel}>Total Wallet Balance</Text>
              <Text style={styles.walletValue}>{formatNPR(12450)}<Text style={styles.walletDecimals}>.00</Text></Text>
              <View style={styles.walletSplitRow}>
                <View>
                  <Text style={styles.weekLabel}>This Week's Earnings</Text>
                  <Text style={styles.weekValue}>{formatNPR(4820)}</Text>
                </View>
                <View style={styles.trendPill}>
                  <MaterialCommunityIcons name="trending-up" size={18} color={colors.primary} />
                  <Text style={styles.trendText}>12% vs last week</Text>
                </View>
              </View>

              <View style={styles.chartWrap}>
                {earningsBars.map((bar, index) => (
                  <View key={`bar-${index}`} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${bar}%`, opacity: 0.35 + index * 0.08 }]} />
                    </View>
                    <Text style={[styles.barLabel, index === 2 && styles.barLabelActive]}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <Pressable style={styles.withdrawButton}>
              <MaterialCommunityIcons name="cash-multiple" size={22} color="#ffffff" />
              <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
            </Pressable>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Collections</Text>
              <Text style={styles.sectionMeta}>View All</Text>
            </View>

            <View style={styles.collectionList}>
              {collections.map((item) => (
                <GlassCard key={item.title} style={styles.collectionCard}>
                  <View style={[styles.collectionIcon, { backgroundColor: item.accent }]}>
                    <MaterialCommunityIcons name={item.title.includes('E-Waste') ? 'power-plug-outline' : item.title.includes('Paper') ? 'delete-sweep-outline' : 'recycle'} size={24} color={item.tone} />
                  </View>
                  <View style={styles.collectionCopy}>
                    <Text style={styles.collectionTitle}>{item.title}</Text>
                    <Text style={styles.collectionMeta}>{item.meta}</Text>
                  </View>
                  <View style={styles.collectionAmountBlock}>
                    <Text style={styles.collectionAmount}>{item.amount}</Text>
                    <Text style={[styles.collectionNote, { color: item.tone }]}>{item.note}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </ScrollView>

          <CollectorBottomNav navigation={navigation} activeRoute="CollectorEarnings" />
        </LinearGradient>
      </View>
    </ScreenEnter>
  );
}

export function CollectorProfileScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Collector Profile</Text>
      <Text style={styles.loginBody}>Profile and history are kept in the stack for completeness. The main collector flow now starts on the dashboard screen.</Text>
      <GhostButton label="Back to Dashboard" onPress={() => navigation.navigate('CollectorDashboard')} style={styles.fullWidthButton} />
    </View>
  );
}

export function CollectorHistoryScreen() {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Collection History</Text>
      <Text style={styles.loginBody}>This screen remains available for future expansion.</Text>
    </View>
  );
}

export const collectorTabBar = () => null;

function CollectorTopBar({ title = 'RecycleSathi', showBack = false, onBack }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {showBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.avatarWrap}>
            <Image source={{ uri: collectorAvatar }} style={styles.avatar} />
          </View>
        )}
        <Text style={styles.brandTitle}>{title}</Text>
      </View>
      <Pressable style={styles.bellButton}>
        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function CollectorBottomNav({ navigation, activeRoute }) {
  return (
    <View style={styles.bottomNav}>
      {bottomRoutes.map((item) => {
        const active = item.key === activeRoute;
        return (
          <Pressable key={item.key} onPress={() => navigation.navigate(item.key)} style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}>
            <MaterialCommunityIcons name={item.icon} size={22} color={active ? colors.primary : colors.onSurfaceVariant} />
            <Text style={[styles.bottomNavLabel, active && styles.bottomNavLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SummaryRow({ icon, title, subtitle, value, tone, valueTone }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryRowLeft}>
        <View style={[styles.summaryIcon, { backgroundColor: `${tone}20` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={tone} />
        </View>
        <View>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summarySubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={[styles.summaryValue, { color: valueTone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenBg: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 128,
    gap: spacing.md,
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    borderWidth: 2,
    borderColor: '#8ce9a0',
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGrid: {
    gap: spacing.md,
  },
  statusCard: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  earningsCard: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  sectionLabel: {
    ...typography.labelSm,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCopy: {
    flex: 1,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusDotOnline: {
    backgroundColor: colors.primary,
  },
  statusDotOffline: {
    backgroundColor: '#b7beb8',
  },
  statusText: {
    ...typography.headlineMd,
    fontSize: 28,
    lineHeight: 34,
  },
  statusTextOnline: {
    color: colors.primary,
  },
  statusTextOffline: {
    color: colors.onSurfaceVariant,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsValue: {
    ...typography.headlineMd,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  earningsIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(226,245,205,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  sectionTitleSmall: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  sectionMeta: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  cardStack: {
    gap: spacing.md,
  },
  requestCard: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 24,
  },
  requestCardFeatured: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  requestLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  locationIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  requestTextBlock: {
    flex: 1,
    gap: 4,
  },
  requestDistance: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  requestArea: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  payoutBlock: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  payoutValue: {
    ...typography.headlineMd,
    color: colors.secondary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  primaryAction: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: {
    ...typography.bodyMd,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  tasksCard: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 24,
  },
  progressRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 5,
    borderColor: 'rgba(0,107,44,0.16)',
    borderTopColor: colors.primary,
    borderRightColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  progressText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  timeline: {
    gap: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineRail: {
    width: 42,
    alignItems: 'center',
  },
  timelineNode: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineNodeDone: {
    backgroundColor: colors.primary,
  },
  timelineNodeActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  timelineNodePending: {
    backgroundColor: '#f0f2f1',
    borderWidth: 2,
    borderColor: '#d2d8d4',
  },
  timelineLine: {
    width: 4,
    flex: 1,
    marginTop: -2,
    borderRadius: 999,
  },
  timelineLineDone: {
    backgroundColor: colors.primary,
  },
  timelineLineMuted: {
    backgroundColor: '#d6ddd8',
  },
  timelineCopy: {
    flex: 1,
    paddingTop: 4,
    gap: 4,
  },
  timelineTitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
  },
  timelineTitleActive: {
    color: colors.primary,
  },
  timelineTitleMuted: {
    color: colors.onSurfaceVariant,
  },
  timelineSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  mapHero: {
    height: 300,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#dbe4e1',
    marginTop: 2,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#dfe8e4',
    opacity: 0.95,
  },
  mapGlow: {
    position: 'absolute',
    left: 18,
    top: 85,
    width: 190,
    height: 85,
    borderRadius: 42,
    backgroundColor: 'rgba(162,255,141,0.55)',
    transform: [{ rotate: '-7deg' }],
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  mapRoute: {
    position: 'absolute',
    left: 72,
    top: 138,
    width: 184,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(42,205,83,0.86)',
    shadowColor: '#7bf96f',
    shadowOpacity: 0.85,
    shadowRadius: 14,
  },
  mapPin: {
    position: 'absolute',
    left: 190,
    top: 118,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMapTools: {
    position: 'absolute',
    right: 16,
    top: 388,
    gap: 10,
  },
  mapToolButton: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  taskCard: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 28,
    marginTop: -42,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  taskName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  inlineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  taskLocation: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  inProgressBadge: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(226,245,205,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(187,216,111,0.9)',
  },
  inProgressText: {
    ...typography.labelMd,
    color: '#61730f',
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryActionText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  summaryCard: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 28,
  },
  estimateBadge: {
    backgroundColor: 'rgba(0,107,44,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  estimateText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  summaryList: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#f5f7f8',
    gap: 12,
  },
  summaryRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
  },
  summarySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryValue: {
    ...typography.headlineMd,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  notesCard: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 28,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notesTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  notesText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  bottomActionWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 88,
  },
  completeButton: {
    minHeight: 66,
    borderRadius: 20,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  completeButtonText: {
    ...typography.headlineMd,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 12,
    height: 74,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bottomNavItemActive: {
    backgroundColor: 'rgba(0,107,44,0.1)',
  },
  bottomNavLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  bottomNavLabelActive: {
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,28,45,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,107,44,0.08)',
  },
  modalTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  modalBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 26,
  },
  simplePage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loginShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loginTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  loginBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 26,
  },
  loginButton: {
    alignSelf: 'stretch',
  },
  fullWidthButton: {
    alignSelf: 'stretch',
  },
});
