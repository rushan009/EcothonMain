import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { endpoints } from '../../api/client';

const PRIMARY_GREEN = '#2E7D32';
const LIGHT_GREEN = '#A5D6A7';
const BACKGROUND = '#F9F9F9';
const CARD_BG = '#FFFFFF';
const DEFAULT_CATEGORIES = [
  { category: 'Plastic', icon: '♻️' },
  { category: 'Paper', icon: '📄' },
];

const MANUAL_OPTIONS = [
  { category: 'Plastic', icon: '♻️' },
  { category: 'Paper', icon: '📄' },
  { category: 'Metal', icon: '🛠️' },
  { category: 'E-Waste', icon: '💻' },
  { category: 'Glass', icon: '🍶' },
];

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const detectedLabel = useMemo(() => {
    return detectedItems.length > 0 ? 'Detected items' : 'Ready to scan';
  }, [detectedItems]);

  const requestCameraAccess = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access so you can scan waste items.');
      return false;
    }

    return true;
  };

  const handleCapture = async () => {
    const allowed = await requestCameraAccess();

    if (!allowed) {
      return;
    }

    if (!cameraRef.current) {
      return;
    }

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true, skipProcessing: true });
      const response = await endpoints.classifyWaste({
        image: photo.base64,
        mimeType: photo.uri?.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });

      const results = Array.isArray(response.data?.results) && response.data.results.length > 0
        ? response.data.results
        : DEFAULT_CATEGORIES;

      setDetectedItems(results);
    } catch (error) {
      console.log('scan error', error);
      Alert.alert('Scan failed', 'We could not analyze that image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addCategory = (category) => {
    const nextItem = MANUAL_OPTIONS.find((option) => option.category === category);

    if (!nextItem) {
      return;
    }

    setDetectedItems((current) => {
      const exists = current.some((item) => item.category === nextItem.category);
      if (exists) {
        return current;
      }
      return [...current, nextItem];
    });
  };

  const handleRequestPickup = () => {
    if (detectedItems.length === 0) {
      Alert.alert('Add an item', 'Capture an item or choose a category before requesting pickup.');
      return;
    }

    navigation.navigate('RequestPickup', { scrapTypes: detectedItems });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingShell}>
        <ActivityIndicator color={PRIMARY_GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.cameraContainer}>
        {permission.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
        ) : (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBody}>Allow camera permission to scan your recyclables and request a pickup.</Text>
            <Pressable style={styles.permissionButton} onPress={requestCameraAccess}>
              <Text style={styles.permissionButtonText}>Allow access</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Align the waste in the green frame</Text>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{detectedLabel}</Text>
        </View>

        <View style={styles.shutterWrap}>
          <Pressable style={styles.shutterButton} onPress={handleCapture} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.shutterIcon}>📸</Text>
            )}
          </Pressable>
        </View>

        {isAnalyzing ? (
          <View style={styles.analyzingCard}>
            <ActivityIndicator color={PRIMARY_GREEN} />
            <Text style={styles.analyzingText}>Analyzing waste...</Text>
          </View>
        ) : null}
      </View>

      {detectedItems.length > 0 ? (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeaderRow}>
            <View>
              <Text style={styles.sheetTitle}>Detected scrap</Text>
              <Text style={styles.sheetSubtitle}>Tap a chip to confirm or add more items.</Text>
            </View>
            <Pressable style={styles.secondaryAction} onPress={() => setPickerOpen(true)}>
              <Text style={styles.secondaryActionText}>Looks wrong? Add manually</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {detectedItems.map((item) => (
              <View key={`${item.category}-${item.icon}`} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{item.icon} {item.category}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.primaryAction} onPress={handleRequestPickup}>
            <Text style={styles.primaryActionText}>Request Pickup →</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a category</Text>
            <Text style={styles.modalBody}>Choose the scrap type that best matches your waste.</Text>
            {MANUAL_OPTIONS.map((option) => (
              <Pressable
                key={option.category}
                style={styles.optionButton}
                onPress={() => {
                  addCategory(option.category);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.optionButtonText}>{option.icon} {option.category}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeButton} onPress={() => setPickerOpen(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: '#000000',
  },
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BACKGROUND,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: PRIMARY_GREEN,
    backgroundColor: 'transparent',
  },
  scanHint: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerBadge: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(46,125,50,0.94)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  shutterWrap: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
  },
  shutterButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: PRIMARY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: LIGHT_GREEN,
  },
  shutterIcon: {
    fontSize: 28,
  },
  analyzingCard: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  analyzingText: {
    color: '#102313',
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249,249,249,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102313',
  },
  sheetSubtitle: {
    color: '#4F6454',
    marginTop: 4,
  },
  secondaryAction: {
    backgroundColor: '#EAF6EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryActionText: {
    color: PRIMARY_GREEN,
    fontWeight: '700',
  },
  chipRow: {
    gap: 10,
    paddingBottom: 6,
  },
  categoryChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C4E4C7',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipText: {
    color: '#12361B',
    fontWeight: '700',
  },
  primaryAction: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  permissionCard: {
    flex: 1,
    backgroundColor: BACKGROUND,
    padding: 24,
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102313',
    marginBottom: 8,
  },
  permissionBody: {
    fontSize: 15,
    color: '#4F6454',
    lineHeight: 22,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 15, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102313',
  },
  modalBody: {
    marginTop: 6,
    marginBottom: 16,
    color: '#4F6454',
    lineHeight: 20,
  },
  optionButton: {
    backgroundColor: '#F3FBF4',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionButtonText: {
    color: '#102313',
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
});
