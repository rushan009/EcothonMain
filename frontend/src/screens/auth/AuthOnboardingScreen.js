import { StyleSheet, Text, View } from 'react-native';
import { AuthBackdrop } from '../../components/auth';
import { AuthOnboardingPager } from '../../components/auth/AuthOnboardingPager';
import { useTranslation } from '../../i18n/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

function SlideArt() {
  return (
    <LinearGradient colors={['#f4fff2', '#c9f2cc', '#98e7a5']} style={styles.slideArt}>
      <View style={styles.slideCircleOuter} />
      <View style={styles.slideCircleInner} />
      <View style={styles.phoneFrame} />
      <View style={styles.bottle} />
      <Text style={styles.scanCue}>⌁</Text>
    </LinearGradient>
  );
}

export default function AuthOnboardingScreen({ navigation, onBack, onComplete, onSkip }) {
  const { t } = useTranslation();

  const slides = [
    {
      key: 'scan',
      title: 'Scan & Sell Your Recyclables',
      body: 'Upload waste photos and get instant guidance on sorting, value, and pickup readiness.',
      art: <SlideArt />,
    },
    {
      key: 'pickup',
      title: 'Schedule Pickup Easily',
      body: 'Choose the collection slot that works for you and let nearby collectors handle the rest.',
      art: <SlideArt />,
    },
    {
      key: 'reward',
      title: 'Earn Rewards For Every Trip',
      body: 'Track your impact, build streaks, and turn clean waste into points and real value.',
      art: <SlideArt />,
    },
  ];

  return (
    <AuthBackdrop variant="soft">
      <AuthOnboardingPager
        title={t('appName')}
        subtitle={t('tagline')}
        slides={slides}
        onSkip={onSkip || (() => navigation.navigate('AuthLanding'))}
        onComplete={onComplete || (() => navigation.navigate('UserLogin'))}
        onBack={onBack || (() => navigation.navigate('AuthLanding'))}
      />
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  slideArt: {
    width: 252,
    height: 252,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideCircleOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.12)',
  },
  slideCircleInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.12)',
  },
  phoneFrame: {
    width: 106,
    height: 176,
    borderRadius: 28,
    borderWidth: 10,
    borderColor: '#1d2720',
    backgroundColor: '#10361f',
    transform: [{ rotate: '-4deg' }],
  },
  bottle: {
    position: 'absolute',
    width: 52,
    height: 126,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    transform: [{ rotate: '10deg' }],
  },
  scanCue: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    fontSize: 34,
    color: 'rgba(22,163,74,0.42)',
  },
});