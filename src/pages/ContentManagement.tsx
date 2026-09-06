import { useState, useEffect, useRef } from "react";
import {
  FolderTree,
  Upload,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Users,
  Sparkles,
  Save,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AdminContentPage() {
  // 1. حالة نموذج تعديل الهوم بيدج (الواجهة الرئيسية)
  const [heroForm, setHeroForm] = useState({
    title: "منصة zed التعليمية الأولى في مصر",
    subtitle: "تعلم البرمجة، اللغات، والعلوم بطريقة احترافية مع نخبة من أفضل المدرسين والخبراء.",
    imageFile: null as File | null,
    imagePreview: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
  });

  const [heroRecords, setHeroRecords] = useState<any[]>([]);

  // 2. حالة نموذج الإحصائيات والخبراء (مربوط بقاعدة البيانات + رفع أيقونة)
  const [expertForm, setExpertForm] = useState({
    name: "طالب نشط يتعلم معنا",
    count: "+15 ألف",
    iconFile: null as File | null,
    iconPreview: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  });

  const [expertRecords, setExpertRecords] = useState<any[]>([]);

  const [successMsg, setSuccessMsg] = useState("");
  const heroImageRef = useRef<HTMLInputElement>(null);
  const expertIconRef = useRef<HTMLInputElement>(null);

  // جلب البيانات من Supabase عند التحميل (الهوم + الإحصائيات)
  useEffect(() => {
    async function fetchData() {
      // جلب بيانات الهيرو
      const { data: heroData } = await supabase
        .from("hero_section")
        .select("*")
        .order("id", { ascending: false });

      if (heroData) {
        setHeroRecords(
          heroData.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            image: item.image_url,
            updatedAt: item.created_at ? item.created_at.split("T")[0] : "حديث",
          }))
        );
      }

      // جلب بيانات الإحصائيات من جدول platform_stats الجديد
      const { data: statsData } = await supabase
        .from("platform_stats")
        .select("*")
        .order("id", { ascending: false });

      if (statsData) {
        setExpertRecords(
          statsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            count: item.count,
            icon: item.icon_url,
          }))
        );
      }
    }

    fetchData();
  }, []);

  // اختيار صورة الهيرو
  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setHeroForm({ ...heroForm, imageFile: file, imagePreview: url });
    }
  };

  // اختيار أيقونة الإحصائية
  const handleExpertIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setExpertForm({ ...expertForm, iconFile: file, iconPreview: url });
    }
  };

  // حفظ تعديل الهوم بيدج
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalImageUrl = heroForm.imagePreview;

      if (heroForm.imageFile) {
        const fileExt = heroForm.imageFile.name.split(".").pop();
        const fileName = `hero_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("site-images")
          .upload(fileName, heroForm.imageFile);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("site-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicURLData.publicUrl;
      }

      const { data, error: dbError } = await supabase
        .from("hero_section")
        .insert([{ title: heroForm.title, subtitle: heroForm.subtitle, image_url: finalImageUrl }])
        .select();

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        setHeroRecords([
          {
            id: data[0].id,
            title: data[0].title,
            subtitle: data[0].subtitle,
            image: data[0].image_url,
            updatedAt: new Date().toISOString().split("T")[0],
          },
          ...heroRecords,
        ]);
      }

      setSuccessMsg("تم حفظ بيانات الهوم بيدج بنجاح!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error: any) {
      alert(`حدث خطأ: ${error.message || "خطأ غير معروف"}`);
    }
  };

  // حفظ الإحصائية الجديدة في قاعدة البيانات (مع رفع الأيقونة)
  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalIconUrl = expertForm.iconPreview;

      // رفع الأيقونة إلى Supabase Storage إذا تم اختيار ملف جديد
      if (expertForm.iconFile) {
        const fileExt = expertForm.iconFile.name.split(".").pop();
        const fileName = `stat_icon_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("site-images")
          .upload(fileName, expertForm.iconFile);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("site-images")
          .getPublicUrl(fileName);

        finalIconUrl = publicURLData.publicUrl;
      }

      // الإدخال في جدول platform_stats الجديد
      const { data, error: dbError } = await supabase
        .from("platform_stats")
        .insert([
          {
            name: expertForm.name,
            count: expertForm.count,
            icon_url: finalIconUrl,
          },
        ])
        .select();

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        setExpertRecords([
          {
            id: data[0].id,
            name: data[0].name,
            count: data[0].count,
            icon: data[0].icon_url,
          },
          ...expertRecords,
        ]);
      }

      setSuccessMsg("تم حفظ الإحصائية ورفع الأيقونة إلى قاعدة البيانات بنجاح!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error: any) {
      alert(`حدث خطأ أثناء حفظ الإحصائية: ${error.message || "خطأ غير معروف"}`);
    }
  };

  // حذف سجل الهيرو
  const handleDeleteHeroRecord = async (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      const { error } = await supabase.from("hero_section").delete().eq("id", id);
      if (!error) setHeroRecords(heroRecords.filter((r) => r.id !== id));
    }
  };

  // حذف سجل الإحصائية من قاعدة البيانات
  const handleDeleteExpertRecord = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الإحصائية من قاعدة البيانات؟")) {
      const { error } = await supabase.from("platform_stats").delete().eq("id", id);
      if (!error) {
        setExpertRecords(expertRecords.filter((r) => r.id !== id));
      } else {
        alert("فشل الحذف من قاعدة البيانات");
      }
    }
  };

  return (
    <div className="space-y-10 pb-16 bg-white text-slate-800" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <FolderTree size={14} />
            إدارة المحتوى والأقسام - لوحة المسؤول
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">إدارة الهوم بيدج والخبراء والإحصائيات</h1>
          <p className="text-purple-100 text-xs sm:text-sm">تعديل محتوى الصفحة والتحكم بقاعدة بيانات Supabase بالكامل.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {/* ================= FORM 1: الهوم بيدج ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">فورم: تعديل على هوم البيدج</h2>
            <p className="text-xs text-slate-500">تغيير العنوان، الوصف، ورفع صورة الواجهة البارزة.</p>
          </div>
        </div>

        <form onSubmit={handleSaveHero} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الواجهة الرئيسي</label>
              <input
                type="text"
                value={heroForm.title}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف التعريفي</label>
              <textarea
                rows={3}
                value={heroForm.subtitle}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              <span> حفظ </span>
            </button>
          </div>

          <div className="space-y-3 bg-purple-50/30 p-4 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
            <label className="block text-xs font-bold text-purple-900 self-start">صورة الواجهة البارزة</label>
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-purple-200 bg-white">
              <img src={heroForm.imagePreview} alt="Hero Preview" className="w-full h-full object-cover" />
            </div>
            <input type="file" ref={heroImageRef} onChange={handleHeroImageChange} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => heroImageRef.current?.click()}
              className="w-full py-2.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>اختر صورة من جهازك</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">سجل التعديلات السابقة للهوم بيدج</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {heroRecords.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img src={rec.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{rec.title}</h4>
                    <span className="text-[10px] text-slate-500">التحديث: {rec.updatedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHeroForm({ ...heroForm, title: rec.title, subtitle: rec.subtitle, imagePreview: rec.image, imageFile: null })}
                    className="p-2 bg-white text-purple-600 hover:bg-purple-100 rounded-xl border border-purple-200 text-xs"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteHeroRecord(rec.id)}
                    className="p-2 bg-white text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 text-xs"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= FORM 2: إحصائيات المنصة (مربوط بقاعدة البيانات + رفع أيقونة) ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">فورم: إحصائيات المنصة (قاعدة بيانات + رفع أيقونة)</h2>
            <p className="text-xs text-slate-500">أدخل وصف الإحصائية والعدد، وقم برفع أيقونة حقيقية من جهازك.</p>
          </div>
        </div>

        <form onSubmit={handleSaveExpert} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان / وصف الإحصائية</label>
              <input
                type="text"
                value={expertForm.name}
                onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                placeholder="مثال: طالب نشط يتعلم معنا"
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">العدد / القيمة</label>
              <input
                type="text"
                value={expertForm.count}
                onChange={(e) => setExpertForm({ ...expertForm, count: e.target.value })}
                placeholder="مثال: +15 ألف"
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              <span>حفظ الإحصائية    </span>
            </button>
          </div>

          <div className="space-y-3 bg-purple-50/30 p-4 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
            <label className="block text-xs font-bold text-purple-900 self-start">أيقونة أو صورة الإحصائية</label>
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-300 bg-white shadow-inner">
              <img src={expertForm.iconPreview} alt="Icon Preview" className="w-full h-full object-cover" />
            </div>
            <input type="file" ref={expertIconRef} onChange={handleExpertIconChange} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => expertIconRef.current?.click()}
              className="w-full py-2.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>اختر الأيقونة من جهازك</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">سجل الإحصائيات الحالية (من Supabase)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expertRecords.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-purple-50/40 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <img src={item.icon} alt="" className="w-10 h-10 rounded-full object-cover border border-purple-200 shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-purple-700 block mb-0.5">{item.count}</span>
                    <h4 className="text-xs font-medium text-slate-900 line-clamp-1">{item.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteExpertRecord(item.id)}
                    className="p-2 bg-white text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 text-xs"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}