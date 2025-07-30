// API Configuration
const config = {
  // Development (local)
  development: {
    apiBaseUrl: 'http://localhost:3001'
  },
  // Production (deployed)
  production: {
    apiBaseUrl: process.env.REACT_APP_API_URL || 'https://inexpensive-trains-production.up.railway.app'
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export the appropriate config
export const apiBaseUrl = config[environment].apiBaseUrl;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${apiBaseUrl}${endpoint}`;
}; 