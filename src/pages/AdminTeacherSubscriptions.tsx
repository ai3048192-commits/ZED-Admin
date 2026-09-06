import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  User,
  FileText,
  ShieldCheck,
  X,
  Mail,
  Loader2,
  Package,
  DollarSign,
  Phone
} from "lucide-react";

interface Subscription {
  id: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  packageName: string;
  packagePrice: string;
  paymentMethod: string;
  receiptImage: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "active";
}

export default function AdminTeacherSubscriptions() {
  const [successMsg, setSuccessMsg] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("teacher_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData: Subscription[] = data.map((item: any) => ({
          id: item.id,
          teacherName: item.teacher_name || "معلم غير محدد",
          teacherEmail: item.teacher_email || "غير متوفر",
          teacherPhone: item.teacher_phone || item.phone || "غير متوفر",
          packageName: item.plan_name || "باقة غير محددة",
          packagePrice: `${item.amount || 0} ج.م`,
          paymentMethod: item.payment_method === "vodafone" ? "فودافون كاش" : item.payment_method === "instapay" ? "انستا باي" : item.payment_method,
          receiptImage: item.receipt_url,
          date: item.created_at ? new Date(item.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : "وقت غير محدد",
          status: item.status,
        }));
        setSubscriptions(formattedData);
      }
    } catch (err: any) {
      console.error("خطأ في جلب الاشتراكات:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subToApprove: Subscription) => {
    try {
      // تحديث الحالة إلى active لتفتح لوحة تحكم المعلم فوراً
      const { error } = await supabase
        .from("teacher_subscriptions")
        .update({ status: "active" })
        .eq("id", subToApprove.id);

      if (error) throw error;

      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === subToApprove.id ? { ...sub, status: "active" } : sub
        )
      );
      
      showSuccess("تم قبول اشتراك المدرس وتفعيل الباقة وفتح المنصة بنجاح!");
      setSelectedSub(null);
    } catch (err: any) {
      alert("حدث خطأ أثناء تحديث حالة الطلب: " + err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // تحديث الحالة إلى rejected لإبقاق لوحة تحكم المعلم مغلقة
      const { error } = await supabase
        .from("teacher_subscriptions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === id ? { ...sub, status: "rejected" } : sub
        )
      );
      showSuccess("تم رفض الاشتراك وإبقاء المنصة مغلقة!");
      setSelectedSub(null);
    } catch (err: any) {
      alert("حدث خطأ أثناء رفض الطلب: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف سجل الاشتراك هذا؟")) {
      try {
        const { error } = await supabase
          .from("teacher_subscriptions")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setSubscriptions(subscriptions.filter((sub) => sub.id !== id));
        showSuccess("تم حذف السجل بنجاح.");
        setSelectedSub(null);
      } catch (err: any) {
        alert("حدث خطأ أثناء الحذف: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 min-h-screen text-slate-800" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-3">
          <span className="px-3.5 py-1.5 bg-white/25 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-2 border border-white/20">
            <CreditCard size={14} />
            إدارة الاشتراكات المالية
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">مراجعة اشتراكات المعلمين</h1>
          <p className="text-purple-100 text-sm">تفاصيل المعلمين، الباقات المختارة، وبيانات الدفع والإيصالات.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
          الطلبات الواردة ({subscriptions.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 size={40} className="animate-spin text-purple-600" />
            <p className="text-sm font-bold text-slate-500">جاري تحميل البيانات...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
            لا توجد طلبات اشتراك مُسجلة حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center shrink-0">
                    <User size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">{sub.teacherName}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone size={12}/> {sub.teacherPhone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-xl md:bg-transparent md:p-0">
                  <div>
                    <span className="text-slate-400 block font-semibold">الباقة:</span>
                    <span className="font-black text-purple-700">{sub.packageName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">السعر:</span>
                    <span className="font-black text-emerald-600">{sub.packagePrice}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">طريقة الدفع:</span>
                    <span className="font-black text-indigo-700">{sub.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {sub.status === "pending" && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">قيد المراجعة</span>}
                  {sub.status === "active" && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">مفعل (مفتوح)</span>}
                  {sub.status === "rejected" && <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg">مرفوض (مغلق)</span>}

                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Eye size={16} /> التفاصيل والإيصال
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-400" />
                <h3 className="font-black text-base">تفاصيل الاشتراك والتحويل</h3>
              </div>
              <button onClick={() => setSelectedSub(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                    <User size={14} /> بيانات المعلم
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm font-black text-slate-800">{selectedSub.teacherName}</p>
                    <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><Phone size={12}/> {selectedSub.teacherPhone}</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-3">
                  <h4 className="text-xs font-black text-purple-400 uppercase flex items-center gap-2">
                    <Package size={14} /> تفاصيل الباقة
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm font-black text-purple-900">{selectedSub.packageName}</p>
                    <p className="text-sm font-black text-emerald-700 flex items-center gap-1"><DollarSign size={14}/> السعر: {selectedSub.packagePrice}</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-black text-indigo-400 uppercase flex items-center gap-2">
                  <CreditCard size={14} /> معلومات الدفع والتحويل
                </h4>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <div className="bg-white px-3 py-2 rounded-lg border border-indigo-50">
                    <span className="text-slate-500 block mb-1">الوسيلة المستخدمة:</span>
                    <span className="text-indigo-700 text-sm">{selectedSub.paymentMethod}</span>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-indigo-50">
                    <span className="text-slate-500 block mb-1">تاريخ الطلب:</span>
                    <span className="text-slate-800">{selectedSub.date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" /> صورة إيصال التحويل المرفقة:
                </span>
                <div className="w-full bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center p-2 min-h-[250px]">
                  <img
                    src={selectedSub.receiptImage}
                    alt="إيصال التحويل"
                    className="max-h-[400px] max-w-full object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleApprove(selectedSub)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={18} /> قبول وتفعيل (فتح المنصة)
                </button>
                <button
                  onClick={() => handleReject(selectedSub.id)}
                  className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XCircle size={18} /> رفض (إغلاق المنصة)
                </button>
              </div>
              <button
                onClick={() => handleDelete(selectedSub.id)}
                className="w-full sm:w-auto px-4 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 size={16} /> حذف السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}