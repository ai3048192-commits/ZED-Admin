import { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  X, 
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TeacherVerification() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachersData();
  }, []);

  const fetchTeachersData = async () => {
    try {
      setLoading(true);
      // استخدام جدول teachers_profile المتوافق مع ملف Profile_2.tsx
      const { data, error } = await supabase
        .from('teachers_profile')
        .select('*');

      console.log("Supabase Data:", data);
      if (error) throw error;
      if (data) setTeachers(data);
    } catch (err: any) {
      console.error("خطأ في جلب البيانات:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    // التحديث محلياً مباشرة لتجنب الأخطاء
    setTeachers(prev => prev.map(t => (t.id === id || t.user_id === id) ? { ...t, status: newStatus } : t));
    if (selectedTeacher && (selectedTeacher.id === id || selectedTeacher.user_id === id)) {
      setSelectedTeacher((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await supabase.from('teachers_profile').delete().eq('user_id', id);
      setTeachers(prev => prev.filter(t => t.id !== id && t.user_id !== id));
      setSelectedTeacher(null);
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const name = t.full_name || t.name || "";
    const email = t.email || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "pending") return matchesSearch && (t.status === "pending" || !t.status);
    if (activeTab === "approved") return matchesSearch && t.status === "approved";
    if (activeTab === "rejected") return matchesSearch && t.status === "rejected";
    return matchesSearch;
  });

  // الربط المباشر بحقول الصور القادمة من Profile_2.tsx
  const getFrontImage = (teacher: any) => {
    return teacher.id_front_url || teacher.front_image || teacher.national_id_front || teacher.id_image || null;
  };

  const getBackImage = (teacher: any) => {
    return teacher.id_back_url || teacher.back_image || teacher.national_id_back || null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-purple-600 font-bold bg-slate-50 gap-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 min-h-screen bg-slate-50" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              توثيق حسابات المعلمين
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة ومراجعة هويات وبطاقات المعلمين المسجلين
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeTab === "all" ? "bg-purple-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          كل الطلبات ({teachers.length})
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeTab === "pending" ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          قيد المراجعة ({teachers.filter(t => t.status === 'pending' || !t.status).length})
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeTab === "approved" ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المقبولة ({teachers.filter(t => t.status === 'approved').length})
        </button>
        <button 
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeTab === "rejected" ? "bg-rose-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المرفوضة ({teachers.filter(t => t.status === 'rejected').length})
        </button>
      </div>

      {/* شبكة الكروت */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const teacherName = teacher.full_name || teacher.name || "معلم بدون اسم";
            const recordId = teacher.user_id || teacher.id;
            return (
              <div 
                key={recordId} 
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {teacherName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-xs truncate">
                          {teacherName}
                        </h3>
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                          {teacher.email}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      teacher.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      teacher.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {teacher.status === 'approved' ? 'مقبول' : teacher.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-2.5 border-y border-slate-100 my-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><Mail size={12}/> البريد:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{teacher.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><Phone size={12}/> الهاتف:</span>
                      <span className="font-medium text-slate-700" dir="ltr">{teacher.phone || "غير متوفر"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button 
                    onClick={() => setSelectedTeacher(teacher)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>التفاصيل والهوية</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(recordId)}
                    title="حذف"
                    className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-xs">لا توجد بيانات مطابقة للبحث الحالي.</p>
          </div>
        )}
      </div>

      {/* مودال التفاصيل وبطاقة الهوية */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              تفاصيل وملف المعلم
            </h2>

            <div className="space-y-2 text-xs text-slate-700 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p><strong>الاسم:</strong> {selectedTeacher.full_name || selectedTeacher.name}</p>
              <p><strong>البريد:</strong> {selectedTeacher.email}</p>
              <p><strong>الهاتف:</strong> <span dir="ltr">{selectedTeacher.phone || "غير متوفر"}</span></p>
              {selectedTeacher.city && <p><strong>المدينة:</strong> {selectedTeacher.city}</p>}
            </div>

            {/* عرض صور البطاقة القادمة من الـ Profile */}
            <div className="mb-5">
              <span className="text-xs font-bold text-slate-800 block mb-2.5">
                صور بطاقة الهوية (اضغط للتكبير):
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* الوجه الأمامي */}
                <div 
                  onClick={() => getFrontImage(selectedTeacher) && setZoomedImage(getFrontImage(selectedTeacher))}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-32 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {getFrontImage(selectedTeacher) ? (
                    <img src={getFrontImage(selectedTeacher)} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center p-2">وجه البطاقة غير مرفق</span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[9px] rounded-lg backdrop-blur-sm">
                    الوجه الأمامي
                  </span>
                </div>

                {/* الوجه الخلفي */}
                <div 
                  onClick={() => getBackImage(selectedTeacher) && setZoomedImage(getBackImage(selectedTeacher))}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-32 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {getBackImage(selectedTeacher) ? (
                    <img src={getBackImage(selectedTeacher)} alt="ID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-[11px] text-slate-400 text-center p-2">ظهر البطاقة غير مرفق</span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[9px] rounded-lg backdrop-blur-sm">
                    الوجه الخلفي
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار القرار */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.user_id || selectedTeacher.id, 'approved')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>قبول وتوثيق</span>
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.user_id || selectedTeacher.id, 'rejected')}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <XCircle size={14} />
                  <span>رفض الطلب</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* نافذة تكبير الصورة */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/25 transition-all"
          >
            <X size={20} />
          </button>
          
          <img 
            src={zoomedImage} 
            alt="Zoomed ID" 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
