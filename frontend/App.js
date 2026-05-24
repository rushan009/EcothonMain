import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, useFonts } from '@expo-google-fonts/outfit';
import { LanguageProvider } from './src/i18n/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { OfflineBanner } from './src/components/ui';
import AuthFlow from './src/screens/auth/AuthFlow';
import { useEffect, useState } from 'react';
import { initApi } from './src/api/client';

function AppShell() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <AuthFlow AppNavigator={AppNavigator} />
      <Toast />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initApi({ timeout: 2000 });
      } finally {
        if (mounted) setApiReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!fontsLoaded || !apiReady)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
