import React, { useState, useRef, useEffect } from "react";
import {
  Info,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Save,
  HelpCircle,
  Cpu,
  Layers,
  Award,
  X,
  Upload,
  Compass,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AdminAboutUsPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // ==========================================
  // 1. فورم: الهيرو الرئيسي (مرتبط بـ about_hero_tracks)
  // ==========================================
  const [futureForm, setFutureForm] = useState({
    trackName: "مسار الطلاب",
    badge: "انطلاقـة قوية نحو سوق العمل",
    title: "ابنِ أساسك البرامجي والمهني من الصفر للاحتراف",
    description:
      "مصمم خصيصاً للباحثين عن بداية حقيقية في عالم التكنولوجيا مع مشاريع عملية وتوجيه مستمر.",
    iconFile: null as File | null,
    iconPreview: "https://cdn-icons-png.flaticon.com/512/2621/2621015.png",
    features: [
      "مناسب للمبتدئين تماماً",
      "مشاريع تخرج حقيقية",
      "شهادة إتمام معتمدة",
    ],
  });

  const [tempFeature, setTempFeature] = useState("");
  const [futureRecords, setFutureRecords] = useState<any[]>([]);
  const [editingFutureId, setEditingFutureId] = useState<number | null>(null);

  const futureIconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAboutHeroData();
    fetchExpertData();
    fetchEcosystemData();
    fetchFaqData();
  }, []);

  const fetchAboutHeroData = async () => {
    const { data, error } = await supabase
      .from("about_hero_tracks")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) {
      setFutureRecords(data);
    }
  };

  const handleAddFeature = () => {
    if (tempFeature.trim()) {
      setFutureForm({
        ...futureForm,
        features: [...futureForm.features, tempFeature.trim()],
      });
      setTempFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFutureForm({
      ...futureForm,
      features: futureForm.features.filter((_, i) => i !== index),
    });
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFutureForm({
          ...futureForm,
          iconFile: file,
          iconPreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveFuture = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      track_name: futureForm.trackName,
      badge: futureForm.badge,
      title: futureForm.title,
      description: futureForm.description,
      features: futureForm.features,
      icon_url: futureForm.iconPreview,
    };

    if (editingFutureId !== null) {
      const { error } = await supabase
        .from("about_hero_tracks")
        .update(payload)
        .eq("id", editingFutureId);
      if (error) {
        alert("فشل التعديل: " + error.message);
      } else {
        showSuccess("تم تحديث المسار بنجاح!");
        setEditingFutureId(null);
        fetchAboutHeroData();
      }
    } else {
      const { error } = await supabase
        .from("about_hero_tracks")
        .insert([payload]);
      if (error) {
        alert("حدث خطأ أثناء الحفظ: " + error.message);
      } else {
        showSuccess("تم حفظ المسار بنجاح!");
        fetchAboutHeroData();
      }
    }
    setFutureForm({
      trackName: "مسار الطلاب",
      badge: "انطلاقـة قوية نحو سوق العمل",
      title: "ابنِ أساسك البرامجي والمهني من الصفر للاحتراف",
      description: "مصمم خصيصاً للباحثين عن بداية حقيقية في عالم التكنولوجيا.",
      iconFile: null,
      iconPreview: "https://cdn-icons-png.flaticon.com/512/2621/2621015.png",
      features: ["مناسب للمبتدئين تماماً"],
    });
  };

  const handleEditFuture = (record: any) => {
    setEditingFutureId(record.id);
    setFutureForm({
      trackName: record.track_name || "",
      badge: record.badge || "",
      title: record.title || "",
      description: record.description || "",
      iconFile: null,
      iconPreview: record.icon_url || "",
      features: record.features || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteFuture = async (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      const { error } = await supabase
        .from("about_hero_tracks")
        .delete()
        .eq("id", id);
      if (!error) {
        setFutureRecords(futureRecords.filter((r) => r.id !== id));
        showSuccess("تم الحذف بنجاح");
      } else {
        alert("فشل الحذف: " + error.message);
      }
    }
  };

  // ==========================================
  // 2. فورم: عن خبرات والإحصائيات (about_experts)
  // ==========================================
  const [expertForm, setExpertForm] = useState({ count: "", name: "" });
  const [expertRecords, setExpertRecords] = useState<any[]>([]);
  const [editingExpertId, setEditingExpertId] = useState<number | null>(null);

  const fetchExpertData = async () => {
    const { data } = await supabase
      .from("about_experts")
      .select("*")
      .order("id", { ascending: false });
    if (data) setExpertRecords(data);
  };

  const handleSaveExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpertId !== null) {
      const { error } = await supabase
        .from("about_experts")
        .update(expertForm)
        .eq("id", editingExpertId);
      if (error) {
        alert("فشل التحديث: " + error.message);
      } else {
        showSuccess("تم تحديث الخبرة/الإحصائية بنجاح!");
        setEditingExpertId(null);
        fetchExpertData();
      }
    } else {
      const { error } = await supabase
        .from("about_experts")
        .insert([expertForm]);
      if (error) {
        alert("فشل الإضافة: " + error.message);
      } else {
        showSuccess("تم إضافة الخبرة/الإحصائية بنجاح!");
        fetchExpertData();
      }
    }
    setExpertForm({ count: "", name: "" });
  };

  const handleEditExpert = (rec: any) => {
    setEditingExpertId(rec.id);
    setExpertForm({ count: rec.count, name: rec.name });
  };

  const handleDeleteExpert = async (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      const { error } = await supabase
        .from("about_experts")
        .delete()
        .eq("id", id);
      if (!error) {
        setExpertRecords(expertRecords.filter((r) => r.id !== id));
        showSuccess("تم الحذف بنجاح");
      } else {
        alert("فشل الحذف: " + error.message);
      }
    }
  };

  // ==========================================
  // 3. فورم: منظومة متكاملة (about_ecosystem)
  // ==========================================
  const [ecosystemForm, setEcosystemForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    sub_description: "",
    features: [] as string[],
  });
  const [tempEcoFeature, setTempEcoFeature] = useState("");
  const [ecosystemRecords, setEcosystemRecords] = useState<any[]>([]);
  const [editingEcoId, setEditingEcoId] = useState<number | null>(null);

  const fetchEcosystemData = async () => {
    const { data } = await supabase
      .from("about_ecosystem")
      .select("*")
      .order("id", { ascending: false });
    if (data) setEcosystemRecords(data);
  };

  const handleAddEcoFeature = () => {
    if (tempEcoFeature.trim()) {
      setEcosystemForm({
        ...ecosystemForm,
        features: [...ecosystemForm.features, tempEcoFeature.trim()],
      });
      setTempEcoFeature("");
    }
  };

  const handleRemoveEcoFeature = (index: number) => {
    setEcosystemForm({
      ...ecosystemForm,
      features: ecosystemForm.features.filter((_, i) => i !== index),
    });
  };

  const handleSaveEcosystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEcoId !== null) {
      const { error } = await supabase
        .from("about_ecosystem")
        .update(ecosystemForm)
        .eq("id", editingEcoId);
      if (error) {
        alert("فشل التحديث: " + error.message);
      } else {
        showSuccess("تم تحديث المنظومة بنجاح!");
        setEditingEcoId(null);
        fetchEcosystemData();
      }
    } else {
      const { error } = await supabase
        .from("about_ecosystem")
        .insert([ecosystemForm]);
      if (error) {
        alert("فشل الحفظ: " + error.message);
      } else {
        showSuccess("تم حفظ المنظومة بنجاح!");
        fetchEcosystemData();
      }
    }
    setEcosystemForm({
      title: "",
      subtitle: "",
      description: "",
      sub_description: "",
      features: [],
    });
  };

  const handleEditEcosystem = (rec: any) => {
    setEditingEcoId(rec.id);
    setEcosystemForm({
      title: rec.title || "",
      subtitle: rec.subtitle || "",
      description: rec.description || "",
      sub_description: rec.sub_description || "",
      features: rec.features || [],
    });
  };

  const handleDeleteEcosystem = async (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      const { error } = await supabase
        .from("about_ecosystem")
        .delete()
        .eq("id", id);
      if (!error) {
        setEcosystemRecords(ecosystemRecords.filter((r) => r.id !== id));
        showSuccess("تم الحذف بنجاح");
      } else {
        alert("فشل الحذف: " + error.message);
      }
    }
  };

  // ==========================================
  // 4. فورم: الأسئلة الشائعة (about_faqs)
  // ==========================================
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [faqRecords, setFaqRecords] = useState<any[]>([]);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);

  const fetchFaqData = async () => {
    const { data, error } = await supabase
      .from("about_faqs")
      .select("*")
      .order("id", { ascending: false });
    if (!error && data) {
      setFaqRecords(data);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaqId !== null) {
      const { error } = await supabase
        .from("about_faqs")
        .update(faqForm)
        .eq("id", editingFaqId);
      if (error) {
        alert("فشل تحديث السؤال: " + error.message);
      } else {
        showSuccess("تم تحديث السؤال بنجاح!");
        setEditingFaqId(null);
        fetchFaqData();
      }
    } else {
      const { error } = await supabase.from("about_faqs").insert([faqForm]);
      if (error) {
        alert("فشل إضافة السؤال: " + error.message);
      } else {
        showSuccess("تم إضافة السؤال بنجاح!");
        fetchFaqData();
      }
    }
    setFaqForm({ question: "", answer: "" });
  };

  const handleEditFaq = (rec: any) => {
    setEditingFaqId(rec.id);
    setFaqForm({ question: rec.question, answer: rec.answer });
  };

  const handleDeleteFaq = async (id: number) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      const { error } = await supabase.from("about_faqs").delete().eq("id", id);
      if (!error) {
        setFaqRecords(faqRecords.filter((r) => r.id !== id));
        showSuccess("تم الحذف بنجاح");
      } else {
        alert("فشل الحذف: " + error.message);
      }
    }
  };

  return (
    <div className="space-y-10 pb-16 bg-white text-slate-800" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/25 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <Info size={14} />
            إدارة صفحة "من نحن" التعليمية - لوحة المسؤول
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            إدارة محتوى صفحة من نحن (About Us)
          </h1>
          <p className="text-purple-100 text-xs sm:text-sm">
            إدارة المسارات المخصصة، الإحصائيات، المنظومة، والأسئلة الشائعة مع
            إمكانية التعديل والحذف الكامل.
          </p>
        </div>
      </div>

      {/* رسالة النجاح */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {/* ================= 1. فورم: الهيرو الرئيسي ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingFutureId
                  ? "تعديل مسار رئيسي"
                  : "فورم: القسم الرئيسي (about_hero_tracks)"}
              </h2>
              <p className="text-xs text-slate-500">
                إضافة أو تحديث تفاصيل المسارات الرئيسية.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveFuture} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Compass size={14} className="text-purple-600" />
                اسم المسار
              </label>
              <input
                type="text"
                value={futureForm.trackName}
                onChange={(e) =>
                  setFutureForm({ ...futureForm, trackName: e.target.value })
                }
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-bold text-purple-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نص الشارة العلوي (Badge)
              </label>
              <input
                type="text"
                value={futureForm.badge}
                onChange={(e) =>
                  setFutureForm({ ...futureForm, badge: e.target.value })
                }
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              العنوان الرئيسي
            </label>
            <input
              type="text"
              value={futureForm.title}
              onChange={(e) =>
                setFutureForm({ ...futureForm, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
              required
            />
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              أيقونة المسار
            </label>
            <div className="flex items-center gap-4">
              <img
                src={futureForm.iconPreview}
                alt=""
                className="w-12 h-12 rounded-xl object-contain border border-purple-200 bg-white p-1.5 shrink-0"
              />
              <input
                type="file"
                ref={futureIconRef}
                onChange={handleIconFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => futureIconRef.current?.click()}
                className="px-4 py-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Upload size={14} /> اختيار ملف
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف المسار
            </label>
            <textarea
              rows={3}
              value={futureForm.description}
              onChange={(e) =>
                setFutureForm({ ...futureForm, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              مميزات هذا المسار
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempFeature}
                onChange={(e) => setTempFeature(e.target.value)}
                placeholder="أدخل ميزة..."
                className="flex-1 px-4 py-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2.5 bg-purple-100 text-purple-700 font-bold rounded-xl text-xs"
              >
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {futureForm.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold"
                >
                  {feat}{" "}
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-rose-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <Save size={16} />{" "}
              <span>{editingFutureId ? "تحديث التعديلات" : "حفظ وإرسال"}</span>
            </button>
            {editingFutureId && (
              <button
                type="button"
                onClick={() => {
                  setEditingFutureId(null);
                  setFutureForm({
                    trackName: "",
                    badge: "",
                    title: "",
                    description: "",
                    iconFile: null,
                    iconPreview: "",
                    features: [],
                  });
                }}
                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            السجلات المخزنة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {futureRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={rec.icon_url}
                    alt=""
                    className="w-10 h-10 rounded-xl object-contain bg-white p-1 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md block w-fit mb-1">
                      {rec.track_name}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {rec.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditFuture(rec)}
                    className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 text-xs"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteFuture(rec.id)}
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

      {/* ================= 2. فورم: الإحصائيات (about_experts) ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
            <Award size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingExpertId
                ? "تعديل خبرة / إحصائية"
                : "فورم: الإحصائيات (about_experts)"}
            </h2>
            <p className="text-xs text-slate-500">
              إدارة أعداد الطلاب والتدريبات.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSaveExpert}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              العدد / القيمة
            </label>
            <input
              type="text"
              value={expertForm.count}
              onChange={(e) =>
                setExpertForm({ ...expertForm, count: e.target.value })
              }
              className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الوصف
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertForm.name}
                onChange={(e) =>
                  setExpertForm({ ...expertForm, name: e.target.value })
                }
                className="flex-1 px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0"
              >
                <PlusCircle size={16} />{" "}
                <span>{editingExpertId ? "تحديث" : "إضافة"}</span>
              </button>
            </div>
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            سجل الإحصائيات
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expertRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl"
              >
                <div>
                  <span className="text-xs font-black text-purple-700 block">
                    {rec.count}
                  </span>
                  <h4 className="text-xs font-medium text-slate-800">
                    {rec.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditExpert(rec)}
                    className="p-1.5 bg-white text-indigo-600 rounded-lg border border-indigo-200"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteExpert(rec.id)}
                    className="p-1.5 bg-white text-rose-600 rounded-lg border border-rose-200"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 3. فورم: منظومة متكاملة (about_ecosystem) ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingEcoId
                ? "تعديل منظومة"
                : "فورم: منظومة تعليمية متكاملة (about_ecosystem)"}
            </h2>
            <p className="text-xs text-slate-500">
              إدارة تفاصيل المنظومة والعناوين والأوصاف والمميزات.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveEcosystem} className="space-y-4">
          {/* الصف الأول: العنوان الرئيسي + العنوان الفرعي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                العنوان الرئيسي
              </label>
              <input
                type="text"
                value={ecosystemForm.title}
                onChange={(e) =>
                  setEcosystemForm({ ...ecosystemForm, title: e.target.value })
                }
                placeholder="أدخل العنوان الرئيسي..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                العنوان الفرعي
              </label>
              <input
                type="text"
                value={ecosystemForm.subtitle}
                onChange={(e) =>
                  setEcosystemForm({
                    ...ecosystemForm,
                    subtitle: e.target.value,
                  })
                }
                placeholder="أدخل العنوان الفرعي..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
                required
              />
            </div>
          </div>

          {/* الصف الثاني: الوصف الرئيسي + الوصف الفرعي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الوصف الرئيسي
              </label>
              <textarea
                rows={2}
                value={ecosystemForm.description}
                onChange={(e) =>
                  setEcosystemForm({
                    ...ecosystemForm,
                    description: e.target.value,
                  })
                }
                placeholder="أدخل الوصف الرئيسي..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الوصف الفرعي
              </label>
              <textarea
                rows={2}
                value={ecosystemForm.sub_description}
                onChange={(e) =>
                  setEcosystemForm({
                    ...ecosystemForm,
                    sub_description: e.target.value,
                  })
                }
                placeholder="أدخل الوصف الفرعي..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm resize-none"
                required
              />
            </div>
          </div>

          {/* المميزات */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              المميزات
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempEcoFeature}
                onChange={(e) => setTempEcoFeature(e.target.value)}
                placeholder="أدخل ميزة جديدة..."
                className="flex-1 px-4 py-2.5 bg-purple-50/40 border border-purple-200 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={handleAddEcoFeature}
                className="px-4 py-2.5 bg-purple-100 text-purple-700 font-bold rounded-xl text-xs"
              >
                إضافة ميزة
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {ecosystemForm.features.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold"
                >
                  {feat}{" "}
                  <button
                    type="button"
                    onClick={() => handleRemoveEcoFeature(idx)}
                    className="text-rose-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* زر الحفظ / التعديل */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <Save size={16} />{" "}
              <span>{editingEcoId ? "تحديث المنظومة" : "حفظ المنظومة"}</span>
            </button>
            {editingEcoId && (
              <button
                type="button"
                onClick={() => {
                  setEditingEcoId(null);
                  setEcosystemForm({
                    title: "",
                    subtitle: "",
                    description: "",
                    sub_description: "",
                    features: [],
                  });
                }}
                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>

        {/* سجلات المنظومة المخزنة */}
        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            سجلات المنظومة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ecosystemRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {rec.subtitle}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditEcosystem(rec)}
                    className="p-2 bg-white text-indigo-600 rounded-xl border border-indigo-200"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteEcosystem(rec.id)}
                    className="p-2 bg-white text-rose-600 rounded-xl border border-rose-200"
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

      {/* ================= 4. فورم: الأسئلة الشائعة (مرتبط بـ about_faqs) ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingFaqId
                ? "تعديل سؤال شائع"
                : "فورم: الأسئلة الشائعة (about_faqs)"}
            </h2>
            <p className="text-xs text-slate-500">إضافة أو تعديل الأسئلة.</p>
          </div>
        </div>

        <form onSubmit={handleSaveFaq} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              العنوان أو السؤال
            </label>
            <input
              type="text"
              value={faqForm.question}
              onChange={(e) =>
                setFaqForm({ ...faqForm, question: e.target.value })
              }
              className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الإجابة
            </label>
            <textarea
              rows={2}
              value={faqForm.answer}
              onChange={(e) =>
                setFaqForm({ ...faqForm, answer: e.target.value })
              }
              className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm resize-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <PlusCircle size={16} />{" "}
              <span>
                {editingFaqId ? "تحديث السؤال" : "إضافة السؤال الشائع"}
              </span>
            </button>
            {editingFaqId && (
              <button
                type="button"
                onClick={() => {
                  setEditingFaqId(null);
                  setFaqForm({ question: "", answer: "" });
                }}
                className="px-4 py-3 bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            سجل الأسئلة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {rec.question}
                  </h4>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditFaq(rec)}
                    className="p-2 bg-white text-indigo-600 rounded-xl border border-indigo-200"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(rec.id)}
                    className="p-2 bg-white text-rose-600 rounded-xl border border-rose-200"
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