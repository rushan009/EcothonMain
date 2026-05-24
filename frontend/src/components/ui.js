import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import { colors, glass, radius, spacing, typography } from '../theme/tokens';
import { useTranslation } from '../i18n/LanguageContext';

export function GlassCard({ children, style }) {
  return (
    <BlurView intensity={25} tint="light" style={[styles.card, style]}>
      {children}
    </BlurView>
  );
}

export function GradientButton({ label, onPress, style, textStyle, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const handlePress = async () => {
    if (disabled) return;
    await Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        onPress={handlePress}
        disabled={disabled}
        style={styles.touchMin}
      >
        <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
          <Text style={[styles.primaryButtonText, textStyle]}>{label.toUpperCase()}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function GhostButton({ label, onPress, style }) {
  return (
    <Pressable style={[styles.ghostButton, styles.touchMin, style]} onPress={onPress}>
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Input({ value, onChangeText, placeholder, prefix, keyboardType = 'default', secureTextEntry = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrap, focused && styles.inputFocused]}>
      {prefix ? <Text style={styles.inputPrefix}>{prefix}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        placeholderTextColor={colors.onSurfaceVariant}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export function OtpBoxes({ value, setValue }) {
  const cells = Array.from({ length: 6 }, (_, i) => value[i] || '');
  return (
    <View style={styles.otpRow}>
      {cells.map((digit, index) => (
        <Pressable key={index} onPress={() => {}} style={styles.otpBox}>
          <Text style={styles.otpText}>{digit || '•'}</Text>
        </Pressable>
      ))}
      <TextInput
        value={value}
        onChangeText={(text) => setValue(text.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="number-pad"
        style={styles.hiddenInput}
      />
    </View>
  );
}

export function Badge({ label, tone = 'default' }) {
  const toneStyle = useMemo(() => {
    if (tone === 'success') return { backgroundColor: 'rgba(0,107,44,0.12)', color: colors.primary };
    if (tone === 'warning') return { backgroundColor: 'rgba(250,204,21,0.18)', color: '#915f00' };
    return { backgroundColor: 'rgba(0,106,97,0.12)', color: colors.secondary };
  }, [tone]);

  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: toneStyle.color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value }) {
  return (
    <View style={styles.progressTrack}>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, value))}%` }]}
      />
    </View>
  );
}

export function BottomNav({ state, descriptors, navigation }) {
  return (
    <BlurView intensity={28} tint="light" style={styles.bottomBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.tabItem, styles.touchMin]}
          >
            <Text style={styles.tabLabel}>{label}</Text>
            <View style={[styles.activeDot, { opacity: isFocused ? 1 : 0 }]} />
          </Pressable>
        );
      })}
    </BlurView>
  );
}

export function Sidebar({ items, active, onSelect }) {
  return (
    <BlurView intensity={24} tint="light" style={styles.sidebar}>
      <Text style={styles.sidebarLogo}>RecycleSathi</Text>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onSelect(item.key)}
          style={[styles.sidebarItem, active === item.key && styles.sidebarItemActive, styles.touchMin]}
        >
          <Text style={styles.sidebarIcon}>{item.icon}</Text>
          <Text style={styles.sidebarLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </BlurView>
  );
}

export function ChartMock({ bars = [40, 55, 70, 60, 78, 65] }) {
  return (
    <View style={styles.chartWrap}>
      {bars.map((item, index) => (
        <View key={index} style={[styles.chartBar, { height: `${item}%` }]} />
      ))}
    </View>
  );
}

export function MapViewWrapper({ label = 'Map preview', height = 220 }) {
  return (
    <LinearGradient colors={['#dcfce7', '#ccfbf1']} style={[styles.mapWrap, { height }]}>
      <Text style={styles.mapLabel}>🗺 {label}</Text>
      <Text style={styles.mapSubLabel}>Map integration wrapper (Google Maps / react-native-maps ready)</Text>
    </LinearGradient>
  );
}

export function LoadingSkeleton({ lines = 3 }) {
  return (
    <GlassCard style={styles.loadingCard}>
      {Array.from({ length: lines }).map((_, index) => (
        <View key={index} style={[styles.skeletonLine, { width: `${88 - index * 12}%` }]} />
      ))}
    </GlassCard>
  );
}

export function ErrorCard({ onRetry }) {
  const { t } = useTranslation();
  return (
    <GlassCard style={styles.stateCard}>
      <Text style={styles.stateEmoji}>😢</Text>
      <Text style={styles.stateText}>Oops! Something went wrong.</Text>
      <GhostButton label={t('tryAgain')} onPress={onRetry} />
    </GlassCard>
  );
}

export function EmptyState({ title, action }) {
  return (
    <GlassCard style={styles.stateCard}>
      <Text style={styles.stateEmoji}>🌿</Text>
      <Text style={styles.stateText}>{title}</Text>
      {action}
    </GlassCard>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (mounted) {
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      }
    };

    check();
    const timer = setInterval(check, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  if (online) return null;

  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>{t('offline')}</Text>
    </View>
  );
}

export function ScreenEnter({ children }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...glass.card,
    borderRadius: radius.card,
    padding: spacing.md,
    overflow: 'hidden',
  },
  touchMin: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: radius.chip,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonText: {
    color: colors.onPrimary,
    ...typography.labelSm,
  },
  ghostButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.chip,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  ghostButtonText: {
    color: colors.primary,
    ...typography.labelSm,
  },
  inputWrap: {
    width: '100%',
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputPrefix: {
    marginRight: 8,
    color: colors.onSurface,
    ...typography.labelMd,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    ...typography.bodyMd,
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: radius.otp,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpText: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  badge: {
    borderRadius: radius.chip,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...typography.labelSm,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: radius.chip,
    backgroundColor: '#D8E3FB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.chip,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: radius.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tabItem: {
    gap: 6,
  },
  tabLabel: {
    color: colors.onSurface,
    ...typography.labelSm,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sidebar: {
    width: 280,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    gap: 8,
  },
  sidebarLogo: {
    color: colors.onSurface,
    ...typography.headlineMd,
    marginBottom: 12,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'flex-start',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(0,107,44,0.10)',
  },
  sidebarIcon: {
    fontSize: 16,
  },
  sidebarLabel: {
    color: colors.onSurface,
    ...typography.labelMd,
  },
  chartWrap: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 16,
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 12,
    gap: 8,
  },
  chartBar: {
    flex: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: 'rgba(0,106,97,0.75)',
  },
  mapWrap: {
    borderRadius: radius.nested,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  mapLabel: {
    color: colors.onSurface,
    ...typography.headlineMd,
  },
  mapSubLabel: {
    color: colors.onSurfaceVariant,
    ...typography.bodyMd,
  },
  loadingCard: {
    gap: 12,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 8,
    backgroundColor: '#dce6ff',
  },
  stateCard: {
    alignItems: 'center',
    gap: 10,
  },
  stateEmoji: {
    fontSize: 36,
  },
  stateText: {
    color: colors.onSurface,
    ...typography.bodyMd,
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  offlineText: {
    color: '#4d3a02',
    fontWeight: '700',
    textAlign: 'center',
  },
});
