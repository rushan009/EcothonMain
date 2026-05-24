import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRef, useState } from 'react';
import { GlassCard, GradientButton, GhostButton } from '../ui';
import { AuthHeroArt } from './AuthHeroArt';
import { colors, spacing, typography } from '../../theme/tokens';

export function AuthOnboardingPager({ slides, title, subtitle, onSkip, onComplete, onBack }) {
  const listRef = useRef(null);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const pageWidth = width - 32;

  const nextSlide = () => {
    if (activeIndex < slides.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      return;
    }

    onComplete?.();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.brand}>{title}</Text>
        <GhostButton label="Skip" onPress={onSkip} style={styles.skipButton} />
      </View>

      <View style={styles.heroArea}>
        <AuthHeroArt />
        <Text style={styles.heroTitle}>{subtitle}</Text>
      </View>

      <GlassCard style={styles.card}>
        <FlatList
          ref={listRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
            setActiveIndex(index);
          }}
          getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: pageWidth }]}>
              <View style={styles.slideArtWrap}>
                {item.art}
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideBody}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <Pressable key={slide.key} onPress={() => {
              setActiveIndex(index);
              listRef.current?.scrollToIndex({ index, animated: true });
            }} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.actionsRow}>
          {onBack ? <GhostButton label="Back" onPress={onBack} style={styles.secondaryButton} /> : null}
          <GradientButton label={activeIndex === slides.length - 1 ? 'Login' : 'Next'} onPress={nextSlide} style={styles.primaryButton} />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    ...typography.headlineMd,
    color: colors.primary,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: 0,
    borderWidth: 0,
  },
  heroArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(16,185,129,0.14)',
  },
  slide: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  slideArtWrap: {
    marginBottom: 26,
  },
  slideTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
    fontWeight: '700',
  },
  slideBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 320,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c9d7c9',
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 0.42,
  },
  primaryButton: {
    flex: 1,
  },
});