import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  HiOutlineAcademicCap,
  HiOutlineMail,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlineUserGroup,
  HiOutlineBan,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlinePencilAlt,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { supabase } from "../lib/supabaseClient";

/* ================================================================== */
/*  لوحة صلاحيات المستخدم — تصميم عصري ومنظم (بنفس الألوان الأصلية)    */
/* ================================================================== */

type NoticeType = "success" | "error" | "info";
type Status = "active" | "disabled";
type Access = "checking" | "guest" | "not-admin" | "admin";
type FilterTab = "all" | "active" | "disabled";

interface TeacherEmail {
  email: string;
  note: string | null;
  status: Status;
  created_at: string;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// دالة لتنسيق التاريخ بشكل لطيف
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ar-EG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
};

export default function UserPermissions() {
  const [access, setAccess] = useState<Access>("checking");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [list, setList] = useState<TeacherEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");

  // فلترة وبحث السجلات
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // تعديل صف موجود
  const [editing, setEditing] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editNote, setEditNote] = useState("");

  const activeCount = useMemo(() => list.filter((t) => t.status === "active").length, [list]);
  const disabledCount = list.length - activeCount;

  // تصفية السجلات حسب التبويب والبحث
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && item.status === "active") ||
        (activeTab === "disabled" && item.status === "disabled");

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.email.toLowerCase().includes(query) ||
        (item.note && item.note.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [list, activeTab, searchQuery]);

  const resolveAccess = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setAccess("guest");
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .maybeSingle();
    setAccess(prof?.role === "admin" ? "admin" : "not-admin");
  }, []);

  useEffect(() => {
    resolveAccess();
  }, [resolveAccess]);

  const loadList = useCallback(async () => {
    const { data, error } = await supabase
      .from("teacher_emails")
      .select("email, note, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setNotice({ type: "error", text: "تعذّر تحميل القائمة: " + error.message });
      return;
    }
    setList((data as TeacherEmail[]) ?? []);
  }, []);

  useEffect(() => {
    if (access === "admin") loadList();
  }, [access, loadList]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPass,
    });
    setLoading(false);
    if (error) {
      setNotice({ type: "error", text: "خطأ في الدخول: " + error.message });
      return;
    }
    setLoginPass("");
    await resolveAccess();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setList([]);
    setAccess("guest");
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const email = newEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setNotice({ type: "error", text: "اكتب بريداً إلكترونياً صحيحاً." });
      return;
    }
    if (list.some((t) => t.email.toLowerCase() === email)) {
      setNotice({ type: "info", text: "هذا البريد موجود في القائمة بالفعل." });
      return;
    }
    setLoading(true);
    setNotice(null);
    const { error } = await supabase
      .from("teacher_emails")
      .insert({ email, note: newNote.trim() || null, status: "active" });
    setLoading(false);
    if (error) {
      setNotice({ type: "error", text: "تعذّر الإضافة: " + error.message });
      return;
    }
    setNewEmail("");
    setNewNote("");
    setNotice({ type: "success", text: "تمت الإضافة بنجاح. سيمتلك صلاحية معلم فور تسجيل دخوله." });
    loadList();
  };

  const toggleStatus = async (t: TeacherEmail) => {
    const next: Status = t.status === "active" ? "disabled" : "active";
    setBusy(t.email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").update({ status: next }).eq("email", t.email);
    if (!error) {
      await supabase
        .from("teachers_profile")
        .update({ active: next === "active" })
        .ilike("email", t.email);
    }
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر تغيير الحالة: " + error.message });
      return;
    }
    setNotice({
      type: next === "disabled" ? "info" : "success",
      text:
        next === "disabled"
          ? "تم تعطيل الحساب مؤقتاً. بياناته محفوظة ولكنه لن يتمكن من الدخول."
          : "تم إعادة تفعيل الحساب بنجاح.",
    });
    loadList();
  };

  const startEdit = (t: TeacherEmail) => {
    setEditing(t.email);
    setEditEmail(t.email);
    setEditNote(t.note ?? "");
    setNotice(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditEmail("");
    setEditNote("");
  };

  const saveEdit = async (original: TeacherEmail) => {
    const email = editEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setNotice({ type: "error", text: "اكتب بريداً إلكترونياً صحيحاً." });
      return;
    }
    if (
      email !== original.email.toLowerCase() &&
      list.some((t) => t.email.toLowerCase() === email)
    ) {
      setNotice({ type: "info", text: "البريد الجديد موجود بالفعل في القائمة." });
      return;
    }
    setBusy(original.email);
    setNotice(null);
    const { error } = await supabase
      .from("teacher_emails")
      .update({ email, note: editNote.trim() || null })
      .eq("email", original.email);
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر حفظ التعديلات: " + error.message });
      return;
    }
    cancelEdit();
    setNotice({ type: "success", text: "تم تحديث البيانات بنجاح." });
    loadList();
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المعلم نهائياً من القائمة؟")) return;
    setBusy(email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").delete().eq("email", email);
    if (!error) {
      await supabase.from("teachers_profile").update({ active: false }).ilike("email", email);
    }
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر الحذف: " + error.message });
      return;
    }
    setNotice({ type: "info", text: "تمت إزالة المعلم من القائمة بنجاح." });
    loadList();
  };

  /* ----------------------------- حالات الوصول ----------------------------- */

  if (access === "checking") {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (access === "guest") {
    return (
      <div dir="rtl" className="flex min-h-[80vh] items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-2xl shadow-blue-900/5">
          <div className="mb-6 flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">تسجيل دخول المشرف</h1>
              <p className="text-[11px] font-medium text-slate-400">لوحة تحكم صلاحيات المعلمين</p>
            </div>
          </div>

          {notice && (
            <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-600">
              {notice.text}
            </div>
          )}

          <label className="mb-1.5 block text-[11px] font-bold text-slate-700">البريد الإلكتروني</label>
          <div className="relative mb-4">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <HiOutlineMail className="h-4 w-4" />
            </span>
            <input
              type="email"
              required
              dir="ltr"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-3 pr-10 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          <label className="mb-1.5 block text-[11px] font-bold text-slate-700">كلمة المرور</label>
          <div className="relative mb-6">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <HiOutlineLockClosed className="h-4 w-4" />
            </span>
            <input
              type="password"
              required
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-3 pr-10 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 py-3 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "دخول النظام"
            )}
          </button>
        </form>
      </div>
    );
  }

  if (access === "not-admin") {
    return (
      <div dir="rtl" className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 shadow-sm">
          <HiOutlineBan className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800">عذراً، ليس لديك صلاحية</h2>
          <p className="mt-1 text-xs text-slate-500">هذه الصفحة مخصصة لحسابات المشرفين (Admins) فقط.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <HiOutlineLogout className="h-4 w-4" /> تسجيل الخروج والدخول بحساب آخر
        </button>
      </div>
    );
  }

  /* ----------------------------- لوحة الأدمن (التصميم المطور) ----------------------------- */

  return (
    <div dir="rtl" className="mx-auto w-full max-w-9xl  space-y-6">
      
      {/* 1. رأس الصفحة البطاقي الاحترافي */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-blue-600 via-indigo-600 to-violet-600 p-6 lg:p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <HiOutlineShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight">إدارة صلاحيات المعلمين</h1>
              <p className="text-xs text-white/80 mt-0.5">التحكم الشامل في الحسابات المصرح لها بدور المعلم</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/15 transition hover:bg-white/20 shadow-sm"
          >
            <HiOutlineLogout className="h-5 w-5" />
          </button>
        </div>

        {/* إحصائيات سريعة داخل الهيدر */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 relative z-10">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 backdrop-blur-md border border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <HiOutlineUserGroup className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/75">المعلمين المفعّلين</p>
              <p className="text-xl font-black">{activeCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3.5 backdrop-blur-md border border-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <HiOutlineBan className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/75">الحسابات المعطّلة</p>
              <p className="text-xl font-black">{disabledCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* تنبيه إرشادي مصمم بعناية */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs font-semibold leading-relaxed text-blue-900 shadow-2xs">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <span className="text-[10px] font-black">i</span>
        </div>
        <div>
          <span className="font-bold">آلية العمل:</span> أضف البريد الإلكتروني للمعلم هنا <b>مسبقاً</b>. بمجرد قيام المعلم بإنشاء حساب بنفس البريد، ستحول صلاحياته تلقائياً لمعلم. أي بريد غير مدرج أو معطل سيتم التعامل معه كطالب افتراضياً.
        </div>
      </div>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={
            "flex items-center gap-2.5 rounded-2xl border px-4 py-3.5 text-xs font-bold leading-relaxed shadow-xs " +
            (notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              : notice.type === "info"
                ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
                : "border-rose-500/30 bg-rose-500/10 text-rose-700")
          }
        >
          {notice.type === "success" && <HiOutlineCheckCircle className="h-5 w-5 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* 2. فورم الإضافة السريعة */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-black tracking-wide text-slate-800 uppercase">إضافة معلم جديد للقائمة</h2>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">البريد الإلكتروني</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                  <HiOutlineMail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-3 pr-10 text-right text-xs font-semibold text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-slate-700">ملاحظة أو اسم المعلم (اختياري)</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="مثال: أ. أحمد محمد - رياضيات"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-3.5 text-xs font-semibold text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <HiOutlinePlus className="h-4 w-4" /> إضافة المعلم وصلاحيته
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. قسم السجلات وإدارتها بوضوح تام */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        
        {/* شريط الأدوات: التبويبات والبحث */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* تبويبات الفلترة */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={
                "rounded-xl px-3.5 py-1.5 text-[11px] font-black transition " +
                (activeTab === "all" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800")
              }
            >
              الكل ({list.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={
                "rounded-xl px-3.5 py-1.5 text-[11px] font-black transition " +
                (activeTab === "active" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800")
              }
            >
              المفعّلين ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("disabled")}
              className={
                "rounded-xl px-3.5 py-1.5 text-[11px] font-black transition " +
                (activeTab === "disabled" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800")
              }
            >
              المعطّلين ({disabledCount})
            </button>
          </div>

          {/* خانة البحث */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <HiOutlineSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في السجلات..."
              className="w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-3 pr-9 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* عرض السجلات أو الحالة الفارغة */}
        {filteredList.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 border border-slate-200/50 shadow-2xs">
              <HiOutlineAcademicCap className="h-7 w-7" />
            </div>
            <p className="text-xs font-bold text-slate-600">لا توجد سجلات تطابق بحثك</p>
            <p className="text-[11px] text-slate-400 mt-0.5">جرب تغيير كلمة البحث أو إضافة معلم جديد.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredList.map((t) => {
              const isActive = t.status === "active";
              const rowBusy = busy === t.email;
              const isEditing = editing === t.email;

              // ---- وضع التعديل (تصميم بطاقة منسقة) ----
              if (isEditing) {
                return (
                  <div key={t.email} className="rounded-2xl border border-blue-300 bg-blue-50/30 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-700">تعديل بيانات المعلم</span>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{t.email}</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-600">البريد الإلكتروني</label>
                      <input
                        type="email"
                        dir="ltr"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-right text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-600">ملاحظة / اسم المعلم</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="اسم المدرس أو المادة"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(t)}
                        disabled={rowBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-[11px] font-black text-white transition hover:bg-emerald-500 disabled:opacity-50 shadow-2xs"
                      >
                        <HiOutlineCheck className="h-4 w-4" /> حفظ التعديلات
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={rowBusy}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 shadow-2xs"
                      >
                        <HiOutlineX className="h-4 w-4" /> إلغاء
                      </button>
                    </div>
                  </div>
                );
              }

              // ---- العرض العادي للسجل (بطاقة نظيفة واضحة) ----
              return (
                <div
                  key={t.email}
                  className={
                    "group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition-all " +
                    (isActive
                      ? "border-slate-200/80 bg-white hover:border-blue-200 hover:shadow-md"
                      : "border-slate-200/60 bg-slate-50/70 opacity-80")
                  }
                >
                  {/* معلومات السجل */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5 shadow-2xs " +
                        (isActive
                          ? "bg-blue-600/10 text-blue-600 border border-blue-600/20"
                          : "bg-slate-200 text-slate-400 border border-slate-300/50")
                      }
                    >
                      <HiOutlineAcademicCap className="h-5 w-5" />
                    </div>
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span dir="ltr" className="text-xs font-black text-slate-900 tracking-tight">
                          {t.email}
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[10px] font-black shadow-2xs " +
                            (isActive
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : "bg-slate-200 text-slate-600 border border-slate-300/40")
                          }
                        >
                          {isActive ? "نشط ومفعّل" : "معطّل"}
                        </span>
                      </div>

                      {t.note && (
                        <p className="text-xs font-bold text-slate-600">
                          {t.note}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5 font-medium">
                        <HiOutlineClock className="h-3.5 w-3.5" />
                        <span>أُضيف في: {formatDate(t.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* أزرار الإجراءات على السجل */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => startEdit(t)}
                      disabled={rowBusy}
                      aria-label="تعديل"
                      title="تعديل البيانات"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50 shadow-2xs"
                    >
                      <HiOutlinePencilAlt className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => toggleStatus(t)}
                      disabled={rowBusy}
                      aria-label={isActive ? "تعطيل الصلاحية" : "تفعيل الصلاحية"}
                      title={isActive ? "تعطيل الصلاحية" : "تفعيل الصلاحية"}
                      className={
                        "flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:opacity-50 shadow-2xs " +
                        (isActive
                          ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100")
                      }
                    >
                      {isActive ? <HiOutlinePause className="h-4 w-4" /> : <HiOutlinePlay className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => handleDelete(t.email)}
                      disabled={rowBusy}
                      aria-label="حذف نهائي"
                      title="حذف نهائي من القائمة"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 shadow-2xs"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
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
