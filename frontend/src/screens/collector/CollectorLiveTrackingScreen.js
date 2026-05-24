import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/ui';
import { colors } from '../../theme/tokens';
import { CollectorBottomNav } from './Shared';
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';

const DEFAULT_COORD = { latitude: 27.7172, longitude: 85.324 };

function normalizeCoord(input) {
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
    .map((point) => normalizeCoord(point))
    .filter(Boolean);
}

function Header({ onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.headerButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Live Tracking</Text>
      <View style={styles.headerButton} />
    </View>
  );
}

function DonorMini({ request, onCall }) {
  const donorName = request?.userName || 'Pickup Donor';
  return (
    <GlassCard style={styles.donorCard}>
      <View style={styles.avatarCluster}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{String(donorName).split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.donorCopy}>
        <Text style={styles.donorName}>{donorName}</Text>
        <Text style={styles.donorSubtitle}>{request?.location?.address || 'Pickup location'}</Text>
      </View>

      <Pressable style={styles.callButton} onPress={onCall}>
        <MaterialCommunityIcons name="phone" size={22} color="#ffffff" />
      </Pressable>
    </GlassCard>
  );
}

export default function CollectorLiveTrackingScreen({ navigation, route }) {
  const request = route?.params?.request || null;
  const initialCollectorCoord = normalizeCoord(request?.collectorLocation) || DEFAULT_COORD;
  const normalizedDestination = normalizeCoord(request?.location) || DEFAULT_COORD;

  const [collectorLocation, setCollectorLocation] = useState({
    latitude: initialCollectorCoord.latitude,
    longitude: initialCollectorCoord.longitude,
  });
  const [routeCoords, setRouteCoords] = useState(() => sanitizeRouteCoordinates(request?.route));
  const mapRef = useRef(null);

  const destination = useMemo(() => normalizedDestination, [normalizedDestination]);

  const etaAndDistance = useMemo(() => {
    const toRad = (v) => (v * Math.PI) / 180;
    const earthRadius = 6371;
    const dLat = toRad(destination.latitude - collectorLocation.latitude);
    const dLng = toRad(destination.longitude - collectorLocation.longitude);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(collectorLocation.latitude))
      * Math.cos(toRad(destination.latitude))
      * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = earthRadius * c;
    const distanceMeters = Math.max(1, Math.round(distanceKm * 1000));
    const etaMinutes = Math.max(1, Math.round((distanceKm / 18) * 60));

    return { distanceMeters, etaMinutes };
  }, [collectorLocation, destination]);

  useEffect(() => {
    const nextCollectorCoord = normalizeCoord(request?.collectorLocation);
    if (nextCollectorCoord) {
      setCollectorLocation(nextCollectorCoord);
    }
  }, [request]);

  useEffect(() => {
    let mounted = true;

    const loadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${collectorLocation.longitude},${collectorLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        const geometry = data?.routes?.[0]?.geometry?.coordinates || [];

        if (!mounted || !Array.isArray(geometry) || geometry.length < 2) {
          return;
        }

        const nextRoute = sanitizeRouteCoordinates(geometry.map(([longitude, latitude]) => ({ latitude, longitude })));

        if (nextRoute.length > 1) {
          setRouteCoords(nextRoute);
        }
      } catch (error) {
        console.log('[collector-live] route load failed', error?.message || error);
      }
    };

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [collectorLocation.latitude, collectorLocation.longitude, destination.latitude, destination.longitude]);

  useEffect(() => {
    let watchSubscription = null;
    let mounted = true;

    const startTracking = async () => {
      if (!request?._id) {
        return;
      }

      const { status } = await import('expo-location').then((mod) => mod.requestForegroundPermissionsAsync());
      if (status !== 'granted' || !mounted) {
        return;
      }

      const socket = await connectPickupSocket();
      if (!socket || !mounted) {
        return;
      }

      const Location = await import('expo-location');

      const emitCollectorLocation = (latitude, longitude) => {
        const normalized = normalizeCoord({ latitude, longitude });
        if (!normalized) {
          return;
        }

        setCollectorLocation(normalized);
        socket.emit('pickup_location_update', {
          requestId: request._id,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
        });
      };

      try {
        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

        if (mounted) {
          emitCollectorLocation(currentPosition.coords.latitude, currentPosition.coords.longitude);
        }
      } catch (error) {
        console.log('[collector-live] initial position failed', error?.message || error);
      }

      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (position) => {
          emitCollectorLocation(position.coords.latitude, position.coords.longitude);
        }
      );
    };

    startTracking();

    return () => {
      mounted = false;
      if (watchSubscription) {
        watchSubscription.remove();
      }
      disconnectPickupSocket();
    };
  }, [request]);

  useEffect(() => {
    if (!mapRef.current || typeof mapRef.current.fitToCoordinates !== 'function') return;
    const coords = routeCoords.length > 1 ? routeCoords : [collectorLocation, destination];
    setTimeout(() => {
      try { mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 80, right: 60, bottom: 240, left: 60 }, animated: true }); } catch (e) {}
    }, 50);
  }, [routeCoords, collectorLocation, destination]);

  const handleCall = async () => {
    const phone = request?.userPhone || request?.phone;
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  };

  const handleArrived = async () => {
    try {
      if (!request?._id) {
        return;
      }

      await endpoints.arrivedPickup(request._id);
      navigation.navigate('CollectorPayment', { request: { ...request, status: 'arrived' } });
    } catch (error) {
      Alert.alert('Unable to mark arrival', error?.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header onBack={() => navigation.navigate('CollectorDashboard')} />

        <View style={styles.mapWrap}>
          <MapView ref={mapRef} style={styles.map} initialRegion={{ latitude: collectorLocation.latitude, longitude: collectorLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
            <UrlTile urlTemplate="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />

            {normalizeCoord(collectorLocation) ? <Marker coordinate={collectorLocation} title="Collector" /> : null}
            {normalizeCoord(destination) ? <Marker coordinate={destination} title={request?.userName || 'Pickup'} pinColor="#D32F2F" /> : null}

            { (routeCoords && routeCoords.length > 1) && (
              <Polyline coordinates={routeCoords} strokeColor={colors.primary} strokeWidth={5} />
            ) }
          </MapView>

          <View style={styles.topEtaWrap} pointerEvents="none">
            <View style={styles.topEtaCard}>
              <Text style={styles.topEtaSmall}>HEADING TO PICKUP</Text>
              <View style={styles.topEtaRow}>
                <Text style={styles.topEtaLarge}>ETA: {etaAndDistance.etaMinutes} mins</Text>
                <View style={styles.topEtaBadge}>
                  <Text style={styles.topEtaBadgeText}>{etaAndDistance.distanceMeters}m away</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <DonorMini request={request} onCall={handleCall} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{(request?.scrapTypes?.length) || 0} Items</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Estimated Earnings</Text>
            <Text style={styles.summaryValue}>{request?.offer?.amount ? `Rs ${request.offer.amount}` : 'Rs 0'}</Text>
          </View>
        </View>

        <Pressable style={styles.arrivedButton} onPress={handleArrived}>
          <Text style={styles.arrivedButtonText}>I've Arrived</Text>
        </Pressable>

      </ScrollView>

      <CollectorBottomNav navigation={navigation} activeRoute="CollectorRoutes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f4f8f4' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 130, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },
  mapWrap: { borderRadius: 18, overflow: 'hidden', height: 360, marginTop: 8 },
  map: { flex: 1 },
  topEtaWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  topEtaCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topEtaSmall: {
    color: '#2f6f0f',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  topEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topEtaLarge: {
    color: '#102313',
    fontWeight: '800',
    fontSize: 18,
  },
  topEtaBadge: {
    backgroundColor: '#d5efb3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topEtaBadgeText: {
    color: '#234f12',
    fontWeight: '700',
  },
  donorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 12, backgroundColor: '#fff', marginTop: 12 },
  avatarCluster: { width: 70, alignItems: 'center' },
  avatarOuter: { width: 58, height: 58, borderRadius: 29, padding: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#78d86a' },
  avatarInner: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: '#d5efb3', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  donorCopy: { flex: 1 },
  donorName: { fontSize: 17, fontWeight: '700', color: '#102313' },
  donorSubtitle: { marginTop: 4, fontSize: 13, color: '#5c6c5d' },
  callButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  summaryLabel: { fontSize: 12, color: '#5c6c5d' },
  summaryValue: { marginTop: 6, fontWeight: '800', color: '#102313' },
  arrivedButton: { marginTop: 16, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  arrivedButtonText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
