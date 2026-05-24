import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function AuthPrimaryButton({ label, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [float]);

  const animateTo = (toValue) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  const handlePress = async () => {
    await Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [
            { scale },
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -2],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <Pressable onPressIn={() => animateTo(0.98)} onPressOut={() => animateTo(1)} onPress={handlePress} style={styles.pressable}>
        <View style={styles.button}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  button: {
    minHeight: 62,
    borderRadius: radius.chip,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#0b5e2a',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  label: {
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.05,
    color: colors.primary,
    fontWeight: '700',
  },
  arrow: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
});
