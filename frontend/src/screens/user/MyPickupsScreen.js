import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';

const PRIMARY_GREEN = '#2E7D32';
const BACKGROUND = '#F9F9F9';
const CARD_BG = '#FFFFFF';

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

function statusMeta(status) {
  if (status === 'accepted') {
    return { label: '🟢 Coming', color: '#166534', bg: '#DCFCE7' };
  }

  if (status === 'arrived') {
    return { label: '🟠 Arrived', color: '#92400E', bg: '#FEF3C7' };
  }

  if (status === 'completed') {
    return { label: '✅ Completed', color: '#14532D', bg: '#DCFCE7' };
  }

  if (status === 'cancelled') {
    return { label: '❌ Cancelled', color: '#7F1D1D', bg: '#FEE2E2' };
  }

  if (status === 'declined') {
    return { label: '⚪ Declined', color: '#6B7280', bg: '#E5E7EB' };
  }

  return { label: '🟡 Pending', color: '#854D0E', bg: '#FEF3C7' };
}

function formatEta(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 'ETA unavailable';
  }

  if (minutes < 60) {
    return `Arriving in ${Math.max(1, Math.round(minutes))} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);

  if (remaining === 0) {
    return `Arriving in ${hours} hr`;
  }

  return `Arriving in ${hours} hr ${remaining} min`;
}

function haversineDistanceKm(origin, destination) {
  if (!origin || !destination) {
    return 0;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(destination.latitude - origin.latitude);
  const deltaLng = toRad(destination.longitude - origin.longitude);
  const startLat = toRad(origin.latitude);
  const endLat = toRad(destination.latitude);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function estimateEtaFromPoints(origin, destination) {
  const distanceKm = haversineDistanceKm(origin, destination);

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return null;
  }

  const averageCitySpeedKmh = 18;
  return (distanceKm / averageCitySpeedKmh) * 60;
}

function normalizeCoordinates(input) {
  if (!input) {
    return null;
  }

  const latitude = Number(input.latitude ?? input.lat);
  const longitude = Number(input.longitude ?? input.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function sanitizeRouteCoordinates(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((point) => normalizeCoordinates(point))
    .filter(Boolean);
}

function PickupRoutePreview({ pickup }) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const mapRef = useRef(null);

  const collectorLocation = normalizeCoordinates(
    pickup?.collectorLocation || pickup?.collector?.location || pickup?.collectorId?.location || null,
  );
  const pickupLocation = pickup?.location || null;
  const collectorName = pickup?.collectorName || pickup?.collector?.name || pickup?.collectorId?.name || 'Collector on the way';
  const collectorPhone = pickup?.collectorPhone || pickup?.collector?.phone || pickup?.collectorId?.phone || null;
  const collectorCompany = pickup?.collectorCompany || pickup?.collector?.company || pickup?.collectorId?.company || 'EcoSathi Collector Team';
  const pickupPoint = normalizeCoordinates(pickupLocation);

  const previewRegion = useMemo(() => {
    if (!collectorLocation || !pickupPoint) {
      return {
        latitude: collectorLocation?.latitude || pickupPoint?.latitude || 27.7172,
        longitude: collectorLocation?.longitude || pickupPoint?.longitude || 85.324,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const latitude = (collectorLocation.latitude + pickupPoint.latitude) / 2;
    const longitude = (collectorLocation.longitude + pickupPoint.longitude) / 2;
    const latitudeDelta = Math.max(Math.abs(collectorLocation.latitude - pickupPoint.latitude) * 1.6, 0.02);
    const longitudeDelta = Math.max(Math.abs(collectorLocation.longitude - pickupPoint.longitude) * 1.6, 0.02);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  }, [collectorLocation, pickupPoint]);

  useEffect(() => {
    let mounted = true;
    const startPoint = collectorLocation;
    const endPoint = pickupPoint;

    const safePickupRoute = sanitizeRouteCoordinates(pickup?.route);

    // Only update if coordinates actually changed
    if (safePickupRoute.length > 1) {
      setRouteCoordinates((prev) => {
        const next = safePickupRoute;
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          return next;
        }
        return prev;
      });
      setEtaMinutes((prev) => {
        const newEta = pickup.routeDuration ? pickup.routeDuration / 60 : estimateEtaFromPoints(startPoint, endPoint);
        if (prev !== newEta) return newEta;
        return prev;
      });
    } else if (startPoint && endPoint) {
      setRouteCoordinates((prev) => {
        const newCoords = [startPoint, endPoint];
        if (JSON.stringify(prev) !== JSON.stringify(newCoords)) {
          return newCoords;
        }
        return prev;
      });
      setEtaMinutes((prev) => {
        const newEta = estimateEtaFromPoints(startPoint, endPoint);
        if (prev !== newEta) return newEta;
        return prev;
      });
    }

    const loadRoute = async () => {
      if (!startPoint || !endPoint) {
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startPoint.longitude},${startPoint.latitude};${endPoint.longitude},${endPoint.latitude}?overview=full&geometries=geojson`
        );

        const data = await response.json();
        const route = data?.routes?.[0] || null;
        const geometry = route?.geometry?.coordinates || [];

        if (!mounted || !Array.isArray(geometry) || geometry.length === 0) {
          return;
        }

        const nextRoute = sanitizeRouteCoordinates(geometry.map(([longitude, latitude]) => ({ latitude, longitude })));

        if (nextRoute.length > 1) {
          setRouteCoordinates(nextRoute);
        }

        if (route?.duration) {
          setEtaMinutes(route.duration / 60);
        }
      } catch (error) {
        console.log('[pickup-route] route load failed', error?.message || error);
      }
    };

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [collectorLocation, pickupPoint, pickup?.route, pickup?.routeDuration]);

  const displayCoordinates = useMemo(() => {
    if (routeCoordinates.length > 1) {
      return routeCoordinates;
    }

    return collectorLocation?.latitude && collectorLocation?.longitude && pickupPoint
      ? [
        { latitude: collectorLocation.latitude, longitude: collectorLocation.longitude },
        pickupPoint,
      ]
      : [];
  }, [collectorLocation, pickupPoint, routeCoordinates]);

  useEffect(() => {
    if (!mapRef.current || typeof mapRef.current.fitToCoordinates !== 'function' || displayCoordinates.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        mapRef.current.fitToCoordinates(displayCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } catch (error) {
        console.log('[pickup-route] fit failed', error?.message || error);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [displayCoordinates]);

  return (
    <View style={styles.liveTrackCard}>
      <View style={styles.liveTrackHeader}>
        <Text style={styles.liveTrackTitle}>Live Collector Location</Text>
        <Text style={styles.liveTrackEta}>{formatEta(etaMinutes)}</Text>
      </View>

      <View style={styles.liveMapWrap}>
        <MapView
          ref={(instance) => {
            if (instance) {
              mapRef.current = instance;
            }
          }}
          style={styles.liveMap}
          mapType="none"
          initialRegion={previewRegion}
        >
          <UrlTile
            urlTemplate="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {collectorLocation?.latitude && collectorLocation?.longitude ? (
            <Marker
              coordinate={{ latitude: collectorLocation.latitude, longitude: collectorLocation.longitude }}
              title={collectorName}
              description={`${collectorCompany} • Live collector location`}
              pinColor={PRIMARY_GREEN}
              identifier="collector-location"
            />
          ) : null}

          {pickupPoint ? (
            <Marker
              coordinate={pickupPoint}
              title="Pickup"
              description={pickupLocation.address || 'Pickup location'}
              pinColor="#D32F2F"
              identifier="pickup-location"
            />
          ) : null}

          {displayCoordinates.length > 1 ? (
            <Polyline
              coordinates={displayCoordinates}
              strokeColor={PRIMARY_GREEN}
              strokeWidth={5}
            />
          ) : null}
        </MapView>
      </View>

      <View style={styles.collectorInfoCard}>
        <View style={styles.collectorInfoTopRow}>
          <View style={styles.collectorAvatar}>
            <MaterialCommunityIcons name="truck-fast-outline" size={22} color={PRIMARY_GREEN} />
          </View>

          <View style={styles.collectorInfoCopy}>
            <Text style={styles.collectorName}>{collectorName}</Text>
            <Text style={styles.collectorCompany}>{collectorCompany}</Text>
          </View>

          <View style={styles.collectorEtaChip}>
            <Text style={styles.collectorEtaChipText}>{formatEta(etaMinutes)}</Text>
          </View>
        </View>

        <View style={styles.collectorMetaRow}>
          <View style={styles.collectorMetaItem}>
            <Text style={styles.collectorMetaLabel}>Phone number</Text>
            <Text style={styles.collectorMetaValue}>{collectorPhone || 'Not shared yet'}</Text>
          </View>

          <View style={styles.collectorMetaItem}>
            <Text style={styles.collectorMetaLabel}>Status</Text>
            <Text style={styles.collectorMetaValue}>{pickup.status === 'accepted' ? 'Coming' : statusMeta(pickup.status).label}</Text>
          </View>
        </View>

        {collectorPhone ? (
          <Pressable style={styles.collectorCallButton} onPress={() => Linking.openURL(`tel:${collectorPhone}`)}>
            <MaterialCommunityIcons name="phone" size={18} color="#ffffff" />
            <Text style={styles.collectorCallButtonText}>Call collector</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function MyPickupsScreen({ navigation }) {
  const [pickups, setPickups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPickups = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await endpoints.getMyPickups();
      setPickups(response.data?.pickups || []);
    } catch (error) {
      Alert.alert('Unable to load pickups', error?.response?.data?.message || 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const visiblePickups = useMemo(() => pickups.filter((pickup) => pickup.status !== 'cancelled'), [pickups]);

  useFocusEffect(
    useCallback(() => {
      loadPickups();
    }, [loadPickups])
  );

  useEffect(() => {
    let mounted = true;

    const attachSocket = async () => {
      const socket = await connectPickupSocket();

      if (!socket || !mounted) {
        return;
      }

      const handleCreated = (pickup) => {
        if (!pickup?._id) {
          return;
        }

        setPickups((current) => {
          if (current.some((item) => item._id === pickup._id)) {
            return current.map((item) => (item._id === pickup._id ? { ...item, ...pickup } : item));
          }

          return [{ ...pickup }, ...current];
        });
      };

      const handleStatusChanged = (pickup) => {
        if (!pickup?._id) {
          return;
        }

        setPickups((current) => current.map((item) => (item._id === pickup._id ? { ...item, ...pickup } : item)));
      };

      const handleAccepted = (payload) => {
        if (!payload?.requestId) {
          return;
        }

        setPickups((current) => current.map((pickup) => {
          if (pickup._id === payload.requestId) {
            const existingCollector = pickup.collectorId && typeof pickup.collectorId === 'object' ? pickup.collectorId : null;
            const mergedCollector = payload.collector ? {
              ...(existingCollector || {}),
              ...payload.collector,
              location: payload.collectorLocation
                ? {
                  lat: payload.collectorLocation.latitude,
                  lng: payload.collectorLocation.longitude,
                }
                : existingCollector?.location || null,
            } : existingCollector;

            return {
              ...pickup,
              status: payload.status || 'accepted',
              collectorLocation: payload.collectorLocation || pickup.collectorLocation || null,
              route: payload.route || pickup.route || null,
              routeDuration: payload.routeDuration || pickup.routeDuration || null,
              collector: mergedCollector || pickup.collector || null,
              collectorId: mergedCollector || pickup.collectorId,
              collectorName: payload.collector?.name || pickup.collectorName,
              collectorPhone: payload.collector?.phone || pickup.collectorPhone,
              collectorCompany: payload.collector?.company || pickup.collectorCompany,
            };
          }

          return pickup;
        }));
      };

      const handleLocationUpdate = (payload) => {
        if (!payload?.requestId || !payload?.collectorLocation) {
          return;
        }

        setPickups((current) => current.map((pickup) => {
          if (pickup._id !== payload.requestId) {
            return pickup;
          }

          const existingCollector = pickup.collectorId && typeof pickup.collectorId === 'object' ? pickup.collectorId : null;
          const mergedCollector = payload.collector ? {
            ...(existingCollector || {}),
            ...payload.collector,
            location: {
              lat: payload.collectorLocation.latitude,
              lng: payload.collectorLocation.longitude,
            },
          } : existingCollector;

          return {
            ...pickup,
              status: payload.status || pickup.status,
              collectorLocation: payload.collectorLocation,
              route: payload.route || pickup.route || null,
              routeDuration: payload.routeDuration || pickup.routeDuration || null,
            collector: mergedCollector || pickup.collector || null,
            collectorId: mergedCollector || pickup.collectorId,
            collectorName: payload.collector?.name || pickup.collectorName,
            collectorPhone: payload.collector?.phone || pickup.collectorPhone,
            collectorCompany: payload.collector?.company || pickup.collectorCompany,
          };
        }));
      };

      const handleCollectorArrived = (payload) => {
        if (!payload?.requestId) {
          return;
        }

        setPickups((current) => current.map((pickup) => (
          pickup._id === payload.requestId
            ? { ...pickup, status: 'arrived' }
            : pickup
        )));
      };

      const handlePaymentCompleted = (payload) => {
        if (!payload?.requestId) {
          return;
        }

        setPickups((current) => current.map((pickup) => (
          pickup._id === payload.requestId
            ? { ...pickup, status: 'completed' }
            : pickup
        )));

        navigation.navigate('PaymentConfirmation', {
          finalAmount: payload.finalAmount,
          weight: payload.weight,
          ecoPointsEarned: payload.ecoPointsEarned,
        });
      };

      socket.on('pickup_created', handleCreated);
      socket.on('pickup_accepted', handleAccepted);
      socket.on('pickup_status_changed', handleStatusChanged);
      socket.on('pickup_location_updated', handleLocationUpdate);
      socket.on('collector_arrived', handleCollectorArrived);
      socket.on('payment_completed', handlePaymentCompleted);

      return () => {
        socket.off('pickup_created', handleCreated);
        socket.off('pickup_accepted', handleAccepted);
        socket.off('pickup_status_changed', handleStatusChanged);
        socket.off('pickup_location_updated', handleLocationUpdate);
        socket.off('collector_arrived', handleCollectorArrived);
        socket.off('payment_completed', handlePaymentCompleted);
      };
    };

    attachSocket();

    return () => {
      mounted = false;
      disconnectPickupSocket();
    };
  }, []);

  const totalPending = useMemo(() => visiblePickups.filter((pickup) => pickup.status === 'pending').length, [visiblePickups]);

  const handleCancel = async (pickupId) => {
    try {
      await endpoints.cancelPickup(pickupId);
      setPickups((current) => current.map((pickup) => (pickup._id === pickupId ? { ...pickup, status: 'cancelled' } : pickup)));
    } catch (error) {
      Alert.alert('Cancel failed', error?.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Pickups</Text>
          <Text style={styles.subtitle}>{totalPending} pickup{totalPending === 1 ? '' : 's'} waiting</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={loadPickups}>
          <Text style={styles.refreshButtonText}>↻ Refresh</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPickups} tintColor={PRIMARY_GREEN} />}
      >
        {visiblePickups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No pickups yet</Text>
            <Text style={styles.emptyCopy}>Capture a photo and request a pickup to see it here.</Text>
            <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('UserTabs', { screen: 'Call' })}>
              <Text style={styles.emptyButtonText}>Go to call pickup</Text>
            </Pressable>
          </View>
        ) : null}

        {visiblePickups.map((pickup) => {
          const status = statusMeta(pickup.status);

          return (
            <View key={pickup._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeWrap}>
                  <Text style={[styles.badgeText, { color: status.color, backgroundColor: status.bg }]}>{status.label}</Text>
                </View>
                <Text style={styles.timeAgo}>{timeAgo(pickup.createdAt)}</Text>
              </View>

              <View style={styles.chipRow}>
                {(pickup.scrapTypes || []).map((item) => (
                  <View key={`${pickup._id}-${item.category}`} style={styles.chip}>
                    <Text style={styles.chipText}>{item.icon} {item.category}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.addressLabel}>Pickup location</Text>
              <Text style={styles.addressText}>{pickup.location?.address || 'Address unavailable'}</Text>

              <Text style={styles.noteLabel}>Collector note</Text>
              <Text style={styles.noteText}>{pickup.note || 'No note added.'}</Text>

              {(pickup.status === 'accepted' || pickup.status === 'arrived') && (pickup.collectorLocation || pickup.collectorId?.location) ? (
                <PickupRoutePreview pickup={pickup} />
              ) : null}

              {pickup.status === 'arrived' ? (
                <View style={styles.arrivedActions}>
                  <Pressable
                    style={styles.qrActionButton}
                    onPress={() => navigation.navigate('UserPayment', { request: pickup })}
                  >
                    <Text style={styles.qrActionText}>📱 Give QR</Text>
                  </Pressable>

                  <Pressable
                    style={styles.cashActionButton}
                    onPress={() => Alert.alert('Cash payment', 'Cash payment is not available in this flow yet.')}
                  >
                    <Text style={styles.cashActionText}>💵 Cash</Text>
                  </Pressable>
                </View>
              ) : null}

              {pickup.status === 'pending' ? (
                <Pressable style={styles.cancelButton} onPress={() => handleCancel(pickup._id)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#102313',
  },
  subtitle: {
    marginTop: 4,
    color: '#5C6C5D',
  },
  refreshButton: {
    backgroundColor: '#EAF2EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102313',
    marginTop: 8,
  },
  emptyCopy: {
    textAlign: 'center',
    color: '#5C6C5D',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  badgeWrap: {
    flex: 1,
  },
  badgeText: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
  },
  timeAgo: {
    color: '#5C6C5D',
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    backgroundColor: '#EAF6EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#12361B',
    fontWeight: '700',
  },
  addressLabel: {
    marginTop: 14,
    fontWeight: '800',
    color: '#102313',
  },
  addressText: {
    marginTop: 4,
    color: '#4F6454',
    lineHeight: 20,
  },
  noteLabel: {
    marginTop: 12,
    fontWeight: '800',
    color: '#102313',
  },
  noteText: {
    marginTop: 4,
    color: '#4F6454',
    lineHeight: 20,
  },
  liveTrackCard: {
    marginTop: 14,
    backgroundColor: '#F2F8F2',
    borderRadius: 18,
    padding: 12,
  },
  liveTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  liveTrackTitle: {
    fontWeight: '800',
    color: '#102313',
  },
  liveTrackEta: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  liveMapWrap: {
    overflow: 'hidden',
    borderRadius: 14,
  },
  liveMap: {
    height: 180,
  },
  collectorInfoCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
  },
  collectorInfoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorInfoCopy: {
    flex: 1,
  },
  collectorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102313',
  },
  collectorCompany: {
    marginTop: 2,
    color: '#5C6C5D',
    fontWeight: '600',
  },
  collectorEtaChip: {
    backgroundColor: '#EAF6EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  collectorEtaChipText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  collectorMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  collectorMetaItem: {
    flex: 1,
    backgroundColor: '#F7FAF7',
    borderRadius: 14,
    padding: 12,
  },
  collectorMetaLabel: {
    color: '#6B7C6E',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  collectorMetaValue: {
    marginTop: 6,
    color: '#102313',
    fontWeight: '800',
  },
  collectorCallButton: {
    marginTop: 14,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  collectorCallButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  arrivedActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  qrActionButton: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  qrActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cashActionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cashActionText: {
    color: '#111827',
    fontWeight: '800',
  },
  cancelButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  cancelButtonText: {
    color: '#9F1239',
    fontWeight: '800',
  },
});
