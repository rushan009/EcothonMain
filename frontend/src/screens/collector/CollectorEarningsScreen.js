import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../../components/ui';
import { COLLECTOR_REQUESTS } from '../../data/mockData';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { collectorAvatar, dashboardTasks, earningsBars, collections, bottomRoutes, collectorTabBar, CollectorTopBar, CollectorBottomNav, SummaryRow, styles } from './Shared';

export function CollectorEarningsScreen({ navigation }) {
  return (
    <ScreenEnter>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient colors={['#f8fbf9', '#eef5ef', '#f7f9fb']} style={styles.screenBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CollectorTopBar title="RecycleSathi" />

            <GlassCard style={styles.walletCard}>
              <Text style={styles.walletLabel}>Total Wallet Balance</Text>
              <Text style={styles.walletValue}>{formatNPR(12450)}<Text style={styles.walletDecimals}>.00</Text></Text>
              <View style={styles.walletSplitRow}>
                <View>
                  <Text style={styles.weekLabel}>This Week's Earnings</Text>
                  <Text style={styles.weekValue}>{formatNPR(4820)}</Text>
                </View>
                <View style={styles.trendPill}>
                  <MaterialCommunityIcons name="trending-up" size={18} color={colors.primary} />
                  <Text style={styles.trendText}>12% vs last week</Text>
                </View>
              </View>

              <View style={styles.chartWrap}>
                {earningsBars.map((bar, index) => (
                  <View key={`bar-${index}`} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${bar}%`, opacity: 0.35 + index * 0.08 }]} />
                    </View>
                    <Text style={[styles.barLabel, index === 2 && styles.barLabelActive]}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <Pressable style={styles.withdrawButton}>
              <MaterialCommunityIcons name="cash-multiple" size={22} color="#ffffff" />
              <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
            </Pressable>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Collections</Text>
              <Text style={styles.sectionMeta}>View All</Text>
            </View>

            <View style={styles.collectionList}>
              {collections.map((item) => (
                <GlassCard key={item.title} style={styles.collectionCard}>
                  <View style={[styles.collectionIcon, { backgroundColor: item.accent }]}>
                    <MaterialCommunityIcons name={item.title.includes('E-Waste') ? 'power-plug-outline' : item.title.includes('Paper') ? 'delete-sweep-outline' : 'recycle'} size={24} color={item.tone} />
                  </View>
                  <View style={styles.collectionCopy}>
                    <Text style={styles.collectionTitle}>{item.title}</Text>
                    <Text style={styles.collectionMeta}>{item.meta}</Text>
                  </View>
                  <View style={styles.collectionAmountBlock}>
                    <Text style={styles.collectionAmount}>{item.amount}</Text>
                    <Text style={[styles.collectionNote, { color: item.tone }]}>{item.note}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </ScrollView>

          <CollectorBottomNav navigation={navigation} activeRoute="CollectorEarnings" />
        </LinearGradient>
      </View>
    </ScreenEnter>
  );
}


export default CollectorEarningsScreen;
