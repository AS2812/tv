import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { User, Upload, AlertTriangle, CheckCircle } from 'lucide-react'
import apiService from '@/services/api.js'

const ProfileSetup = ({ user, onComplete, onSkip, isPreviewMode = false }) => {
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    username: user?.username || '',
    gender: user?.gender || '',
    avatar_url: user?.avatar_url || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setLoading(true)
      setError('')
      
      // إنشاء معاينة فورية للصورة
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("avatar", file)
        const response = await apiService.uploadAvatar(uploadFormData)
        const imageUrl = response.avatar_url
        
        // تحديث معاينة الصورة بالرابط الفعلي
        setAvatarPreview(imageUrl)
        setFormData(prev => ({
          ...prev,
          avatar_url: imageUrl
        }))
      } catch (err) {
        setError(err.message || "فشل في رفع الصورة")
        // الاحتفاظ بالمعاينة المحلية في حالة الخطأ
        // setAvatarPreview سيبقى على القيمة المحلية التي تم تعيينها من FileReader
      } finally {
        setLoading(false)
      }
    }
  }

  const validateForm = () => {
    if (!formData.display_name.trim()) {
      setError('الاسم مطلوب')
      return false
    }
    if (!formData.username.trim()) {
      setError('اسم المستخدم مطلوب')
      return false
    }
    if (!formData.gender) {
      setError('الجنس مطلوب')
      return false
    }
    if (formData.username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
      return false
    }
    if (formData.display_name.length < 2) {
      setError('الاسم يجب أن يكون حرفين على الأقل')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await onComplete(formData)
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">أكمل ملفك الشخصي</CardTitle>
          <p className="text-muted-foreground">
            أضف معلوماتك الشخصية لتحسين تجربة الدردشة
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* صورة العرض */}
            <div className="space-y-3">
              <Label>صورة العرض (اختيارية)</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage 
                      src={avatarPreview} 
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="text-lg">
                      {formData.display_name?.charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {loading ? 'جاري الرفع...' : 'اختر صورة'}
                      </span>
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG حتى 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* الاسم */}
            <div className="space-y-2">
              <Label htmlFor="display_name">الاسم *</Label>
              <Input
                id="display_name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                required
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                هذا الاسم سيظهر للمستخدمين الآخرين
              </p>
            </div>

            {/* اسم المستخدم */}
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم *</Label>
              <Input
                id="username"
                type="text"
                placeholder="اختر اسم مستخدم فريد"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                className="text-left"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                أحرف إنجليزية وأرقام وشرطة سفلية فقط، 3 أحرف على الأقل
              </p>
            </div>

            {/* الجنس */}
            <div className="space-y-2">
              <Label>الجنس *</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange('gender', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                يساعد في تحسين تجربة المطابقة
              </p>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    حفظ والمتابعة
                  </div>
                )}
              </Button>
              
              {onSkip && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onSkip}
                  disabled={loading}
                >
                  تخطي الآن
                </Button>
              )}
            </div>

            {/* معلومات إضافية */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-600" />
                لماذا نحتاج هذه المعلومات؟
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mr-6">
                <li>• تحسين تجربة المطابقة مع مستخدمين متوافقين</li>
                <li>• إنشاء ملف شخصي جذاب للآخرين</li>
                <li>• ضمان بيئة آمنة ومناسبة للجميع</li>
                <li>• تخصيص المحتوى حسب تفضيلاتك</li>
              </ul>
            </div>

            {isPreviewMode && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  أنت في وضع المعاينة. سيتم حفظ البيانات محلياً فقط.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileSetup


