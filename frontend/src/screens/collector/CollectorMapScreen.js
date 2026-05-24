import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { GlassCard } from '../../components/ui';
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';
import { colors } from '../../theme/tokens';
import { CollectorBottomNav } from './Shared';

function Header({ onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.headerButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Routes</Text>
      <View style={styles.headerButton}>
        <MaterialCommunityIcons name="map-outline" size={24} color={colors.primary} />
      </View>
    </View>
  );
}

function RouteCard({ request, onStartRoute, onCall, busy }) {
  const donorName = request?.userName || 'Pickup Donor';
  const address = request?.location?.address || 'Pickup location unavailable';
  const estimate = request?.offer?.amount ? `Rs ${request.offer.amount}` : 'Offer pending';
  const collectorCompany = request?.collectorCompany || 'EcoSathi Collector Team';

  return (
    <GlassCard style={styles.routeCard}>
      <View style={styles.routeCardTop}>
        <View style={styles.donorBadge}>
          <Text style={styles.donorInitials}>{String(donorName).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.routeCopy}>
          <Text style={styles.routeName}>{donorName}</Text>
          <Text style={styles.routeMeta}>{address}</Text>
          <Text style={styles.routeCompany}>{collectorCompany}</Text>
        </View>
        <View style={styles.offerChip}>
          <Text style={styles.offerChipText}>{estimate}</Text>
        </View>
      </View>

      <View style={styles.routeActions}>
        <Pressable style={styles.routeActionSecondary} onPress={onCall}>
          <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
          <Text style={styles.routeActionSecondaryText}>Call</Text>
        </Pressable>
        <Pressable style={[styles.routeActionPrimary, busy && styles.routeActionPrimaryDisabled]} onPress={onStartRoute} disabled={busy}>
          <MaterialCommunityIcons name="navigation-variant-outline" size={20} color="#ffffff" />
          <Text style={styles.routeActionPrimaryText}>{busy ? 'Please wait' : 'Accept & Start Route'}</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

export function CollectorMapScreen({ navigation, route }) {
  const [busy, setBusy] = useState(false);
  const request = route?.params?.request || null;
  const [collectorLocation, setCollectorLocation] = useState({
    latitude: request?.collectorLocation?.latitude || 27.7172,
    longitude: request?.collectorLocation?.longitude || 85.324,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const destinationLocation = useMemo(() => ({
    latitude: request?.location?.lat || 27.7172,
    longitude: request?.location?.lng || 85.324,
  }), [request]);

  const routeRegion = useMemo(() => {
    const latitude = (collectorLocation.latitude + destinationLocation.latitude) / 2;
    const longitude = (collectorLocation.longitude + destinationLocation.longitude) / 2;
    const latitudeDelta = Math.max(Math.abs(collectorLocation.latitude - destinationLocation.latitude) * 1.8, 0.02);
    const longitudeDelta = Math.max(Math.abs(collectorLocation.longitude - destinationLocation.longitude) * 1.8, 0.02);

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }, [collectorLocation.latitude, collectorLocation.longitude, destinationLocation.latitude, destinationLocation.longitude]);

  useEffect(() => {
    let mounted = true;

    const loadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${collectorLocation.longitude},${collectorLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`
        );

        const data = await response.json();
        const geometry = data?.routes?.[0]?.geometry?.coordinates || [];

        if (!mounted || geometry.length === 0) {
          return;
        }

        setRouteCoordinates(
          geometry.map(([longitude, latitude]) => ({ latitude, longitude }))
        );
      } catch (error) {
        console.log('[collector-route] route load failed', error?.message || error);
      }
    };

    loadRoute();

    return () => {
      mounted = false;
    };
  }, [collectorLocation.latitude, collectorLocation.longitude, destinationLocation.latitude, destinationLocation.longitude]);

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
        setCollectorLocation({ latitude, longitude });
        socket.emit('pickup_location_update', {
          requestId: request._id,
          latitude,
          longitude,
        });
      };

      try {
        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          emitCollectorLocation(currentPosition.coords.latitude, currentPosition.coords.longitude);
        }
      } catch (error) {
        console.log('[collector-route] initial position failed', error?.message || error);
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

  const openNavigate = () => {
    navigation.navigate('CollectorActivePickup', { request });
  };

  const acceptAndNavigate = async () => {
    if (!request?._id || busy) {
      return;
    }

    if (request.status !== 'accepted') {
      setBusy(true);
      try {
        const response = await endpoints.acceptPickup(request._id);
        const pickup = response?.data?.pickup || request;
        navigation.navigate('CollectorRoutes', { request: { ...request, ...pickup, status: 'accepted' } });
        return;
      } finally {
        setBusy(false);
      }
    }

    openNavigate();
  };

  const openCall = async () => {
    const phone = request?.userPhone || request?.phone;

    if (!phone) {
      return;
    }

    await Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header onBack={() => navigation.goBack()} />

        <RouteCard request={request} onStartRoute={acceptAndNavigate} onCall={openCall} busy={busy} />

        <GlassCard style={styles.mapCard}>
          <View style={styles.mapLegendRow}>
            <Text style={styles.mapLegendTitle}>Live Route</Text>
            <Text style={styles.mapLegendSubTitle}>OpenStreetMap tiles, no billing required</Text>
          </View>

          <MapView
            style={styles.mapView}
            region={routeRegion}
            mapType="none"
            showsCompass={false}
            showsMyLocationButton={false}
            showsTraffic={false}
          >
            <UrlTile
              urlTemplate="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />

            <Marker
              coordinate={collectorLocation}
              title="Collector"
              description="Live collector location"
            />

            <Marker
              coordinate={destinationLocation}
              title={request?.userName || 'Pickup location'}
              description={request?.location?.address || 'Pickup location'}
            />

            <Polyline
              coordinates={routeCoordinates.length > 1 ? routeCoordinates : [collectorLocation, destinationLocation]}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          </MapView>

          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>This route screen can also mirror the collector's live location for the user tracking view.</Text>
          </View>
        </GlassCard>
      </ScrollView>

      <CollectorBottomNav navigation={navigation} activeRoute="CollectorRoutes" />
    </SafeAreaView>
  );
}


export default CollectorMapScreen;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#f4f8f4',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  routeCard: {
    borderRadius: 24,
    padding: 16,
  },
  routeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donorBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#d5efb3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  routeCopy: {
    flex: 1,
  },
  routeName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  routeMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.onSurface,
    opacity: 0.74,
  },
  offerChip: {
    backgroundColor: '#d8f36c',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  offerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b6207',
  },
  routeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  routeActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#c8d6c9',
    backgroundColor: '#f8fbf8',
  },
  routeActionSecondaryText: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  routeActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  routeActionPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mapCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 0,
  },
  mapLegendRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  mapLegendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  mapLegendSubTitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.onSurface,
    opacity: 0.72,
  },
  mapView: {
    height: 360,
  },
  mapFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mapFooterText: {
    fontSize: 13,
    color: colors.onSurface,
    opacity: 0.74,
    lineHeight: 18,
  },
});
