import { useState, useEffect } from "react";
import {
  Settings,
  Upload,
  Building2,
  MapPin,
  Mail,
  Phone,
  Clock,
  Globe,
  Save,
  CheckCircle2,
  X,
  Trash2,
  Loader2
} from "lucide-react";

import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaLinkedin, 
  FaWhatsapp 
} from "react-icons/fa";

import { supabase } from "../lib/supabaseClient"; // تأكد من مسار الـ client الصحيح

export default function AdminSettingsPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // بيانات المنصة الأساسية ووسائل التواصل
  const [settings, setSettings] = useState({
    platformName: "",
    address: "",
    email: "",
    phone: "",
    workHours: "",
    social: {
      facebook: "",
      twitter: "",
      instagram: "",
      whatsapp: "",
      youtube: "",
      linkedin: ""
    }
  });

  // حالة الشعار (Logo) مع المعاينة والرفع
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // جلب البيانات من جدول site_settings عند تحميل الصفحة
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .order("id", { ascending: false })
          .limit(1);

        if (data && data.length > 0 && !error) {
          const item = data[0];
          setSettings({
            platformName: item.site_name || "",
            address: item.address || "",
            email: item.email || "",
            phone: item.phone || "",
            workHours: item.work_hours || "",
            social: {
              facebook: item.facebook || "",
              twitter: item.twitter || "",
              instagram: item.instagram || "",
              whatsapp: item.whatsapp || "",
              youtube: item.youtube || "",
              linkedin: item.linkedin || ""
            }
          });
          if (item.logo_url) {
            setLogoPreview(item.logo_url);
          }
        }
      } catch (err) {
        console.error("خطأ في جلب الإعدادات:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // تحديث الحقول النصية
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // مسح أو حذف قيمة حقل معين
  const handleClearField = (fieldName: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [fieldName]: "" }));
    showSuccess(`تم حذف وتفريغ حقل ${fieldName}`);
  };

  // تحديث حقول وسائل التواصل
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      social: { ...prev.social, [name]: value }
    }));
  };

  // مسح حقل وسيلة تواصل اجتماعي
  const handleClearSocial = (socialName: keyof typeof settings.social) => {
    setSettings(prev => ({
      ...prev,
      social: { ...prev.social, [socialName]: "" }
    }));
    showSuccess(`تم حذف رابط ${socialName}`);
  };

  // رفع ومعاينة شعار المنصة
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        showSuccess("تم رفع وعرض الشعار بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    showSuccess("تم حذف شعار المنصة بنجاح.");
  };

  // حفظ التغييرات وإرسالها إلى Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // التحقق مما إذا كان هناك سجل موجود مسبقاً لتحديثه، أو إنشاء سجل جديد
      const { data: existingData } = await supabase
        .from("site_settings")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);

      const payload = {
        site_name: settings.platformName,
        logo_url: logoPreview || "",
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        work_hours: settings.workHours,
        facebook: settings.social.facebook,
        twitter: settings.social.twitter,
        instagram: settings.social.instagram,
        whatsapp: settings.social.whatsapp,
        youtube: settings.social.youtube,
        linkedin: settings.social.linkedin,
      };

      let error;
      if (existingData && existingData.length > 0) {
        // تحديث آخر سجل موجود
        const { error: updateError } = await supabase
          .from("site_settings")
          .update(payload)
          .eq("id", existingData[0].id);
        error = updateError;
      } else {
        // إدخال سجل جديد إذا لم يكن موجوداً
        const { error: insertError } = await supabase
          .from("site_settings")
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      showSuccess("تم حفظ كافة إعدادات المنصة في قاعدة البيانات بنجاح!");
    } catch (err) {
      console.error("خطأ أثناء الحفظ:", err);
      alert("حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3 text-purple-600 font-bold text-lg">
          <Loader2 className="animate-spin" size={28} />
          <span>جاري تحميل الإعدادات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 bg-white text-slate-800" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <Settings size={14} />
            إدارة إعدادات النظام العام - قاعدة البيانات
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">إعدادات النظام والهوية البصرية</h1>
          <p className="text-purple-100 text-xs sm:text-sm">تحكم كامل في هوية منصة أشطا، الشعار، بيانات الاتصال، وشبكات التواصل المرتبطة بـ Supabase.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {/* رسالة النجاح الفورية */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. بيانات المنصة الأساسية */}
        <div className="lg:col-span-2 bg-white border-2 border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold flex items-center gap-2 border-b border-purple-100 pb-4 text-slate-900">
            <Building2 size={20} className="text-purple-600" /> بيانات المنصة الأساسية
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>اسم المنصة</span>
                <button onClick={() => handleClearField("platformName")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </label>
              <input 
                name="platformName" 
                value={settings.platformName} 
                onChange={handleInputChange} 
                placeholder="أدخل اسم المنصة"
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>البريد الإلكتروني</span>
                <button onClick={() => handleClearField("email")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-3.5 text-purple-400" size={18}/>
                <input 
                  name="email" 
                  value={settings.email} 
                  onChange={handleInputChange} 
                  placeholder="أدخل البريد الإلكتروني"
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>رقم الهاتف</span>
                <button onClick={() => handleClearField("phone")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </label>
              <div className="relative">
                <Phone className="absolute right-4 top-3.5 text-purple-400" size={18}/>
                <input 
                  name="phone" 
                  value={settings.phone} 
                  onChange={handleInputChange} 
                  placeholder="أدخل رقم الهاتف"
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>ساعات العمل</span>
                <button onClick={() => handleClearField("workHours")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </label>
              <div className="relative">
                <Clock className="absolute right-4 top-3.5 text-purple-400" size={18}/>
                <input 
                  name="workHours" 
                  value={settings.workHours} 
                  onChange={handleInputChange} 
                  placeholder="أدخل ساعات العمل"
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                <span>العنوان التفصيلي</span>
                <button onClick={() => handleClearField("address")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </label>
              <div className="relative">
                <MapPin className="absolute right-4 top-3.5 text-purple-400" size={18}/>
                <input 
                  name="address" 
                  value={settings.address} 
                  onChange={handleInputChange} 
                  placeholder="أدخل العنوان التفصيلي"
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

          </div>
        </div>

        {/* 2. شعار المنصة (Logo) */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
          <h2 className="text-base font-bold w-full text-right border-b border-purple-100 pb-4 text-slate-900">شعار المنصة (Logo)</h2>
          
          <div className="w-36 h-36 bg-purple-50/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-purple-200 shadow-inner group relative overflow-hidden">
            {logoPreview ? (
              <>
                <img src={logoPreview} alt="Platform Logo" className="w-full h-full object-cover rounded-2xl" />
                <button 
                  onClick={handleRemoveLogo}
                  className="absolute top-2 left-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-all shadow"
                  title="حذف الشعار"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <Upload className="text-purple-400 group-hover:text-purple-600 transition-colors" size={36} />
            )}
          </div>

          <label className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-purple-200 flex items-center justify-center gap-2">
            <Upload size={14} /> {logoPreview ? "تغيير الشعار" : "رفع شعار جديد"}
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </label>
        </div>

        {/* 3. روابط وسائل التواصل الاجتماعي */}
        <div className="lg:col-span-3 bg-white border-2 border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold flex items-center justify-between border-b border-purple-100 pb-4 text-slate-900">
            <span className="flex items-center gap-2">
              <Globe size={20} className="text-purple-600" /> روابط وسائل التواصل الاجتماعي
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* فيسبوك */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>فيسبوك</span>
                <button onClick={() => handleClearSocial("facebook")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaFacebook className="absolute right-4 top-4 text-blue-600" size={18}/>
                <input 
                  name="facebook" 
                  placeholder="رابط فيسبوك" 
                  value={settings.social.facebook} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            {/* تويتر */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>تويتر / X</span>
                <button onClick={() => handleClearSocial("twitter")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaTwitter className="absolute right-4 top-4 text-sky-500" size={18}/>
                <input 
                  name="twitter" 
                  placeholder="رابط تويتر / X" 
                  value={settings.social.twitter} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            {/* إنستجرام */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>إنستجرام</span>
                <button onClick={() => handleClearSocial("instagram")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaInstagram className="absolute right-4 top-4 text-pink-600" size={18}/>
                <input 
                  name="instagram" 
                  placeholder="رابط إنستجرام" 
                  value={settings.social.instagram} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            {/* واتساب */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>واتساب</span>
                <button onClick={() => handleClearSocial("whatsapp")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaWhatsapp className="absolute right-4 top-4 text-emerald-600" size={18}/>
                <input 
                  name="whatsapp" 
                  placeholder="رقم واتساب" 
                  value={settings.social.whatsapp} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            {/* يوتيوب */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>يوتيوب</span>
                <button onClick={() => handleClearSocial("youtube")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaYoutube className="absolute right-4 top-4 text-rose-600" size={18}/>
                <input 
                  name="youtube" 
                  placeholder="رابط يوتيوب" 
                  value={settings.social.youtube} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

            {/* لينكد إن */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <span>لينكد إن</span>
                <button onClick={() => handleClearSocial("linkedin")} className="text-rose-500 hover:text-rose-700 text-[11px] flex items-center gap-1">
                  <Trash2 size={12} /> مسح
                </button>
              </div>
              <div className="relative">
                <FaLinkedin className="absolute right-4 top-4 text-blue-700" size={18}/>
                <input 
                  name="linkedin" 
                  placeholder="رابط لينكد إن" 
                  value={settings.social.linkedin} 
                  onChange={handleSocialChange} 
                  className="w-full pr-11 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium text-slate-900 transition-colors" 
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* زر الحفظ السفلي */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? "جاري الحفظ..." : "حفظ كافة الإعدادات"}
        </button>
      </div>
    </div>
  );
}