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
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
} from "react-icons/hi";
import { supabase } from "../lib/supabaseClient";

type NoticeType = "success" | "error" | "info";
type Status = "active" | "disabled";
type Access = "checking" | "guest" | "not-admin" | "admin";

interface TeacherEmail {
  email: string;
  note: string | null;
  status: Status;
  created_at: string;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function UserPermissions() {
  const [access, setAccess] = useState<Access>("checking");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [list, setList] = useState<TeacherEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");

  const activeCount = useMemo(() => list.filter((t) => t.status === "active").length, [list]);
  const disabledCount = list.length - activeCount;

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
      setNotice({ type: "error", text: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }
    if (list.some((t) => t.email.toLowerCase() === email)) {
      setNotice({ type: "info", text: "هذا البريد الإلكتروني مسجل مسبقاً في القائمة." });
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
    setNotice({ type: "success", text: "تمت إضافة المدرس بنجاح. سيتم منحه الصلاحيات تلقائياً فور التسجيل." });
    loadList();
  };

  const toggleStatus = async (t: TeacherEmail) => {
    const next: Status = t.status === "active" ? "disabled" : "active";
    setBusy(t.email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").update({ status: next }).eq("email", t.email);
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر تغيير الحالة: " + error.message });
      return;
    }
    setNotice({
      type: next === "disabled" ? "info" : "success",
      text: next === "disabled" ? "تم تعطيل البريد بنجاح. لن يتمكن من الدخول كمدرس." : "تم تفعيل البريد بنجاح.",
    });
    loadList();
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`هل أنت متأكد من حذف البريد (${email}) نهائياً؟`)) return;
    setBusy(email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").delete().eq("email", email);
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر الحذف: " + error.message });
      return;
    }
    setNotice({ type: "info", text: "تمت إزالة البريد من القائمة نهائياً." });
    loadList();
  };

  const filteredList = list.filter(
    (t) =>
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (access === "checking") {
    return (
      <div dir="rtl" className="flex min-h-[60vh] items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent shadow-md" />
      </div>
    );
  }

  if (access === "guest") {
    return (
      <div dir="rtl" className="mx-auto w-full max-w-md p-4 lg:p-8 flex items-center min-h-[80vh]">
        <form onSubmit={handleLogin} className="w-full rounded-[2.5rem] border border-slate-200/80 bg-white/90 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
              <HiOutlineShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 mb-1">
                <HiOutlineSparkles className="h-3 w-3" /> بوابة الإدارة
              </div>
              <h1 className="text-xl font-black text-slate-900">تسجيل دخول الأدمن</h1>
            </div>
          </div>

          {notice && (
            <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-50/90 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm">
              {notice.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">البريد الإلكتروني</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <HiOutlineMail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-4 pr-11 text-right text-xs font-semibold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-600/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">كلمة المرور</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                  <HiOutlineLockClosed className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-4 pr-11 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-600/10 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-sky-600/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "تسجيل الدخول للنظام"
            )}
          </button>
        </form>
      </div>
    );
  }

  if (access === "not-admin") {
    return (
      <div dir="rtl" className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 shadow-sm border border-rose-100">
          <HiOutlineBan className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-1">غير مسموح بالدخول</h2>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            الحساب الحالي لا يمتلك صلاحيات الأدمن، وبالتالي لا يمكنه إدارة صلاحيات المستخدمين.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <HiOutlineLogout className="h-4 w-4" /> تسجيل الدخول بحساب آخر
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-9xl   space-y-6">
      
      {/* هيدر اللوحة */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-sky-400 shadow-inner">
              <HiOutlineShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-[11px] font-medium text-sky-300 mb-2 border border-sky-400/20">
                <HiOutlineSparkles className="h-3.5 w-3.5" /> لوحة إدارة المدرسين المعتمدين[cite: 2]
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                صلاحيات المستخدم
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">تحكّم في الحسابات المصرح لها بدخول النظام كمدرس</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            aria-label="خروج"
            title="تسجيل الخروج"
            className="flex items-center gap-2 self-start sm:self-auto rounded-2xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white/90 backdrop-blur-md border border-white/10 transition hover:bg-white/20 shadow-sm"
          >
            <HiOutlineLogout className="h-4 w-4" /> خروج من الأدمن
          </button>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 shadow-inner">
            <div className="flex items-center gap-2 text-[11px] font-bold text-sky-300">
              <HiOutlineUserGroup className="h-4 w-4" /> مدرسين مفعّلين
            </div>
            <p className="mt-1 text-2xl font-black text-white">{activeCount}</p>
          </div>
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 shadow-inner">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300">
              <HiOutlineBan className="h-4 w-4" /> معطّلين
            </div>
            <p className="mt-1 text-2xl font-black text-white">{disabledCount}</p>
          </div>
        </div>
      </div>

      {/* تنبيه إرشادي */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-sky-500/20 bg-sky-50/80 p-4 text-xs font-medium leading-relaxed text-sky-950 shadow-sm">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-600/30">
          i
        </span>
        <p className="mt-0.5">
          قم بإضافة البريد الإلكتروني للمدرس هنا <b>قبل</b> أن يقوم بإنشاء حسابه[cite: 2]. بمجرد تسجيله بنفس البريد، سيحصل على صلاحيات المدرس تلقائياً[cite: 2]. أي إيميل غير موجود بالقائمة أو معطل سيتم تسجيله كطالب[cite: 2].
        </p>
      </div>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={
            "rounded-2xl border px-4 py-3.5 text-xs font-bold leading-relaxed shadow-sm transition-all flex items-center gap-3 " +
            (notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-800"
              : notice.type === "info"
                ? "border-sky-500/30 bg-sky-50 text-sky-800"
                : "border-rose-500/30 bg-rose-50 text-rose-800")
          }
        >
          <span className={`h-2.5 w-2.5 rounded-full ${notice.type === "success" ? "bg-emerald-500" : notice.type === "info" ? "bg-sky-500" : "bg-rose-500"}`}></span>
          {notice.text}
        </div>
      )}

      {/* فورم الإضافة */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-100">
        <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-600"></span>
          إضافة مدرس جديد للقائمة
        </h2>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-5">
            <label className="mb-1.5 block text-xs font-bold text-slate-700">إيميل المدرس</label>
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 pl-3 pr-10 text-right text-xs font-bold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-600/10 transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="mb-1.5 block text-xs font-bold text-slate-700">ملاحظة (اختياري)</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اسم المدرس أو المادة"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3.5 px-3 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-600/10 transition-all"
            />
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-sky-600/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <HiOutlinePlus className="h-4 w-4" /> إضافة مدرس
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* سجلات المدرسين بشكل بطاقات تفاعلية أنيقة (Cards Grid) بدلاً من الجداول */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-slate-900">سجلات المدرسين المعتمدين</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">إجمالي المدرسين في النظام: {list.length}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <HiOutlineSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالبريد أو الاسم..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-3 pr-9 text-xs font-medium text-slate-800 focus:border-sky-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HiOutlineAcademicCap className="h-7 w-7" />
            </div>
            <p className="text-xs font-bold text-slate-600">
              {searchQuery ? "لا توجد نتائج مطابقة لبحثك." : "لا يوجد مدرسين في القائمة لسه[cite: 2]."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((t) => {
              const isActive = t.status === "active";
              const rowBusy = busy === t.email;
              return (
                <div
                  key={t.email}
                  className={
                    "relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 hover:shadow-lg " +
                    (isActive
                      ? "border-slate-200/80 bg-white hover:border-sky-200"
                      : "border-slate-200 bg-slate-50/60 opacity-80")
                  }
                >
                  <div>
                    {/* رأس البطاقة: الأيقونة، الحالة، وأزرار التحكم */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm " +
                            (isActive ? "bg-sky-50 text-sky-600" : "bg-slate-200 text-slate-400")
                          }
                        >
                          <HiOutlineAcademicCap className="h-6 w-6" />
                        </div>
                        <div>
                          <span
                            className={
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black mb-1 " +
                              (isActive
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                                : "bg-slate-200 text-slate-600 border border-slate-300")
                            }
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                            {isActive ? "حساب مفعّل" : "حساب معطّل"}
                          </span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات داخل البطاقة */}
                      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                        <button
                          onClick={() => toggleStatus(t)}
                          disabled={rowBusy}
                          aria-label={isActive ? "تعطيل" : "تفعيل"}
                          title={isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                          className={
                            "flex h-8 w-8 items-center justify-center rounded-xl transition-all disabled:opacity-50 " +
                            (isActive ? "text-amber-600 hover:bg-white shadow-sm" : "text-emerald-600 hover:bg-white shadow-sm")
                          }
                        >
                          {isActive ? <HiOutlinePause className="h-4 w-4" /> : <HiOutlinePlay className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDelete(t.email)}
                          disabled={rowBusy}
                          aria-label="حذف"
                          title="حذف نهائي"
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-600 hover:bg-white shadow-sm transition-all disabled:opacity-50"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">البريد الإلكتروني</p>
                      <p dir="ltr" className="text-right text-xs font-black text-slate-900 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
                        {t.email}
                      </p>
                    </div>

                    {/* الملاحظة أو الوصف */}
                    {t.note && (
                      <div className="mb-3 flex items-start gap-2 bg-slate-50/80 border border-slate-100 p-2.5 rounded-2xl">
                        <HiOutlineChatAlt2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-slate-700">{t.note}</p>
                      </div>
                    )}
                  </div>

                  {/* تاريخ الإضافة في أسفل البطاقة */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <HiOutlineCalendar className="h-3.5 w-3.5" /> تاريخ الإضافة:
                    </span>
                    <span dir="ltr" className="font-semibold text-slate-600">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
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