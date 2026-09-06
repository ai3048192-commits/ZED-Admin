import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Package,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Tag,
  DollarSign,
  FileText,
  ListPlus,
  X,
  Save,
  Loader2
} from "lucide-react";

interface PackageItem {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function AdminPackagesPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const [currentPackage, setCurrentPackage] = useState<PackageItem | null>(null);
  const [loading, setLoading] = useState(true);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // حقول نموذج الباقة الوحيدة
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // جلب الباقة الوحيدة من Supabase عند تحميل الصفحة
  useEffect(() => {
    fetchSinglePackage();
  }, []);

  const fetchSinglePackage = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCurrentPackage(data);
        // تعبئة الحقول تلقائياً في حال أراد المسؤول التعديل مباشرة
        setPackageName(data.name);
        setPackagePrice(data.price);
        setPackageDesc(data.description);
        setFeaturesList(data.features || []);
        setIsEditing(true);
      } else {
        setCurrentPackage(null);
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("خطأ في جلب الباقة:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // إضافة ميزة للقائمة المؤقتة
  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFeaturesList([...featuresList, featureInput.trim()]);
    setFeatureInput("");
  };

  // حذف ميزة من القائمة المؤقتة
  const handleRemoveFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, idx) => idx !== index));
  };

  // حفظ أو تحديث الباقة الوحيدة في Supabase
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName || !packagePrice || featuresList.length === 0) {
      alert("الرجاء إدخال اسم الباقة، السعر، ومميزاتها على الأقل!");
      return;
    }

    try {
      if (currentPackage) {
        // تحديث الباقة الحالية الموجودة مسبقاً
        const { error } = await supabase
          .from("packages")
          .update({
            name: packageName,
            price: packagePrice,
            description: packageDesc,
            features: featuresList,
          })
          .eq("id", currentPackage.id);

        if (error) throw error;

        setCurrentPackage({
          ...currentPackage,
          name: packageName,
          price: packagePrice,
          description: packageDesc,
          features: featuresList,
        });
        showSuccess("تم تحديث بيانات الباقة بنجاح!");
      } else {
        // إضافة الباقة لأول مرة (بما أنه لا يوجد غيرها)
        const { data, error } = await supabase
          .from("packages")
          .insert([
            {
              name: packageName,
              price: packagePrice,
              description: packageDesc,
              features: featuresList,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setCurrentPackage(data[0]);
          setIsEditing(true);
        }
        showSuccess("تم حفظ الباقة بنجاح!");
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء الحفظ: " + err.message);
    }
  };

  // تعبئة النموذج لتعديل الباقة الحالية
  const handleStartEdit = () => {
    if (!currentPackage) return;
    setPackageName(currentPackage.name);
    setPackagePrice(currentPackage.price);
    setPackageDesc(currentPackage.description);
    setFeaturesList([...currentPackage.features]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // حذف الباقة نهائياً
  const handleDeletePackage = async () => {
    if (!currentPackage) return;
    if (window.confirm("هل أنت متأكد من حذف هذه الباقة نهائياً؟")) {
      try {
        const { error } = await supabase.from("packages").delete().eq("id", currentPackage.id);
        if (error) throw error;

        setCurrentPackage(null);
        setPackageName("");
        setPackagePrice("");
        setPackageDesc("");
        setFeaturesList([]);
        setIsEditing(false);
        showSuccess("تم حذف الباقة بنجاح.");
      } catch (err: any) {
        alert("حدث خطأ أثناء الحذف: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 pb-16 bg-white text-slate-800" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/25 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <Package size={14} />
            إدارة الباقة الوحيدة - لوحة المسؤول
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">إدارة باقة المنصة الأساسية</h1>
          <p className="text-purple-100 text-xs sm:text-sm">تخصيص وتعديل تفاصيل وأسعار ومميزات الباقة المعروضة في المنصة.</p>
        </div>
      </div>

      {/* رسالة النجاح */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* نموذج الإضافة / التعديل */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-xs space-y-6 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {currentPackage ? "تعديل بيانات الباقة" : "إنشاء باقة المنصة"}
                </h2>
                <p className="text-xs text-slate-500">قم بتحديث بيانات الباقة الظاهرة للطلاب.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePackage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الباقة</label>
              <div className="relative">
                <span className="absolute right-3.5 top-3.5 text-slate-400"><Tag size={16} /></span>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="مثال: الباقة الشاملة..."
                  className="w-full pr-10 pl-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الباقة (ج.م)</label>
              <div className="relative">
                <span className="absolute right-3.5 top-3.5 text-slate-400"><DollarSign size={16} /></span>
                <input
                  type="text"
                  value={packagePrice}
                  onChange={(e) => setPackagePrice(e.target.value)}
                  placeholder="مثال: 1500"
                  className="w-full pr-10 pl-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف الباقة</label>
              <div className="relative">
                <span className="absolute right-3.5 top-3.5 text-slate-400"><FileText size={16} /></span>
                <textarea
                  rows={3}
                  value={packageDesc}
                  onChange={(e) => setPackageDesc(e.target.value)}
                  placeholder="اكتب وصفاً موجزاً لما تقدمه الباقة..."
                  className="w-full pr-10 pl-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">مميزات الباقة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="اكتب ميزة واضغط إضافة..."
                  className="w-full px-4 py-2.5 bg-purple-50/40 border border-purple-200 rounded-2xl text-xs focus:outline-none focus:border-purple-600 font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1"
                >
                  <ListPlus size={15} /> إضافة
                </button>
              </div>

              {featuresList.length > 0 && (
                <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200 space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-purple-900 block">المميزات المضافة ({featuresList.length}):</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {featuresList.map((feat, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-purple-100 text-xs">
                        <span className="text-slate-700 font-medium">• {feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Save size={16} />
              <span>{currentPackage ? "حفظ وتحديث الباقة" : "حفظ الباقة الجديدة"}</span>
            </button>
          </form>
        </div>

        {/* عرض المعاينة للباقة الحالية */}
        <div className="lg:col-span-2 bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-purple-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">معاينة الباقة الحالية في المنصة</h2>
              <p className="text-xs text-slate-500">هذه هي الباقة الوحيدة المفعلة حالياً للعملاء.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 size={36} className="animate-spin text-purple-600" />
              <p className="text-xs font-bold text-slate-500">جاري تحميل الباقة...</p>
            </div>
          ) : !currentPackage ? (
            <div className="text-center py-16 text-slate-500 text-sm font-bold">
              لا توجد باقة مسجلة حالياً. استخدم النموذج المجاور لإنشاء باقة المنصة.
            </div>
          ) : (
            <div className="p-6 rounded-3xl border-2 border-purple-100 bg-white shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-4">
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{currentPackage.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentPackage.description}</p>
                  </div>
                  <div className="px-4 py-2 bg-purple-100 text-purple-900 font-black text-base rounded-2xl border border-purple-200 shrink-0">
                    {currentPackage.price} ج.م
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-purple-900 block">مميزات الباقة المفعلة:</span>
                  <ul className="space-y-2">
                    {currentPackage.features?.map((feature, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-center gap-2 font-medium">
                        <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-purple-100">
                <button
                  onClick={handleStartEdit}
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Edit3 size={15} /> تعديل الباقة
                </button>
                <button
                  onClick={handleDeletePackage}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={15} /> حذف الباقة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}