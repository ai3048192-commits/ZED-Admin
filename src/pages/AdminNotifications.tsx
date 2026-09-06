import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; 
import {
  Bell,
  Send,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  SendHorizonal,
  Users,
  Loader2
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  grade: string;
  group_name: string;
  specialization: string;
  email: string;
  phone: string;
}

interface SentMessageItem {
  id: number;
  title: string;
  content: string;
  date: string;
  targetCount: number;
}

export default function AdminNotificationsPage() {
  const [successMsg, setSuccessMsg] = useState("");
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [sentLogs, setSentLogs] = useState<SentMessageItem[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchTeachers();
    fetchSentMessages();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const { data, error } = await supabase.from("teachers").select("*");
      if (error) throw error;
      if (data && data.length > 0) {
        setTeachersList(data);
      } else {
        setTeachersList([
          { id: "00000000-0000-0000-0000-000000000001", name: "معلم تجريبي", grade: "الكل", group_name: "الكل", specialization: "عام", email: "teacher@test.com", phone: "01000000000" }
        ]);
      }
    } catch (error) {
      console.error("خطأ في جلب المعلمين:", error);
      setTeachersList([
        { id: "00000000-0000-0000-0000-000000000001", name: "معلم تجريبي", grade: "الكل", group_name: "الكل", specialization: "عام", email: "teacher@test.com", phone: "01000000000" }
      ]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchSentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("sent_messages")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      if (data) {
        const map = new Map();
        data.forEach((msg: any) => {
          const key = `${msg.title}_${msg.content}_${msg.created_at?.split('T')[0]}`;
          if (!map.has(key)) {
            map.set(key, {
              id: msg.id,
              title: msg.title,
              content: msg.content,
              date: msg.created_at ? msg.created_at.split('T')[0] : "الآن",
              targetCount: 1
            });
          } else {
            map.get(key).targetCount += 1;
          }
        });
        setSentLogs(Array.from(map.values()));
      }
    } catch (error) {
      console.error("خطأ في جلب سجلات الرسائل:", error);
    }
  };

  const handleSendManualMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualTitle.trim() || !manualContent.trim()) {
      alert("الرجاء إدخال عنوان ومحتوى الرسالة بشكل صحيح.");
      return;
    }

    if (teachersList.length === 0) {
      alert("لا يوجد معلمون مسجلون في قاعدة البيانات حالياً.");
      return;
    }

    try {
      setActionLoading(true);
      const messagesToInsert = teachersList.map(t => ({
        teacher_id: t.id,
        title: manualTitle.trim(),
        content: manualContent.trim(),
        read: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from("sent_messages").insert(messagesToInsert);
      if (error) throw error;

      showSuccess(`تم إرسال وحفظ الرسالة بنجاح إلى جميع المعلمين (${teachersList.length} معلم)!`);
      setManualTitle("");
      setManualContent("");
      fetchSentMessages();
    } catch (error: any) {
      console.error("تفاصيل الخطأ الدقيقة من Supabase:", error);
      alert(`خطأ Supabase: ${error.message || JSON.stringify(error)}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLog = async (title: string, content: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) {
      try {
        const { error } = await supabase
          .from("sent_messages")
          .delete()
          .eq("title", title)
          .eq("content", content);

        if (error) throw error;

        showSuccess("تم حذف السجل بنجاح.");
        fetchSentMessages();
      } catch (error: any) {
        alert(`خطأ أثناء الحذف: ${error.message}`);
      }
    }
  };

  const handleStartEdit = (item: SentMessageItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
  };

  const handleSaveEdit = async (oldTitle: string, oldContent: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("لا يمكن ترك الحقول فارغة.");
      return;
    }

    try {
      const { error } = await supabase
        .from("sent_messages")
        .update({ title: editTitle.trim(), content: editContent.trim() })
        .eq("title", oldTitle)
        .eq("content", oldContent);

      if (error) throw error;

      showSuccess("تم تعديل السجل بنجاح.");
      setEditingId(null);
      fetchSentMessages();
    } catch (error: any) {
      alert(`خطأ أثناء التعديل: ${error.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-16 bg-white text-slate-800" dir="rtl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/25 backdrop-blur-md text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-white/20">
            <Bell size={14} />
            إدارة إشعارات المعلمين - لوحة المسؤول
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">إرسال رسائل وتنبيهات لجميع المعلمين</h1>
          <p className="text-purple-100 text-xs sm:text-sm">إرسال تعاميم ورسائل شاملة لكل المعلمين المسجلين في النظام لتظهر لديهم في تبويب الإشعارات الواردة.</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-xs space-y-6 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-200">
              <Send size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">رسالة جماعية للمعلمين</h2>
              <p className="text-xs text-slate-500">
                {loadingTeachers ? "جاري تحميل المعلمين..." : `سيتم الإرسال لـ (${teachersList.length}) معلم مسجل.`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSendManualMessage} className="space-y-4">
            <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-2xl flex items-center gap-3">
              <Users className="text-purple-600 shrink-0" size={20} />
              <div className="text-xs text-purple-900 font-medium">
                الإرسال مخصص هنا ليشمل جميع المعلمين في قاعدة البيانات تلقائياً وتظهر في واجهاتهم مباشرة.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الرسالة</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="اكتب عنوان التعميم أو الرسالة..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">محتوي الرسالة</label>
              <textarea
                rows={4}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="اكتب تفاصيل الرسالة الموجهة للمعلمين بوضوح..."
                className="w-full px-4 py-3 bg-purple-50/40 border border-purple-200 rounded-2xl text-sm focus:outline-none focus:border-purple-600 font-medium resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingTeachers || teachersList.length === 0 || actionLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-2xl text-sm font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizonal size={16} />}
              <span>{actionLoading ? "جاري الإرسال..." : `إرسال إلى جميع المعلمين (${teachersList.length})`}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-purple-100">
            <h2 className="text-base font-bold text-slate-900">
              سجل الرسائل المرسلة ({sentLogs.length})
            </h2>
          </div>

          <div className="space-y-4">
            {sentLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                لا توجد سجلات مرسلة حتى الآن. استخدم النموذج لإرسال أول رسالة جماعية.
              </div>
            ) : (
              sentLogs.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-purple-100 bg-purple-50/30 transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg">
                        إرسال جماعي
                      </span>
                      <span className="text-xs text-slate-500 font-medium">المستهدفون: {item.targetCount} معلم</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                  </div>

                  {editingId === item.id ? (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-bold"
                      />
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.title, item.content)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <X size={14} /> إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                    </div>
                  )}

                  {editingId !== item.id && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100/60">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl border border-purple-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={14} /> تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteLog(item.title, item.content)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={14} /> حذف
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}