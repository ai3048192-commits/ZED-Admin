import { useState, useEffect } from "react";
import {
  HelpCircle,
  User,
  CheckCircle2,
  Trash2,
  Clock,
  BookOpen,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface SupportRequest {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  date: string;
  time: string;
  status: "pending" | "resolved" | "in_progress";
  userType: "طالب" | "ولي أمر" | "معلم" | "مؤسسة";
  priority: "عالية" | "متوسطة" | "منخفضة";
}

export default function SupportContactPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  const fetchSupportRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((item) => ({
          id: item.id,
          fullName: item.full_name || item.fullName || "مستخدم مجهول",
          email: item.email || "غير متوفر",
          phone: item.phone || "+200000000000",
          inquiryType: item.inquiry_type || item.inquiryType || "استفسار عام",
          message: item.message || "",
          date: item.date || new Date().toISOString().split("T")[0],
          time: item.time || "12:00 م",
          status: item.status || "pending",
          userType: item.user_type || item.userType || "طالب",
          priority: item.priority || "متوسطة",
        }));
        setSupportRequests(formatted);
      }
    } catch (error) {
      console.error("خطأ في جلب طلبات الدعم الفني:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: "pending" | "resolved" | "in_progress") => {
    try {
      const { error } = await supabase
        .from("support_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setSupportRequests(
        supportRequests.map(req => req.id === id ? { ...req, status: newStatus } : req)
      );
      showSuccess("تم تحديث حالة الطلب بنجاح في قاعدة البيانات.");
    } catch (error) {
      console.error("خطأ أثناء تحديث الحالة:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) {
      try {
        const { error } = await supabase
          .from("support_requests")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setSupportRequests(supportRequests.filter(req => req.id !== id));
        showSuccess("تم حذف الطلب بنجاح.");
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8  text-slate-800" dir="rtl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <HelpCircle size={14} />
            لوحة تحكم الأدمن والرسائل الواردة (متصل بقاعدة البيانات)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">سجل رسائل وتنبيهات الأدمن الواردة</h1>
          <p className="text-purple-100 text-xs sm:text-sm">عرض وتتبع جميع التنبيهات والرسائل الموجهة للأدمن من المنصة لحظة بلحظة.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">الرسائل والتنبيهات الموجهة للأدمن</h2>
            <p className="text-xs text-slate-500">إجمالي الطلبات المسجلة حالياً: {supportRequests.length}</p>
          </div>
        </div>

        {supportRequests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 font-bold">
            لا توجد رسائل أو تنبيهات موجهة للأدمن حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportRequests.map((req) => (
              <div
                key={req.id}
                className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
                  req.status === "pending"
                    ? "bg-purple-50/40 border-purple-200 shadow-xs"
                    : req.status === "in_progress"
                    ? "bg-amber-50/30 border-amber-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-purple-100 text-purple-700 font-bold rounded-2xl flex items-center justify-center shrink-0 border border-purple-200">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{req.fullName}</h4>
                        <span className="text-xs text-slate-500">{req.email}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800">
                      {req.userType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="px-3 py-1 bg-purple-100/70 border border-purple-200 text-purple-900 font-bold rounded-lg flex items-center gap-1">
                      <BookOpen size={13} /> {req.inquiryType}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      req.priority === "عالية" ? "bg-rose-100 text-rose-700" :
                      req.priority === "متوسطة" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      أولوية: {req.priority}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-purple-100 space-y-1">
                    <span className="text-[11px] font-bold text-purple-900 block">نص التنبيه أو الرسالة:</span>
                    <p className="text-xs text-slate-700 leading-relaxed">{req.message}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-purple-100/60">
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock size={12} /> {req.date} - {req.time}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none ${
                          req.status === "resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          req.status === "in_progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="in_progress">جاري العمل عليها</option>
                        <option value="resolved">تم الحل والرد</option>
                      </select>

                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all"
                        title="حذف الكرت"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}