import React, { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { GlassCard } from '../../components/ui';
import { colors } from '../../theme/tokens';
import { endpoints } from '../../api/client';
import { formatNPR } from '../../utils/format';

const RATE_PER_KG = 20;

function MaterialChip({ category, icon }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={styles.chipText}>{category}</Text>
    </View>
  );
}

export default function UserPaymentScreen({ navigation, route }) {
  const request = route?.params?.request || null;
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [qrValue, setQrValue] = useState(null);
  const [finalAmount, setFinalAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  const scrapTypes = useMemo(() => request?.scrapTypes || [], [request]);

  const previewAmount = useMemo(() => {
    const parsed = Number(weight);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }

    const weightInKg = weightUnit === 'gram' ? parsed / 1000 : parsed;
    return Math.round(weightInKg * RATE_PER_KG);
  }, [weight, weightUnit]);

  const handleGenerateQR = async () => {
    if (!request?._id) {
      return;
    }

    const parsed = Number(weight);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Weight required', 'Enter a valid weight before generating the QR.');
      return;
    }

    setLoading(true);

    try {
      const response = await endpoints.setPickupWeight(request._id, { weight: parsed, weightUnit });
      const payload = response?.data || {};
      setFinalAmount(Number(payload.finalAmount));
      setQrValue(payload.qrValue || null);
    } catch (error) {
      Alert.alert('Unable to generate QR', error?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetQR = () => {
    setQrValue(null);
    setFinalAmount(null);
  };

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>📱 Payment QR</Text>
          <View style={styles.headerSpacer} />
        </View>

        <GlassCard style={styles.heroCard}>
          <Text style={styles.sectionTitle}>Weight collected</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              keyboardType="decimal-pad"
              placeholder="Enter weight"
              value={weight}
              onChangeText={setWeight}
            />
            <View style={styles.unitSelector}>
              <Pressable
                style={[styles.unitOption, weightUnit === 'kg' && styles.unitOptionActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.unitOptionText, weightUnit === 'kg' && styles.unitOptionTextActive]}>kg</Text>
              </Pressable>
              <Pressable
                style={[styles.unitOption, weightUnit === 'gram' && styles.unitOptionActive]}
                onPress={() => setWeightUnit('gram')}
              >
                <Text style={[styles.unitOptionText, weightUnit === 'gram' && styles.unitOptionTextActive]}>gram</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Rate</Text>
              <Text style={styles.metaValue}>{formatNPR(RATE_PER_KG)}/kg</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Live Preview</Text>
              <Text style={styles.metaValue}>{formatNPR(previewAmount)}</Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            {scrapTypes.length > 0 ? scrapTypes.map((item) => (
              <MaterialChip key={`${item.category}-${item.icon}`} category={item.category} icon={item.icon} />
            )) : (
              <Text style={styles.emptyText}>No scrap types available.</Text>
            )}
          </View>

          <Pressable style={[styles.generateButton, loading && styles.generateButtonDisabled]} onPress={handleGenerateQR} disabled={loading}>
            <MaterialCommunityIcons name="qrcode" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>{loading ? 'Generating…' : 'Generate QR'}</Text>
          </Pressable>
        </GlassCard>

        {qrValue ? (
          <GlassCard style={styles.qrCard}>
            <Text style={styles.qrTitle}>QR Generated</Text>
            <Text style={styles.qrAmount}>{formatNPR(finalAmount)}</Text>
            <Text style={styles.qrHint}>Show this to collector</Text>
            <View style={styles.qrSvgWrap}>
              <QRCode value={qrValue} size={220} color="#111827" backgroundColor="#ffffff" />
            </View>
            <Pressable onPress={resetQR} style={styles.reenterButton}>
              <Text style={styles.reenterText}>Wrong weight? Re-enter ↩</Text>
            </Pressable>
          </GlassCard>
        ) : null}
      </ScrollView>
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
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#102313' },
  weightRow: { marginTop: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  weightInput: { flex: 1, backgroundColor: '#F8FBF8', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, fontSize: 18, color: '#111827' },
  unitSelector: { flexDirection: 'row', backgroundColor: '#EAF6EB', borderRadius: 999, padding: 4 },
  unitOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  unitOptionActive: { backgroundColor: '#2E7D32' },
  unitOptionText: { fontWeight: '800', color: '#12361B' },
  unitOptionTextActive: { color: '#fff' },
  metaRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: '#5C6C5D', textTransform: 'uppercase' },
  metaValue: { marginTop: 6, fontSize: 22, fontWeight: '800', color: '#102313' },
  chipRow: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF6EB', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipIcon: { fontSize: 16 },
  chipText: { fontWeight: '700', color: '#12361B' },
  generateButton: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  qrCard: { marginTop: 16, borderRadius: 24, padding: 18, alignItems: 'center' },
  qrTitle: { fontSize: 20, fontWeight: '800', color: '#102313' },
  qrAmount: { marginTop: 10, fontSize: 30, fontWeight: '900', color: '#102313' },
  qrHint: { marginTop: 8, color: '#5C6C5D', fontWeight: '700' },
  qrSvgWrap: { marginTop: 18, padding: 15, backgroundColor: '#ffffff', borderRadius: 18 },
  reenterButton: { marginTop: 16 },
  reenterText: { color: colors.primary, fontWeight: '800' },
  emptyText: { color: '#5C6C5D' },
});
