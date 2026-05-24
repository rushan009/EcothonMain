import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Badge,
  BottomNav,
  EmptyState,
  ErrorCard,
  GlassCard,
  GradientButton,
  GhostButton,
  Input,
  LoadingSkeleton,
  MapViewWrapper,
  OtpBoxes,
  ProgressBar,
  ScreenEnter,
} from '../components/ui';
import { endpoints, setAccessToken } from '../api/client';
import { connectPickupSocket, disconnectPickupSocket } from '../api/socket';
import { MOCK_COLLECTORS, MOCK_USER, SCRAP_RATES, USER_PICKUPS } from '../data/mockData';
import { useTranslation } from '../i18n/LanguageContext';
import { colors, spacing, typography } from '../theme/tokens';
import { formatKg, formatNPR, getTrendArrow } from '../utils/format';
import { clearAuthTokens, getRefreshToken } from '../features/auth/authStorage';
import { emitAuthLogout } from '../features/auth/authEvents';
import { logoutUser } from '../features/auth/authApi';

export function UserOnboardingScreen({ navigation }) {
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState(0);
  const slides = [
    { icon: '📷', title: language === 'np' ? 'फोहोर स्क्यान गर्नुहोस्' : 'Scan your waste' },
    { icon: '⚖️', title: language === 'np' ? 'ठीक मूल्य पाउनुहोस्' : 'Get a fair price' },
    { icon: '🚚', title: language === 'np' ? 'पिकअप सेड्युल गर्नुहोस्' : 'Schedule a pickup' },
  ];

  return (
    <LinearGradient colors={colors.gradientPrimary} style={styles.fullScreen}>
      <View style={styles.rowEnd}>
        <GhostButton label={`EN | ${language === 'np' ? 'नेपाली' : 'NP'}`} onPress={() => setLanguage(language === 'np' ? 'en' : 'np')} />
      </View>

      <View style={styles.centered}>
        <Text style={styles.onboardLogo}>♻️</Text>
        <Text style={styles.onboardTitle}>{t('appName')}</Text>
        <Text style={styles.onboardTagline}>{t('tagline')}</Text>
      </View>

      <GlassCard style={styles.onboardSlideCard}>
        <Text style={styles.slideIcon}>{slides[step].icon}</Text>
        <Text style={styles.slideTitle}>{slides[step].title}</Text>
        <View style={styles.dotRow}>
          {slides.map((_, idx) => (
            <View key={idx} style={[styles.dot, { opacity: idx === step ? 1 : 0.35 }]} />
          ))}
        </View>

        <View style={styles.rowGap}>
          <GradientButton label={t('getStarted')} onPress={() => navigation.navigate('UserLogin')} />
          <GhostButton label={language === 'np' ? 'अर्को स्लाइड' : 'Next Slide'} onPress={() => setStep((prev) => (prev + 1) % slides.length)} />
        </View>
      </GlassCard>
    </LinearGradient>
  );
}

export function UserLoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('9841234567');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await endpoints.sendOtp({ phone: `+977${phone}` });
    } catch (_err) {
      setError('network');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await endpoints.verifyOtp({ phone: `+977${phone}`, otp });
      navigation.replace('UserApp');
    } catch (_err) {
      if (otp.length === 6) {
        navigation.replace('UserApp');
      } else {
        setError('otp');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#dbfce7', '#ccfbf1']} style={styles.fullScreen}>
      <View style={styles.screenPadding}>
        <GlassCard style={styles.authCard}>
          <Text style={styles.sectionTitle}>{t('loginTitle')}</Text>
          <Input value={phone} onChangeText={setPhone} placeholder="9841234567" prefix="🇳🇵 +977" keyboardType="phone-pad" />
          <GradientButton label={t('sendOtp')} onPress={sendOtp} />
          <OtpBoxes value={otp} setValue={setOtp} />
          <GradientButton label={t('verifyOtp')} onPress={verifyOtp} disabled={loading} />
          <GhostButton label={t('resendOtp')} onPress={sendOtp} />
          {loading && <LoadingSkeleton lines={2} />}
          {error ? <ErrorCard onRetry={sendOtp} /> : null}
        </GlassCard>
      </View>
    </LinearGradient>
  );
}

export function UserHomeScreen({ navigation }) {
  const { language, t } = useTranslation();
  const handleSignOut = () => {
    const doLogout = async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          await logoutUser({ refreshToken });
        }
      } finally {
        await clearAuthTokens();
        setAccessToken(null);
        emitAuthLogout();
      }
    };

    doLogout();
  };

  return (
    <ScreenEnter>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.homeTopRow}>
          <View>
            <Text style={styles.greeting}>{language === 'np' ? 'नमस्ते, Priya! 👋' : 'Namaste, Priya! 👋'}</Text>
            <Text style={styles.subMuted}>{language === 'np' ? 'आजको वातावरणीय प्रभाव हेर्नुहोस्' : 'Track your impact today'}</Text>
          </View>
          <View style={styles.homeActions}>
            <GhostButton label="Sign Out" onPress={handleSignOut} />
            <Text style={styles.avatar}>👩</Text>
          </View>
        </View>

        <LinearGradient colors={['rgba(22,163,74,0.12)', 'rgba(13,148,136,0.12)']} style={styles.statsCard}>
          <Text style={styles.statsPill}>🌿 {formatKg(MOCK_USER.totalKgRecycled)} | 🌳 {MOCK_USER.treesEquivalent} | ⭐ {MOCK_USER.ecoPoints} pts</Text>
        </LinearGradient>

        <View style={styles.actionGrid}>
          <ActionTile icon="🔍" title={language === 'np' ? 'स्क्यान' : 'Scan Waste'} onPress={() => navigation.navigate('WasteScanner')} color="#006B2C" />
          <ActionTile icon="📅" title={t('schedulePickup')} onPress={() => navigation.navigate('PickupBooking')} color="#006A61" />
          <ActionTile icon="💰" title={t('scrapPrices')} onPress={() => navigation.navigate('ScrapPrices')} color="#3F6700" />
          <ActionTile icon="🏆" title={t('myRewards')} onPress={() => navigation.navigate('Rewards')} color="#7f6a00" />
        </View>

        <SectionTitle text={language === 'np' ? 'हालको गतिविधि' : 'Recent Activity'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGap}>
          {USER_PICKUPS.map((pickup) => (
            <GlassCard key={pickup.id} style={styles.recentCard}>
              <Text style={styles.recentTitle}>{pickup.items}</Text>
              <Text style={styles.subMuted}>{pickup.collector}</Text>
              <Text style={styles.subMuted}>{formatNPR(pickup.amount)}</Text>
              <Badge label={pickup.status.toUpperCase()} tone={pickup.status === 'completed' ? 'success' : 'default'} />
            </GlassCard>
          ))}
        </ScrollView>

        <SectionTitle text={language === 'np' ? 'लाइभ दर' : 'Live Scrap Rates'} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.ticker}>
            {SCRAP_RATES.map((rate) => (
              <Text key={rate.id} style={styles.tickerText}>{rate.icon} {language === 'np' ? rate.nameNp : rate.name}: {formatNPR(rate.rate)}/{rate.unit} | </Text>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </ScreenEnter>
  );
}

export function WasteScannerScreen({ navigation }) {
  const { language } = useTranslation();
  const [captured, setCaptured] = useState(false);
  const [weight, setWeight] = useState(2);
  const [loading, setLoading] = useState(false);

  const estimate = useMemo(() => weight * 30, [weight]);

  const analyze = async () => {
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await endpoints.scanWaste({ image: 'mock-base64' });
    } catch (_err) {
      // mocked state for MVP
    } finally {
      setTimeout(() => {
        setCaptured(true);
        setLoading(false);
      }, 350);
    }
  };

  return (
    <View style={styles.scannerRoot}>
      <MapViewWrapper label={language === 'np' ? 'क्यामेरा भ्यूफाइन्डर (MVP)' : 'Camera Viewfinder (MVP)'} height={340} />
      <GlassCard style={styles.scannerHintCard}>
        <Text style={styles.sectionBody}>{language === 'np' ? 'क्यामेरा फोहोरमा देखाउनुहोस्' : 'Point camera at your waste'}</Text>
      </GlassCard>
      {!captured ? (
        <GradientButton label={loading ? 'Analyzing...' : 'Capture Scan'} onPress={analyze} />
      ) : (
        <GlassCard style={styles.scanResultCard}>
          <Badge label={language === 'np' ? 'प्लास्टिक बोतल पत्ता लाग्यो' : 'Plastic Bottle Detected'} tone="success" />
          <Text style={styles.sectionBody}>92% confident</Text>
          <ProgressBar value={92} />

          <View style={styles.weightRow}>
            <GhostButton label="-" onPress={() => setWeight((v) => Math.max(0.5, v - 0.5))} />
            <Text style={styles.weightText}>{language === 'np' ? 'अनुमानित तौल' : 'Estimated Weight'}: {formatKg(weight)}</Text>
            <GhostButton label="+" onPress={() => setWeight((v) => Math.min(50, v + 0.5))} />
          </View>

          <Text style={styles.pricePreview}>{language === 'np' ? 'अनुमानित मूल्य' : 'Estimated Value'}: {formatNPR(estimate)}</Text>
          <Text style={styles.subMuted}>🌍 ~0.03 kg CO₂ avoided</Text>

          <GradientButton label={language === 'np' ? 'पिकअप सेड्युल' : 'Schedule Pickup'} onPress={() => navigation.navigate('PickupBooking')} />
          <GhostButton label={language === 'np' ? 'फेरि स्क्यान' : 'Scan Again'} onPress={() => setCaptured(false)} />
        </GlassCard>
      )}
    </View>
  );
}

export function PickupBookingScreen({ navigation }) {
  const { t } = useTranslation();
  const [slot, setSlot] = useState('asap');
  const collector = MOCK_COLLECTORS[0];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <SectionTitle text="Schedule Your Pickup" />
      <GlassCard style={styles.cardGap}>
        <Text style={styles.sectionBody}>🥤 Plastic | {formatKg(2)} | {formatNPR(60)}</Text>
      </GlassCard>

      <GlassCard style={styles.cardGap}>
        <MapViewWrapper label="Balaju, Kathmandu" height={130} />
        <GhostButton label="Use Current Location" onPress={() => {}} />
      </GlassCard>

      <View style={styles.rowGap}>
        <GhostButton label="ASAP" onPress={() => setSlot('asap')} style={slot === 'asap' ? styles.activeGhost : null} />
        <GhostButton label="Schedule Later" onPress={() => setSlot('later')} style={slot === 'later' ? styles.activeGhost : null} />
      </View>

      <GlassCard style={styles.cardGap}>
        <Text style={styles.sectionBody}>Nearest Collector: {collector.name} ⭐{collector.rating} | {collector.distance} km | ETA {collector.eta} min</Text>
        <Badge label={t('available')} tone="success" />
      </GlassCard>

      <GradientButton label={t('confirmPickup')} onPress={() => navigation.navigate('LiveTracking')} />
    </ScrollView>
  );
}

export function LiveTrackingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const states = ['Confirmed', 'En Route', 'Arrived', 'Collected'];
  const [collectorLocation, setCollectorLocation] = useState({ latitude: 27.7172, longitude: 85.324 });
  const requestId = null;

  useEffect(() => {
    const timer = setInterval(() => setStep((prev) => (prev < 4 ? prev + 1 : prev)), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const attachSocket = async () => {
      const socket = await connectPickupSocket();

      if (!socket || !mounted) {
        return;
      }

      const handleLocationUpdate = (payload) => {
        if (!payload?.collectorLocation) {
          return;
        }

        setCollectorLocation({
          latitude: payload.collectorLocation.latitude,
          longitude: payload.collectorLocation.longitude,
        });
      };

      socket.on('pickup_location_updated', handleLocationUpdate);

      return () => {
        socket.off('pickup_location_updated', handleLocationUpdate);
      };
    };

    attachSocket();

    return () => {
      mounted = false;
      disconnectPickupSocket();
    };
  }, []);

  return (
    <View style={styles.pageFlex}>
      <GlassCard style={styles.liveMapCard}>
        <MapView
          style={styles.liveMapView}
          mapType="none"
          initialRegion={{
            latitude: 27.7172,
            longitude: 85.324,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          <Marker
            coordinate={{ latitude: collectorLocation.latitude, longitude: collectorLocation.longitude }}
            title="Collector"
            description="Live collector location"
          />
        </MapView>
      </GlassCard>
      <GlassCard style={styles.overlayCard}>
        <Text style={styles.sectionBody}>🚴 Hari is on the way — ETA 8 min</Text>
        <View style={styles.stepperRow}>
          {states.map((item, index) => (
            <View key={item} style={styles.stepItem}>
              <View style={[styles.stepDot, index < step && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.rowGap}>
          <GhostButton label="📞 Call Hari" onPress={() => {}} />
          <GhostButton label="💬 Message" onPress={() => {}} />
        </View>
        <GradientButton label="Mark Collected" onPress={() => navigation.navigate('PickupComplete')} />
      </GlassCard>
    </View>
  );
}

export function PickupCompleteScreen({ navigation }) {
  const [points, setPoints] = useState(0);
  const confetti = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(confetti, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    const timer = setInterval(() => {
      setPoints((p) => {
        if (p >= 15) {
          clearInterval(timer);
          return 15;
        }
        return p + 1;
      });
    }, 70);
    return () => clearInterval(timer);
  }, [confetti]);

  return (
    <ScrollView contentContainerStyle={styles.pageCenter}>
      <Animated.Text style={[styles.successIcon, { transform: [{ scale: confetti.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>✅</Animated.Text>
      <Text style={styles.sectionTitle}>Pickup Completed</Text>
      <GlassCard style={styles.cardGap}>
        <Text style={styles.sectionBody}>Final weight: {formatKg(5.3)} Plastic</Text>
        <Text style={styles.sectionBody}>Amount paid: {formatNPR(165)}</Text>
        <Text style={styles.sectionBody}>🌿 You saved 0.25 kg CO₂ today</Text>
      </GlassCard>
      <GlassCard style={styles.cardGap}>
        <Text style={styles.sectionBody}>+{points} Green Points 🏅</Text>
        <Text style={styles.subMuted}>🏆 Plastic Pioneer badge unlocked!</Text>
      </GlassCard>
      <GradientButton label="Back to Home" onPress={() => navigation.popToTop()} />
    </ScrollView>
  );
}

export function RewardsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.scoreWrapOuter}>
        <LinearGradient colors={colors.gradientPrimary} style={styles.scoreWrapInner}>
          <Text style={styles.scoreValue}>320</Text>
          <Text style={styles.scoreLabel}>Eco Warrior Level 3</Text>
        </LinearGradient>
      </View>

      <View style={styles.rewardStatsRow}>
        <StatTile label="Total kg" value={formatKg(MOCK_USER.totalKgRecycled)} />
        <StatTile label="CO₂ Saved" value={`${MOCK_USER.co2Saved} kg`} />
        <StatTile label="Points" value={`${MOCK_USER.ecoPoints}`} />
      </View>

      <SectionTitle text="Badges" />
      <View style={styles.badgeGrid}>
        {['🌿 First Pickup', '🥤 Plastic Pioneer', '⚡ E-Waste Hero', '📦 Paper Champion'].map((badge) => (
          <GlassCard key={badge} style={styles.badgeCard}><Text style={styles.sectionBody}>{badge}</Text></GlassCard>
        ))}
      </View>

      <SectionTitle text="Monthly Chart" />
      <View style={styles.chartMockRow}>
        {[40, 55, 38, 64, 70, 58].map((bar, index) => <View key={index} style={[styles.monthBar, { height: bar }]} />)}
      </View>
    </ScrollView>
  );
}

export function UserProfileScreen() {
  const { language, setLanguage } = useTranslation();
  const menu = [
    'My Pickup History',
    'Saved Addresses',
    'Wallet / Transactions',
    'Refer a Friend',
    'Privacy & Security',
    'Help & Support',
    'Logout',
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <GlassCard style={styles.profileCard}>
        <Text style={styles.profileAvatar}>👩</Text>
        <Text style={styles.sectionTitle}>{MOCK_USER.name}</Text>
        <Text style={styles.subMuted}>{MOCK_USER.phone}</Text>
      </GlassCard>

      <GlassCard style={styles.cardGap}>
        <Text style={styles.sectionBody}>Total pickups: {MOCK_USER.pickupsCompleted}</Text>
        <Text style={styles.sectionBody}>Total earned: {formatNPR(4850)}</Text>
        <Text style={styles.sectionBody}>Member since: Jan 2026</Text>
      </GlassCard>

      <GlassCard style={styles.cardGap}>
        {menu.map((item) => (
          <View key={item} style={styles.menuRow}>
            <Text style={styles.sectionBody}>{item}</Text>
            <Text style={styles.subMuted}>›</Text>
          </View>
        ))}
      </GlassCard>

      <GhostButton label={`Language: ${language === 'np' ? 'नेपाली' : 'English'}`} onPress={() => setLanguage(language === 'np' ? 'en' : 'np')} />
    </ScrollView>
  );
}

export function PickupHistoryScreen() {
  const [filter, setFilter] = useState('all');

  const rows = USER_PICKUPS.filter((item) => (filter === 'all' ? true : item.status === filter));

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.rowGap}>
        {['all', 'pending', 'completed', 'cancelled'].map((tab) => (
          <GhostButton key={tab} label={tab.toUpperCase()} onPress={() => setFilter(tab)} style={filter === tab ? styles.activeGhost : null} />
        ))}
      </View>

      {!rows.length ? (
        <EmptyState title="No pickups for this filter" action={<GhostButton label="Reset Filter" onPress={() => setFilter('all')} />} />
      ) : (
        rows.map((row) => (
          <GlassCard key={row.id} style={styles.cardGap}>
            <Text style={styles.sectionBody}>{row.id} · {row.date}</Text>
            <Text style={styles.subMuted}>{row.collector} · {row.items}</Text>
            <Text style={styles.subMuted}>{formatKg(row.weight)} · {formatNPR(row.amount)}</Text>
            <Badge label={row.status.toUpperCase()} tone={row.status === 'completed' ? 'success' : 'default'} />
          </GlassCard>
        ))
      )}
    </ScrollView>
  );
}

export function ScrapPricesScreen() {
  const { language } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.subMuted}>Prices updated: Today, 8:00 AM</Text>
      {SCRAP_RATES.map((rate) => (
        <GlassCard key={rate.id} style={styles.rateRow}>
          <Text style={styles.sectionBody}>{rate.icon} {language === 'np' ? rate.nameNp : rate.name}</Text>
          <Text style={styles.rateValue}>{formatNPR(rate.rate)}/{rate.unit} {getTrendArrow(rate.trend)}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

function ActionTile({ icon, title, onPress, color }) {
  return (
    <LinearGradient colors={[`${color}d9`, `${color}b3`]} style={styles.tileGradient}>
      <GradientButton label={title} onPress={onPress} style={styles.tileButton} textStyle={styles.tileText} />
      <Text style={styles.tileIcon}>{icon}</Text>
    </LinearGradient>
  );
}

function SectionTitle({ text }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function StatTile({ label, value }) {
  return (
    <GlassCard style={styles.statTile}>
      <Text style={styles.subMuted}>{label}</Text>
      <Text style={styles.sectionBody}>{value}</Text>
    </GlassCard>
  );
}

export const userTabBar = (props) => <BottomNav {...props} />;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    padding: spacing.lg,
  },
  rowEnd: {
    marginTop: 42,
    alignItems: 'flex-end',
  },
  centered: {
    alignItems: 'center',
    marginTop: 24,
    gap: spacing.sm,
  },
  onboardLogo: {
    fontSize: 76,
  },
  onboardTitle: {
    color: '#FFFFFF',
    ...typography.headlineLg,
    fontWeight: '700',
  },
  onboardTagline: {
    color: '#DFFFEA',
    ...typography.bodyMd,
  },
  onboardSlideCard: {
    marginTop: 'auto',
    gap: spacing.md,
    marginBottom: 22,
  },
  slideIcon: {
    fontSize: 42,
    textAlign: 'center',
  },
  slideTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  rowGap: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  screenPadding: {
    flex: 1,
    justifyContent: 'center',
  },
  authCard: {
    gap: spacing.md,
  },
  page: {
    padding: spacing.md,
    gap: spacing.md,
  },
  homeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subMuted: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  avatar: {
    fontSize: 34,
  },
  statsCard: {
    borderRadius: 24,
    padding: spacing.md,
  },
  statsPill: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tileGradient: {
    width: '48%',
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  tileButton: {
    width: '100%',
  },
  tileText: {
    fontSize: 11,
  },
  tileIcon: {
    fontSize: 30,
  },
  horizontalGap: {
    gap: spacing.sm,
  },
  recentCard: {
    width: 190,
    gap: 6,
  },
  recentTitle: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  ticker: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tickerText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  scannerRoot: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  scannerHintCard: {
    paddingVertical: 10,
  },
  sectionBody: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  scanResultCard: {
    gap: spacing.sm,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  weightText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  pricePreview: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  cardGap: {
    gap: spacing.sm,
  },
  activeGhost: {
    backgroundColor: 'rgba(0,107,44,0.12)',
  },
  pageFlex: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  overlayCard: {
    gap: spacing.sm,
  },
  liveMapCard: {
    overflow: 'hidden',
    padding: 0,
    borderRadius: 24,
  },
  liveMapView: {
    height: 420,
  },
  stepperRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBD4C4',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  pageCenter: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    fontSize: 72,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  scoreWrapOuter: {
    alignItems: 'center',
    marginTop: 10,
  },
  scoreWrapInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scoreValue: {
    fontSize: 42,
    color: '#fff',
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#ecfffa',
    ...typography.labelMd,
  },
  rewardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  statTile: {
    flex: 1,
    gap: 6,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    width: '48%',
  },
  chartMockRow: {
    height: 140,
    borderRadius: 20,
    backgroundColor: 'rgba(236,253,245,0.7)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  monthBar: {
    flex: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: 'rgba(0,106,97,0.78)',
  },
  profileCard: {
    alignItems: 'center',
    gap: 6,
  },
  profileAvatar: {
    fontSize: 44,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,28,45,0.05)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateValue: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
});
