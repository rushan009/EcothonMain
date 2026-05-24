import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../../components/ui';
import { COLLECTOR_REQUESTS } from '../../data/mockData';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { collectorAvatar, dashboardTasks, earningsBars, collections, bottomRoutes, collectorTabBar, CollectorTopBar, CollectorBottomNav, SummaryRow, styles } from './Shared';

export function CollectorConfirmCollectionScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Pickup Verified</Text>
      <Text style={styles.loginBody}>This route is preserved for backwards compatibility. Use the task-details screen to verify pickups and return to the dashboard.</Text>
      <GhostButton label="Go to Earnings" onPress={() => navigation.navigate('CollectorEarnings')} style={styles.fullWidthButton} />
    </View>
  );
}


export default CollectorConfirmCollectionScreen;
