import { useEffect, useState } from 'react';
import { getAppRouteForRole, useAuthForm } from '../../features/auth';
import { onAuthLogout } from '../../features/auth/authEvents';
import AuthLandingScreen from './AuthLandingScreen';
import AuthLoginScreen from './AuthLoginScreen';
import AuthSignupScreen from './AuthSignupScreen';
import RegistrationDetailsScreen from './RegistrationDetailsScreen';
import RoleSelectionScreen from './RoleSelectionScreen';

export default function AuthFlow({ AppNavigator }) {
  const [stage, setStage] = useState('landing');
  const [homeRoute, setHomeRoute] = useState('UserApp');
  const auth = useAuthForm();

  useEffect(() => {
    return onAuthLogout(() => {
      setHomeRoute('UserApp');
      setStage('login');
    });
  }, []);

  if (stage === 'app') {
    return <AppNavigator initialRouteName={homeRoute} />;
  }

  if (stage === 'login') {
    return <AuthLoginScreen onLoggedIn={(nextRoute) => { if (nextRoute) setHomeRoute(nextRoute); setStage('app'); }} onBack={() => setStage('landing')} onCreateAccount={() => setStage('signup')} />;
  }

  if (stage === 'signup') {
    return <AuthSignupScreen auth={auth} onBack={() => setStage('login')} onContinue={() => setStage('details')} />;
  }

  if (stage === 'details') {
    return <RegistrationDetailsScreen auth={auth} onBack={() => setStage('signup')} onComplete={() => setStage('roles')} />;
  }

  if (stage === 'roles') {
    return <RoleSelectionScreen auth={auth} onBack={() => setStage('details')} onContinue={(nextRoute) => { setHomeRoute(nextRoute || getAppRouteForRole(auth?.form?.role)); setStage('app'); }} />;
  }

  return <AuthLandingScreen onGetStarted={() => setStage('login')} />;
}