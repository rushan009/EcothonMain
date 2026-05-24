import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CollectorQRScanner from '../../components/collector/CollectorQRScanner';
import { GlassCard } from '../../components/ui';
import { colors } from '../../theme/tokens';
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';
import { formatNPR } from '../../utils/format';

function MaterialChip({ category, icon }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>{category}</Text>
    </View>
  );
}

function parseAmountFromPayload(payload) {
  if (!payload) {
    return null;
  }

  const directAmount = Number(payload.finalAmount);
  if (Number.isFinite(directAmount) && directAmount > 0) {
    return directAmount;
  }

  const paisaAmount = Number(payload.finalAmountPaisa);
  if (Number.isFinite(paisaAmount) && paisaAmount > 0) {
    return paisaAmount / 100;
  }

  return null;
}

function getRequestId(request) {
  const rawId = request?._id ?? request?.id ?? request?.requestId;
  if (!rawId) {
    return null;
  }

  return rawId.toString ? rawId.toString() : String(rawId);
}

export default function CollectorPaymentScreen({ navigation, route }) {
  const request = route?.params?.request || null;
  const requestId = getRequestId(request);
  const [finalAmount, setFinalAmount] = useState(() => {
    const nextAmount = parseAmountFromPayload(request);
    return nextAmount || null;
  });
  const [scannerVisible, setScannerVisible] = useState(false);

  const scrapTypes = useMemo(() => request?.scrapTypes || [], [request]);
  const waitingForWeight = !Number.isFinite(finalAmount) || finalAmount <= 0;

  useEffect(() => {
    const nextAmount = parseAmountFromPayload(request);
    if (nextAmount) {
      setFinalAmount(nextAmount);
    }
  }, [request?.finalAmount, request?.finalAmountPaisa, request?._id, request?.id]);

  useEffect(() => {
    let socket;
    let isMounted = true;

    async function setupSocket() {
      socket = await connectPickupSocket();
      if (!socket || !isMounted) return;

      const handleAmountPayload = (payload) => {
        if (!payload) {
          return;
        }

        const payloadRequestId = payload?.requestId || payload?._id || payload?.id;
        if (payloadRequestId && payloadRequestId !== requestId) {
          return;
        }

        const nextAmount = parseAmountFromPayload(payload);
        if (nextAmount) {
          setFinalAmount(nextAmount);
        }
      };

      socket.on('weight_set', handleAmountPayload);
      socket.on('pickup_status_changed', handleAmountPayload);

      return () => {
        socket.off('weight_set', handleAmountPayload);
        socket.off('pickup_status_changed', handleAmountPayload);
      };
    }

    const cleanupPromise = setupSocket();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
      disconnectPickupSocket();
    };
  }, [requestId]);

  const handleScanQR = () => {
    setScannerVisible(true);
  };

  const handleQRScanned = (data) => {
    setScannerVisible(false);
    if (!data) {
      Alert.alert('Unable to scan', 'The QR code could not be read. Please try again.');
      return;
    }
    Linking.openURL(data).catch(() => {
      Alert.alert('Error', 'Khalti app not found. Please install Khalti.');
    });
  };

  const handlePaymentDone = async () => {
    if (!request?._id) {
      return;
    }

    if (!finalAmount) {
      Alert.alert('Waiting for weight', 'Ask the user to generate the QR and enter the weight first.');
      return;
    }

    try {
      await endpoints.completePayment(request._id, { finalAmount });
      navigation.navigate('CollectorHome');
    } catch (error) {
      Alert.alert('Payment failed', error?.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.headerSpacer} />
        </View>

        <GlassCard style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="cash-register" size={28} color={colors.primary} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>💰 Payment</Text>
              <Text style={styles.heroSubtitle}>Complete the Khalti payment once the user generates the QR.</Text>
            </View>
          </View>

          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Scrap Collected</Text>
          </View>
          <View style={styles.chipRow}>
            {scrapTypes.length > 0 ? scrapTypes.map((item) => (
              <MaterialChip key={`${item.category}-${item.icon}`} category={item.category} icon={item.icon} />
            )) : (
              <Text style={styles.emptyText}>No scrap items captured.</Text>
            )}
          </View>

          <View style={styles.summaryPanel}>
            {waitingForWeight ? (
              <View>
                <Text style={styles.infoLabel}>Waiting for user to enter weight</Text>
                <Text style={styles.infoText}>Ask the user to open the QR flow and generate the payment code.</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.amountText}>{formatNPR(finalAmount)}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.primaryButton, waitingForWeight && styles.primaryButtonDisabled]}
              onPress={handleScanQR}
              disabled={waitingForWeight}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Scan QR Code</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, !finalAmount && styles.secondaryButtonDisabled]}
              onPress={handlePaymentDone}
              disabled={!finalAmount}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Payment Done</Text>
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>

      {scannerVisible && (
        <CollectorQRScanner
          onScanned={handleQRScanned}
          onCancel={() => setScannerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f4f8f4' },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 140 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.primary },
  headerSpacer: { width: 28 },
  heroCard: { borderRadius: 24, padding: 18, marginTop: 8 },
  heroHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F6E3', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#102313' },
  heroSubtitle: { color: '#5C6C5D', marginTop: 4, lineHeight: 20 },
  sectionTitleRow: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#102313' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF6EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipIcon: { fontSize: 16 },
  chipText: { fontWeight: '700', color: '#12361B' },
  summaryPanel: { marginTop: 18, backgroundColor: '#F8FBF8', borderRadius: 18, padding: 16 },
  infoLabel: { fontSize: 13, fontWeight: '800', color: '#5C6C5D', textTransform: 'uppercase' },
  infoText: { marginTop: 8, color: '#102313', lineHeight: 20 },
  amountText: { marginTop: 8, fontSize: 30, fontWeight: '900', color: '#102313' },
  actionRow: { marginTop: 20, gap: 12 },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderColor: '#D8E8D6', borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonDisabled: { opacity: 0.5 },
  secondaryButtonText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  emptyText: { color: '#5C6C5D' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  overlayDarken: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    height: 220,
    borderWidth: 3,
    borderColor: '#4ade80',
    borderRadius: 24,
  },
  scanText: { position: 'absolute', top: '22%', left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: '800', fontSize: 18 },
  cancelBtn: { position: 'absolute', top: 60, right: 22, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  cancelText: { color: '#111827', fontWeight: '800' },
  scannerHint: { position: 'absolute', bottom: 80, left: 20, right: 20, alignItems: 'center' },
  scannerHintText: { color: '#fff', fontWeight: '700' },
});
