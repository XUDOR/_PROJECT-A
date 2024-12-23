// const.js 

module.exports = {
  // Project A's own URL and endpoints
  PROJECT_A_URL: 'http://localhost:3001',
  PROJECT_A_ENDPOINTS: {
    AUTH: {
      SIGNUP: '/api/auth/signup',
      LOGIN: '/api/auth/login'
    }
  },

  // URL of Project B (Database) for API interactions
  PROJECT_B_URL: 'http://localhost:3002/api/users',

  // URL of Project F (Communication) for notifications
  PROJECT_F_URL: 'http://localhost:3006/api/notifications',
};