/**
 * Ultra-simple authentication utility that bypasses the need for real authentication
 * by automatically setting a fixed user account in localStorage.
 */

// The one fixed user account to use throughout the app
export const DEFAULT_USER = {
  id: "default-user-id",
  username: "DemoUser",
  email: "demo@example.com",
  isAuthenticated: true
};

/**
 * Automatically logs in the user by setting the default user in localStorage
 * @returns The default user object
 */
export const autoLogin = () => {
  localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
  localStorage.setItem('token', 'fixed-demo-token-123');
  return DEFAULT_USER;
};

/**
 * Checks if user is logged in
 * @returns User object if logged in, null otherwise
 */
export const getLoggedInUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Logs out the user
 */
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};