import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import {
  Video,
  User,
  Sun,
  Moon,
  LogOut,
  Shield,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  ArrowLeft
} from 'lucide-react'
import apiService from './services/api.js'
import adminService from './services/admin.js'
import VideoChat from './components/VideoChat.jsx'
import ProfileSetup from './components/ProfileSetup.jsx'
import LoginForm from './components/LoginForm.jsx'
import './App.css'

function App() {
  // Initialize dark mode from localStorage or default to true (dark mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('ser_theme')
    return savedTheme ? savedTheme === 'dark' : true // Default to dark mode
  })
  const [currentView, setCurrentView] = useState('welcome') // welcome, login, home, chat, profile, profile-setup, admin, report, faq, contact
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState(null)
  const [sessionStatus, setSessionStatus] = useState('none')
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [reconnectRequests, setReconnectRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [metUsers, setMetUsers] = useState([])

  // Enhanced theme toggle function
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('ser_theme', newTheme ? 'dark' : 'light')
  }

  useEffect(() => {
    // Update user data when returning from chat or other views
    if (isPreviewMode && currentView === 'home') {
      const savedDisplayName = localStorage.getItem('ser_user_display_name')
      const savedUsername = localStorage.getItem('ser_user_username')
      const savedAvatar = localStorage.getItem('ser_user_avatar')
      
      // Always update user data with saved values if they exist
      if (savedDisplayName || savedUsername || savedAvatar) {
        setUser(prev => ({
          ...prev,
          display_name: savedDisplayName || prev?.display_name || 'مستخدم تجريبي',
          username: savedUsername || prev?.username || 'معاينة',
          avatar_url: savedAvatar || prev?.avatar_url || ''
        }))
      }
    }
  }, [currentView, isPreviewMode])

  useEffect(() => {
    // Load saved user data in preview mode when entering preview mode
    if (isPreviewMode && !user) {
      const savedDisplayName = localStorage.getItem('ser_user_display_name')
      const savedUsername = localStorage.getItem('ser_user_username')
      const savedAvatar = localStorage.getItem('ser_user_avatar')
      
      // Set initial user data with saved values or defaults
      setUser({
        id: "preview",
        display_name: savedDisplayName || "مستخدم تجريبي",
        username: savedUsername || "معاينة",
        email: "preview@ser.app",
        avatar_url: savedAvatar || null
      })
    }
  }, [isPreviewMode])

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = 'hsl(var(--background))'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.backgroundColor = 'hsl(var(--background))'
    }
    
    // Save theme preference
    localStorage.setItem('ser_theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus()
  }, [])

  useEffect(() => {
    // Update user data from localStorage in preview mode
    if (isPreviewMode && user) {
      const savedDisplayName = localStorage.getItem('ser_user_display_name')
      const savedUsername = localStorage.getItem('ser_user_username')
      const savedAvatar = localStorage.getItem('ser_user_avatar')
      const savedGender = localStorage.getItem('ser_user_gender')
      
      if (savedDisplayName || savedUsername || savedAvatar || savedGender) {
        setUser(prevUser => ({
          ...prevUser,
          display_name: savedDisplayName || prevUser?.display_name || "",
          username: savedUsername || prevUser?.username || "",
          avatar_url: savedAvatar || prevUser?.avatar_url || "",
          gender: savedGender || prevUser?.gender || ""
        }))
      }
    }
  }, [isPreviewMode, user?.id]) // Re-run when user ID changes or preview mode changes

  useEffect(() => {
    // Poll session status when user is logged in
    let interval
    if (user && currentView === 'chat' && !isPreviewMode) {
      interval = setInterval(checkSessionStatus, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user, currentView, isPreviewMode])

  useEffect(() => {
    // Poll reconnect requests when user is logged in
    let interval
    if (user && !isPreviewMode) {
      loadReconnectRequests()
      loadMetUsers()
      interval = setInterval(() => {
        loadReconnectRequests()
        loadMetUsers()
      }, 10000) // Check every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user, isPreviewMode])

  // رسائل ترحيبية ديناميكية
  const welcomeMessages = [
    "دكّة: حياك معنا - سوالف فيديو خفيفة",
    "لك مكان في دكّتنا - تعال سولف",
    "دكّتنا بسيطة.. وناسها أحلى",
    "الجلسة الخارجية البسيطة"
  ]

  // وصف الموقع الديناميكي
  const siteDescriptions = [
    "دكّة مكان بسيط يجمعك بناس عشوائية لطيفة بالفيديو. بدون تعقيد، مجرد سوالف ووجيه جديدة",
    "منصة سعودية للدردشة المرئية مع أشخاص جدد",
    "اكتشف أصدقاء جدد واستمتع بسوالف ممتعة",
    "مكانك المفضل للقاء أشخاص جدد وسوالف لطيفة"
  ]

  // نصوص أزرار ديناميكية
  const startButtonTexts = [
    "ابدأ الجلسة",
    "ابدأ الآن",
    "يلا نبدأ",
    "تعال سولف"
  ]

  const checkAuthStatus = async () => {
    if (isPreviewMode) return
    try {
      const response = await apiService.getCurrentUser()
      setUser(response.user)
      
      // التحقق من إكمال الملف الشخصي
      if (!response.user.profile_completed) {
        setCurrentView('profile-setup')
      } else {
        setCurrentView('home')
      }
    } catch (error) {
      console.log("User not authenticated, staying on welcome screen or login screen.")
      if (error.message.includes("401")) {
        console.log("Expected 401 error for unauthenticated user.")
      } else {
        console.error("Unexpected error during auth check:", error)
      }
    }
  }

  const checkSessionStatus = async () => {
    if (isPreviewMode) return
    try {
      const response = await apiService.getSessionStatus()
      setSessionStatus(response.status)
      
      if (response.status === 'connected') {
        setIsConnected(true)
        setPartner(response.partner)
      } else if (response.status === 'waiting') {
        setIsConnected(false)
        setPartner(null)
      } else {
        setIsConnected(false)
        setPartner(null)
      }
    } catch (error) {
      console.error('Failed to check session status:', error)
    }
  }

  const handleLogin = async (provider) => {
    setLoading(true)
    setError('')
    
    try {
      let response
      if (provider === 'google') {
        response = await apiService.loginWithGoogle({})
      } else if (provider === 'discord') {
        response = await apiService.loginWithDiscord({})
      }
      
      setUser(response.user)
      
      // التحقق من إكمال الملف الشخصي
      if (!response.user.profile_completed) {
        setCurrentView('profile-setup')
      } else {
        setCurrentView('home')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiService.logout()
      setUser(null)
      setCurrentView('welcome')
      setIsConnected(false)
      setPartner(null)
      setSessionStatus('none')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleLoginSuccess = (user) => {
    setUser(user)
    
    // التحقق من إكمال الملف الشخصي
    if (!user.profile_completed) {
      setCurrentView('profile-setup')
    } else {
      setCurrentView('home')
    }
  }

  const startChat = async () => {
    if (!user && !isPreviewMode) {
      setError("الرجاء تسجيل الدخول أو استخدام وضع المعاينة لبدء الدردشة.")
      return
    }
    setLoading(true)
    setError("")
    
    // إعداد تنظيف الجلسة
    adminService.setupCleanup()
    
    if (isPreviewMode) {
      // Preview mode - simulate chat session
      setSessionStatus('waiting')
      setIsConnected(false)
      setLoading(false)
      
      // بدء تتبع الجلسة في وضع المعاينة
      adminService.startSession({
        id: 'preview_user',
        display_name: user?.display_name || 'مستخدم تجريبي',
        avatar_url: user?.avatar_url,
        gender: user?.gender || localStorage.getItem('ser_user_gender')
      })
      
      // تعيين حالة الانتظار
      adminService.setWaiting()
      
      // After 3 seconds, simulate finding a partner
      setTimeout(() => {
        setSessionStatus('connected')
        setIsConnected(true)
        
        // Get user's gender to determine appropriate partner
        const userGender = localStorage.getItem('ser_user_gender') || 'male'
        const partnerGender = userGender === 'male' ? 'female' : 'male'
        
        const partner = {
          id: 'demo-partner',
          username: 'شريك_تجريبي',
          display_name: partnerGender === 'female' ? 'سارة أحمد' : 'أحمد محمد',
          avatar_url: null,
          gender: partnerGender
        }
        
        setPartner(partner)
        
        // تحديث حالة الدردشة
        adminService.joinChat(partner.id)
      }, 3000)
      return
    }
    
    try {
      // بدء تتبع الجلسة الحقيقية
      adminService.startSession(user)
      
      const response = await apiService.startChatSession()
      
      if (response.status === 'waiting') {
        setSessionStatus('waiting')
        setIsConnected(false)
        adminService.setWaiting()
      } else if (response.partner) {
        setSessionStatus('connected')
        setIsConnected(true)
        setPartner(response.partner)
        adminService.joinChat(response.partner.id)
      }
    } catch (error) {
      setError(error.message)
      adminService.endSession()
    } finally {
      setLoading(false)
    }
  }

  const endChat = async () => {
    // إنهاء تتبع الجلسة
    adminService.endSession()
    
    if (isPreviewMode) {
      setIsConnected(false)
      setPartner(null)
      setSessionStatus('none')
      setCurrentView('home')
      
      // Force reload saved user data when returning to home
      const savedDisplayName = localStorage.getItem('ser_user_display_name')
      const savedUsername = localStorage.getItem('ser_user_username')
      const savedAvatar = localStorage.getItem('ser_user_avatar')
      
      // Always update user data with saved values if they exist
      if (savedDisplayName || savedUsername || savedAvatar) {
        setUser(prev => ({
          ...prev,
          display_name: savedDisplayName || prev?.display_name || 'مستخدم تجريبي',
          username: savedUsername || prev?.username || 'معاينة',
          avatar_url: savedAvatar || prev?.avatar_url || ''
        }))
      }
      return
    }
    try {
      await apiService.endChatSession()
      setIsConnected(false)
      setPartner(null)
      setSessionStatus('none')
      setCurrentView('home')
    } catch (error) {
      console.error('Failed to end chat:', error)
    }
  }

  const reportUser = async () => {
    if (!partner) return
    if (isPreviewMode) {
      alert('تم إرسال التقرير بنجاح (وضع المعاينة)')
      return
    }
    
    try {
      await apiService.reportUser({
        reported_user_id: partner.id,
        reason: 'inappropriate_behavior',
        description: 'تم الإبلاغ عن سلوك غير لائق'
      })
      
      alert('تم إرسال التقرير بنجاح')
    } catch (error) {
      alert('فشل في إرسال التقرير: ' + error.message)
    }
  }

  // Beautiful success message component
  const showSuccessMessage = (message = 'تم الحفظ بنجاح!', description = 'تم حفظ جميع التغييرات في ملفك الشخصي') => {
    const successDiv = document.createElement('div')
    successDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 25px 35px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
        z-index: 10000;
        text-align: center;
        font-family: 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif;
        min-width: 320px;
        max-width: 90vw;
        backdrop-filter: blur(10px);
        animation: successSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        border: 2px solid rgba(255, 255, 255, 0.2);
      ">
        <div style="
          font-size: 32px; 
          margin-bottom: 12px;
          animation: successBounce 0.6s ease-out 0.2s both;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        ">✅</div>
        <div style="
          font-size: 20px; 
          font-weight: 700; 
          margin-bottom: 8px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          letter-spacing: 0.5px;
        ">${message}</div>
        <div style="
          font-size: 15px; 
          opacity: 0.95;
          line-height: 1.4;
          font-weight: 400;
        ">${description}</div>
      </div>
      <style>
        @keyframes successSlideIn {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        @keyframes successBounce {
          0% { transform: scale(0.3); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes successFadeOut {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
        }
      </style>
    `
    document.body.appendChild(successDiv)
    
    // Add fade out animation before removing
    setTimeout(() => {
      const messageDiv = successDiv.querySelector('div')
      messageDiv.style.animation = 'successFadeOut 0.3s ease-out forwards'
    }, 2700)
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv)
      }
    }, 3000)
  }

  const updateProfile = async (profileData) => {
    if (isPreviewMode) {
      // Save all profile data to localStorage in preview mode
      const updatedUser = { ...user, ...profileData }
      
      // Save individual fields to localStorage for persistence
      localStorage.setItem('ser_user_display_name', profileData.display_name || '')
      localStorage.setItem('ser_user_username', profileData.username || '')
      localStorage.setItem('ser_user_avatar', profileData.avatar_url || '')
      localStorage.setItem('ser_user_gender', profileData.gender || '')
      
      // Update user state with new data
      setUser(updatedUser)
      
      // Show success message
      showSuccessMessage()
      return
    }
    try {
      const response = await apiService.updateProfile(profileData)
      setUser(response.user)
      // Show success message
      showSuccessMessage()
    } catch (error) {
      alert('فشل في حفظ التغييرات: ' + error.message)
    }
  }

  const loadStats = async () => {
    if (isPreviewMode) {
      setStats({
        users: { active: 100, banned: 5 },
        sessions: { today: 500 },
        reports: { pending: 10 }
      })
      return
    }
    try {
      const response = await apiService.getChatStats()
      setStats(response)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadReconnectRequests = async () => {
    if (isPreviewMode) {
      // Simulate reconnect requests in preview mode
      setReconnectRequests([
        {
          id: '1',
          requester: {
            id: '2',
            display_name: 'سارة أحمد',
            avatar_url: null
          },
          created_at: new Date().toISOString()
        }
      ])
      return
    }
    try {
      const response = await apiService.getReconnectRequests()
      setReconnectRequests(response.requests || [])
    } catch (error) {
      console.error('Failed to load reconnect requests:', error)
    }
  }

  const loadMetUsers = async () => {
    if (isPreviewMode) {
      // Simulate met users in preview mode
      setMetUsers([
        {
          id: '1',
          display_name: 'أحمد محمد',
          username: 'ahmed_m',
          avatar_url: null,
          last_met: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          session_duration: 300
        },
        {
          id: '2',
          display_name: 'سارة أحمد',
          username: 'sara_a',
          avatar_url: null,
          last_met: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          session_duration: 450
        }
      ])
      return
    }
    try {
      const response = await apiService.getMetUsers()
      setMetUsers(response.met_users || [])
    } catch (error) {
      console.error('Failed to load met users:', error)
    }
  }

  const handleReconnectRequest = async (targetUserId) => {
    if (isPreviewMode) {
      alert('تم إرسال طلب إعادة الاتصال بنجاح (وضع المعاينة)')
      return
    }
    try {
      await apiService.requestReconnect(targetUserId)
      alert('تم إرسال طلب إعادة الاتصال بنجاح')
    } catch (error) {
      alert('فشل في إرسال طلب إعادة الاتصال: ' + error.message)
    }
  }

  const handleRespondToReconnect = async (requestId, response) => {
    if (isPreviewMode) {
      // Remove request from list in preview mode
      setReconnectRequests(prev => prev.filter(req => req.id !== requestId))
      if (response === 'accept') {
        alert('تم قبول طلب إعادة الاتصال! سيتم توصيلك قريباً.')
        // Simulate starting chat
        setTimeout(() => {
          setCurrentView('chat')
          setSessionStatus('connected')
          setIsConnected(true)
          setPartner({
            id: 'reconnect-partner',
            username: 'شريك_إعادة_اتصال',
            display_name: 'سارة أحمد',
            avatar_url: null
          })
        }, 1000)
      } else {
        alert('تم رفض طلب إعادة الاتصال.')
      }
      return
    }
    try {
      await apiService.respondToReconnect(requestId, response)
      // Remove request from list
      setReconnectRequests(prev => prev.filter(req => req.id !== requestId))
      
      if (response === 'accept') {
        alert('تم قبول طلب إعادة الاتصال! سيتم توصيلك قريباً.')
        // Redirect to chat view
        setCurrentView('chat')
      } else {
        alert('تم رفض طلب إعادة الاتصال.')
      }
    } catch (error) {
      alert('فشل في الرد على طلب إعادة الاتصال: ' + error.message)
    }
  }

  const startChatWithUser = async (userId) => {
    if (isPreviewMode) {
      alert('بدء دردشة مع المستخدم (وضع المعاينة)')
      // Simulate starting chat
      setTimeout(() => {
        setCurrentView('chat')
        setSessionStatus('connected')
        setIsConnected(true)
        const user = metUsers.find(u => u.id === userId)
        setPartner({
          id: userId,
          username: user?.username || 'مستخدم',
          display_name: user?.display_name || 'مستخدم',
          avatar_url: user?.avatar_url
        })
      }, 1000)
      return
    }
    try {
      setLoading(true)
      const response = await apiService.startDirectChat(userId)
      
      if (response.success) {
        alert('تم بدء الدردشة بنجاح!')
        setCurrentView('chat')
        setSessionStatus('connected')
        setIsConnected(true)
        setPartner(response.partner)
      }
    } catch (error) {
      alert('فشل في بدء الدردشة: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

   const WelcomeScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">د</span>
          </div>
          <CardTitle className="text-2xl font-bold">أهلاً بك في دكّة!</CardTitle>
          <p className="text-muted-foreground">{welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setCurrentView("login")} 
            className="w-full"
            size="lg"
          >
            ابدأ الآن
          </Button>
          <Button 
            onClick={() => {
              setIsPreviewMode(true)
              setUser({
                id: "preview",
                username: "معاينة",
                display_name: "مستخدم تجريبي",
                email: "preview@ser.app",
                avatar_url: null
              })
              setCurrentView("home")
            }} 
            variant="outline"
            className="w-full"
            size="lg"
          >
            معاينة التطبيق
          </Button>
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const LoginScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-foreground">د</span>
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <p className="text-muted-foreground">اختر طريقة تسجيل الدخول المفضلة لديك</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Google Login Button */}
          <button 
            onClick={() => handleLogin('google')} 
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 rounded-lg p-4 flex items-center justify-center gap-3 min-h-[56px] shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-sm">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium text-base">
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول بـ Google'}
            </span>
          </button>

          {/* Discord Login Button */}
          <button 
            onClick={() => handleLogin('discord')} 
            disabled={loading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] transition-all duration-300 rounded-lg p-4 flex items-center justify-center gap-3 min-h-[56px] shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-sm">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span className="text-white font-medium text-base">
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول بـ Discord'}
            </span>
          </button>

          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("welcome")}
            >
              العودة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

const HomeScreen = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">د</span>
            </div>
            <h1 className="text-xl font-bold">دكّة</h1>
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={user.avatar_url} 
                    className="object-cover w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <AvatarFallback className="text-sm">
                    {user.display_name?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
                <Badge variant="secondary">
                  مرحباً {user.display_name}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("profile")}
            >
              <User className="h-4 w-4" />
            </Button>
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentView("admin")
                  loadStats()
                }}
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}
            {!isPreviewMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Marketing Box */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-600 rounded-lg shadow-[4px_4px_0px_0px_rgba(34,197,94,0.8)] p-6 text-center">
          <div className="w-16 h-16 bg-green-600 border-2 border-green-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">🇸🇦</span>
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-3">ضريبة الموقع</h2>
          <p className="text-green-700 font-medium mb-4">التسويق للمنصة السعودية</p>
          <div className="bg-white border-2 border-green-600 rounded-lg p-4 shadow-sm">
            <p className="text-green-800 text-sm leading-relaxed">
              ساعدنا في نشر هذا المشروع السعودي الرائع! شارك التطبيق مع أصدقائك وعائلتك لدعم الابتكار المحلي.
            </p>
          </div>
          <div className="mt-4 flex gap-2 justify-center">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-700 rounded-lg font-bold"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'تطبيق دكّة',
                    text: 'اكتشف تطبيق دكّة - المنصة السعودية للدردشة المرئية!',
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('تم نسخ الرابط!')
                }
              }}
            >
              📱 شارك التطبيق
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-bold"
              onClick={() => window.open('https://twitter.com/intent/tweet?text=اكتشفت تطبيق دكّة - منصة سعودية رائعة للدردشة المرئية! ' + window.location.href, '_blank')}
            >
              🐦 غرد عنا
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Section */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center space-y-6 p-6 bg-card rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-center">{siteDescriptions[Math.floor(Math.random() * siteDescriptions.length)]}</h2>
            <p className="text-muted-foreground text-center max-w-md">
              انقر على الزر أدناه للانضمام إلى جلسة خارجية بسيطة مع أشخاص جدد.
            </p>
            <Button 
              size="lg" 
              className="w-full max-w-xs"
              onClick={() => {
                if (isPreviewMode) {
                  setUser({
                    id: "preview",
                    username: "معاينة",
                    display_name: "مستخدم تجريبي",
                    email: "preview@ser.app",
                    avatar_url: null
                  })
                }
                setCurrentView("chat")
              }}
            >
              <Video className="h-5 w-5 mr-2" />
              {startButtonTexts[Math.floor(Math.random() * startButtonTexts.length)]}
            </Button>

          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Who I Met Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  من قابلت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metUsers.length > 0 ? (
                    metUsers.map((metUser) => (
                      <div key={metUser.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={metUser.avatar_url} />
                          <AvatarFallback>{metUser.display_name?.charAt(0) || 'م'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{metUser.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            آخر لقاء: {metUser.last_met ? new Date(metUser.last_met).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </p>
                          {metUser.session_duration && (
                            <p className="text-xs text-muted-foreground">
                              مدة الدردشة: {Math.floor(metUser.session_duration / 60)} دقيقة
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => startChatWithUser(metUser.id)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleReconnectRequest(metUser.id)}>
                            🔄
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm">لم تقابل أحداً بعد.</p>
                  )}
                  {metUsers.length > 0 && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm" onClick={() => alert('عرض المزيد')}>
                        عرض المزيد
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reconnect Requests Section */}
            {reconnectRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔔 طلبات إعادة الاتصال
                    <Badge variant="destructive" className="text-xs">
                      {reconnectRequests.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reconnectRequests.map((request) => (
                      <div key={request.id} className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.requester?.avatar_url} />
                            <AvatarFallback>{request.requester?.display_name?.charAt(0) || 'م'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{request.requester?.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              يريد إعادة الاتصال معك
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="flex-1"
                            onClick={() => handleRespondToReconnect(request.id, 'accept')}
                          >
                            قبول
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleRespondToReconnect(request.id, 'decline')}
                          >
                            رفض
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Support Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  الدعم والمساعدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setCurrentView("report")} >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  الإبلاغ عن مشكلة
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setCurrentView("contact")} >
                  <User className="h-4 w-4 mr-2" />
                  تواصل مع الدعم
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setCurrentView("faq")} >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  الأسئلة الشائعة
                </Button>
              </CardContent>
            </Card>

            {/* About Founder Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  عن المؤسس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarFallback className="text-lg">ر</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">راكان الحربي</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    مؤسس ومطور تطبيق دكّة
                  </p>
                  <div className="space-y-3">
                    {/* Discord Bar */}
                    <button 
                      onClick={() => window.open("https://discord.gg/vbvlr", "_blank")}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 rounded-lg p-3 flex items-center justify-center gap-3 min-h-[50px] shadow-lg hover:shadow-xl transform hover:scale-[1.02] border border-indigo-500/20"
                      title="Discord"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-md">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      <span className="text-white font-bold text-base drop-shadow-md">Discord</span>
                    </button>
                    
                    {/* Snapchat Bar */}
                    <button 
                      onClick={() => window.open("https://snapchat.com/add/qc-3", "_blank")}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 rounded-lg p-3 flex items-center justify-center gap-3 min-h-[50px] shadow-lg hover:shadow-xl transform hover:scale-[1.02] border border-yellow-300/20"
                      title="Snapchat"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="drop-shadow-md">
                        <path d="M12.166 3c-2.4 0-4.35 1.95-4.35 4.35 0 2.4 1.95 4.35 4.35 4.35s4.35-1.95 4.35-4.35c0-2.4-1.95-4.35-4.35-4.35zm0 6.75c-1.32 0-2.4-1.08-2.4-2.4s1.08-2.4 2.4-2.4 2.4 1.08 2.4 2.4-1.08 2.4-2.4 2.4zm7.74 2.55c-.12-.36-.48-.6-.84-.6-.36 0-.72.24-.84.6-.12.36-.12.72 0 1.08.12.36.48.6.84.6.36 0 .72-.24.84-.6.12-.36.12-.72 0-1.08zm-15.48 0c-.12-.36-.48-.6-.84-.6-.36 0-.72.24-.84.6-.12.36-.12.72 0 1.08.12.36.48.6.84.6.36 0 .72-.24.84-.6.12-.36.12-.72 0-1.08zm7.74 8.7c-4.8 0-8.7-3.9-8.7-8.7 0-.48.04-.96.12-1.44.08-.48.56-.8 1.04-.72.48.08.8.56.72 1.04-.08.4-.12.8-.12 1.2 0 3.84 3.12 6.96 6.96 6.96s6.96-3.12 6.96-6.96c0-.4-.04-.8-.12-1.2-.08-.48.24-.96.72-1.04.48-.08.96.24 1.04.72.08.48.12.96.12 1.44-.04 4.8-3.94 8.7-8.74 8.7z"/>
                      </svg>
                      <span className="text-white font-bold text-base drop-shadow-md">Snapchat</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )



  const ChatScreen = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">د</span>
            </div>
            <h1 className="text-xl font-bold">دكّة</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("profile")}
            >
              <User className="h-4 w-4" />
            </Button>
            {user?.is_admin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentView("admin")
                  loadStats()
                }}
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}
            {!isPreviewMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <VideoChat
          user={user}
          partner={partner}
          onEndCall={endChat}
          onReport={reportUser}
          sessionStatus={sessionStatus}
          onStartChat={startChat}
          loading={loading}
          isPreviewMode={isPreviewMode}
        />
      </main>
    </div>
  )

  const ProfileScreen = () => {
    const [formData, setFormData] = useState({
      display_name: user?.display_name || "",
      username: user?.username || "",
      avatar_url: user?.avatar_url || "",
      gender: ""
    })

    // Load profile data on component mount and when user changes
    useEffect(() => {
      if (isPreviewMode) {
        const savedDisplayName = localStorage.getItem('ser_user_display_name')
        const savedUsername = localStorage.getItem('ser_user_username')
        const savedAvatar = localStorage.getItem('ser_user_avatar')
        const savedGender = localStorage.getItem('ser_user_gender')
        
        setFormData({
          display_name: savedDisplayName || user?.display_name || "",
          username: savedUsername || user?.username || "",
          avatar_url: savedAvatar || user?.avatar_url || "",
          gender: savedGender || ""
        })
      } else {
        // In non-preview mode, use user data directly
        setFormData({
          display_name: user?.display_name || "",
          username: user?.username || "",
          avatar_url: user?.avatar_url || "",
          gender: user?.gender || ""
        })
      }
    }, [isPreviewMode, user])

    // Reset form data when navigating back to profile
    useEffect(() => {
      if (isPreviewMode) {
        const savedDisplayName = localStorage.getItem('ser_user_display_name')
        const savedUsername = localStorage.getItem('ser_user_username')
        const savedAvatar = localStorage.getItem('ser_user_avatar')
        const savedGender = localStorage.getItem('ser_user_gender')
        
        setFormData({
          display_name: savedDisplayName || user?.display_name || "",
          username: savedUsername || user?.username || "",
          avatar_url: savedAvatar || user?.avatar_url || "",
          gender: savedGender || ""
        })
      }
    }, [])

    const handleSubmit = (e) => {
      e.preventDefault()
      handleSaveProfile()
    }

    const handleAvatarClick = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5 ميجابايت.')
            return
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار ملف صورة صالح.')
            return
          }
          
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageData = e.target.result
            setFormData(prev => ({...prev, avatar_url: imageData}))
            // Only update the form data, don't save to localStorage or show success message
          }
          
          reader.onerror = () => {
            alert("حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى.")
          }
          
          reader.readAsDataURL(file)
        }
      }
      input.click()
    }

    const handleSaveProfile = () => {
      updateProfile(formData)
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold">الملف الشخصي</h1>
            <div></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div 
                className="w-20 h-20 mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
                title="انقر لتغيير الصورة الشخصية"
              >
                <Avatar className="w-20 h-20">
                  <AvatarImage 
                    src={formData.avatar_url} 
                    className="object-cover w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <AvatarFallback className="text-2xl">
                    {formData.display_name?.charAt(0) || "م"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>تعديل الملف الشخصي</CardTitle>
              <p className="text-sm text-muted-foreground">انقر على الصورة لتغييرها</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">اسمك في الدكّة؟</Label>
                  <Input 
                    id="display_name" 
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input 
                    id="username" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <select 
                    id="gender" 
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="">اختر الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userid">معرف المستخدم</Label>
                  <Input id="userid" value={user?.id || ""} disabled />
                </div>
                <Button type="submit" className="w-full">حفظ التغييرات</Button>
                
                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold"
                  onClick={() => {
                    if (isPreviewMode) {
                      // Clear preview mode data
                      localStorage.removeItem('ser_user_display_name')
                      localStorage.removeItem('ser_user_username')
                      localStorage.removeItem('ser_user_avatar')
                      localStorage.removeItem('ser_user_gender')
                      setUser(null)
                      setIsPreviewMode(false)
                      setCurrentView('welcome')
                    } else {
                      handleLogout()
                    }
                  }}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  تسجيل الخروج
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const AdminScreen = () => {
    useEffect(() => {
      loadStats()
    }, [])

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold">لوحة التحكم</h1>
            <div></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                <div className="space-y-2">
                  <p>المستخدمون النشطون: {stats.users.active}</p>
                  <p>المستخدمون المحظورون: {stats.users.banned}</p>
                  <p>جلسات اليوم: {stats.sessions.today}</p>
                  <p>التقارير المعلقة: {stats.reports.pending}</p>
                </div>
              ) : (
                <p>جاري تحميل الإحصائيات...</p>
              )}
              <Button className="w-full" onClick={loadStats}>تحديث الإحصائيات</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const ReportScreen = () => {
    const [formData, setFormData] = useState({
      type: '',
      description: '',
      user_id: user?.id || ''
    })
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsSubmitting(true)
      
      try {
        if (isPreviewMode) {
          // Simulate API call in preview mode
          setTimeout(() => {
            setIsSubmitted(true)
            setIsSubmitting(false)
          }, 1000)
        } else {
          // Real API call
          await apiService.reportProblem(formData)
          setIsSubmitted(true)
          setIsSubmitting(false)
        }
      } catch (error) {
        console.error('Failed to submit report:', error)
        alert('فشل في إرسال البلاغ: ' + error.message)
        setIsSubmitting(false)
      }
    }

    if (isSubmitted) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => {
                setCurrentView("home")
                setIsSubmitted(false)
                setFormData({ type: '', description: '', user_id: user?.id || '' })
              }}>
                العودة
              </Button>
              <h1 className="text-xl font-bold">الإبلاغ عن مشكلة</h1>
              <div></div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6 max-w-md">
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h2 className="text-xl font-bold mb-2">تم الإرسال بنجاح!</h2>
                <p className="text-muted-foreground mb-4">
                  شكراً لك! تم استلام بلاغك بنجاح. سنقوم بمراجعته والعمل على حل المشكلة في أقرب وقت ممكن.
                </p>
                <Button onClick={() => {
                  setCurrentView("home")
                  setIsSubmitted(false)
                  setFormData({ type: '', description: '', user_id: user?.id || '' })
                }}>
                  العودة للرئيسية
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setCurrentView("home")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة
              </Button>
              <h1 className="text-xl font-bold">الإبلاغ عن مشكلة</h1>
              <div></div>
            </div>
          </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>الإبلاغ عن مشكلة</CardTitle>
              <p className="text-muted-foreground">
                نحن هنا لمساعدتك. يرجى وصف المشكلة التي تواجهها بالتفصيل لمساعدتنا في حلها بأسرع وقت ممكن.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="type" className="text-lg font-bold text-foreground">نوع المشكلة</Label>
                  <select 
                    id="type" 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-4 border-2 rounded-lg text-lg font-medium bg-background text-foreground border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
                    required
                    style={{
                      fontFamily: "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif",
                      lineHeight: "1.5"
                    }}
                  >
                    <option value="" className="text-muted-foreground font-normal" style={{fontSize: '16px', padding: '8px'}}>
                      ⬇️ اختر نوع المشكلة
                    </option>
                    <option value="technical" className="text-foreground font-bold" style={{fontSize: '16px', padding: '8px', backgroundColor: 'var(--background)'}}>
                      🔧 مشكلة فنية
                    </option>
                    <option value="user_behavior" className="text-foreground font-bold" style={{fontSize: '16px', padding: '8px', backgroundColor: 'var(--background)'}}>
                      ⚠️ سلوك مستخدم غير لائق
                    </option>
                    <option value="suggestion" className="text-foreground font-bold" style={{fontSize: '16px', padding: '8px', backgroundColor: 'var(--background)'}}>
                      💡 اقتراح تحسين
                    </option>
                    <option value="other" className="text-foreground font-bold" style={{fontSize: '16px', padding: '8px', backgroundColor: 'var(--background)'}}>
                      📝 أخرى
                    </option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-lg font-bold text-foreground">وصف المشكلة</Label>
                  <textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-4 border-2 rounded-lg h-40 text-base font-medium bg-background text-foreground border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                    placeholder="يرجى وصف المشكلة بالتفصيل هنا... كلما كان الوصف أكثر تفصيلاً، كان بإمكاننا مساعدتك بشكل أفضل."
                    required
                    style={{
                      fontFamily: "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif",
                      lineHeight: "1.6"
                    }}
                  />
                </div>
                {user && (
                  <div className="space-y-3">
                    <Label htmlFor="user_id" className="text-lg font-bold text-foreground">معرف المستخدم</Label>
                    <Input 
                      id="user_id" 
                      value={user.id} 
                      disabled 
                      className="text-base font-medium bg-muted text-muted-foreground border-2"
                      style={{
                        fontFamily: "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif"
                      }}
                    />
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg" 
                  disabled={isSubmitting}
                  style={{
                    fontFamily: "'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif"
                  }}
                >
                  {isSubmitting ? '⏳ جاري الإرسال...' : '📤 إرسال البلاغ'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const FAQScreen = () => {
    const [openIndex, setOpenIndex] = useState(null)

    const faqs = [
      {
        question: "كيف أبدأ الدردشة في تطبيق دكّة؟",
        answer: "بعد تسجيل الدخول، انقر على زر \"ابدأ الدردشة\" في الشاشة الرئيسية للاتصال بشخص عشوائي. يمكنك أيضاً استخدام وضع المعاينة لتجربة التطبيق دون تسجيل الدخول."
      },
      {
        question: "هل يمكنني إعادة الاتصال بشخص قابلته سابقاً؟",
        answer: "نعم، يمكنك إرسال طلب إعادة اتصال من قسم \"من قابلت\" في الشاشة الرئيسية. سيتلقى الشخص الآخر إشعاراً بطلبك ويمكنه قبوله أو رفضه."
      },
      {
        question: "كيف أبلغ عن مستخدم؟",
        answer: "أثناء الدردشة، يمكنك النقر على زر الإبلاغ عن المستخدم وتقديم السبب. سيتم مراجعة البلاغ من قبل فريق الإدارة واتخاذ الإجراء المناسب."
      },
      {
        question: "هل التطبيق آمن؟",
        answer: "نعم، نحن نستخدم أحدث تقنيات التشفير لضمان أمان وخصوصية محادثاتك. جميع البيانات محمية ولا نحتفظ بتسجيلات المحادثات."
      },
      {
        question: "كيف يمكنني تغيير اسم المستخدم أو الصورة الشخصية؟",
        answer: "يمكنك تحديث ملفك الشخصي من خلال صفحة \"الملف الشخصي\" في التطبيق. انقر على أيقونة المستخدم في الشريط العلوي للوصول إلى إعدادات الملف الشخصي."
      },
      {
        question: "ماذا أفعل إذا واجهت مشكلة فنية؟",
        answer: "يمكنك الإبلاغ عن المشكلة من خلال صفحة \"الإبلاغ عن مشكلة\" أو التواصل معنا مباشرة عبر صفحة \"تواصل معنا\". سنعمل على حل المشكلة في أقرب وقت ممكن."
      }
    ]

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold">الأسئلة الشائعة</h1>
            <div></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>الأسئلة الشائعة</CardTitle>
              <p className="text-muted-foreground">
                هنا ستجد إجابات لأكثر الأسئلة شيوعاً حول تطبيق دكّة.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                  <button
                    className="w-full p-4 text-right flex justify-between items-center hover:bg-muted/50"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <span className="font-medium">{faq.question}</span>
                    <span className="text-xl">{openIndex === index ? '−' : '+'}</span>
                  </button>
                  {openIndex === index && (
                    <div className="p-4 pt-0 text-muted-foreground">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const ContactScreen = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      subject: '',
      message: ''
    })
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setIsSubmitting(true)
      
      try {
        if (isPreviewMode) {
          // Simulate API call in preview mode
          setTimeout(() => {
            setIsSubmitted(true)
            setIsSubmitting(false)
          }, 1000)
        } else {
          // Real API call
          await apiService.contactUs(formData)
          setIsSubmitted(true)
          setIsSubmitting(false)
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        alert('فشل في إرسال الرسالة: ' + error.message)
        setIsSubmitting(false)
      }
    }

    if (isSubmitted) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => {
                setCurrentView("home")
                setIsSubmitted(false)
                setFormData({ name: '', email: '', subject: '', message: '' })
              }}>
                العودة
              </Button>
              <h1 className="text-xl font-bold">تواصل معنا</h1>
              <div></div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6 max-w-md">
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h2 className="text-xl font-bold mb-2">تم الإرسال بنجاح!</h2>
                <p className="text-muted-foreground mb-4">
                  شكراً لك! تم استلام رسالتك بنجاح. سنقوم بمراجعتها والرد عليك في أقرب وقت ممكن.
                </p>
                <Button onClick={() => {
                  setCurrentView("home")
                  setIsSubmitted(false)
                  setFormData({ name: '', email: '', subject: '', message: '' })
                }}>
                  العودة للرئيسية
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold">تواصل معنا</h1>
            <div></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>تواصل معنا</CardTitle>
              <p className="text-muted-foreground">
                لأي استفسارات عامة، اقتراحات، أو دعم فني، يرجى ملء النموذج أدناه وسنتواصل معك في أقرب وقت ممكن.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="اسمك الكامل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">الموضوع</Label>
                  <Input 
                    id="subject" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="موضوع الرسالة"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">الرسالة</Label>
                  <textarea 
                    id="message" 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full p-2 border rounded-md h-32"
                    placeholder="اكتب رسالتك هنا..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const SubscriptionScreen = () => {
    const [selectedPlan, setSelectedPlan] = useState('monthly')
    const [showPayment, setShowPayment] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('')
    const [formData, setFormData] = useState({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    })

    const handleSubscribe = () => {
      setShowPayment(true)
    }

    const handlePayment = (e) => {
      e.preventDefault()
      if (isPreviewMode) {
        alert('تم الاشتراك بنجاح! (وضع المعاينة)')
        setCurrentView('home')
      } else {
        // Handle real payment
        alert('سيتم تفعيل الدفع الحقيقي قريباً')
      }
    }

    if (showPayment) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowPayment(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة
              </Button>
              <h1 className="text-xl font-bold">إتمام الدفع</h1>
              <div></div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6 max-w-md">
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h2 className="text-xl font-bold text-black mb-4">ملخص الطلب</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black font-medium">الباقة المميزة</span>
                    <span className="text-black font-bold">15 ريال</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black">المدة</span>
                    <span className="text-black">شهر واحد</span>
                  </div>
                  <div className="border-t-2 border-black pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-black font-bold text-lg">المجموع</span>
                      <span className="text-black font-bold text-lg">15 ريال</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <h3 className="text-lg font-bold text-black mb-4">طريقة الدفع</h3>
                <div className="space-y-3">
                  {/* Apple Pay */}
                  <button 
                    onClick={() => setPaymentMethod('apple')}
                    className={`w-full p-4 border-2 border-black rounded-none transition-all duration-200 flex items-center gap-3 ${
                      paymentMethod === 'apple' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="font-bold">Apple Pay</span>
                  </button>

                  {/* Google Pay */}
                  <button 
                    onClick={() => setPaymentMethod('google')}
                    className={`w-full p-4 border-2 border-black rounded-none transition-all duration-200 flex items-center gap-3 ${
                      paymentMethod === 'google' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-bold">Google Pay</span>
                  </button>

                  {/* Credit Card */}
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full p-4 border-2 border-black rounded-none transition-all duration-200 flex items-center gap-3 ${
                      paymentMethod === 'card' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                    </svg>
                    <span className="font-bold">بطاقة ائتمان</span>
                  </button>
                </div>
              </div>

              {/* Credit Card Form */}
              {paymentMethod === 'card' && (
                <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber" className="text-black font-bold">رقم البطاقة</Label>
                      <Input 
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                        className="border-2 border-black rounded-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate" className="text-black font-bold">تاريخ الانتهاء</Label>
                        <Input 
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                          className="border-2 border-black rounded-none"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="text-black font-bold">CVV</Label>
                        <Input 
                          id="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                          className="border-2 border-black rounded-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cardholderName" className="text-black font-bold">اسم حامل البطاقة</Label>
                      <Input 
                        id="cardholderName"
                        placeholder="الاسم كما يظهر على البطاقة"
                        value={formData.cardholderName}
                        onChange={(e) => setFormData({...formData, cardholderName: e.target.value})}
                        className="border-2 border-black rounded-none"
                        required
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* Payment Button */}
              {paymentMethod && (
                <Button 
                  onClick={handlePayment}
                  className="w-full bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold py-4 text-lg"
                >
                  دفع 15 ريال
                </Button>
              )}

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-600">
                <p>🔒 جميع المعاملات محمية بتشفير SSL</p>
                <p>لن يتم حفظ معلومات البطاقة على خوادمنا</p>
              </div>
            </div>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentView("home")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold">الاشتراك المميز</h1>
            <div></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-6">
            {/* Premium Plan */}
            <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-center">
              <div className="w-16 h-16 bg-black border-2 border-black rounded-none mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">👑</span>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">الباقة المميزة</h2>
              <div className="text-3xl font-bold text-black mb-4">15 ريال<span className="text-lg">/شهر</span></div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>إزالة الإعلانات نهائياً</span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>أولوية في الاتصال</span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>فلاتر متقدمة للبحث</span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>رسائل غير محدودة</span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>دعم فوري متميز</span>
                </div>
                <div className="flex items-center gap-3 text-black">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>ميزات حصرية جديدة</span>
                </div>
              </div>

              <Button 
                onClick={handleSubscribe}
                className="w-full bg-black text-white border-2 border-black rounded-none hover:bg-gray-800 font-bold py-3 text-lg"
              >
                اشترك الآن
              </Button>
            </div>

            {/* Benefits Comparison */}
            <div className="bg-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-lg font-bold text-black mb-4 text-center">مقارنة الميزات</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm font-bold text-black border-b-2 border-black pb-2">
                  <span>الميزة</span>
                  <span className="text-center">مجاني</span>
                  <span className="text-center">مميز</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-black">
                  <span>الدردشة المرئية</span>
                  <span className="text-center text-green-600">✓</span>
                  <span className="text-center text-green-600">✓</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-black">
                  <span>الإعلانات</span>
                  <span className="text-center text-red-600">✗</span>
                  <span className="text-center text-green-600">✓</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-black">
                  <span>أولوية الاتصال</span>
                  <span className="text-center text-red-600">✗</span>
                  <span className="text-center text-green-600">✓</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-black">
                  <span>الفلاتر المتقدمة</span>
                  <span className="text-center text-red-600">✗</span>
                  <span className="text-center text-green-600">✓</span>
                </div>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="text-center text-sm text-gray-600">
              <p>💰 ضمان استرداد الأموال خلال 7 أيام</p>
              <p>🔒 دفع آمن ومحمي 100%</p>
              <p>📞 دعم فني على مدار الساعة</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const handleCompleteProfile = async (profileData) => {
    if (isPreviewMode) {
      // في وضع المعاينة، حفظ البيانات محلياً
      localStorage.setItem('ser_user_display_name', profileData.display_name || '')
      localStorage.setItem('ser_user_username', profileData.username || '')
      localStorage.setItem('ser_user_avatar', profileData.avatar_url || '')
      localStorage.setItem('ser_user_gender', profileData.gender || '')
      
      // تحديث بيانات المستخدم
      const updatedUser = { 
        ...user, 
        ...profileData, 
        profile_completed: true 
      }
      setUser(updatedUser)
      setCurrentView('home')
      return
    }

    try {
      const response = await apiService.completeProfile(profileData)
      setUser(response.user)
      setCurrentView('home')
    } catch (error) {
      throw new Error(error.message || 'فشل في حفظ الملف الشخصي')
    }
  }

  const handleSkipProfile = () => {
    // السماح بتخطي إعداد الملف الشخصي والانتقال للصفحة الرئيسية
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen />
      case 'login':
        return (
          <LoginForm 
            onLogin={handleLoginSuccess}
            onBack={() => setCurrentView('welcome')}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        )
      case 'profile-setup':
        return (
          <ProfileSetup 
            user={user}
            onComplete={handleCompleteProfile}
            onSkip={handleSkipProfile}
            isPreviewMode={isPreviewMode}
          />
        )
      case 'home':
        return <HomeScreen />
      case 'chat':
        return <ChatScreen />
      case 'profile':
        return <ProfileScreen />
      case 'admin':
        return <AdminScreen />
      case 'report':
        return <ReportScreen />
      case 'faq':
        return <FAQScreen />
      case 'contact':
        return <ContactScreen />
      case 'subscription':
        return <SubscriptionScreen />
      default:
        return <WelcomeScreen />
    }
  }

  return renderCurrentView()
}

export default App


