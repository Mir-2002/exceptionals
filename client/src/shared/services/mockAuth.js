// Extremely simple mock authentication service

// Default test user
export const mockUsers = [
  { 
    id: '1', 
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
  }
];

// Login a user - ALWAYS SUCCEEDS with provided credentials
export const login = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For development/testing, just create a user object from the credentials
  // This makes ANY email/password combination work
  const user = {
    id: 'user-1',
    username: email.split('@')[0], // Use part of email as username
    email: email
  };
  
  return {
    success: true,
    user: user,
    token: 'mock-token-' + Math.random().toString(36).substring(2)
  };
};

// Register a user - ALWAYS SUCCEEDS
export const register = async (userData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Always succeed
  return { 
    success: true 
  };
};

// GitHub login mock - ALWAYS SUCCEEDS
export const githubLogin = async (code) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Create a GitHub user
  const githubUser = {
    id: 'github-user',
    username: 'github-user',
    email: 'github@example.com'
  };
  
  return {
    success: true,
    user: githubUser,
    token: 'mock-github-token-' + Math.random().toString(36).substring(2)
  };
};