import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { endpoints } from '../../api/client';

const PRIMARY_GREEN = '#2E7D32';
const LIGHT_GREEN = '#A5D6A7';
const BACKGROUND = '#F9F9F9';

const CARD_BG = '#FFFFFF';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

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

    if (!allowed || !cameraRef.current) {
      return;
    }

    try {
      setIsAnalyzing(true);

      const pickupsResponse = await endpoints.getMyPickups();
      const activePickup = (pickupsResponse.data?.pickups || []).some((pickup) => ['pending', 'accepted'].includes(pickup.status));

      if (activePickup) {
        Alert.alert(
          'One order at a time',
          'You already have an active pickup request. Please finish it before placing another order.',
          [
            { text: 'View pickups', onPress: () => navigation.navigate('Pickup') },
            { text: 'Cancel' },
          ],
        );
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error('Camera did not return an image uri');
      }

      const processedPhoto = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.75, format: SaveFormat.JPEG },
      );

      const formData = new FormData();
      formData.append('image', {
        uri: processedPhoto.uri,
        name: processedPhoto.uri.split('/').pop() || 'pickup-image.jpg',
        type: 'image/jpeg',
      });

      const uploadResponse = await endpoints.uploadPickupImage(formData);

      if (!uploadResponse.data?.imageUrl) {
        throw new Error('Upload did not return an image url');
      }

      navigation.navigate('RequestPickup', {
        imageUrl: uploadResponse.data.imageUrl,
        scrapTypes: [{ category: 'Paper', icon: '📄' }],
      });
    } catch (error) {
      console.log('[scan] capture error', error);
      Alert.alert('Unable to start pickup', 'We could not save the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
            <Text style={styles.permissionBody}>
              Allow camera permission to scan your recyclables and request a pickup.
            </Text>
            <Pressable style={styles.permissionButton} onPress={requestCameraAccess}>
              <Text style={styles.permissionButtonText}>Allow access</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Capture the waste photo to start a pickup request</Text>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Ready to call</Text>
        </View>

        <View style={styles.shutterWrap}>
          <Pressable style={styles.shutterButton} onPress={handleCapture} disabled={isAnalyzing}>
            {isAnalyzing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.shutterIcon}>📸</Text>}
          </Pressable>
        </View>

        {isAnalyzing ? (
          <View style={styles.analyzingCard}>
            <ActivityIndicator color={PRIMARY_GREEN} />
            <Text style={styles.analyzingText}>Saving photo...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Capture your waste photo</Text>
        <Text style={styles.helperBody}>After the photo is saved, you’ll land on the pickup form where you can confirm the details and place one order at a time.</Text>
      </View>
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
  helperCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 18,
    padding: 18,
    borderRadius: 24,
  },
  helperTitle: {
    color: '#102313',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  helperBody: {
    color: '#4F6454',
    fontSize: 14,
    lineHeight: 20,
  },
  resultCardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 24,
  },
  resultCard: {
    width: '92%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  resultIdentified: {
    color: PRIMARY_GREEN,
    fontWeight: '700',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  resultCategory: {
    fontSize: 28,
    fontWeight: '800',
    color: '#102313',
  },
  resultPriceBox: {
    backgroundColor: '#D1FF8A',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  resultPriceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3A6B0B',
    marginRight: 2,
  },
  resultPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3A6B0B',
  },
  resultStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 18,
  },
  resultStatBox: {
    backgroundColor: '#F3F7F0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  resultStatLabel: {
    color: '#4F6454',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  resultStatValue: {
    color: '#102313',
    fontWeight: '800',
    fontSize: 18,
  },
  resultPrimaryButton: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
    marginBottom: 8,
  },
  resultPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  resultConfidence: {
    color: '#4F6454',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
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
