import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../../components/ui';
import { COLLECTOR_REQUESTS } from '../../data/mockData';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { collectorAvatar, dashboardTasks, earningsBars, collections, bottomRoutes, collectorTabBar, CollectorTopBar, CollectorBottomNav, SummaryRow, styles } from './Shared';

export function CollectorProfileScreen({ navigation }) {
  return (
    <View style={styles.simplePage}>
      <Text style={styles.sectionTitle}>Collector Profile</Text>
      <Text style={styles.loginBody}>Profile and history are kept in the stack for completeness. The main collector flow now starts on the dashboard screen.</Text>
      <GhostButton label="Back to Dashboard" onPress={() => navigation.navigate('CollectorDashboard')} style={styles.fullWidthButton} />
    </View>
  );
}


export default CollectorProfileScreen;
