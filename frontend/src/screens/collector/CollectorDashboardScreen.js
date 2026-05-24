import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, ScreenEnter } from '../../components/ui';
import { colors, spacing } from '../../theme/tokens';
import {
  dashboardTasks,
  CollectorBottomNav,
  styles,
} from './Shared';

/* ── Local request data ── */
const REQUESTS = [
  {
    id: 'R-201',
    distance: '1.2',
    area: 'Green Glen Layout, Sector 4',
    payout: 450,
    tags: [
      { label: 'Paper', icon: 'newspaper-variant-outline' },
      { label: 'Plastic', icon: 'package-variant-closed' },
      { label: 'Metal', icon: 'nail' },
    ],
    featured: true,
  },
  {
    id: 'R-202',
    distance: '0.8',
    area: 'Sunshine Apartment, Block B',
    payout: 180,
    tags: [
      { label: 'Glass', icon: 'glass-fragile' },
      { label: 'Plastic', icon: 'package-variant-closed' },
    ],
    featured: false,
  },
];

/* ── Collector name — replace with your auth/context value ── */
const COLLECTOR_NAME = 'Ramesh Kumar';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Top Bar with Welcome ── */
function CollectorTopBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.welcomeBlock}>
        <Text style={styles.welcomeGreeting}>{getGreeting()} 👋</Text>
        <Text style={styles.welcomeName}>{COLLECTOR_NAME}</Text>
      </View>
      <View style={styles.topBarRight}>
        <View style={styles.notifWrap}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={20}
            color={colors.primary}
          />
          <View style={styles.notifDot} />
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(COLLECTOR_NAME)}</Text>
        </View>
      </View>
    </View>
  );
}

export function CollectorDashboardScreen({ navigation }) {
  const [online, setOnline] = useState(true);

  return (
    <ScreenEnter>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient
          colors={['#f8fbf9', '#eef5ef', '#f7f9fb']}
          style={styles.screenBg}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Top Bar ── */}
            <CollectorTopBar />

            {/* ── Hero: Status + Earnings ── */}
            <View style={styles.heroGrid}>
              {/* Duty Status */}
              <GlassCard style={styles.statusCard}>
                <Text style={styles.sectionLabel}>Duty Status</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDotRow}>
                    <View
                      style={[
                        styles.statusDot,
                        online ? styles.statusDotOnline : styles.statusDotOffline,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        online ? styles.statusTextOnline : styles.statusTextOffline,
                      ]}
                    >
                      {online ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                  <Switch
                    value={online}
                    onValueChange={setOnline}
                    trackColor={{ false: '#d7ddd8', true: colors.primary }}
                    thumbColor="#ffffff"
                    style={styles.toggle}
                  />
                </View>
              </GlassCard>

              {/* Daily Earnings */}
              <GlassCard style={styles.earningsCard}>
                <Text style={styles.sectionLabel}>Daily Earnings</Text>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsValue}>Rs 1,250</Text>
                  <View style={styles.earningsIconBubble}>
                    <MaterialCommunityIcons
                      name="credit-card-outline"
                      size={18}
                      color={colors.secondary}
                    />
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* ── Section Header ── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nearby Requests</Text>
              <Text style={styles.sectionMeta}>3 Live</Text>
            </View>

            {/* ── Request Cards ── */}
            <View style={styles.cardStack}>
              {REQUESTS.map((request) => (
                <GlassCard
                  key={request.id}
                  style={[
                    styles.requestCard,
                    request.featured && styles.requestCardFeatured,
                  ]}
                >
                  {request.featured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>FEATURED</Text>
                    </View>
                  )}

                  {/* Top row: location + payout */}
                  <View style={[styles.requestTopRow, request.featured && { marginTop: 8 }]}>
                    <View style={styles.requestLeft}>
                      <View style={styles.locationIconWrap}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.requestTextBlock}>
                        <Text style={styles.requestDistance}>
                          {request.distance} km away
                        </Text>
                        <Text style={styles.requestArea}>{request.area}</Text>
                      </View>
                    </View>
                    <View style={styles.payoutBlock}>
                      <Text style={styles.payoutLabel}>Est. Payout</Text>
                      <Text style={styles.payoutValue}>Rs {request.payout}</Text>
                    </View>
                  </View>

                  {/* Tags */}
                  <View style={styles.tagRow}>
                    {request.tags.map((tag) => (
                      <View
                        key={`${request.id}-${tag.label}`}
                        style={styles.tagChip}
                      >
                        <MaterialCommunityIcons
                          name={tag.icon}
                          size={13}
                          color={colors.onSurface}
                        />
                        <Text style={styles.tagText}>{tag.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Gradient Accept Button */}
                  <Pressable
                    onPress={() => navigation.navigate('CollectorActivePickup')}
                  >
                    <LinearGradient
                      colors={[colors.primary, '#00873a']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryAction}
                    >
                      <Text style={styles.primaryActionText}>Accept Request</Text>
                    </LinearGradient>
                  </Pressable>
                </GlassCard>
              ))}
            </View>

            {/* ── Today's Tasks ── */}
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
                            size={14}
                            color={
                              task.state === 'done'
                                ? '#ffffff'
                                : task.state === 'active'
                                ? colors.primary
                                : colors.onSurfaceVariant
                            }
                          />
                        </View>
                        {!isLast && (
                          <View
                            style={[
                              styles.timelineLine,
                              task.state === 'done'
                                ? styles.timelineLineDone
                                : styles.timelineLineMuted,
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.timelineCopy}>
                        <Text
                          style={[
                            styles.timelineTitle,
                            task.state === 'active' && styles.timelineTitleActive,
                            task.state === 'pending' && styles.timelineTitleMuted,
                          ]}
                        >
                          {task.title}
                        </Text>
                        <Text style={styles.timelineSubtitle}>{task.subtitle}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </ScrollView>

          <CollectorBottomNav
            navigation={navigation}
            activeRoute="CollectorDashboard"
          />
        </LinearGradient>
      </View>
    </ScreenEnter>
  );
}

export default CollectorDashboardScreen;