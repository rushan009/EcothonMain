export const AUTH_ROUTES = {
  user: 'UserApp',
  collector: 'CollectorApp',
  admin: 'AdminApp',
};

export function getAppRouteForRole(role) {
  return AUTH_ROUTES[String(role || '').toLowerCase()] || AUTH_ROUTES.user;
}