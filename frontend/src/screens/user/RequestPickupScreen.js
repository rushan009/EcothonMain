import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  { category: 'Soft Plastic', icon: '🛍️' },
  { category: 'Hard Plastic', icon: '🧴' },
  { category: 'Paper', icon: '📄' },
  { category: 'Aluminium', icon: '🔩' },
  { category: 'Copper', icon: '⚙️' },
  { category: 'Scrap Metal', icon: '🛠️' },
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

function normalizeScrapItems(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item) => item && typeof item.category === 'string' && item.category.trim().length > 0)
    .map((item) => ({
      category: item.category.trim(),
      icon: typeof item.icon === 'string' && item.icon.trim().length > 0 ? item.icon.trim() : '♻️',
    }))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.category === item.category) === index);
}

export default function RequestPickupScreen({ navigation, route }) {
  const uploadedImageUrl = route?.params?.imageUrl || null;

  const [selectedItems, setSelectedItems] = useState(() => normalizeScrapItems(route?.params?.scrapTypes));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [note, setNote] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

    const loadProfile = async () => {
      try {
        const response = await endpoints.getUserProfile();
        if (mounted && response?.data?.phone) {
          setPhoneNumber(response.data.phone);
        }
      } catch (error) {
        console.log('[pickup] profile load error', error?.message || error);
      }
    };

    loadProfile();

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

  const parsedWeight = Number(estimatedWeight);

  const isReadyToOrder = useMemo(() => (
    selectedItems.length > 0
    && Boolean(location.address)
    && Boolean(phoneNumber.trim())
    && Number.isFinite(parsedWeight)
    && parsedWeight > 0
  ), [location.address, parsedWeight, phoneNumber, selectedItems.length]);

  const addCategory = (category) => {
    const selected = MANUAL_OPTIONS.find((option) => option.category === category);

    if (!selected) {
      return;
    }

    setSelectedItems((current) => {
      const normalizedCurrent = normalizeScrapItems(current);
      if (normalizedCurrent.some((item) => item.category === selected.category)) {
        return normalizedCurrent;
      }

      return [...normalizedCurrent, { category: selected.category, icon: selected.icon }];
    });
  };

  const removeCategory = (category) => {
    setSelectedItems((current) => normalizeScrapItems(current).filter((item) => item.category !== category));
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
    if (!selectedItems.length) {
      Alert.alert('Missing details', 'Please add at least one scrap type before placing a pickup request.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Missing contact', 'Please add a phone number so the collector can reach you.');
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Missing details', 'Please enter a valid estimated weight in kilograms.');
      return;
    }

    if (!location.address) {
      Alert.alert('Missing details', 'Please confirm your pickup location before placing the request.');
      return;
    }

    if (!uploadedImageUrl) {
      Alert.alert('Missing image', 'Please capture a photo before placing the pickup request.');
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedItems = normalizeScrapItems(selectedItems);

      if (sanitizedItems.length === 0) {
        Alert.alert('Missing details', 'Please add at least one scrap type before placing a pickup request.');
        return;
      }

      await endpoints.createPickup({
        scrapTypes: sanitizedItems,
        location,
        phone: phoneNumber.trim(),
        estimatedWeight: {
          value: parsedWeight,
          unit: 'kg',
        },
        note,
        imageUrl: uploadedImageUrl,
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.log('[pickup] create error', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      Alert.alert('Unable to place pickup', error?.response?.data?.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMyPickups = () => {
    setShowSuccessModal(false);
    navigation.navigate('UserTabs', { screen: 'Pickup' });
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
          <Text style={styles.sectionHeading}>Contact Number</Text>
          <Text style={styles.sectionHint}>We prefill your saved phone number so collectors can reach you quickly.</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="98XXXXXXXX"
            placeholderTextColor="#6B7B6D"
            keyboardType="phone-pad"
            style={styles.inputField}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Estimated Weight</Text>
          <Text style={styles.sectionHint}>Tell us how much waste you want to schedule for pickup.</Text>
          <View style={styles.weightRow}>
            <TextInput
              value={estimatedWeight}
              onChangeText={setEstimatedWeight}
              placeholder="10"
              placeholderTextColor="#6B7B6D"
              keyboardType="decimal-pad"
              style={styles.weightInput}
            />
            <Text style={styles.weightUnit}>kg</Text>
          </View>
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

        {uploadedImageUrl ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Captured Photo</Text>
            <Image source={{ uri: uploadedImageUrl }} style={styles.previewImage} resizeMode="cover" />
          </View>
        ) : null}

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

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Pickup request placed</Text>
            <Text style={styles.successBody}>Your request is now waiting for a collector. You can track the status in My Pickups.</Text>
            <View style={styles.successActions}>
              <Pressable style={styles.successPrimaryButton} onPress={openMyPickups}>
                <Text style={styles.successPrimaryButtonText}>View My Pickups</Text>
              </Pressable>
              <Pressable style={styles.successSecondaryButton} onPress={() => setShowSuccessModal(false)}>
                <Text style={styles.successSecondaryButtonText}>Continue</Text>
              </Pressable>
            </View>
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
  inputField: {
    marginTop: 12,
    backgroundColor: '#F7FAF7',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#102313',
    fontSize: 15,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#F7FAF7',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#102313',
    fontSize: 15,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102313',
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
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginTop: 12,
    backgroundColor: '#EAF6EB',
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
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 15, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 32,
  },
  successTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#102313',
  },
  successBody: {
    marginTop: 10,
    textAlign: 'center',
    color: '#4F6454',
    lineHeight: 20,
  },
  successActions: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  successPrimaryButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  successPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  successSecondaryButton: {
    borderWidth: 1,
    borderColor: '#C9E2CE',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  successSecondaryButtonText: {
    color: '#102313',
    fontWeight: '800',
  },
});
