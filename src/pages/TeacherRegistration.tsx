import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Maximize2,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  X,
  XCircle,
  LogIn,
  LogOut,
  Lock,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* ================================================================== */
/*  Types & helpers                                                   */
/* ================================================================== */

type Status = "pending" | "approved" | "rejected";
type Access = "loading" | "guest" | "not-admin" | "admin";

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  date: string;
  idCardFront: string;
  idCardBack: string;
  status: Status;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const errorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return String(err);
};

const toTeacher = (t: Row): Teacher => ({
  id: t.user_id,
  name: t.name || "مدرس بدون اسم",
  // الكود القديم كان بيحط test@teacher.com لأي معلم مالوش إيميل، فالأدمن
  // كان ممكن يفتكره إيميل حقيقي
  email: t.email || "بدون بريد",
  phone: t.phone || "غير متوفر",
  subject: t.role || "مدرس",
  date: t.updated_at ? String(t.updated_at).split("T")[0] : "حديث",
  idCardFront: t.id_front_url || "",
  idCardBack: t.id_back_url || "",
  status: t.status === "approved" || t.status === "rejected" ? t.status : "pending",
});

/* ================================================================== */
/*  الصفحة                                                             */
/* ================================================================== */

export default function TeacherVerification() {
  const [access, setAccess] = useState<Access>("loading");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | Status>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // نموذج الدخول اللي جوه الصفحة نفسها
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  const fetchTeachersData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      // التأكد إن اللي فاتح الصفحة أدمن فعلاً.
      // من غير ده، الصفحة كانت بتطلع فاضية من غير ما حد يعرف ليه:
      // RLS بترجّع للمستخدم العادي سجله هو بس (أو ولا حاجة).
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setAccess("guest");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
      if (profile?.role !== "admin") {
        setAccess("not-admin");
        return;
      }
      setAccess("admin");

      const { data, error } = await supabase
        .from("teachers_profile")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setTeachers((data ?? []).map(toTeacher));
    } catch (err) {
      console.error("خطأ في جلب بيانات المعلمين:", err);
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTeachersData();
    // لو الجلسة اتغيّرت (دخول/خروج)، نعيد الفحص من غير reload
    const { data: sub } = supabase.auth.onAuthStateChange(() => void fetchTeachersData());
    return () => sub.subscription.unsubscribe();
  }, [fetchTeachersData]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSigningIn(false);
    if (error) {
      setSignInError("البريد أو كلمة المرور غير صحيحة.");
      return;
    }
    setPassword("");
    // onAuthStateChange هيعيد الفحص تلقائياً
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTeachers([]);
    setAccess("guest");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (zoomedImage) setZoomedImage(null);
      else setSelectedTeacher(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomedImage]);

  const handleStatusChange = async (id: string, newStatus: Status) => {
    setBusyId(id);
    try {
      const { data, error } = await supabase
        .from("teachers_profile")
        .update({ status: newStatus })
        .eq("user_id", id)
        .select("user_id");
      if (error) throw error;
      // لو RLS رفضت، Supabase مش بيرمي خطأ، بيرجّع 0 صف بس
      if (!data?.length) throw new Error("لم يتم التحديث. تأكد إن حسابك أدمن وإن ملف admin_access.sql متشغّل.");

      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
      setSelectedTeacher((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      alert("خطأ أثناء تحديث الحالة: " + errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) return;
    setBusyId(id);
    try {
      const { data, error } = await supabase.from("teachers_profile").delete().eq("user_id", id).select("user_id");
      if (error) throw error;
      if (!data?.length) throw new Error("لم يتم الحذف. تأكد إن حسابك أدمن وإن ملف admin_access.sql متشغّل.");

      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setSelectedTeacher((prev) => (prev && prev.id === id ? null : prev));
    } catch (err) {
      alert("خطأ أثناء الحذف: " + errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const q = searchTerm.toLowerCase();
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
    return matchesSearch && (activeTab === "all" || t.status === activeTab);
  });

  const count = (s: Status) => teachers.filter((t) => t.status === s).length;

  /* ---------- الحالات قبل العرض ---------- */

  if (access === "loading" || (access === "admin" && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-purple-600">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  // مش مسجّل دخول → خانة دخول جوه الصفحة نفسها.
  // تكتب مرة واحدة، وبعدها المتصفح بيفتكر الجلسة وتفتح على طول كل مرة.
  if (access === "guest") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm space-y-5 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="space-y-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-purple-50 text-purple-600">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-lg font-black text-slate-900">دخول لوحة الإدارة</h1>
            <p className="text-xs text-slate-500">هذه الصفحة مخصصة للإدارة. سجّل الدخول بحساب الأدمن.</p>
          </div>

          {signInError && (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
              {signInError}
            </p>
          )}

          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-right text-sm font-semibold text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/15"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-semibold text-slate-800 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/15"
              />
            </div>
            <button
              type="submit"
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3 text-sm font-black text-white shadow-md transition-colors hover:bg-purple-700 disabled:opacity-60"
            >
              {signingIn ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  // مسجّل دخول بس مش أدمن
  if (access === "not-admin") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <div className="max-w-md space-y-3 rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert size={36} className="mx-auto text-rose-500" />
          <h1 className="text-lg font-black text-slate-900">هذا الحساب ليس حساب إدارة</h1>
          <p className="text-xs leading-relaxed text-slate-500">
            الحساب الحالي مش أدمن. سجّل الخروج وادخل بحساب الإدارة الصحيح.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <LogOut size={15} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  /* ---------- الصفحة ---------- */

  return (
    <div className="min-h-screen space-y-8" dir="rtl">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[32px] border border-slate-200/85 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-500/5 blur-2xl" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="shrink-0 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-purple-600 shadow-sm">
            <UserCheck size={32} />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600">
              <Sparkles size={12} />
              <span>لوحة الاعتمادات والتوثيق</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">توثيق حسابات المعلمين</h1>
            <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
              راجع بيانات المعلمين وصور هوياتهم الشخصية، ووثّق الحسابات أو ارفضها.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="تسجيل الخروج"
            className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={14} />
            خروج
          </button>
        </div>

        <div className="relative z-10 w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            placeholder="بحث بالاسم، البريد، أو المادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-xs font-medium text-slate-800 shadow-inner transition-all focus:border-purple-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>تعذّر جلب بيانات المعلمين: {loadError}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            ["all", `كل الطلبات (${teachers.length})`, "bg-purple-600 shadow-purple-600/20"],
            ["pending", `قيد المراجعة (${count("pending")})`, "bg-amber-500 shadow-amber-500/20"],
            ["approved", `المقبولة (${count("approved")})`, "bg-emerald-600 shadow-emerald-600/20"],
            ["rejected", `المرفوضة (${count("rejected")})`, "bg-rose-600 shadow-rose-600/20"],
          ] as const
        ).map(([key, label, activeCls]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
              activeTab === key
                ? `${activeCls} text-white shadow-lg`
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />

              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-base font-black text-purple-600 shadow-sm">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-purple-600">
                        {teacher.name}
                      </h3>
                      <span dir="ltr" className="block truncate text-right text-[11px] font-medium text-slate-400">
                        {teacher.email}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={teacher.status} />
                </div>

                <div className="my-4 space-y-2 border-y border-slate-100 py-3 text-xs font-medium text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الدور / المادة:</span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-bold text-slate-800">{teacher.subject}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <span className="font-semibold text-slate-800" dir="ltr">
                      {teacher.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(teacher)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-600 shadow-sm transition-all hover:bg-purple-600 hover:text-white"
                >
                  <Eye size={15} />
                  عرض التفاصيل والبطاقة
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(teacher.id)}
                  disabled={busyId === teacher.id}
                  title="حذف الطلب"
                  aria-label={`حذف ${teacher.name}`}
                  className="rounded-xl bg-slate-100 p-2.5 text-slate-500 shadow-sm transition-all hover:bg-rose-600 hover:text-white disabled:opacity-60"
                >
                  {busyId === teacher.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white py-16 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">
              {teachers.length === 0 ? "لا توجد طلبات معلمين مسجلة حتى الآن." : "لا توجد نتائج مطابقة."}
            </p>
          </div>
        )}
      </div>

      {selectedTeacher && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedTeacher(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              aria-label="إغلاق"
              className="absolute left-6 top-6 z-10 rounded-2xl bg-slate-100 p-2 text-slate-500 transition-colors hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl font-black text-purple-600 shadow-inner">
                {selectedTeacher.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{selectedTeacher.name}</h2>
                <span className="text-xs font-semibold text-purple-600">{selectedTeacher.subject}</span>
              </div>
              <div className="mr-auto">
                <StatusBadge status={selectedTeacher.status} />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="mb-1 block text-slate-400">البريد الإلكتروني</span>
                <span dir="ltr" className="block break-all text-right font-bold text-slate-800">
                  {selectedTeacher.email}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="mb-1 block text-slate-400">رقم الهاتف</span>
                <span className="font-bold text-slate-800" dir="ltr">
                  {selectedTeacher.phone}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <span className="mb-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <FileText size={16} className="text-purple-600" />
                صور بطاقة الهوية (اضغط للتكبير):
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <IdImage src={selectedTeacher.idCardFront} label="الوجه الأمامي" onZoom={setZoomedImage} />
                <IdImage src={selectedTeacher.idCardBack} label="الوجه الخلفي" onZoom={setZoomedImage} />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="block text-xs font-bold text-slate-500">اتخاذ القرار النهائي للتوثيق:</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void handleStatusChange(selectedTeacher.id, "approved")}
                  disabled={busyId === selectedTeacher.id}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold shadow-md transition-all disabled:opacity-60 ${
                    selectedTeacher.status === "approved"
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  موافق (توثيق الحساب)
                </button>
                <button
                  type="button"
                  onClick={() => void handleStatusChange(selectedTeacher.id, "rejected")}
                  disabled={busyId === selectedTeacher.id}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold shadow-md transition-all disabled:opacity-60 ${
                    selectedTeacher.status === "rejected"
                      ? "bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2"
                      : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                  }`}
                >
                  <XCircle size={16} />
                  رفض الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10"
          onClick={() => setZoomedImage(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImage(null);
            }}
            aria-label="إغلاق"
            className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
          >
            <X size={24} />
          </button>
          <img
            src={zoomedImage}
            alt="صورة البطاقة مكبّرة"
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  مكونات صغيرة                                                        */
/* ================================================================== */

function StatusBadge({ status }: { status: Status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
        <CheckCircle2 size={12} />
        تم التوثيق
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200/60 bg-rose-50 px-3 py-1 text-[10px] font-bold text-rose-600">
        <XCircle size={12} />
        مرفوض
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-600">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      قيد المراجعة
    </span>
  );
}

function IdImage({ src, label, onZoom }: { src: string; label: string; onZoom: (s: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => src && onZoom(src)}
      disabled={!src}
      className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition-all hover:shadow-lg disabled:cursor-default"
    >
      {src ? (
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
      ) : (
        <span className="text-xs font-bold text-slate-400">لم يرفع المعلم صورة {label}</span>
      )}
      {src && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 size={24} />
          <span className="text-xs font-bold">تكبير {label}</span>
        </span>
      )}
      <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
        {label}
      </span>
    </button>
  );
}
