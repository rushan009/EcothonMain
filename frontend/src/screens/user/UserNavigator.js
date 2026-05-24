import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserHomeScreen from './UserHomeScreen';
import UserRewardsScreen from './UserRewardsScreen';
import UserProfileScreen from './UserProfileScreen';
import UserPersonalDetailsScreen from './UserPersonalDetailsScreen';
import ScanScreen from './ScanScreen';
import RequestPickupScreen from './RequestPickupScreen';
import MyPickupsScreen from './MyPickupsScreen';
import { userTabBar } from '../../components/user/UserTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator tabBar={userTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={UserHomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Pickup" component={MyPickupsScreen} />
      <Tab.Screen name="Rewards" component={UserRewardsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={Tabs} />
      <Stack.Screen name="RequestPickup" component={RequestPickupScreen} />
      <Stack.Screen name="MyPickups" component={MyPickupsScreen} />
      <Stack.Screen name="PersonalDetails" component={UserPersonalDetailsScreen} />
    </Stack.Navigator>
  );
}
