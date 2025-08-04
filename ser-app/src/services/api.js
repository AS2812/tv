// Clean API service for the application

// Mock user data
const MOCK_USER = {
  profile: {
    name: 'User',
    email: 'user@example.com',
    avatar: '/assets/default-avatar.png'
  },
  isAuthenticated: true
};

// API base URL configuration
class ApiService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com' 
      : 'http://localhost:5000';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Upload methods
  async uploadAvatar(formData) {
    return this.request('/api/upload/upload-avatar', {
      method: 'POST',
      body: formData,
    });
  }

  // Chat methods
  async startChatSession() {
    return this.request('/chat/start-session', {
      method: 'POST',
    });
  }

  async endChatSession() {
    return this.request('/chat/end-session', {
      method: 'POST',
    });
  }

  async getSessionStatus() {
    return this.request('/chat/session-status');
  }

  async sendMessage(message) {
    return this.request('/chat/send-message', {
      method: 'POST',
      body: { message },
    });
  }

  async getMessages() {
    return this.request('/chat/get-messages');
  }

  // User interaction methods
  async getMetUsers() {
    return this.request('/chat/met-users');
  }

  async requestReconnect(targetUserId) {
    return this.request('/chat/request-reconnect', {
      method: 'POST',
      body: { target_user_id: targetUserId },
    });
  }

  async respondToReconnect(requestId, response) {
    return this.request('/chat/respond-reconnect', {
      method: 'POST',
      body: { request_id: requestId, response },
    });
  }

  async getReconnectRequests() {
    return this.request('/chat/get-reconnect-requests');
  }

  async startDirectChat(targetUserId) {
    return this.request('/chat/start-direct-chat', {
      method: 'POST',
      body: { target_user_id: targetUserId },
    });
  }

  // Report methods
  async reportUser(reportData) {
    return this.request('/chat/report', {
      method: 'POST',
      body: reportData,
    });
  }

  async reportProblem(data) {
    return this.request('/chat/report-problem', {
      method: 'POST',
      body: data,
    });
  }

  async contactUs(data) {
    return this.request('/chat/contact-us', {
      method: 'POST',
      body: data,
    });
  }

  // Stats methods
  async getChatStats() {
    return this.request('/chat/stats');
  }

  // Admin methods
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async banUser(userId, reason) {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: { reason },
    });
  }

  async unbanUser(userId) {
    return this.request(`/admin/users/${userId}/unban`, {
      method: 'POST',
    });
  }

  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/reports${queryString ? `?${queryString}` : ''}`);
  }

  async reviewReport(reportId, action, notes = '', banUser = false) {
    return this.request(`/admin/reports/${reportId}/review`, {
      method: 'POST',
      body: { action, notes, ban_user: banUser },
    });
  }

  async getSystemSettings() {
    return this.request('/admin/system-settings');
  }

  async updateSystemSettings(settings) {
    return this.request('/admin/system-settings', {
      method: 'PUT',
      body: settings,
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;