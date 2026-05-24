import React, { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/ui';
import { endpoints } from '../../api/client';
import { colors } from '../../theme/tokens';
import { formatNPR } from '../../utils/format';
import { CollectorBottomNav } from './Shared';

const MATERIAL_META = {
  Paper: { icon: 'newspaper-variant-outline', chip: '#EAF4C7', tone: '#64851B', subtitle: 'PAPER WASTE' },
  Plastic: { icon: 'recycle', chip: '#DFF4E5', tone: '#15803D', subtitle: 'RECYCLABLE PET' },
  'Soft Plastic': { icon: 'shopping-bag-outline', chip: '#D7F4F1', tone: '#0F766E', subtitle: 'SOFT PLASTIC' },
  'Hard Plastic': { icon: 'bottle-soda-outline', chip: '#DBEAFE', tone: '#1D4ED8', subtitle: 'HARD PLASTIC' },
  Aluminium: { icon: 'cup-outline', chip: '#E4F4C7', tone: '#4F7E1A', subtitle: 'METAL SCRAP' },
  Copper: { icon: 'nail', chip: '#FDE7C9', tone: '#B45309', subtitle: 'METAL SCRAP' },
  'Scrap Metal': { icon: 'hammer-screwdriver', chip: '#D7F4F1', tone: '#0F766E', subtitle: 'METAL SCRAP' },
  Glass: { icon: 'glass-fragile', chip: '#D7F4F9', tone: '#0891B2', subtitle: 'GLASS WASTE' },
};

function getInitials(name) {
  return String(name || 'RD')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getDistanceLabel(request) {
  return request?.distanceLabel || request?.distance || '850m away';
}

function buildMaterialRows(request) {
  const scrapTypes = request?.scrapTypes || [];
  const totalWeight = Number(request?.estimatedWeight?.value || scrapTypes.length || 0);
  const count = Math.max(1, scrapTypes.length);
  const fallbackRate = request?.offer?.ratePerKg || 25;

  return scrapTypes.slice(0, 3).map((item, index) => {
    const meta = MATERIAL_META[item.category] || {
      icon: 'recycle',
      chip: '#EAF6EB',
      tone: colors.primary,
      subtitle: item.category?.toUpperCase?.() || 'RECYCLABLE',
    };

    const allocatedWeight = count === 1
      ? totalWeight || 1
      : Math.max(1, Math.round((totalWeight || count) * ([0.45, 0.38, 0.17][index] || 1 / count)));

    return {
      id: `${request?._id || 'pickup'}-${item.category}-${index}`,
      title: `${allocatedWeight}kg ${item.category}`,
      subtitle: meta.subtitle,
      icon: meta.icon,
      tone: meta.tone,
      chip: meta.chip,
      amount: formatNPR(allocatedWeight * fallbackRate),
    };
  });
}

function Header({ onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.headerIconButton}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Pickup Details</Text>
      <Pressable hitSlop={12} style={styles.headerIconButton}>
        <MaterialCommunityIcons name="dots-vertical" size={26} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function DonorCard({ request, onCall }) {
  const donorName = request?.userName || 'Rahul S.';

  return (
    <GlassCard style={styles.donorCard}>
      <View style={styles.avatarCluster}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{getInitials(donorName)}</Text>
          </View>
        </View>
        <View style={styles.ratingPill}>
          <MaterialCommunityIcons name="star" size={10} color="#3d7009" />
          <Text style={styles.ratingText}>4.9</Text>
        </View>
      </View>

      <View style={styles.donorCopy}>
        <Text style={styles.donorName}>{donorName}</Text>
        <Text style={styles.donorSubtitle}>Verified Waste Donor</Text>
      </View>

      <Pressable style={styles.callButton} onPress={onCall} hitSlop={10}>
        <MaterialCommunityIcons name="phone" size={24} color="#2f6f0f" />
      </Pressable>
    </GlassCard>
  );
}

function MapPanel({ request, onNavigate }) {
  return (
    <GlassCard style={styles.mapCard}>
      <View style={styles.mapStrip}>
        <View style={[styles.mapSide, styles.mapSideLeft]}>
          <MaterialCommunityIcons name="heart-pulse" size={34} color="rgba(255,255,255,0.72)" />
        </View>

        <View style={styles.mapCenter}>
          <View style={styles.mapGrid} />
          <MaterialCommunityIcons name="map-marker" size={30} color={colors.primary} />

          <View style={styles.distancePill}>
            <MaterialCommunityIcons name="navigation-variant-outline" size={14} color={colors.primary} />
            <Text style={styles.distanceText}>{getDistanceLabel(request)}</Text>
          </View>
        </View>

        <View style={[styles.mapSide, styles.mapSideRight]}>
          <MaterialCommunityIcons name="heart-pulse" size={34} color="rgba(255,255,255,0.72)" />
        </View>
      </View>

      <View style={styles.pickupPointRow}>
        <View style={styles.pickupPointCopy}>
          <Text style={styles.pickupPointLabel}>PICKUP POINT</Text>
          <Text style={styles.pickupPointAddress}>{request?.location?.address || 'Pickup location unavailable'}</Text>
        </View>

        <Pressable style={styles.navigateButton} onPress={onNavigate}>
          <MaterialCommunityIcons name="navigation-variant-outline" size={18} color="#ffffff" />
          <Text style={styles.navigateButtonText}>NAVIGATE</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

function PhotoCard({ imageUrl }) {
  return (
    <GlassCard style={styles.photoCard}>
      <View style={styles.photoFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.photoImage} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={44} color={colors.primary} />
          </View>
        )}

        <View style={styles.aiBadge}>
          <MaterialCommunityIcons name="robot-outline" size={14} color="#ffffff" />
          <Text style={styles.aiBadgeText}>AI Scanned</Text>
        </View>

        <View style={styles.photoCaption}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#ffffff" />
          <Text style={styles.photoCaptionText}>User-provided verification photo</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function BreakdownCard({ request }) {
  const rows = buildMaterialRows(request);
  const itemCount = request?.scrapTypes?.length || rows.length || 0;
  const totalEstimate = request?.offer?.amount || 0;

  return (
    <GlassCard style={styles.breakdownCard}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownTitle}>Material Breakdown</Text>
        <Text style={styles.breakdownCount}>{itemCount} Items</Text>
      </View>

      <View style={styles.breakdownList}>
        {rows.length > 0 ? rows.map((row) => (
          <View key={row.id} style={styles.breakdownRow}>
            <View style={[styles.breakdownIcon, { backgroundColor: row.chip }]}>
              <MaterialCommunityIcons name={row.icon} size={20} color={row.tone} />
            </View>

            <View style={styles.breakdownCopy}>
              <Text style={styles.breakdownRowTitle}>{row.title}</Text>
              <Text style={styles.breakdownRowSubtitle}>{row.subtitle}</Text>
            </View>

            <Text style={styles.breakdownAmount}>{row.amount}</Text>
          </View>
        )) : (
          <Text style={styles.emptyBreakdownText}>No material breakdown available for this pickup.</Text>
        )}
      </View>

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalSubLabel}>Estimate</Text>
        </View>
        <View style={styles.totalCopyRight}>
          <Text style={styles.totalAmount}>{formatNPR(totalEstimate)}</Text>
          <Text style={styles.totalFootnote}>Final value after weighing</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export function CollectorActivePickupScreen({ navigation, route }) {
  const [busy, setBusy] = useState(false);
  const request = route?.params?.request || null;

  const callDonor = async () => {
    const phone = request?.userPhone || request?.phone;
    if (!phone) {
      return;
    }

    await Linking.openURL(`tel:${phone}`);
  };

  const navigateToPickup = async () => {
    navigation.navigate('CollectorRoutes', { request });
  };

  const acceptPickup = async () => {
    if (!request?._id || busy) {
      return;
    }

    setBusy(true);
    try {
      await endpoints.acceptPickup(request._id);
      navigation.navigate('CollectorRoutes', { request: { ...request, status: 'accepted' } });
    } finally {
      setBusy(false);
    }
  };

  const declinePickup = async () => {
    if (!request?._id || busy) {
      return;
    }

    setBusy(true);
    try {
      await endpoints.declinePickup(request._id);
      navigation.navigate('CollectorDashboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.shell}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header onBack={() => navigation.goBack()} />

        <DonorCard request={request} onCall={callDonor} />

        <MapPanel request={request} onNavigate={navigateToPickup} />

        <PhotoCard imageUrl={request?.imageUrl} />

        <BreakdownCard request={request} />

        <Pressable disabled={busy} onPress={acceptPickup} style={styles.primaryButtonWrap}>
          <LinearGradient colors={[colors.primary, '#0d7d34']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Accept & Start Route</Text>
          </LinearGradient>
        </Pressable>

        <Pressable disabled={busy} onPress={declinePickup} style={styles.secondaryButton}>
          <MaterialCommunityIcons name="close-circle-outline" size={22} color={colors.onSurface} />
          <Text style={styles.secondaryButtonText}>Decline</Text>
        </Pressable>
      </ScrollView>

      <CollectorBottomNav navigation={navigation} activeRoute="CollectorRequests" />
    </View>
  );
}

export default CollectorActivePickupScreen;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#f4f8f4',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 124,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  donorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    padding: 14,
  },
  avatarCluster: {
    width: 70,
    alignItems: 'center',
    gap: 6,
  },
  avatarOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#78d86a',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#d5efb3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d8f36c',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b6207',
  },
  donorCopy: {
    flex: 1,
  },
  donorName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  donorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.onSurface,
    opacity: 0.78,
    lineHeight: 18,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#c9eb5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    overflow: 'hidden',
    borderRadius: 24,
    padding: 0,
  },
  mapStrip: {
    flexDirection: 'row',
    height: 170,
  },
  mapSide: {
    flex: 1,
    backgroundColor: '#245d50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSideLeft: {
    borderTopLeftRadius: 24,
  },
  mapSideRight: {
    borderTopRightRadius: 24,
  },
  mapCenter: {
    flex: 1.2,
    backgroundColor: '#f1efe6',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderColor: '#f4f7f4',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  distancePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  distanceText: {
    fontSize: 13,
    color: '#3b7a13',
    fontWeight: '600',
  },
  pickupPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  pickupPointCopy: {
    flex: 1,
  },
  pickupPointLabel: {
    fontSize: 14,
    letterSpacing: 1.1,
    color: colors.onSurface,
    opacity: 0.82,
  },
  pickupPointAddress: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    lineHeight: 24,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  navigateButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  photoCard: {
    overflow: 'hidden',
    borderRadius: 24,
    padding: 0,
  },
  photoFrame: {
    height: 252,
    backgroundColor: '#d8e7d8',
    position: 'relative',
  },
  photoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.primary,
  },
  aiBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  photoCaption: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  photoCaptionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownCard: {
    borderRadius: 24,
    padding: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  breakdownCount: {
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.76,
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f7f9f6',
    borderRadius: 18,
    padding: 12,
  },
  breakdownIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownCopy: {
    flex: 1,
  },
  breakdownRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  breakdownRowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    letterSpacing: 0.3,
    color: colors.onSurface,
    opacity: 0.74,
  },
  breakdownAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyBreakdownText: {
    color: colors.onSurfaceVariant,
  },
  totalRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(17,28,45,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    color: colors.onSurface,
  },
  totalSubLabel: {
    marginTop: 2,
    fontSize: 14,
    color: colors.onSurface,
    opacity: 0.78,
  },
  totalCopyRight: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  totalFootnote: {
    marginTop: 6,
    fontSize: 13,
    color: colors.onSurface,
    opacity: 0.8,
    textAlign: 'right',
    maxWidth: 140,
  },
  primaryButtonWrap: {
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 28,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#c8d6c9',
    backgroundColor: '#f8fbf8',
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onSurface,
  },
});
