import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

export function AuthHeroArt() {
  const jiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(jiggle, {
          toValue: 0,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(jiggle, {
          toValue: -1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(jiggle, {
          toValue: 0,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [jiggle]);

  const animatedStyle = {
    transform: [
      {
        translateY: jiggle.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [5, 0, -5],
        }),
      },
      {
        rotate: jiggle.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-1deg', '0deg', '1deg'],
        }),
      },
      {
        scale: jiggle.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.99, 1, 1.01],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <View style={styles.ringOuter} />
      <View style={styles.ringInner} />
      <View style={styles.tile}>
        <View style={styles.leafLeft} />
        <View style={styles.leafRight} />
        <View style={styles.coreGlow} />
        <Text style={styles.coreText}>🌍</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 212,
    height: 212,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  ringInner: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tile: {
    width: 168,
    height: 168,
    borderRadius: 0,
    backgroundColor: '#050b05',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  coreGlow: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(142,255,150,0.2)',
    shadowColor: '#7cff97',
    shadowOpacity: 0.55,
    shadowRadius: 24,
  },
  leafLeft: {
    position: 'absolute',
    left: 24,
    top: 30,
    width: 52,
    height: 104,
    borderTopLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: 'rgba(117,255,152,0.88)',
    opacity: 0.9,
  },
  leafRight: {
    position: 'absolute',
    right: 24,
    top: 30,
    width: 52,
    height: 104,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 50,
    transform: [{ rotate: '12deg' }],
    backgroundColor: 'rgba(117,255,152,0.88)',
    opacity: 0.9,
  },
  coreText: {
    fontSize: 66,
  },
});