import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Flag,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Send
} from 'lucide-react'
import webrtcService from '../services/webrtc.js'
import apiService from '../services/api.js'

const VideoChat = ({
  user,
  partner,
  onEndCall,
  onReport,
  sessionStatus,
  onStartChat,
  loading,
  isPreviewMode
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [connectionState, setConnectionState] = useState('new')
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showPermissionScreen, setShowPermissionScreen] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [disconnectMessage, setDisconnectMessage] = useState('')
  const [showDisconnectMessage, setShowDisconnectMessage] = useState(false)
  
  // حالة تبديل الشاشات
  const [isLocalVideoMain, setIsLocalVideoMain] = useState(false) // لتبديل الشاشات
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const messagesEndRef = useRef(null)

  // رسائل الانتظار باللهجة السعودية
  const waitingMessages = [
    "ندور لك على أحد... لحظة.",
    "شوي ويكون معك واحد.",
    "نجهز لك الجلسة...",
    "أحد جاي بالطريق..."
  ]


  // رسائل خطأ الاتصال باللهجة السعودية
  const connectionErrorMessages = [
    "النت سواها فينا! حاول مرة ثانية يا بطل.",
    "فصل! بسيطة، ارجع للدكّة بسرعة.",
    "الاتصال تبخر... شكله حسدنا على الضحكة."
  ]



  // رسائل خطأ الميكروفون باللهجة السعودية
  const microphoneErrorMessages = [
    "ما نسمعك. تأكد من المايك.",
    "صوتك مو طالع، شيّك على المايكروفون.",
    "المايك مقفل، افتحه عشان نسمعك."
  ]

  // رسائل إنهاء المحادثة باللهجة السعودية
  const disconnectMessages = [
    "قام من الدكّة! شكله اكتفى سوالف اليوم 😄",
    "سحب عليك! بسيطة، الدكّة مليانة غيره 😊", 
    "قفل الخط! معوض خير، اللي بعده يبي يبيك 🤝",
    "تبخر! يلا اللي بعده، الدكّة ما توقف على أحد",
    "شرد! معوض خير بواحد أطلق منه"
  ]

  useEffect(() => {
    if (!isPreviewMode) {
      checkPermissions()
    } else {
      setPermissionsChecked(true)
      setPermissionGranted(true)
    }
    
    // إضافة مستمع لإغلاق الكاميرا والميكروفون عند مغادرة الموقع
    const handleBeforeUnload = () => {
      cleanup()
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (!isPreviewMode) {
        cleanup()
      }
    }
  }, [isPreviewMode])

  const checkPermissions = async () => {
    if (isPreviewMode) {
      setPermissionsChecked(true)
      setPermissionGranted(true)
      return
    }

    try {
      // Check if permissions are already granted
      const permissions = await navigator.permissions.query({ name: 'camera' })
      const micPermissions = await navigator.permissions.query({ name: 'microphone' })
      
      if (permissions.state === 'granted' && micPermissions.state === 'granted') {
        setPermissionGranted(true)
        setShowPermissionScreen(false)
        await initializeWebRTC()
      } else if (permissions.state === 'denied' || micPermissions.state === 'denied') {
        setShowPermissionScreen(true)
        setError('تم رفض الوصول للكاميرا والميكروفون مسبقاً. يرجى السماح بالوصول من إعدادات المتصفح.')
      } else {
        setShowPermissionScreen(true)
      }
      setPermissionsChecked(true)
    } catch (error) {
      console.error('Error checking permissions:', error)
      // Fallback: show permission screen
      setShowPermissionScreen(true)
      setPermissionsChecked(true)
    }
  }

  useEffect(() => {
    // Update video/audio controls
    if (webrtcService.isInitialized) {
      webrtcService.toggleVideo(isVideoEnabled)
    }
  }, [isVideoEnabled])

  useEffect(() => {
    // Update audio controls
    if (webrtcService.isInitialized) {
      webrtcService.toggleAudio(isAudioEnabled)
    }
  }, [isAudioEnabled])

  useEffect(() => {
    // Load messages when partner connects
    if (partner && !isPreviewMode) {
      loadMessages()
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 2000)
      return () => clearInterval(interval)
    } else if (partner && isPreviewMode) {
      // Simulate messages in preview mode
      setMessages([
        {
          id: '1',
          sender_id: partner.id,
          message: 'مرحباً! كيف حالك؟',
          created_at: new Date().toISOString(),
          sender: {
            id: partner.id,
            display_name: partner.display_name,
            avatar_url: partner.avatar_url
          }
        },
        {
          id: '2',
          sender_id: user.id,
          message: 'أهلاً وسهلاً! بخير والحمد لله',
          created_at: new Date().toISOString(),
          sender: {
            id: user.id,
            display_name: user.display_name,
            avatar_url: user.avatar_url
          }
        }
      ])
    }
  }, [partner, isPreviewMode])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (isPreviewMode) return
    
    try {
      const response = await apiService.getMessages()
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const initializeWebRTC = async () => {
    if (!webrtcService.constructor.isSupported()) {
      setError('متصفحك لا يدعم دردشة الفيديو')
      return
    }

    try {
      setIsConnecting(true)
      setError('')

      // Initialize WebRTC and get local stream
      const localStream = await webrtcService.initialize()
      console.log("Local stream obtained:", localStream)
      
      // Set local video
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream
        console.log("Local video srcObject set.")
      }

      // Set up callbacks
      webrtcService.setOnRemoteStream((remoteStream) => {
        console.log("Remote stream obtained:", remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
          console.log("Remote video srcObject set.")
        }
      })

      webrtcService.setOnConnectionStateChange((state) => {
        setConnectionState(state)
        console.log("Connection state changed:", state)
        if (state === 'connected') {
          setIsConnecting(false)
        } else if (state === 'failed' || state === 'disconnected') {
          // عرض رسالة الانقطاع عند انقطاع الاتصال
          if (partner) {
            showRandomDisconnectMessage()
          }
          setError('انقطع الاتصال مع الشريك')
        }
      })

      setIsConnecting(false)

    } catch (error) {
      console.error("WebRTC initialization error:", error)
      setError('لا يمكن الوصول إلى الكاميرا أو الميكروفون. يرجى السماح بالوصول إليهما.')
      setIsConnecting(false)
    }
  }

  const showRandomConnectionErrorMessage = () => {
    const randomMessage = connectionErrorMessages[Math.floor(Math.random() * connectionErrorMessages.length)]
    setError(randomMessage)
  }

  const cleanup = () => {
    // إيقاف جميع المسارات الصوتية والمرئية
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => {
        track.stop()
        console.log(`Stopped ${track.kind} track`)
      })
      localVideoRef.current.srcObject = null
    }
    
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => {
        track.stop()
        console.log(`Stopped remote ${track.kind} track`)
      })
      remoteVideoRef.current.srcObject = null
    }
    
    // إيقاف خدمة WebRTC
    webrtcService.stopStreams()
    console.log("WebRTC streams stopped and peer connection closed.")
  }

  const showRandomDisconnectMessage = () => {
    const randomMessage = disconnectMessages[Math.floor(Math.random() * disconnectMessages.length)]
    setDisconnectMessage(randomMessage)
    setShowDisconnectMessage(true)
    
    // إخفاء الرسالة بعد 4 ثوان
    setTimeout(() => {
      setShowDisconnectMessage(false)
    }, 4000)
  }

  const handleEndCall = () => {
    cleanup()
    setMessages([])
    setShowChat(false)
    
    // عرض رسالة الانقطاع إذا كان هناك شريك
    if (partner) {
      showRandomDisconnectMessage()
    }
    
    onEndCall()
    console.log("Call ended.")
  }

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled
    setIsVideoEnabled(newState)
    if (webrtcService.isInitialized) {
      const success = webrtcService.toggleVideo(newState)
      console.log("Video toggle success:", success, "New state:", newState)
    }
  }

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled
    setIsAudioEnabled(newState)
    if (webrtcService.isInitialized) {
      const success = webrtcService.toggleAudio(newState)
      console.log("Audio toggle success:", success, "New state:", newState)
    }
  }

  const handleReport = () => {
    if (partner) {
      onReport(partner.id)
      console.log("Report initiated for partner:", partner.id)
    }
  }

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat()
    }
  }

  const handleNextPartner = () => {
    // End current chat and start new one
    if (onEndCall) {
      onEndCall()
    }
    setTimeout(() => {
      if (onStartChat) {
        onStartChat()
      }
    }, 500)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sendingMessage) return
    
    if (isPreviewMode) {
      // Simulate sending message in preview mode
      const simulatedMessage = {
        id: Date.now().toString(),
        sender_id: user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender: {
          id: user.id,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      }
      
      setMessages(prev => [...prev, simulatedMessage])
      setNewMessage('')
      
      // Simulate partner response after 2 seconds
      setTimeout(() => {
        const partnerResponse = {
          id: (Date.now() + 1).toString(),
          sender_id: partner.id,
          message: 'شكراً لك على الرسالة!',
          created_at: new Date().toISOString(),
          sender: {
            id: partner.id,
            display_name: partner.display_name,
            avatar_url: partner.avatar_url
          }
        }
        setMessages(prev => [...prev, partnerResponse])
      }, 2000)
      
      return
    }

    setSendingMessage(true)
    
    try {
      const response = await apiService.sendMessage(newMessage.trim())
      setNewMessage('')
      // Messages will be updated by the polling mechanism
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('فشل في إرسال الرسالة')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleRequestPermissions = async () => {
    if (isPreviewMode) {
      // In preview mode, just simulate permission granted
      setPermissionGranted(true)
      setShowPermissionScreen(false)
      return
    }

    try {
      setIsConnecting(true)
      setError('')

      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      // If we get here, permissions were granted
      setPermissionGranted(true)
      setShowPermissionScreen(false)
      
      // Set local video
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream
      }

      // Initialize WebRTC with the stream
      await initializeWebRTC()

    } catch (error) {
      console.error("Permission request error:", error)
      if (error.name === 'NotAllowedError') {
        setError('تم رفض الوصول للكاميرا والميكروفون. يرجى السماح بالوصول من إعدادات المتصفح.')
      } else if (error.name === 'NotFoundError') {
        setError('لم يتم العثور على كاميرا أو ميكروفون. تأكد من توصيل الأجهزة.')
      } else {
        setError('حدث خطأ في الوصول للكاميرا والميكروفون. يرجى المحاولة مرة أخرى.')
      }
      setIsConnecting(false)
    }
  }

  const handleSkipPermissions = () => {
    if (isPreviewMode) {
      setPermissionGranted(true)
      setShowPermissionScreen(false)
    }
  }

  const handleToggleChat = () => {
    setShowChat(!showChat)
    if (!showChat && partner) {
      // Load messages when opening chat
      loadMessages()
    }
  }

  // دالة تبديل الشاشات
  const handleLocalVideoClick = () => {
    setIsLocalVideoMain(!isLocalVideoMain)
  }

  const handleRemoteVideoClick = () => {
    setIsLocalVideoMain(!isLocalVideoMain)
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      <Card>
        <CardContent className="p-2 sm:p-4 md:p-6 relative">
          {/* Permission Request Overlay */}
          {showPermissionScreen && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="max-w-md w-full mx-4">
                <div className="bg-card border border-border rounded-lg shadow-lg p-6 text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <Video className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">مرحباً بك في دكّة!</h2>
                    <p className="text-muted-foreground text-sm">شغّل الكام والمايك عشان تبدأ السوالف</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Video className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="text-right flex-1">
                        <h3 className="font-semibold text-foreground text-sm">الكاميرا</h3>
                        <p className="text-xs text-muted-foreground">لمشاركة الفيديو مع الآخرين</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-secondary">
                      <div className="w-8 h-8 bg-secondary-foreground rounded-full flex items-center justify-center">
                        <Mic className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="text-right flex-1">
                        <h3 className="font-semibold text-foreground text-sm">الميكروفون</h3>
                        <p className="text-xs text-muted-foreground">للتحدث والتواصل الصوتي</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <Button 
                      onClick={handleRequestPermissions}
                      disabled={isConnecting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg shadow-md transform transition-all duration-200 hover:scale-105"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          جاري طلب الأذونات...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          السماح بالوصول
                        </>
                      )}
                    </Button>

                    {isPreviewMode && (
                      <Button 
                        onClick={handleSkipPermissions}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        تخطي (وضع المعاينة)
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>🔒 نحن نحترم خصوصيتك. لن يتم حفظ أو تسجيل أي محتوى مرئي أو صوتي.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disconnect Message Overlay */}
          {showDisconnectMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
              <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm mx-auto animate-in slide-in-from-top-2 duration-300">
                <div className="text-center">
                  <p className="text-foreground font-medium text-sm">{disconnectMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Video Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 grid-mobile">
            {/* Local Video */}
            <div 
              className="relative bg-muted rounded-lg aspect-square overflow-hidden border-2 border-primary video-container cursor-pointer hover:border-primary/80 transition-colors"
              onClick={handleLocalVideoClick}
            >
              <video
                ref={isLocalVideoMain ? remoteVideoRef : localVideoRef}
                autoPlay
                muted={!isLocalVideoMain}
                playsInline
                className="w-full h-full object-cover"
                style={{ 
                  transform: isLocalVideoMain ? 'none' : 'scaleX(-1)'
                }}
              />
              
              {/* Video overlay */}
              <div className="absolute top-2 left-2 bg-black/60 rounded-md px-2 py-1 flex items-center gap-2">
                <Avatar className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 avatar-mobile">
                  <AvatarImage 
                    src={isLocalVideoMain ? partner?.avatar_url : user?.avatar_url} 
                    alt={isLocalVideoMain ? partner?.display_name : user?.display_name}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-xs text-white">
                    {isLocalVideoMain ? (partner?.display_name?.charAt(0) || 'م') : (user?.display_name?.charAt(0) || 'أ')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-xs sm:text-sm md:text-base">
                  {isLocalVideoMain ? (partner?.display_name || 'مستخدم آخر') : 'أنت'}
                </span>
              </div>

              {/* Video disabled overlay */}
              {!isVideoEnabled && !isLocalVideoMain && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm md:text-lg">الكاميرا مغلقة</p>
                  </div>
                </div>
              )}

              {/* No partner placeholder */}
              {!partner && isLocalVideoMain && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 avatar-mobile">
                      <AvatarFallback className="text-lg sm:text-xl md:text-2xl">م</AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">
                      {waitingMessages[Math.floor(Math.random() * waitingMessages.length)]}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div 
              className="relative bg-muted rounded-lg aspect-square overflow-hidden border-2 border-secondary video-container cursor-pointer hover:border-secondary/80 transition-colors"
              onClick={handleRemoteVideoClick}
            >
              <video
                ref={isLocalVideoMain ? localVideoRef : remoteVideoRef}
                autoPlay
                muted={isLocalVideoMain}
                playsInline
                className="w-full h-full object-cover"
                style={{ 
                  transform: isLocalVideoMain ? 'scaleX(-1)' : 'none'
                }}
              />
              
              {/* Video overlay */}
              <div className="absolute top-2 left-2 bg-black/60 rounded-md px-2 py-1 flex items-center gap-2">
                <Avatar className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 avatar-mobile">
                  <AvatarImage 
                    src={isLocalVideoMain ? user?.avatar_url : partner?.avatar_url} 
                    alt={isLocalVideoMain ? user?.display_name : partner?.display_name}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-xs text-white">
                    {isLocalVideoMain ? (user?.display_name?.charAt(0) || 'أ') : (partner?.display_name?.charAt(0) || 'م')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-xs sm:text-sm md:text-base">
                  {isLocalVideoMain ? 'أنت' : (partner?.display_name || 'مستخدم آخر')}
                </span>
                {partner && connectionState === 'connected' && (
                  <Badge variant="default" className="text-xs hidden sm:inline-flex">
                    متصل
                  </Badge>
                )}
              </div>

              {/* Video disabled overlay */}
              {!isVideoEnabled && isLocalVideoMain && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm md:text-lg">الكاميرا مغلقة</p>
                  </div>
                </div>
              )}

              {/* No partner placeholder */}
              {!partner && !isLocalVideoMain && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 avatar-mobile">
                      <AvatarFallback className="text-lg sm:text-xl md:text-2xl">م</AvatarFallback>
                    </Avatar>
                    <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">
                      {waitingMessages[Math.floor(Math.random() * waitingMessages.length)]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 space-y-mobile">
            {/* Start Chat Button */}
            {!partner && !loading && (
              <Button
                variant="default"
                size="lg"
                onClick={handleStartChat}
                className="rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold w-full sm:w-auto"
              >
                ابدأ
              </Button>
            )}

            {/* Stop Search Button */}
            {loading && (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full px-6 py-3 text-base font-semibold"
              >
                توقف
              </Button>
            )}

            {/* Stop Button for Preview Mode */}
            {isPreviewMode && partner && (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="rounded-full px-6 py-3 text-base font-semibold"
              >
                توقف
              </Button>
            )}

            {/* Next Partner Button - Only in real mode */}
            {!isPreviewMode && partner && (
              <Button
                variant="default"
                size="lg"
                onClick={handleNextPartner}
                className="rounded-full px-6 py-3 text-base font-semibold"
              >
                التالي
              </Button>
            )}

            {/* Video Toggle */}
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={handleToggleVideo}
              className="rounded-full w-12 h-12 p-0"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            {/* Audio Toggle */}
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="lg"
              onClick={handleToggleAudio}
              className="rounded-full w-12 h-12 p-0"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            {/* Chat Toggle */}
            <Button
              variant={showChat ? "default" : "outline"}
              size="lg"
              onClick={handleToggleChat}
              className="rounded-full w-12 h-12 p-0"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            
            {/* Report Button */}
            {partner && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleReport}
                className="rounded-full w-12 h-12 p-0"
              >
                <Flag className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="mt-6 border-t pt-4">
              <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto mb-4">
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage 
                              src={message.sender?.avatar_url} 
                              alt={message.sender?.display_name}
                              className="object-cover w-full h-full"
                            />
                            <AvatarFallback className="text-xs">
                              {message.sender?.display_name?.charAt(0) || 'م'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border'
                          }`}
                        >
                          <p>{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {message.sender_id === user?.id && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage 
                              src={user?.avatar_url} 
                              alt={user?.display_name}
                              className="object-cover w-full h-full"
                            />
                            <AvatarFallback className="text-xs">
                              {user?.display_name?.charAt(0) || 'أ'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    لا توجد رسائل بعد. ابدأ المحادثة!
                  </p>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1"
                  maxLength={500}
                  // The 'disabled' prop was causing the issue. 
                  // In preview mode, we want to allow typing even without a 'partner' object.
                  // In real mode, 'partner' is necessary for sending messages.
                  disabled={sendingMessage || (!isPreviewMode && !partner)}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={sendingMessage || !newMessage.trim() || (!isPreviewMode && !partner)}
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Connection Info */}
          <div className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
            {partner ? (
              <p>متصل مع {partner.display_name || 'مستخدم آخر'}</p>
            ) : (
              <p>اضغط على "ابدأ" للبحث عن شريك للدردشة</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VideoChat



