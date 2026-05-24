import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { endpoints } from '../../api/client';

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

export default function CollectorHomeScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const response = await endpoints.getPendingNearby();
      setRequests(response.data?.pickups || []);
    } catch (error) {
      Alert.alert('Unable to load requests', error?.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const timer = setInterval(loadRequests, 15000);

    return () => clearInterval(timer);
  }, []);

  const acceptRequest = async (requestId) => {
    try {
      await endpoints.acceptPickup(requestId);
      setRequests((current) => current.filter((request) => request._id !== requestId));
    } catch (error) {
      Alert.alert('Could not accept request', error?.response?.data?.message || 'Please try again.');
    }
  };

  const declineRequest = (requestId) => {
    setRequests((current) => current.filter((request) => request._id !== requestId));
  };

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Collector Home</Text>
          <Text style={styles.subtitle}>Nearby pickup requests are shown below.</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>Live</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading nearby pickups…</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No pending pickups nearby. Check back soon 🌿</Text>
          </View>
        ) : null}

        {requests.map((request) => (
          <View key={request._id} style={styles.card}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.requestType}>Pickup request</Text>
                <Text style={styles.distance}>2.3 km away</Text>
              </View>
              <Text style={styles.timeAgo}>{timeAgo(request.createdAt)}</Text>
            </View>

            <View style={styles.chipRow}>
              {(request.scrapTypes || []).map((item) => (
                <View key={`${request._id}-${item.category}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item.icon} {item.category}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.noteLabel}>User note</Text>
            <Text style={styles.noteText}>{request.note || 'No note added.'}</Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.acceptButton} onPress={() => acceptRequest(request._id)}>
                <Text style={styles.acceptButtonText}>Accept</Text>
              </Pressable>
              <Pressable style={styles.declineButton} onPress={() => declineRequest(request._id)}>
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        ))}
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
    paddingTop: 14,
    paddingBottom: 10,
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
  statusPill: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusPillText: {
    color: PRIMARY_GREEN,
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4F6454',
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
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102313',
    textAlign: 'center',
    marginTop: 12,
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestType: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102313',
  },
  distance: {
    marginTop: 4,
    color: '#4F6454',
  },
  timeAgo: {
    color: '#5C6C5D',
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
  noteLabel: {
    marginTop: 14,
    fontWeight: '800',
    color: '#102313',
  },
  noteText: {
    marginTop: 4,
    color: '#4F6454',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F6FAF7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C9E2CE',
  },
  declineButtonText: {
    color: '#102313',
    fontWeight: '800',
  },
});
