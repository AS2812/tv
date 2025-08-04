class AdminService {
  constructor() {
    this.adminApiUrl = 'http://localhost:5000/api/admin'
    this.sessionId = null
    this.userId = null
  }

  generateSessionId() {
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    return this.sessionId
  }

  async updateSession(data) {
    try {
      if (!this.sessionId) {
        this.generateSessionId()
      }

      const sessionData = {
        session_id: this.sessionId,
        user_id: this.userId || 'anonymous_' + Date.now(),
        ...data
      }

      const response = await fetch(`${this.adminApiUrl}/sessions/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      if (response.ok) {
        console.log('Session updated successfully')
        return true
      } else {
        console.warn('Failed to update session:', response.status)
        return false
      }
    } catch (error) {
      console.warn('Error updating session:', error)
      return false
    }
  }

  async removeSession() {
    try {
      if (!this.sessionId) {
        return true
      }

      const response = await fetch(`${this.adminApiUrl}/sessions/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: this.sessionId })
      })

      if (response.ok) {
        console.log('Session removed successfully')
        return true
      } else {
        console.warn('Failed to remove session:', response.status)
        return false
      }
    } catch (error) {
      console.warn('Error removing session:', error)
      return false
    }
  }

  async startSession(user) {
    this.userId = user.id || 'user_' + Date.now()
    
    return await this.updateSession({
      status: 'connected',
      user_name: user.display_name || user.username,
      user_avatar: user.avatar_url,
      user_gender: user.gender
    })
  }

  async joinChat(partnerId) {
    return await this.updateSession({
      status: 'in_chat',
      partner_id: partnerId
    })
  }

  async setWaiting() {
    return await this.updateSession({
      status: 'waiting'
    })
  }

  async endSession() {
    const result = await this.removeSession()
    this.sessionId = null
    this.userId = null
    return result
  }

  // تنظيف الجلسة عند إغلاق الصفحة
  setupCleanup() {
    const cleanup = () => {
      if (this.sessionId) {
        // استخدام sendBeacon للإرسال الموثوق عند إغلاق الصفحة
        navigator.sendBeacon(
          `${this.adminApiUrl}/sessions/remove`,
          JSON.stringify({ session_id: this.sessionId })
        )
      }
    }

    window.addEventListener('beforeunload', cleanup)
    window.addEventListener('unload', cleanup)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        cleanup()
      }
    })
  }
}

// إنشاء مثيل عام
const adminService = new AdminService()

export default adminService

