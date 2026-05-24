import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import AuthLandingScreen from '../screens/auth/AuthLandingScreen';
import AuthOnboardingScreen from '../screens/auth/AuthOnboardingScreen';
import AuthLoginScreen from '../screens/auth/AuthLoginScreen';
import AuthSignupScreen from '../screens/auth/AuthSignupScreen';
import RegistrationDetailsScreen from '../screens/auth/RegistrationDetailsScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import AdminDashboardScreen from '../screens/AdminScreen';
import UserNavigator from '../screens/user/UserNavigator';
import CollectorNavigator from '../screens/collector/CollectorNavigator';
import { colors } from '../theme/tokens';

const RootStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

function AdminFlow() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </AdminStack.Navigator>
  );
}

export default function AppNavigator({ initialRouteName = 'AuthLanding' }) {
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
        },
      }}
    >
      <View style={styles.root}>
        <RootStack.Navigator
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          initialRouteName={initialRouteName}
        >
          <RootStack.Screen name="AuthLanding" component={AuthLandingScreen} />
          <RootStack.Screen name="AuthOnboarding" component={AuthOnboardingScreen} />
          <RootStack.Screen name="UserLogin" component={AuthLoginScreen} />
          <RootStack.Screen name="AuthSignup" component={AuthSignupScreen} />
          <RootStack.Screen name="AuthRegistrationDetails" component={RegistrationDetailsScreen} />
          <RootStack.Screen name="AuthRoleSelection" component={RoleSelectionScreen} />
          <RootStack.Screen name="UserApp" component={UserNavigator} />
          <RootStack.Screen name="CollectorApp" component={CollectorNavigator} />
          <RootStack.Screen name="AdminApp" component={AdminFlow} />
        </RootStack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
