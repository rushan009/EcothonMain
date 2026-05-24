import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function AuthBackdrop({ children, variant = 'hero' }) {
  if (variant === 'soft') {
    return (
      <View style={styles.softContainer}>
        <View style={styles.softOrbTopLeft} />
        <View style={styles.softOrbBottomRight} />
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={['#7ffc97', '#34c95c', '#006b2c']} start={{ x: 0.95, y: 0.02 }} end={{ x: 0.1, y: 1 }} style={styles.container}>
      <View style={styles.heroOrbTopRight} />
      <View style={styles.heroOrbCenter} />
      <View style={styles.heroOrbBottomLeft} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  softContainer: {
    flex: 1,
    backgroundColor: '#f5fbf4',
  },
  heroOrbTopRight: {
    position: 'absolute',
    top: -90,
    right: -48,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroOrbCenter: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroOrbBottomLeft: {
    position: 'absolute',
    bottom: -130,
    left: -95,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  softOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(34,197,94,0.08)',
    opacity: 0.9,
  },
  softOrbBottomRight: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(16,185,129,0.07)',
  },
});
