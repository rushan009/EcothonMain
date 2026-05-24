import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, GlassCard, GhostButton, ScreenEnter } from '../../components/ui';
import { COLLECTOR_REQUESTS } from '../../data/mockData';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { collectorAvatar, dashboardTasks, earningsBars, collections, bottomRoutes, collectorTabBar, CollectorTopBar, CollectorBottomNav, SummaryRow, styles } from './Shared';

export function CollectorActivePickupScreen({ navigation }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <LinearGradient colors={['#f8fbf9', '#eef5ef', '#f7f9fb']} style={styles.screenBg}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <CollectorTopBar title="Task Details" showBack onBack={() => navigation.goBack()} />

            <View style={styles.mapHero}>
              <View style={styles.mapGrid} />
              <View style={styles.mapGlow} />
              <View style={styles.mapRoute} />
              <View style={styles.mapPin}>
                <MaterialCommunityIcons name="map-marker" size={28} color={colors.primary} />
              </View>
            </View>

            <View style={styles.floatingMapTools}>
              <Pressable style={styles.mapToolButton}>
                <MaterialCommunityIcons name="target" size={22} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.mapToolButton}>
                <MaterialCommunityIcons name="layers-outline" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <GlassCard style={styles.taskCard}>
              <View style={styles.taskHeaderRow}>
                <View>
                  <Text style={styles.sectionLabel}>Pick Up From</Text>
                  <Text style={styles.taskName}>Anish Prajapati</Text>
                  <View style={styles.inlineLocationRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.onSurfaceVariant} />
                    <Text style={styles.taskLocation}>Sector 4, Green Valley Estate</Text>
                  </View>
                </View>
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressText}>In Progress</Text>
                </View>
              </View>

              <View style={styles.actionGrid}>
                <Pressable style={styles.secondaryAction}>
                  <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>Call User</Text>
                </Pressable>
                <Pressable style={styles.primaryAction}>
                  <MaterialCommunityIcons name="navigation-variant-outline" size={20} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Navigate</Text>
                </Pressable>
              </View>
            </GlassCard>

            <GlassCard style={styles.summaryCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleSmall}>Waste Summary</Text>
                <View style={styles.estimateBadge}>
                  <Text style={styles.estimateText}>Estimated 12kg</Text>
                </View>
              </View>

              <View style={styles.summaryList}>
                <SummaryRow icon="file-document-outline" title="Paper & Cardboard" subtitle="Recyclable Grade A" value="5kg" tone={colors.secondary} valueTone={colors.secondary} />
                <SummaryRow icon="recycle" title="Plastic Bottles" subtitle="PET / HDPE Mixed" value="4kg" tone={colors.tertiary} valueTone={colors.tertiary} />
                <SummaryRow icon="factory" title="Metal Scraps" subtitle="Aluminum & Iron" value="3kg" tone={colors.error} valueTone={colors.error} />
              </View>
            </GlassCard>

            <GlassCard style={styles.notesCard}>
              <View style={styles.notesHeaderRow}>
                <MaterialCommunityIcons name="note-text-outline" size={22} color={colors.primary} />
                <Text style={styles.notesTitle}>User Notes</Text>
              </View>
              <Text style={styles.notesText}>"Please call before reaching. The gate code is 4421. The waste is sorted and packed in green bags."</Text>
            </GlassCard>
          </ScrollView>

          <View style={styles.bottomActionWrap}>
            <Pressable style={styles.completeButton} onPress={() => setShowModal(true)}>
              <MaterialCommunityIcons name="check-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.completeButtonText}>Verify & Complete</Text>
            </Pressable>
          </View>

          <CollectorBottomNav navigation={navigation} activeRoute="CollectorActivePickup" />
        </LinearGradient>
      </View>

      <Modal transparent visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalBody}>The pickup has been verified and the points are ready to credit to the collector wallet.</Text>
            <Pressable
              style={styles.primaryAction}
              onPress={() => {
                setShowModal(false);
                navigation.navigate('CollectorDashboard');
              }}
            >
              <Text style={styles.primaryActionText}>Return to Tasks</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}


export default CollectorActivePickupScreen;
