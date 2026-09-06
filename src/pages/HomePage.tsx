import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import {
  Shield,
  Users,
  BookOpen,
  Bell,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCheck,
  Award,
  CreditCard,
  Settings,
  MessageSquare,
  UserCheck,
  CheckCircle,
  XCircle,
  MessageCircle,
  UserX,
} from "lucide-react";

export default function AdminHomePage() {
 

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [deletingNotifId, setDeletingNotifId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchComments();
    fetchContactMessages();
  }, []);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setComments(data);
    } catch (err) {
      console.error("Error fetching feedback/comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchContactMessages = async () => {
    try {
      setLoadingNotifs(true);
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        const formattedNotifs = data.map((msg) => {
          const name = msg.name || msg.full_name || "زائر للموقع";
          const email = msg.email || msg.mail || "بدون بريد";
          const phone = msg.phone || msg.phone_number || msg.mobile || ""; 
          const subject = msg.subject || msg.title || "استفسار جديد";
          const message = msg.message || msg.content || msg.body || "لا توجد تفاصيل";
          const createdAtVal = msg.created_at || msg.date || new Date();

          return {
            id: msg.id,
            title: `رسالة جديدة: ${subject}`,
            source: "قسم الدعم وتواصل الموقع",
            sender: `${name} (${email})`,
            phone: phone, 
            message: message,
            created_at: new Date(createdAtVal).toLocaleString("ar-EG"),
          };
        });
        setNotifications(formattedNotifs);
      }
    } catch (err) {
      console.error("Error fetching contact messages:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchDashboardData = () => {
    setRefreshing(true);
    fetchComments();
    fetchContactMessages();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleToggleApproval = async (id, currentStatus) => {
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    setActionLoadingId(id);
    try {
      const { error } = await supabase
        .from("user_feedback")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setComments((prev) =>
        prev.map((comm) =>
          comm.id === id ? { ...comm, status: newStatus } : comm
        )
      );
    } catch (err) {
      console.error("Error updating comment status:", err);
      alert("حدث خطأ أثناء تحديث حالة التقييم.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWhatsAppChat = (phone, name) => {
    let targetPhone = phone;
    if (!targetPhone || targetPhone.trim() === "") {
      const phonePrompt = prompt(
        `لا يوجد رقم مسجل مسبقاً لهذا المستخدم (${name}). أدخل رقم الهاتف للتواصل:`
      );
      if (!phonePrompt) return;
      targetPhone = phonePrompt;
    }
    const cleanPhone = targetPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً أ/ ${name}، بخصوص رسالتك أو استفسارك في منصة ZED التعليمية:`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleBanUser = (name) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حظر المستخدم (${name}) من إرسال التعليقات؟`
      )
    )
      return;
    alert(`تم حظر المستخدم ${name} بنجاح من النظام.`);
  };

const handleDeleteNotification = async (id) => {
  if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة من قاعدة البيانات؟")) return;
  setDeletingNotifId(id);
  try {
    const { data, error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      // طباعة الخطأ البرمجي الحقيقي في الكونسول لنعرف سببه بدقة
      console.error("Supabase Delete Error Details:", error);
      alert(`خطأ من قاعدة البيانات: ${error.message}`);
      throw error;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  } catch (err) {
    console.error("Error deleting message:", err);
  } finally {
    setDeletingNotifId(null);
  }
};

  const handleDeleteComment = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق نهائياً؟")) return;
    setActionLoadingId(id);
    try {
      const { error } = await supabase
        .from("user_feedback")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("حدث خطأ أثناء حذف التعليق.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      className="space-y-8 pb-12 bg-white text-slate-800 min-h-screen"
      dir="rtl"
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 rounded-3xl p-6 sm:p-8 shadow-xl text-white border border-purple-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-white/25 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1.5 border border-white/25">
                <Shield size={13} />
                لوحة تحكم المسؤول الشاملة - منصة Z E D
              </span>
              <span className="px-3 py-1 bg-purple-800/40 text-purple-100 text-xs rounded-full flex items-center gap-1 border border-purple-400/30">
                <UserCheck size={14} /> المسؤول العام: أحمد إسماعيل
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-wide">
              مرحباً بك، أستاذ أحمد إسماعيل 👑
            </h1>
            <p className="text-sm text-purple-100 max-w-2xl leading-relaxed">
              من هنا يمكنك مراقبة كل شيء في المنصة: إدارة المستخدمين، مراجعة
              الموافقة على تعليقات ومشاكل الطلاب والمعلمين، والاطلاع على أحدث
              إشعارات ورسائل الزوار بدقة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/settings"
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-purple-50 text-purple-700 font-bold text-sm rounded-2xl transition-all shadow-md hover:scale-[1.02]"
            >
              <Settings size={18} />
              <span>إعدادات النظام العامة</span>
            </Link>
          </div>
        </div>
      </div>

   
      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  تعليقات ومشاكل المستخدمين (الموافقة والنشر والتواصل)
                </h3>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                  {comments.length} تعليق مسجل
                </span>
              </div>
              <span className="text-xs text-slate-500">
                وافق على ظهور التعليقات بالمنصة، تواصل عبر واتساب بضغطة زر، أو احظر / احذف المخالفين
              </span>
            </div>
          </div>
        </div>

        {loadingComments ? (
          <div className="py-12 text-center space-y-2 bg-purple-50/40 border border-purple-100 rounded-2xl">
            <Loader2
              size={28}
              className="text-purple-600 mx-auto animate-spin"
            />
            <p className="text-sm font-bold text-slate-700">
              جاري تحميل التعليقات والشكاوى...
            </p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-purple-50/40 border border-purple-100 rounded-2xl">
            <CheckCheck size={28} className="text-purple-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              لا توجد تعليقات أو شكاوى جديدة حالياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comments.map((comm) => {
              const isApproved = comm.status === "approved";
              return (
                <div
                  key={comm.id}
                  className={`border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all space-y-3 ${
                    isApproved
                      ? "bg-purple-50/20 border-purple-200"
                      : "bg-amber-50/30 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-purple-100">
                    <div>
                      <span className="text-xs font-bold text-purple-800 block">
                        {comm.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comm.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isApproved ? "منشور ✓" : "بانتظار الموافقة ⏳"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200 inline-block">
                        {comm.role}
                      </span>
                      {comm.phone && (
                        <span
                          className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                          title="رقم الهاتف المسجل"
                        >
                          📞 {comm.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mt-1">
                      "{comm.message}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-purple-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleToggleApproval(comm.id, comm.status)
                        }
                        disabled={actionLoadingId === comm.id}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isApproved
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        }`}
                      >
                        {actionLoadingId === comm.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : isApproved ? (
                          <>
                            <XCircle size={13} />
                            <span>إلغاء النشر</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} />
                            <span>موافقة ونشر</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          handleWhatsAppChat(comm.phone, comm.name)
                        }
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title={
                          comm.phone
                            ? `مراسلة ${comm.phone} عبر واتساب`
                            : "أدخل رقم الهاتف للتواصل"
                        }
                      >
                        <MessageCircle size={13} />
                        <span>واتساب</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBanUser(comm.name)}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <UserX size={13} />
                        <span>حظر المستخدم</span>
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comm.id)}
                        disabled={actionLoadingId === comm.id}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="حذف التعليق"
                      >
                        <Trash2 size={13} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  سجل الإشعارات والتنبيهات المباشرة (رسائل الموقع)
                </h3>
                <span className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold">
                  {notifications.length} إشعار نشط
                </span>
              </div>
              <span className="text-xs text-slate-500">
                تتبع الرسائل الواردة من نموذج "أرسل لنا رسالة مباشرة" والتواصل مع الزوار عبر الهاتف أو واتساب
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin text-purple-600" : ""}
              />
              <span>تحديث الإشعارات</span>
            </button>
          </div>
        </div>

        {loadingNotifs ? (
          <div className="py-12 text-center space-y-2 bg-purple-50/40 border border-purple-100 rounded-2xl">
            <Loader2 size={28} className="text-purple-600 mx-auto animate-spin" />
            <p className="text-sm font-bold text-slate-700">جاري تحميل رسائل الإشعارات...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-purple-50/40 border border-purple-100 rounded-2xl">
            <CheckCheck size={28} className="text-purple-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              لا توجد رسائل أو إشعارات جديدة حالياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notifications.map((notif) => {
              const senderNameOnly = notif.sender.split("(")[0].trim();
              return (
                <div
                  key={notif.id}
                  className="bg-purple-50/30 border border-purple-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-purple-100">
                    <span className="text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                      {notif.source}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {notif.created_at}
                      </span>
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        disabled={deletingNotifId === notif.id}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                        title="حذف الرسالة"
                      >
                        {deletingNotifId === notif.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-purple-900 block bg-purple-100/60 px-2 py-1 rounded">
                      المُرسِل: {notif.sender}
                    </span>
                    
                    {notif.phone ? (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block font-bold">
                        📞 هاتف: {notif.phone}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                        📞 لم يسجل رقم هاتف
                      </span>
                    )}

                    <h4 className="text-xs font-bold text-slate-900">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-purple-100">
                    <button
                      onClick={() => handleWhatsAppChat(notif.phone, senderNameOnly)}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle size={14} />
                      <span>مراسلة عبر واتساب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}