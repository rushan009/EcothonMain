import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { endpoints } from '../../api/client';

const PRIMARY_GREEN = '#2E7D32';
const LIGHT_GREEN = '#A5D6A7';
const BACKGROUND = '#F9F9F9';
const CARD_BG = '#FFFFFF';
const MANUAL_OPTIONS = [
  { category: 'Plastic', icon: '♻️' },
  { category: 'Paper', icon: '📄' },
  { category: 'Metal', icon: '🛠️' },
  { category: 'E-Waste', icon: '💻' },
  { category: 'Glass', icon: '🍶' },
];

function formatAddress(geocode) {
  if (!geocode) {
    return 'Current location';
  }

  const parts = [geocode.name, geocode.street, geocode.city, geocode.region, geocode.country].filter(Boolean);

  if (parts.length === 0) {
    return 'Current location';
  }

  return parts.join(', ');
}

export default function RequestPickupScreen({ navigation, route }) {
  const initialItems = Array.isArray(route?.params?.scrapTypes) ? route.params.scrapTypes : [];
  const [selectedItems, setSelectedItems] = useState(initialItems);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [note, setNote] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState({
    address: 'Detecting location...',
    lat: 27.7172,
    lng: 85.324,
  });
  const [draftLocation, setDraftLocation] = useState({
    lat: 27.7172,
    lng: 85.324,
  });

  useEffect(() => {
    let mounted = true;

    const loadLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (mounted) {
            setLocation({ address: 'Location permission not granted', lat: 27.7172, lng: 85.324 });
            setDraftLocation({ lat: 27.7172, lng: 85.324 });
            setIsLoadingLocation(false);
          }
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const geocode = await Location.reverseGeocodeAsync({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });

        const nextLocation = {
          address: formatAddress(geocode[0]),
          lat: currentPosition.coords.latitude,
          lng: currentPosition.coords.longitude,
        };

        if (mounted) {
          setLocation(nextLocation);
          setDraftLocation(nextLocation);
          setIsLoadingLocation(false);
        }
      } catch (error) {
        console.log('location error', error);
        if (mounted) {
          setLocation({ address: 'Unable to read current location', lat: 27.7172, lng: 85.324 });
          setDraftLocation({ lat: 27.7172, lng: 85.324 });
          setIsLoadingLocation(false);
        }
      }
    };

    loadLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const isReadyToOrder = useMemo(() => selectedItems.length > 0 && Boolean(location.address), [location.address, selectedItems.length]);

  const addCategory = (category) => {
    const selected = MANUAL_OPTIONS.find((option) => option.category === category);

    if (!selected) {
      return;
    }

    setSelectedItems((current) => {
      if (current.some((item) => item.category === selected.category)) {
        return current;
      }

      return [...current, selected];
    });
  };

  const removeCategory = (category) => {
    setSelectedItems((current) => current.filter((item) => item.category !== category));
  };

  const applyPickedLocation = async () => {
    const geocode = await Location.reverseGeocodeAsync({
      latitude: draftLocation.lat,
      longitude: draftLocation.lng,
    });

    setLocation({
      address: formatAddress(geocode[0]),
      lat: draftLocation.lat,
      lng: draftLocation.lng,
    });
    setMapVisible(false);
  };

  const handleSubmit = async () => {
    if (!isReadyToOrder) {
      Alert.alert('Missing details', 'Please add at least one scrap type and confirm your pickup location.');
      return;
    }

    setIsSubmitting(true);

    try {
      await endpoints.createPickup({
        scrapTypes: selectedItems.map((item) => ({ category: item.category, icon: item.icon })),
        location,
        note,
      });

      navigation.navigate('MyPickups');
    } catch (error) {
      Alert.alert('Unable to place pickup', error?.response?.data?.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.pageTitle}>Request Pickup</Text>
            <Text style={styles.pageSubtitle}>Keep your recyclables ready for pickup</Text>
          </View>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarText}>🌿</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Detected Items</Text>
          <Text style={styles.sectionHint}>Remove anything that looks wrong, or add more categories manually.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
            {selectedItems.map((item) => (
              <View key={`${item.category}-${item.icon}`} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{item.icon} {item.category}</Text>
                <Pressable onPress={() => removeCategory(item.category)}>
                  <Text style={styles.removeTagText}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addMoreButton} onPress={() => setPickerVisible(true)}>
              <Text style={styles.addMoreText}>+ Add More</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Pickup Location</Text>
              <Text style={styles.sectionHint}>We use your current GPS position by default.</Text>
            </View>
            <Pressable style={styles.changeButton} onPress={() => setMapVisible(true)}>
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
          </View>

          {isLoadingLocation ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={PRIMARY_GREEN} />
              <Text style={styles.loadingText}>Finding your location…</Text>
            </View>
          ) : (
            <View style={styles.locationCard}>
              <Text style={styles.locationTitle}>📍 Current address</Text>
              <Text style={styles.locationText}>{location.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Note for Collector</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="E.g. Call before arrival, items are at the gate..."
            placeholderTextColor="#6B7B6D"
            multiline
            numberOfLines={4}
            style={styles.noteInput}
            textAlignVertical="top"
          />
        </View>

        <Pressable style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>{isSubmitting ? 'Placing order…' : 'Place Order 🛵'}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionHeading}>Add category</Text>
            {MANUAL_OPTIONS.map((option) => (
              <Pressable
                key={option.category}
                style={styles.optionButton}
                onPress={() => {
                  addCategory(option.category);
                  setPickerVisible(false);
                }}
              >
                <Text style={styles.optionButtonText}>{option.icon} {option.category}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setPickerVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={mapVisible} transparent animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapOverlay}>
          <View style={styles.mapCard}>
            <View style={styles.mapHeaderRow}>
              <Text style={styles.sectionHeading}>Choose pickup spot</Text>
              <Pressable onPress={() => setMapVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
            <MapView
              style={styles.mapView}
              region={{
                latitude: draftLocation.lat,
                longitude: draftLocation.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onRegionChangeComplete={(region) => setDraftLocation({ lat: region.latitude, lng: region.longitude })}
            >
              <Marker
                coordinate={{ latitude: draftLocation.lat, longitude: draftLocation.lng }}
                draggable
                onDragEnd={(event) => setDraftLocation({
                  lat: event.nativeEvent.coordinate.latitude,
                  lng: event.nativeEvent.coordinate.longitude,
                })}
              />
            </MapView>
            <Pressable style={styles.primaryActionButton} onPress={applyPickedLocation}>
              <Text style={styles.primaryActionButtonText}>Use this location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: '#102313',
    fontWeight: '800',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102313',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#5C6C5D',
    marginTop: 4,
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIGHT_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102313',
  },
  sectionHint: {
    marginTop: 4,
    color: '#5C6C5D',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
  },
  tagChip: {
    backgroundColor: '#EAF6EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagChipText: {
    color: '#12361B',
    fontWeight: '700',
  },
  removeTagText: {
    color: '#9B1C1C',
    fontWeight: '800',
  },
  addMoreButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addMoreText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  changeButton: {
    backgroundColor: '#EAF2EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  changeButtonText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  loadingText: {
    color: '#4F6454',
  },
  locationCard: {
    backgroundColor: '#F6FBF7',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  locationTitle: {
    fontWeight: '800',
    color: '#102313',
    marginBottom: 6,
  },
  locationText: {
    color: '#4F6454',
    lineHeight: 20,
  },
  noteInput: {
    minHeight: 120,
    marginTop: 12,
    backgroundColor: '#F7FAF7',
    borderRadius: 16,
    padding: 14,
    color: '#102313',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 15, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 20,
  },
  optionButton: {
    backgroundColor: '#F4FBF5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  optionButtonText: {
    color: '#102313',
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 15, 0.45)',
    justifyContent: 'flex-end',
  },
  mapCard: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    height: '70%',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mapView: {
    flex: 1,
    borderRadius: 20,
  },
  primaryActionButton: {
    marginTop: 14,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
