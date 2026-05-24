import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CollectorActivePickupScreen from './CollectorActivePickupScreen';
import CollectorHomeScreen from './CollectorHomeScreen';
import CollectorEarningsScreen from './CollectorEarningsScreen';
import CollectorHistoryScreen from './CollectorHistoryScreen';
import CollectorProfileScreen from './CollectorProfileScreen';

const Stack = createNativeStackNavigator();

export default function CollectorNavigator() {
  return (
    <Stack.Navigator initialRouteName="CollectorHome" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="CollectorHome" component={CollectorHomeScreen} />
      <Stack.Screen name="CollectorActivePickup" component={CollectorActivePickupScreen} />
      <Stack.Screen name="CollectorEarnings" component={CollectorEarningsScreen} />
      <Stack.Screen name="CollectorProfile" component={CollectorProfileScreen} />
      <Stack.Screen name="CollectorHistory" component={CollectorHistoryScreen} />
    </Stack.Navigator>
  );
}
