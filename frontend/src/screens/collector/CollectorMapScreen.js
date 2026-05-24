import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';
import { colors } from '../../theme/tokens';

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

function Header({ onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.headerButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Navigate</Text>
      <View style={styles.headerButton} />
    </View>
  );
}

export function CollectorMapScreen({ navigation, route }) {
  const request = route?.params?.request || null;
  const mapRef = useRef(null);
  const initialCollectorCoord = normalizeCoord(request?.collectorLocation) || DEFAULT_COORD;
  const normalizedDestination = normalizeCoord(request?.location) || DEFAULT_COORD;

  const [collectorLocation, setCollectorLocation] = useState({
    latitude: initialCollectorCoord.latitude,
    longitude: initialCollectorCoord.longitude,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const destinationLocation = useMemo(() => normalizedDestination, [normalizedDestination]);

  useEffect(() => {
    let mounted = true;

    const loadRoadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${collectorLocation.longitude},${collectorLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`
        );

        const data = await response.json();
        const geometry = data?.routes?.[0]?.geometry?.coordinates || [];

        if (!mounted || geometry.length === 0) {
          return;
        }

        setRouteCoordinates(geometry.map(([longitude, latitude]) => ({ latitude, longitude })));
      } catch (error) {
        console.log('[collector-map] route load failed', error?.message || error);
        setRouteCoordinates([collectorLocation, destinationLocation]);
      }
    };

    loadRoadRoute();

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
        const current = { latitude, longitude };
        setCollectorLocation(current);

        // Server persists and broadcasts only after request is accepted; safe to emit here.
        socket.emit('pickup_location_update', {
          requestId: request._id,
          latitude,
          longitude,
        });
      };

      try {
        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

        if (mounted) {
          emitCollectorLocation(currentPosition.coords.latitude, currentPosition.coords.longitude);
        }
      } catch (error) {
        console.log('[collector-map] initial position failed', error?.message || error);
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
    if (!mapRef.current) {
      return;
    }

    const coords = routeCoordinates.length > 1 ? routeCoordinates : [collectorLocation, destinationLocation];
    const timer = setTimeout(() => {
      try {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 70, bottom: 100, left: 70 },
          animated: true,
        });
      } catch (error) {
        console.log('[collector-map] fit failed', error?.message || error);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [routeCoordinates, collectorLocation, destinationLocation]);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <Header onBack={() => navigation.goBack()} />

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.mapView}
          initialRegion={{
            latitude: collectorLocation.latitude,
            longitude: collectorLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
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

          {normalizeCoord(collectorLocation) ? (
            <Marker coordinate={collectorLocation} title="Collector" description="Live collector location" pinColor={colors.primary} />
          ) : null}
          {normalizeCoord(destinationLocation) ? (
            <Marker coordinate={destinationLocation} title={request?.userName || 'Pickup'} description={request?.location?.address || 'Pickup location'} pinColor="#D32F2F" />
          ) : null}

          <Polyline
            coordinates={routeCoordinates.length > 1 ? routeCoordinates : [collectorLocation, destinationLocation]}
            strokeColor={colors.primary}
            strokeWidth={5}
          />
        </MapView>
      </View>
    </SafeAreaView>
  );
}

export default CollectorMapScreen;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#f4f8f4',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
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
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  mapView: {
    flex: 1,
  },
});
