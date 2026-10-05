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
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editNote, setEditNote] = useState("");

  const activeCount = useMemo(() => list.filter((t) => t.status === "active").length, [list]);
  const disabledCount = list.length - activeCount;

  const filteredList = useMemo(() => {
    return list.filter((t) => {
      const matchesSearch =
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [list, searchQuery, statusFilter]);

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
      setNotice({ type: "error", text: "تعذّر تحميل السجلات: " + error.message });
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
      setNotice({ type: "error", text: "خطأ في بيانات الدخول: " + error.message });
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
      setNotice({ type: "info", text: "هذا البريد مسجل مسبقاً في القائمة." });
      return;
    }
    setLoading(true);
    setNotice(null);
    const { error } = await supabase
      .from("teacher_emails")
      .insert({ email, note: newNote.trim() || null, status: "active" });
    setLoading(false);
    if (error) {
      setNotice({ type: "error", text: "تعذّر إضافة السجل: " + error.message });
      return;
    }
    setNewEmail("");
    setNewNote("");
    setNotice({ type: "success", text: "تم اعتماد المعلم بنجاح وإضافته للسجلات." });
    loadList();
  };

  const toggleStatus = async (t: TeacherEmail) => {
    const next: Status = t.status === "active" ? "disabled" : "active";
    setBusy(t.email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").update({ status: next }).eq("email", t.email);
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر تحديث الحالة: " + error.message });
      return;
    }
    setNotice({
      type: next === "disabled" ? "info" : "success",
      text: next === "disabled" ? "تم تعليق صلاحية هذا المعلم مؤقتاً." : "تم تنشيط صلاحية المعلم بنجاح.",
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
      setNotice({ type: "error", text: "يرجى كتابة بريد إلكتروني صحيح." });
      return;
    }
    if (email !== original.email.toLowerCase() && list.some((t) => t.email.toLowerCase() === email)) {
      setNotice({ type: "info", text: "البريد الإلكتروني الجديد مسجل بالفعل." });
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
      setNotice({ type: "error", text: "تعذّر الحفظ: " + error.message });
      return;
    }
    cancelEdit();
    setNotice({ type: "success", text: "تم تحديث البيانات بنجاح." });
    loadList();
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً من قاعدة البيانات؟")) return;
    setBusy(email);
    setNotice(null);
    const { error } = await supabase.from("teacher_emails").delete().eq("email", email);
    setBusy(null);
    if (error) {
      setNotice({ type: "error", text: "تعذّر الحذف: " + error.message });
      return;
    }
    setNotice({ type: "info", text: "تم إزالة السجل نهائياً." });
    loadList();
  };

  if (access === "checking") {
    return (
      <div dir="rtl" className="flex min-h-[100vh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-purple-600 border-t-transparent" />
          <span className="text-xs font-bold text-slate-500">جاري التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  if (access === "guest") {
    return (
      <div dir="rtl" className="min-h-[100vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-purple-900/10 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/30 mb-4">
              <HiOutlineShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">بوابة إدارة النظام</h1>
            <p className="text-xs text-slate-400 mt-1">سجل الدخول بحساب المشرف (Admin) للمتابعة</p>
          </div>

          {notice && (
            <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600 text-center">
              {notice.text}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold text-slate-700">البريد الإلكتروني</label>
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
                  placeholder="admin@platform.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-4 pr-11 text-right text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-extrabold text-slate-700">كلمة المرور</label>
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-4 pr-11 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 py-4 text-xs font-black text-white shadow-lg shadow-purple-600/25 transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "تسجيل الدخول للنظام"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (access === "not-admin") {
    return (
      <div dir="rtl" className="min-h-[100vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-8 text-center border border-slate-100 shadow-xl">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 mb-4">
            <HiOutlineBan className="h-8 w-8" />
          </div>
          <h2 className="text-base font-black text-slate-800 mb-2">منطقة مقيدة الصلاحية</h2>
          <p className="text-xs text-slate-500 mb-6">الحساب الحالي لا يمتلك امتيازات الأدمن للتحكم في الصلاحيات.</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-3 text-xs font-bold hover:bg-slate-800 transition shadow-md"
          >
            <HiOutlineLogout className="h-4 w-4" /> تسجيل الخروج بحساب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-9xl  space-y-6">
      
      {/* رأس الصفحة العصري */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-purple-900 via-indigo-900 to-slate-900 p-6 lg:p-10 text-white shadow-2xl shadow-purple-950/20">
        <div className="absolute top-0 left-0 -ml-12 -mt-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 -mr-12 -mb-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-purple-200">
              <HiOutlineSparkles className="h-3.5 w-3.5 text-purple-300" /> إدارة الاعتماد الأكاديمي
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">سجلات صلاحيات المعلمين</h1>
            <p className="text-xs text-purple-200/80 max-w-xl leading-relaxed">
              تحكم بمرونة في قوائم البريد الإلكتروني المصرح لها بالدخول كمعلمين، وتتبع حالات التفعيل والتعليق بضغطة زر واحدة.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 self-start md:self-auto rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-3 text-xs font-bold backdrop-blur-md transition shadow-sm"
          >
            <HiOutlineLogout className="h-4 w-4" /> خروج آمن
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <HiOutlineUserGroup className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-purple-200/70 font-semibold block">إجمالي السجلات</span>
              <span className="text-xl font-black mt-0.5 block">{list.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-emerald-500/10 backdrop-blur-md p-4 border border-emerald-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <HiOutlineCheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-200/85 font-semibold block">المعلمين المفعّلين</span>
              <span className="text-xl font-black mt-0.5 block text-emerald-300">{activeCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-amber-500/10 backdrop-blur-md p-4 border border-amber-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <HiOutlinePause className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] text-amber-200/85 font-semibold block">الحسابات المعطلة</span>
              <span className="text-xl font-black mt-0.5 block text-amber-300">{disabledCount}</span>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className={
            "rounded-2xl border px-5 py-4 text-xs font-bold leading-relaxed shadow-sm " +
            (notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : notice.type === "info"
                ? "border-purple-200 bg-purple-50 text-purple-800"
                : "border-rose-200 bg-rose-50 text-rose-800")
          }
        >
          {notice.text}
        </div>
      )}

      {/* قسم الإضافة الجديد */}
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-6 lg:p-8 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
            <HiOutlinePlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">تسجيل بريد معلم جديد</h2>
            <p className="text-[11px] text-slate-400">سيحصل صاحب هذا البريد على صلاحيات المعلم فور تسجيل دخوله للمنصة</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-5 relative">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
              <HiOutlineMail className="h-4 w-4" />
            </span>
            <input
              type="email"
              required
              dir="ltr"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="teacher.name@domain.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-4 pr-11 text-right text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="md:col-span-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="ملاحظة (مثال: معلم مادة الرياضيات)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 px-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-600/20 transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <HiOutlinePlus className="h-4 w-4" /> اعتماد وحفظ
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* شريط البحث المتقدم والفلترة */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
            <HiOutlineSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في السجلات (بالبريد أو الملاحظة)..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-10 text-right text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              statusFilter === "all"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            الكل ({list.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            المفعّلة فقط
          </button>
          <button
            onClick={() => setStatusFilter("disabled")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition ${
              statusFilter === "disabled"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            المعطلة فقط
          </button>
        </div>
      </div>

      {/* عرض السجلات (شكل سكون كرت احترافي وفخم جداً - Sleek Floating Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-black text-slate-800 tracking-wide">قائمة الاعتمادات الحالية ({filteredList.length})</h2>
          <span className="text-[11px] font-semibold text-slate-400">تحديث تلقائي</span>
        </div>

        {filteredList.length === 0 ? (
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-16 text-center shadow-xl shadow-slate-200/50">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-400 border border-purple-100">
              <HiOutlineAcademicCap className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-black text-slate-700 mb-1">لا توجد سجلات مطابقة للبحث</h3>
            <p className="text-xs text-slate-400">جرب البحث بكلمات مفتاحية أخرى أو قم بتغيير خيارات الفلتر.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((t) => {
              const isActive = t.status === "active";
              const rowBusy = busy === t.email;
              const isEditing = editing === t.email;

              if (isEditing) {
                return (
                  <div key={t.email} className="col-span-1 md:col-span-2 rounded-[2.2rem] border-2 border-purple-400 bg-purple-50/40 p-6 space-y-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-purple-900">تعديل بيانات السجل الأكاديمي</h3>
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100/60 px-2.5 py-0.5 rounded-full">وضع التعديل النشط</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-600">البريد الإلكتروني</label>
                        <input
                          type="email"
                          dir="ltr"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-right text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-600">الملاحظة أو التخصص</label>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="مثال: معلم لغة عربية"
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => saveEdit(t)}
                        disabled={rowBusy}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                      >
                        <HiOutlineCheck className="h-4 w-4" /> حفظ التعديلات
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={rowBusy}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50 shadow-sm"
                      >
                        <HiOutlineX className="h-4 w-4" /> إلغاء
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={t.email}
                  className={`group relative flex flex-col justify-between rounded-[2.2rem] p-6 transition-all duration-300 ${
                    isActive
                      ? "bg-white border border-slate-100/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(107,33,168,0.08)] hover:-translate-y-1 hover:border-purple-200"
                      : "bg-slate-50/70 border border-slate-200/60 opacity-80 shadow-none"
                  }`}
                >
                  {/* تدرج خلفي ناعم يظهر عند المرور بالماوس */}
                  <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-tr from-purple-600/[0.01] to-indigo-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* أيقونة الكرت بتصميم سكيليط فخم */}
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm ${
                          isActive
                            ? "bg-gradient-to-tr from-purple-50 to-indigo-50/80 text-purple-600 border border-purple-100/80 group-hover:scale-105 group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-purple-600/20"
                            : "bg-slate-200/80 text-slate-500 border border-slate-300/40"
                        }`}>
                          <HiOutlineAcademicCap className="h-6 w-6" />
                        </div>
                        
                        <div className="min-w-0 space-y-1">
                          <p dir="ltr" className="truncate text-right text-xs font-black text-slate-800 tracking-tight group-hover:text-purple-900 transition-colors">
                            {t.email}
                          </p>
                          {t.note ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100/80 text-slate-600 text-[10px] font-bold border border-slate-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                              <span className="truncate max-w-[200px]">{t.note}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">بدون ملاحظات مضافة</span>
                          )}
                        </div>
                      </div>

                      {/* شارة الحالة بتصميم كبسولة هادئة ونظيفة */}
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100/80"
                          : "bg-amber-50 text-amber-600 border border-amber-100/80"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {isActive ? "مفعّل" : "معطّل"}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      <HiOutlineClock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(t.created_at).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</span>
                    </div>

                    {/* أزرار التحكم بتنسيق نظيف وخفيف */}
                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(t)}
                        disabled={rowBusy}
                        title="تعديل"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-200/80 transition hover:bg-purple-600 hover:text-white hover:border-purple-600 disabled:opacity-50 shadow-2xs"
                      >
                        <HiOutlinePencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => toggleStatus(t)}
                        disabled={rowBusy}
                        title={isActive ? "تعطيل الصلاحية" : "تفعيل الصلاحية"}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border transition disabled:opacity-50 shadow-2xs ${
                          isActive
                            ? "bg-amber-50/50 text-amber-600 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                            : "bg-emerald-50/50 text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                        }`}
                      >
                        {isActive ? <HiOutlinePause className="h-4 w-4" /> : <HiOutlinePlay className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(t.email)}
                        disabled={rowBusy}
                        title="حذف نهائي"
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50/50 text-rose-600 border border-rose-200 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-50 shadow-2xs"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
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
