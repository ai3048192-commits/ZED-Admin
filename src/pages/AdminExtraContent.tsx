import { useState, useRef, useEffect } from "react";
import {
  Layers,
  Upload,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Save,
  Compass,
  Rocket,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AdminExtraContentPage() {
  const [successMsg, setSuccessMsg] = useState("");

  // ================= 1. قسم التخصصات الدراسية (Specialties) =================
  const [specialtyForm, setSpecialtyForm] = useState({
    title: "",
    description: "",
    methodology: "",
    coursesCount: "",
    imageFile: null as File | null,
    imagePreview: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
  });

  const [specialtyRecords, setSpecialtyRecords] = useState<any[]>([]);
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<number | null>(null);
  const specialtyImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  async function fetchSpecialties() {
    const { data, error } = await supabase
      .from("specialties")
      .select("*")
      .order("id", { ascending: false });

    if (data && !error) {
      setSpecialtyRecords(
        data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          methodology: item.methodology,
          coursesCount: item.courses_count,
          image: item.image_url,
        }))
      );
    }
  }

  const handleSpecialtyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSpecialtyForm({ ...specialtyForm, imageFile: file, imagePreview: url });
    }
  };

  const handleSaveSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalImageUrl = specialtyForm.imagePreview;

      if (specialtyForm.imageFile) {
        const fileExt = specialtyForm.imageFile.name.split(".").pop();
        const fileName = `specialty_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("site-images")
          .upload(fileName, specialtyForm.imageFile);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("site-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicURLData.publicUrl;
      }

      if (editingSpecialtyId !== null) {
        // عملية تعديل (Update)
        const { error: updateError } = await supabase
          .from("specialties")
          .update({
            title: specialtyForm.title,
            description: specialtyForm.description,
            methodology: specialtyForm.methodology,
            courses_count: specialtyForm.coursesCount,
            image_url: finalImageUrl,
          })
          .eq("id", editingSpecialtyId);

        if (updateError) throw updateError;
        setSuccessMsg("تم تحديث التخصص الدراسي بنجاح!");
      } else {
        // عملية إضافة جديدة (Insert)
        const { error: dbError } = await supabase
          .from("specialties")
          .insert([
            {
              title: specialtyForm.title,
              description: specialtyForm.description,
              methodology: specialtyForm.methodology,
              courses_count: specialtyForm.coursesCount,
              image_url: finalImageUrl,
            },
          ]);

        if (dbError) throw dbError;
        setSuccessMsg("تم إضافة التخصص الدراسي بنجاح!");
      }

      resetSpecialtyForm();
      fetchSpecialties();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error: any) {
      alert(`حدث خطأ: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const handleEditSpecialtyClick = (rec: any) => {
    setEditingSpecialtyId(rec.id);
    setSpecialtyForm({
      title: rec.title,
      description: rec.description,
      methodology: rec.methodology,
      coursesCount: rec.coursesCount,
      imageFile: null,
      imagePreview: rec.image,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetSpecialtyForm = () => {
    setEditingSpecialtyId(null);
    setSpecialtyForm({
      title: "",
      description: "",
      methodology: "",
      coursesCount: "",
      imageFile: null,
      imagePreview: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
    });
  };

  const handleDeleteSpecialty = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التخصص؟")) {
      const { error } = await supabase.from("specialties").delete().eq("id", id);
      if (!error) {
        setSpecialtyRecords(specialtyRecords.filter((r) => r.id !== id));
        if (editingSpecialtyId === id) resetSpecialtyForm();
      } else {
        alert("فشل الحذف من قاعدة البيانات");
      }
    }
  };


  // ================= 2. قسم خطوات الرحلة (Journey Steps) =================
  const [journeyForm, setJourneyForm] = useState({
    title: "",
    description: "",
    imageFile: null as File | null,
    imagePreview: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop",
  });

  const [journeyRecords, setJourneyRecords] = useState<any[]>([]);
  const [editingJourneyId, setEditingJourneyId] = useState<number | null>(null);
  const journeyImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJourneySteps();
  }, []);

  async function fetchJourneySteps() {
    const { data, error } = await supabase
      .from("journey_steps")
      .select("*")
      .order("id", { ascending: false });

    if (data && !error) {
      setJourneyRecords(
        data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          image: item.image_url,
        }))
      );
    }
  }

  const handleJourneyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setJourneyForm({ ...journeyForm, imageFile: file, imagePreview: url });
    }
  };

  const handleSaveJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalImageUrl = journeyForm.imagePreview;

      if (journeyForm.imageFile) {
        const fileExt = journeyForm.imageFile.name.split(".").pop();
        const fileName = `journey_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("journey-images")
          .upload(fileName, journeyForm.imageFile);

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("journey-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicURLData.publicUrl;
      }

      if (editingJourneyId !== null) {
        // تحديث خطوة الرحلة
        const { error: updateError } = await supabase
          .from("journey_steps")
          .update({
            title: journeyForm.title,
            description: journeyForm.description,
            image_url: finalImageUrl,
          })
          .eq("id", editingJourneyId);

        if (updateError) throw updateError;
        setSuccessMsg("تم تحديث خطوة الرحلة بنجاح!");
      } else {
        // إضافة خطوة جديدة
        const { error: dbError } = await supabase
          .from("journey_steps")
          .insert([
            {
              title: journeyForm.title,
              description: journeyForm.description,
              image_url: finalImageUrl,
            },
          ]);

        if (dbError) throw dbError;
        setSuccessMsg("تم إضافة خطوة الرحلة بنجاح!");
      }

      resetJourneyForm();
      fetchJourneySteps();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error: any) {
      alert(`حدث خطأ: ${error.message || "خطأ غير معروف"}`);
    }
  };

  const handleEditJourneyClick = (rec: any) => {
    setEditingJourneyId(rec.id);
    setJourneyForm({
      title: rec.title,
      description: rec.description,
      imageFile: null,
      imagePreview: rec.image,
    });
    window.scrollTo({ top: 500, behavior: "smooth" });
  };

  const resetJourneyForm = () => {
    setEditingJourneyId(null);
    setJourneyForm({
      title: "",
      description: "",
      imageFile: null,
      imagePreview: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop",
    });
  };

  const handleDeleteJourney = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخطوة؟")) {
      const { error } = await supabase.from("journey_steps").delete().eq("id", id);
      if (!error) {
        setJourneyRecords(journeyRecords.filter((r) => r.id !== id));
        if (editingJourneyId === id) resetJourneyForm();
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
          <span className="px-3 py-1 bg-white/25 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <Layers size={14} />
            إدارة المحتوى المتقدم - لوحة المسؤول
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">إدارة التخصصات والرحلة الدراسية</h1>
          <p className="text-purple-100 text-xs sm:text-sm">إضافة، تعديل، وحذف البيانات مع رفع الصور الحقيقية مباشرة.</p>
        </div>
      </div>

      {/* رسالة نجاح عامة */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {/* ================= 1. فورم استكشف التخصصات الدراسية ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingSpecialtyId !== null ? "تعديل التخصص الدراسي الحالي" : "إضافة تخصص دراسي جديد"}
              </h2>
              <p className="text-xs text-slate-500">مربوط بجدول specialties وتخزين الصور.</p>
            </div>
          </div>
          {editingSpecialtyId !== null && (
            <button
              onClick={resetSpecialtyForm}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <X size={14} />
              <span>إلغاء التعديل</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveSpecialty} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان التخصص</label>
              <input
                type="text"
                value={specialtyForm.title}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف التعريفي</label>
                <textarea
                  rows={2}
                  value={specialtyForm.description}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف المنهجي</label>
                <textarea
                  rows={2}
                  value={specialtyForm.methodology}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, methodology: e.target.value })}
                  className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الدورات</label>
              <input
                type="text"
                value={specialtyForm.coursesCount}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, coursesCount: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <Save size={16} />
              <span>{editingSpecialtyId !== null ? "تحديث التخصص" : "حفظ التخصص الجديد"}</span>
            </button>
          </div>

          <div className="space-y-3 bg-purple-50/30 p-4 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
            <label className="block text-xs font-bold text-purple-900 self-start">صورة التخصص</label>
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-purple-200 bg-white">
              <img src={specialtyForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <input type="file" ref={specialtyImageRef} onChange={handleSpecialtyImageChange} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => specialtyImageRef.current?.click()}
              className="w-full py-2.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>اختر صورة جديدة</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">السجلات المحفوظة والتعديل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specialtyRecords.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img src={rec.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                    <span className="text-[10px] text-purple-700 font-bold block">{rec.coursesCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditSpecialtyClick(rec)}
                    className="p-2 bg-white text-purple-600 hover:bg-purple-50 rounded-xl border border-purple-200 text-xs"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteSpecialty(rec.id)}
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

      {/* ================= 2. فورم كيف تبدأ رحلتك مع ZED؟ ================= */}
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
              <Rocket size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingJourneyId !== null ? "تعديل خطوة الرحلة الحالية" : "إضافة خطوة رحلة جديدة"}
              </h2>
              <p className="text-xs text-slate-500">مربوط بجدول journey_steps وتخزين الصور.</p>
            </div>
          </div>
          {editingJourneyId !== null && (
            <button
              onClick={resetJourneyForm}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <X size={14} />
              <span>إلغاء التعديل</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveJourney} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الخطوة</label>
              <input
                type="text"
                value={journeyForm.title}
                onChange={(e) => setJourneyForm({ ...journeyForm, title: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف التفصيلي</label>
              <textarea
                rows={3}
                value={journeyForm.description}
                onChange={(e) => setJourneyForm({ ...journeyForm, description: e.target.value })}
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              <span>{editingJourneyId !== null ? "تحديث خطوة الرحلة" : "حفظ خطوة الرحلة الجديدة"}</span>
            </button>
          </div>

          <div className="space-y-3 bg-purple-50/30 p-4 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
            <label className="block text-xs font-bold text-purple-900 self-start">صورة الخطوة</label>
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-purple-200 bg-white">
              <img src={journeyForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <input type="file" ref={journeyImageRef} onChange={handleJourneyImageChange} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={() => journeyImageRef.current?.click()}
              className="w-full py-2.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Upload size={14} />
              <span>اختر صورة جديدة</span>
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-purple-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">سجل الخطوات المحفوظة والتعديل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {journeyRecords.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3.5 bg-purple-50/40 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img src={rec.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-purple-200 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{rec.title}</h4>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{rec.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditJourneyClick(rec)}
                    className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-200 text-xs"
                    title="تعديل"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteJourney(rec.id)}
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