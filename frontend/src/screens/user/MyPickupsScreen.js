import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { endpoints } from '../../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../../api/socket';

const PRIMARY_GREEN = '#2E7D32';
const LIGHT_GREEN = '#A5D6A7';
const BACKGROUND = '#F9F9F9';
const CARD_BG = '#FFFFFF';

function timeAgo(inputDate) {
  const diffMs = Date.now() - new Date(inputDate).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function statusMeta(status) {
  if (status === 'accepted') {
    return { label: '🟢 Confirmed', color: '#166534', bg: '#DCFCE7' };
  }

  if (status === 'completed') {
    return { label: '✅ Completed', color: '#14532D', bg: '#DCFCE7' };
  }

  if (status === 'cancelled') {
    return { label: '❌ Cancelled', color: '#7F1D1D', bg: '#FEE2E2' };
  }

  return { label: '🟡 Pending', color: '#854D0E', bg: '#FEF3C7' };
}

export default function MyPickupsScreen({ navigation }) {
  const [pickups, setPickups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPickups = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await endpoints.getMyPickups();
      setPickups(response.data?.pickups || []);
    } catch (error) {
      Alert.alert('Unable to load pickups', error?.response?.data?.message || 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPickups();
  }, [loadPickups]);

  useEffect(() => {
    let mounted = true;

    const attachSocket = async () => {
      const socket = await connectPickupSocket();

      if (!socket || !mounted) {
        return;
      }

      const handleAccepted = (payload) => {
        if (!payload?.requestId) {
          return;
        }

        setPickups((current) => current.map((pickup) => {
          if (pickup._id === payload.requestId) {
            return { ...pickup, status: payload.status || 'accepted' };
          }

          return pickup;
        }));
      };

      socket.on('pickup_accepted', handleAccepted);

      return () => {
        socket.off('pickup_accepted', handleAccepted);
      };
    };

    attachSocket();

    return () => {
      mounted = false;
      disconnectPickupSocket();
    };
  }, []);

  const totalPending = useMemo(() => pickups.filter((pickup) => pickup.status === 'pending').length, [pickups]);

  const handleCancel = async (pickupId) => {
    try {
      await endpoints.cancelPickup(pickupId);
      setPickups((current) => current.map((pickup) => {
        if (pickup._id === pickupId) {
          return { ...pickup, status: 'cancelled' };
        }
        return pickup;
      }));
    } catch (error) {
      Alert.alert('Cancel failed', error?.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Pickups</Text>
          <Text style={styles.subtitle}>{totalPending} pickup{totalPending === 1 ? '' : 's'} waiting</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={loadPickups}>
          <Text style={styles.refreshButtonText}>↻ Refresh</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPickups} tintColor={PRIMARY_GREEN} />}
      >
        {pickups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No pickups yet</Text>
            <Text style={styles.emptyCopy}>Scan your waste and request a pickup to see it here.</Text>
            <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('UserTabs', { screen: 'Scan' })}>
              <Text style={styles.emptyButtonText}>Go to scanner</Text>
            </Pressable>
          </View>
        ) : null}

        {pickups.map((pickup) => {
          const status = statusMeta(pickup.status);

          return (
            <View key={pickup._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeWrap}>
                  <Text style={[styles.badgeText, { color: status.color, backgroundColor: status.bg }]}>{status.label}</Text>
                </View>
                <Text style={styles.timeAgo}>{timeAgo(pickup.createdAt)}</Text>
              </View>

              <View style={styles.chipRow}>
                {(pickup.scrapTypes || []).map((item) => (
                  <View key={`${pickup._id}-${item.category}`} style={styles.chip}>
                    <Text style={styles.chipText}>{item.icon} {item.category}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.addressLabel}>Pickup location</Text>
              <Text style={styles.addressText}>{pickup.location?.address || 'Address unavailable'}</Text>

              <Text style={styles.noteLabel}>Collector note</Text>
              <Text style={styles.noteText}>{pickup.note || 'No note added.'}</Text>

              {pickup.status === 'pending' ? (
                <Pressable style={styles.cancelButton} onPress={() => handleCancel(pickup._id)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#102313',
  },
  subtitle: {
    marginTop: 4,
    color: '#5C6C5D',
  },
  refreshButton: {
    backgroundColor: '#EAF2EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyEmoji: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102313',
    marginTop: 8,
  },
  emptyCopy: {
    textAlign: 'center',
    color: '#5C6C5D',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  badgeWrap: {
    flex: 1,
  },
  badgeText: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '800',
  },
  timeAgo: {
    color: '#5C6C5D',
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    backgroundColor: '#EAF6EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#12361B',
    fontWeight: '700',
  },
  addressLabel: {
    marginTop: 14,
    fontWeight: '800',
    color: '#102313',
  },
  addressText: {
    marginTop: 4,
    color: '#4F6454',
    lineHeight: 20,
  },
  noteLabel: {
    marginTop: 12,
    fontWeight: '800',
    color: '#102313',
  },
  noteText: {
    marginTop: 4,
    color: '#4F6454',
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  cancelButtonText: {
    color: '#9F1239',
    fontWeight: '800',
  },
});
