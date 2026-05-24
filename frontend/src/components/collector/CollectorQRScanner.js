import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY_GREEN = '#2E7D32';
const OVERLAY_COLOR = 'rgba(0,0,0,0.6)';
const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;

export default function CollectorQRScanner({ onScanned, onCancel }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data, type }) => {
    if (scanned) return;
    setScanned(true);
    if (data && type === 'org.iso.QRCode') {
      Linking.openURL(data);
      if (onScanned) onScanned(data);
    }
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {/* Overlay */}
      <View style={styles.overlay} />
      {/* Scan Frame */}
      <View style={styles.frameContainer} pointerEvents="none">
        <View style={styles.frame} />
      </View>
      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Scan User's Khalti QR</Text>
      </View>
      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <MaterialCommunityIcons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY_COLOR,
    zIndex: 1,
  },
  frameContainer: {
    position: 'absolute',
    top: '30%',
    left: (width - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 4,
    borderColor: PRIMARY_GREEN,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  instructionContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: FRAME_SIZE + 32,
    zIndex: 3,
  },
  instructionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  cancelButton: {
    position: 'absolute',
    top: 48,
    right: 32,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
