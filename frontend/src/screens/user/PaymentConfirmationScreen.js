import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';

export default function PaymentConfirmationScreen({ navigation, route }) {
  const { finalAmount = 0, weight = 0, ecoPointsEarned = 0 } = route?.params || {};
  const co2Saved = (Number(weight) * 0.5).toFixed(2);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="party-popper" size={40} color="#fff" />
        </View>

        <Text style={styles.title}>🎉 Payment Received!</Text>
        <Text style={styles.amount}>{formatNPR(finalAmount)}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📦 Weight Recycled</Text>
            <Text style={styles.infoValue}>{Number(weight).toFixed(1)} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌱 Eco Points Earned</Text>
            <Text style={styles.infoValue}>+{ecoPointsEarned}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌍 CO₂ Saved</Text>
            <Text style={styles.infoValue}>{co2Saved} kg</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.rateButton} onPress={() => {}}>
            <MaterialCommunityIcons name="star-outline" size={18} color="#fff" />
            <Text style={styles.rateButtonText}>⭐ Rate Collector</Text>
          </Pressable>

          <Pressable style={styles.homeButton} onPress={() => navigation.navigate('UserTabs')}>
            <MaterialCommunityIcons name="home-outline" size={18} color={colors.primary} />
            <Text style={styles.homeButtonText}>🏠 Go Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f4f8f4' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 80, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, fontSize: 26, fontWeight: '800', color: '#102313' },
  amount: { marginTop: 10, fontSize: 34, fontWeight: '900', color: colors.primary },
  infoCard: { width: '100%', marginTop: 26, backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF3EE' },
  infoLabel: { fontSize: 15, color: '#5C6C5D', fontWeight: '700' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#102313' },
  buttonRow: { width: '100%', marginTop: 24, gap: 12 },
  rateButton: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  rateButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeButton: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  homeButtonText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
});
