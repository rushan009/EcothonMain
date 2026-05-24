import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../../components/ui';
import { COLLECTOR_REQUESTS } from '../../data/mockData';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { collectorAvatar, dashboardTasks, earningsBars, collections, bottomRoutes, collectorTabBar, CollectorTopBar, CollectorBottomNav, SummaryRow, styles } from './Shared';

export function CollectorMapScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Request Map</Text>
      <Text style={styles.loginBody}>This screen is kept for navigation parity. The dashboard now matches the collector reference and is the default landing screen.</Text>
      <GhostButton label="Accept Selected Request" onPress={() => navigation.navigate('CollectorActivePickup')} style={styles.fullWidthButton} />
    </View>
  );
}


export default CollectorMapScreen;
