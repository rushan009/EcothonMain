import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CollectorActivePickupScreen from './CollectorActivePickupScreen';
import CollectorDashboardScreen from './CollectorDashboardScreen';
import CollectorEarningsScreen from './CollectorEarningsScreen';
import CollectorHistoryScreen from './CollectorHistoryScreen';
import CollectorMapScreen from './CollectorMapScreen';
import CollectorProfileScreen from './CollectorProfileScreen';

const Stack = createNativeStackNavigator();

export default function CollectorNavigator() {
  return (
    <Stack.Navigator initialRouteName="CollectorDashboard" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="CollectorDashboard" component={CollectorDashboardScreen} />
      <Stack.Screen name="CollectorHome" component={CollectorDashboardScreen} />
      <Stack.Screen name="CollectorRequests" component={CollectorDashboardScreen} />
      <Stack.Screen name="CollectorRoutes" component={CollectorMapScreen} />
      <Stack.Screen name="CollectorActivePickup" component={CollectorActivePickupScreen} />
      <Stack.Screen name="CollectorEarnings" component={CollectorEarningsScreen} />
      <Stack.Screen name="CollectorProfile" component={CollectorProfileScreen} />
      <Stack.Screen name="CollectorHistory" component={CollectorHistoryScreen} />
    </Stack.Navigator>
  );
}
