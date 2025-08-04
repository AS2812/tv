// Local API service that doesn't rely on external APIs

// Mock user data
const MOCK_USER = {
  profile: {
    name: 'User',
    email: 'user@example.com',
    avatar: '/assets/default-avatar.png'
  },
  isAuthenticated: true
};

// API base URL (points to local mock data)
const API = '/api';

// Authentication
export async function getMe() {
  // Return mock user data
  return Promise.resolve(MOCK_USER);
}

export async function login(credentials) {
  // Simulate successful login
  console.log('Login attempted with:', credentials);
  return Promise.resolve(MOCK_USER);
}

// Generic API request function that uses mock data
export async function apiRequest(endpoint, options = {}) {
  console.log(`API request to: ${endpoint}`, options);
  
  // Return mock data based on endpoint
  switch (endpoint) {
    case '/auth/me':
      return MOCK_USER;
    case '/auth/login':
      return MOCK_USER;
    default:
      return { success: true, message: 'Mock data response' };
  }
}

// Create simulated API service with mock methods
const apiService = {
  request: apiRequest,
  
  // Authentication methods
  login: async (credentials) => {
    console.log('Login attempted with:', credentials);
    return MOCK_USER;
  },
  
  register: async (userData) => {
    console.log('Register attempted with:', userData);
    return MOCK_USER;
  },
  
  logout: async () => {
    return { success: true };
  },
  
  getCurrentUser: async () => {
    return MOCK_USER;
  },
  
  updateProfile: async (profileData) => {
    return { ...MOCK_USER, profile: { ...MOCK_USER.profile, ...profileData } };
  },
  
  // All other methods return simulated successful responses
  getMetUsers: async () => [],
  getReconnectRequests: async () => [],
  startChatSession: async () => ({ success: true }),
  endChatSession: async () => ({ success: true }),
  getSessionStatus: async () => ({ active: false }),
  reportUser: async () => ({ success: true }),
  getChatStats: async () => ({ totalChats: 0 }),
  sendMessage: async () => ({ success: true }),
  getMessages: async () => [],
  requestReconnect: async () => ({ success: true }),
  respondToReconnect: async () => ({ success: true }),
  startDirectChat: async () => ({ success: true }),
  getUsers: async () => [],
  reportProblem: async () => ({ success: true }),
  contactUs: async () => ({ success: true }),
  uploadAvatar: async (formData) => {
    return apiService.request('/api/upload/upload-avatar', {
      method: 'POST',
      body: formData,
    });
  }
};

export default apiService;

// New methods for the missing endpoints
async getMetUsers() {
  return this.request('/api/auth/met-users');
}

async getReconnectRequests() {
  return this.request('/api/auth/reconnect-requests');
}

// Chat methods
async startChatSession() {
  return this.request("/chat/start-session", {
    method: "POST",
  });
}

async endChatSession() {
  return this.request("/chat/end-session", {
    method: "POST",
  });
}

async getSessionStatus() {
  return this.request("/chat/session-status");
}

async reportUser(reportData) {
  return this.request("/chat/report", {
    method: "POST",
    body: reportData,
  });
}

async getChatStats() {
  return this.request("/chat/stats");
}

// Text chat methods
async sendMessage(message) {
  return this.request("/chat/send-message", {
    method: "POST",
    body: { message },
  });
}

async getMessages() {
  return this.request("/chat/get-messages");
}

// Reconnection request methods
async requestReconnect(targetUserId) {
  return this.request("/chat/request-reconnect", {
    method: "POST",
    body: { target_user_id: targetUserId },
  });
}

async respondToReconnect(requestId, response) {
  return this.request("/chat/respond-reconnect", {
    method: "POST",
    body: { request_id: requestId, response },
  });
}

async getReconnectRequests() {
  return this.request("/chat/get-reconnect-requests");
}

// Met users methods
async getMetUsers() {
  return this.request("/chat/met-users");
}

async startDirectChat(targetUserId) {
  return this.request("/chat/start-direct-chat", {
    method: "POST",
    body: { target_user_id: targetUserId },
  });
}

// Admin methods
async getUsers(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return this.request(`/admin/users${queryString ? `?${queryString}` : ""}`);
}

async banUser(userId, reason) {
  return this.request(`/admin/users/${userId}/ban`, {
    method: "POST",
    body: { reason },
  });
}

async unbanUser(userId) {
  return this.request(`/admin/users/${userId}/unban`, {
    method: "POST",
  });
}

async getReports(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return this.request(`/admin/reports${queryString ? `?${queryString}` : ""}`);
}

async reviewReport(reportId, action, notes = "", banUser = false) {
  return this.request(`/admin/reports/${reportId}/review`, {
    method: "POST",
    body: { action, notes, ban_user: banUser },
  });
}

async getSystemSettings() {
  return this.request("/admin/system-settings");
}

async updateSystemSettings(settings) {
  return this.request("/admin/system-settings", {
    method: "PUT",
    body: settings,
  });
}

// Report problem
async reportProblem(data) {
  const response = await fetch(`${this.baseURL}/chat/report-problem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to submit report")
  }
  
  return response.json()
}

// Contact us
async contactUs(data) {
  const response = await fetch(`${this.baseURL}/chat/contact-us`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to send message")
  }
  
  return response.json()
}

// Create and export a singleton instance
const apiService = new ApiService();

// New authentication methods for username/password
apiService.login = async function(credentials) {
  return this.request("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
};

apiService.register = async function(userData) {
  return this.request("/api/auth/register", {
    method: "POST",
    body: userData,
  });
};

export default apiService;
// New authentication methods for username/password
apiService.login = async function(credentials) {
  return this.request("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
};

apiService.register = async function(userData) {
  return this.request("/api/auth/register", {
    method: "POST",
    body: userData,
  });
};

export default apiService;

