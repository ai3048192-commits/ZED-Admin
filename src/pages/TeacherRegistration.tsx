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
  Mail,
  MapPin,
  UserCheck
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
      const { data, error } = await supabase
        .from('teachers_profile')
        .select('*');

      if (error) throw error;
      if (data) setTeachers(data);
    } catch (err: any) {
      console.error("خطأ في جلب البيانات:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('teachers_profile')
        .update({ status: newStatus })
        .eq('user_id', id);

      if (error) {
        const { error: idError } = await supabase
          .from('teachers_profile')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (idError) throw idError;
      }

      setTeachers(prev => prev.map(t => (t.id === id || t.user_id === id) ? { ...t, status: newStatus } : t));
      
      if (selectedTeacher && (selectedTeacher.id === id || selectedTeacher.user_id === id)) {
        setSelectedTeacher({ ...selectedTeacher, status: newStatus });
      }

      setSelectedTeacher(null);
    } catch (err: any) {
      alert("حدث خطأ أثناء تحديث الحالة: " + err.message);
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

  const getFrontImage = (teacher: any) => {
    return teacher.id_front_url || teacher.front_image || teacher.national_id_front || teacher.id_image || null;
  };

  const getBackImage = (teacher: any) => {
    return teacher.id_back_url || teacher.back_image || teacher.national_id_back || null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-indigo-600 font-bold bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-600">جاري تحميل بيانات المعلمين...</span>
      </div>
    );
  }

  return (
    <div className="max-w-9xl mx-auto space-y-6 p-4 md:p-8 min-h-screen " dir="rtl">
      
      {/* رأس الصفحة الاحترافي */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={30} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              توثيق حسابات المعلمين
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              إدارة ومراجعة هويات وبطاقات المعلمين المسجلين بكل سهولة
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text5" 
            placeholder="البحث بالاسم أو البريد الإلكتروني..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* التبويبات الحديثة */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          كل الطلبات ({teachers.length})
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "pending" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          قيد المراجعة ({teachers.filter(t => t.status === 'pending' || !t.status).length})
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "approved" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          الموافق عليها ({teachers.filter(t => t.status === 'approved').length})
        </button>
        <button 
          onClick={() => setActiveTab("rejected")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "rejected" ? "bg-rose-600 text-white shadow-md shadow-rose-500/30" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المرفوضة ({teachers.filter(t => t.status === 'rejected').length})
        </button>
      </div>

      {/* شبكة الكروت بحجم أكبر وتصميم فخم مع التمرير (Scroll) */}
      <div className="max-h-[72vh] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const teacherName = teacher.full_name || teacher.name || "معلم بدون اسم";
            const recordId = teacher.user_id || teacher.id;
            return (
              <div 
                key={recordId} 
                className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between gap-5 group"
              >
                <div>
                  {/* رأس الكارت */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-700 border border-indigo-100 flex items-center justify-center font-black text-base shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {teacherName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">
                          {teacherName}
                        </h3>
                        <span className="text-[11px] text-indigo-600 font-semibold block truncate mt-0.5 flex items-center gap-1">
                          <UserCheck size={12} /> {teacher.role || "معلم"}
                        </span>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 shadow-sm ${
                      teacher.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      teacher.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {teacher.status === 'approved' ? 'موافق' : teacher.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                    </span>
                  </div>

                  {/* تفاصيل الكارت بتصميم واسع ومريح */}
                  <div className="space-y-2.5 py-3.5 px-4 border border-slate-100 bg-slate-50/70 rounded-2xl text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700" dir="ltr">{teacher.phone || "غير متوفر"}</span>
                    </div>
                    {teacher.city && (
                      <div className="flex items-center gap-2.5">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{teacher.city} {teacher.country ? `- ${teacher.country}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* أزرار الإجراءات داخل الكارت */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button 
                    onClick={() => setSelectedTeacher(teacher)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Eye size={15} />
                    <span>عرض التفاصيل والهوية</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(recordId)}
                    title="حذف"
                    className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm font-bold">لا توجد بيانات مطابقة للبحث الحالي.</p>
          </div>
        )}
      </div>

      {/* مودال التفاصيل وبطاقة الهوية */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-7 relative shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            
            <button 
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-5 left-5 p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-black text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" />
              تفاصيل وملف المعلم الكامل
            </h2>

            <div className="space-y-2.5 text-xs text-slate-700 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-sm font-bold text-slate-900 pb-1 border-b border-slate-200/60">{selectedTeacher.full_name || selectedTeacher.name}</p>
              <p><strong>البريد الإلكتروني:</strong> {selectedTeacher.email}</p>
              <p><strong>رقم الهاتف:</strong> <span dir="ltr">{selectedTeacher.phone || "غير متوفر"}</span></p>
              <p><strong>الدور:</strong> {selectedTeacher.role || "معلم"}</p>
              {selectedTeacher.city && <p><strong>المدينة:</strong> {selectedTeacher.city}</p>}
              {selectedTeacher.country && <p><strong>الدولة:</strong> {selectedTeacher.country}</p>}
            </div>

            {/* عرض صور البطاقة */}
            <div className="mb-6">
              <span className="text-xs font-extrabold text-slate-800 block mb-3">
                صور بطاقة الهوية الوطنية (اضغط لتكبير الصورة):
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => getFrontImage(selectedTeacher) && setZoomedImage(getFrontImage(selectedTeacher))}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center cursor-pointer shadow-md"
                >
                  {getFrontImage(selectedTeacher) ? (
                    <img src={getFrontImage(selectedTeacher)} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-xs text-slate-400 text-center p-3">وجه البطاقة غير مرفق</span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/75 text-white text-[10px] font-bold rounded-xl backdrop-blur-md">
                    الوجه الأمامي
                  </span>
                </div>

                <div 
                  onClick={() => getBackImage(selectedTeacher) && setZoomedImage(getBackImage(selectedTeacher))}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center cursor-pointer shadow-md"
                >
                  {getBackImage(selectedTeacher) ? (
                    <img src={getBackImage(selectedTeacher)} alt="ID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-xs text-slate-400 text-center p-3">ظهر البطاقة غير مرفق</span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/75 text-white text-[10px] font-bold rounded-xl backdrop-blur-md">
                    الوجه الخلفي
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار القرار (موافق / مرفوض) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.user_id || selectedTeacher.id, 'approved')}
                  className="py-3 px-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 size={16} />
                  <span>موافق (قبول)</span>
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.user_id || selectedTeacher.id, 'rejected')}
                  className="py-3 px-4 rounded-2xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  <XCircle size={16} />
                  <span>مرفوض</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* نافذة تكبير الصورة */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/30 transition-all backdrop-blur-md"
          >
            <X size={22} />
          </button>
          
          <img 
            src={zoomedImage} 
            alt="Zoomed ID" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
