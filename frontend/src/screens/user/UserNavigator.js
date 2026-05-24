import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserHomeScreen from './UserHomeScreen';
import UserScanScreen from './UserScanScreen';
import UserPickupScreen from './UserPickupScreen';
import UserRewardsScreen from './UserRewardsScreen';
import UserProfileScreen from './UserProfileScreen';
import UserPersonalDetailsScreen from './UserPersonalDetailsScreen';
import { userTabBar } from '../../components/user/UserTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator tabBar={userTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={UserHomeScreen} />
      <Tab.Screen name="Scan" component={UserScanScreen} />
      <Tab.Screen name="Pickup" component={UserPickupScreen} />
      <Tab.Screen name="Rewards" component={UserRewardsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={Tabs} />
      <Stack.Screen name="PersonalDetails" component={UserPersonalDetailsScreen} />
    </Stack.Navigator>
  );
}
