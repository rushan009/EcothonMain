import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';
import { colors, spacing } from '../../theme/tokens';
import {
  dashboardTasks,
  CollectorBottomNav,
  styles,
} from './Shared';

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

function timeAgo(inputDate) {
  const diffMs = Date.now() - new Date(inputDate).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatOffer(pickup) {
  const amount = pickup?.offer?.amount;

  if (Number.isFinite(amount) && amount > 0) {
    return `Rs ${amount}`;
  }

  const weightValue = pickup?.estimatedWeight?.value;

  if (Number.isFinite(weightValue) && weightValue > 0) {
    return `${weightValue} ${pickup?.estimatedWeight?.unit || 'kg'} pending rate`;
  }

  return 'Offer pending';
}

function formatWeight(pickup) {
  const weightValue = pickup?.estimatedWeight?.value;

  if (!Number.isFinite(weightValue) || weightValue <= 0) {
    return 'Weight unavailable';
  }

  return `${weightValue} ${pickup?.estimatedWeight?.unit || 'kg'}`;
}

function upsertPendingRequest(current, nextRequest) {
  if (!nextRequest?._id) {
    return current;
  }

  const rest = current.filter((request) => request._id !== nextRequest._id);

  if (nextRequest.status === 'pending') {
    return [nextRequest, ...rest];
  }

  return rest;
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
  const [requests, setRequests] = useState([]);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await endpoints.getPendingNearby();
      setRequests(response.data?.pickups || []);
    } catch (error) {
      Alert.alert('Unable to load requests', error?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!online) {
      setRequests([]);
      setLoading(false);
      setRefreshing(false);
      disconnectPickupSocket();
      return undefined;
    }

    loadRequests();
    return undefined;
  }, [loadRequests, online]);

  useEffect(() => {
    if (!online) {
      return undefined;
    }

    let mounted = true;

    const attachSocket = async () => {
      const socket = await connectPickupSocket();

      if (!socket || !mounted) {
        return;
      }

      const handlePickupUpdate = (pickup) => {
        setRequests((current) => upsertPendingRequest(current, pickup));
      };

      const handlePickupCreated = (pickup) => {
        setRequests((current) => upsertPendingRequest(current, pickup));
      };

      const handleReconnect = () => {
        loadRequests({ silent: true });
      };

      socket.on('pickup_created', handlePickupCreated);
      socket.on('pickup_status_changed', handlePickupUpdate);
      socket.on('connect', handleReconnect);

      return () => {
        socket.off('pickup_created', handlePickupCreated);
        socket.off('pickup_status_changed', handlePickupUpdate);
        socket.off('connect', handleReconnect);
      };
    };

    attachSocket();

    return () => {
      mounted = false;
      disconnectPickupSocket();
    };
  }, [loadRequests, online]);

  const liveCount = useMemo(() => requests.length, [requests]);

  const acceptRequest = async (requestId) => {
    try {
      await endpoints.acceptPickup(requestId);
      setRequests((current) => current.filter((request) => request._id !== requestId));
    } catch (error) {
      Alert.alert('Could not accept request', error?.response?.data?.message || 'Please try again.');
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await endpoints.declinePickup(requestId);
      setRequests((current) => current.filter((request) => request._id !== requestId));
    } catch (error) {
      Alert.alert('Could not decline request', error?.response?.data?.message || 'Please try again.');
    }
  };

  const openRequestDetails = (request) => {
    navigation.navigate('CollectorActivePickup', { request });
  };

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
              <Text style={styles.sectionMeta}>{liveCount} Live</Text>
            </View>

            {/* ── Request Cards ── */}
            <View style={styles.cardStack}>
              {!online ? (
                <GlassCard style={styles.requestCard}>
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <MaterialCommunityIcons name="wifi-off" size={28} color={colors.onSurfaceVariant} />
                    <Text style={{ marginTop: 10, color: colors.onSurfaceVariant, textAlign: 'center' }}>
                      You are offline. Requests stay hidden until you switch back online.
                    </Text>
                  </View>
                </GlassCard>
              ) : loading ? (
                <GlassCard style={styles.requestCard}>
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.onSurfaceVariant }}>Loading live pickup requests…</Text>
                  </View>
                </GlassCard>
              ) : null}

              {online && !loading && requests.length === 0 ? (
                <GlassCard style={styles.requestCard}>
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={28} color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.onSurfaceVariant, textAlign: 'center' }}>
                      No pending pickups right now. New orders will appear here instantly.
                    </Text>
                  </View>
                </GlassCard>
              ) : null}

              {requests.map((request) => (
                <GlassCard
                  key={request._id}
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

                  <Pressable onPress={() => openRequestDetails(request)} style={{ marginBottom: 10 }}>
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
                            {timeAgo(request.createdAt)}
                          </Text>
                          <Text style={styles.requestArea} numberOfLines={2}>
                            {request.location?.address || 'Pickup location unavailable'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.payoutBlock}>
                        <Text style={styles.payoutLabel}>Estimated Offer</Text>
                        <Text style={styles.payoutValue}>{formatOffer(request)}</Text>
                      </View>
                    </View>

                    <View style={styles.tagRow}>
                      {(request.scrapTypes || []).map((tag) => (
                        <View
                          key={`${request._id}-${tag.category}`}
                          style={styles.tagChip}
                        >
                          <MaterialCommunityIcons
                            name={tag.icon}
                            size={13}
                            color={colors.onSurface}
                          />
                          <Text style={styles.tagText}>{tag.category}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.tagRow}>
                      <View style={styles.tagChip}>
                        <MaterialCommunityIcons
                          name="scale-bathroom"
                          size={13}
                          color={colors.onSurface}
                        />
                        <Text style={styles.tagText}>{formatWeight(request)}</Text>
                      </View>
                      <View style={styles.tagChip}>
                        <MaterialCommunityIcons
                          name="phone-outline"
                          size={13}
                          color={colors.onSurface}
                        />
                        <Text style={styles.tagText}>{request.phone || 'No phone'}</Text>
                      </View>
                    </View>
                  </Pressable>

                  <View style={{ gap: 8 }}>
                    <Pressable onPress={() => acceptRequest(request._id)}>
                      <LinearGradient
                        colors={[colors.primary, '#00873a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryAction}
                      >
                        <Text style={styles.primaryActionText}>Accept Request</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      onPress={() => declineRequest(request._id)}
                      style={{
                        borderWidth: 1,
                        borderColor: '#cfe0d4',
                        borderRadius: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                        backgroundColor: '#f7faf7',
                      }}
                    >
                      <Text style={{ color: colors.onSurface, fontWeight: '700' }}>Decline Request</Text>
                    </Pressable>
                  </View>
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