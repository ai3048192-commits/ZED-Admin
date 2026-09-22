import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  FileText, 
  X, 
  Sparkles, 
  AlertCircle, 
  Maximize2,
  ShieldCheck,
  Phone,
  Mail,
  Calendar
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
        .from('profiles')
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
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setTeachers(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      if (selectedTeacher && selectedTeacher.id === id) {
        setSelectedTeacher((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert("خطأ أثناء تحديث الحالة: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
      setTeachers(prev => prev.filter(t => t.id !== id));
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-purple-600 font-bold bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <span>جاري تحميل لوحة التوثيق...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8 min-h-screen bg-slate-100/60 font-sans" dir="rtl">
      
      {/* رأس الصفحة الفخم */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm">
            <ShieldCheck size={36} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold mb-2">
              <Sparkles size={12} />
              <span>إدارة الأمان والاعتمادات</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              توثيق حسابات المعلمين
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">
              مراجعة هويات وبطاقات المعلمين المسجلين في النظام بدقة وسرعة
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72 z-10">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد الإلكتروني..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* التبويبات العصرية */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          كل الطلبات ({teachers.length})
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "pending" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          قيد المراجعة ({teachers.filter(t => t.status === 'pending' || !t.status).length})
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "approved" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المقبولة ({teachers.filter(t => t.status === 'approved').length})
        </button>
        <button 
          onClick={() => setActiveTab("rejected")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "rejected" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/25" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المرفوضة ({teachers.filter(t => t.status === 'rejected').length})
        </button>
      </div>

      {/* شبكة الكروت الاحترافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const teacherName = teacher.full_name || teacher.name || "معلم بدون اسم";
            return (
              <div 
                key={teacher.id} 
                className="group bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-purple-500/20 shrink-0">
                        {teacherName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                          {teacherName}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          {teacher.email}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                        teacher.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' :
                        teacher.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200/60' : 
                        'bg-amber-50 text-amber-600 border border-amber-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'approved' ? 'bg-emerald-500' : teacher.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
                        {teacher.status === 'approved' ? 'مفعل وموثق' : teacher.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 py-3.5 border-y border-slate-100 my-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><Mail size={13} /> البريد:</span>
                      <span className="font-bold text-slate-800">{teacher.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5"><Phone size={13} /> الهاتف:</span>
                      <span className="font-semibold text-slate-800" dir="ltr">{teacher.phone || "غير متوفر"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => setSelectedTeacher(teacher)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Eye size={16} />
                    <span>عرض التفاصيل وبطاقة الهوية</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(teacher.id)}
                    title="حذف السجل"
                    className="p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-[32px] border border-slate-200 space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-bold text-sm">لا توجد بيانات مطابقة للبحث أو الجدول فارغ حالياً.</p>
          </div>
        )}
      </div>

      {/* مودال تفاصيل المعلم وبطاقة الهوية */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            <button 
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-6 left-6 p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                {(selectedTeacher.full_name || selectedTeacher.name || "م").charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{selectedTeacher.full_name || selectedTeacher.name}</h2>
                <span className="text-xs text-purple-600 font-bold mt-0.5 block">ملف توثيق هوية المعلم</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-1 font-medium">البريد الإلكتروني</span>
                <span className="font-bold text-slate-800">{selectedTeacher.email}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-1 font-medium">رقم الهاتف</span>
                <span className="font-bold text-slate-800" dir="ltr">{selectedTeacher.phone || "غير متوفر"}</span>
              </div>
            </div>

            {/* قسم صور بطاقة الهوية */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />
                  <span>صور بطاقة الهوية الوطنية (اضغط لتكبير الصورة):</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* الوجه الأمامي */}
                <div 
                  onClick={() => selectedTeacher.id_front_url && setZoomedImage(selectedTeacher.id_front_url)}
                  className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 h-44 flex items-center justify-center cursor-pointer shadow-md hover:border-purple-500 transition-all"
                >
                  {selectedTeacher.id_front_url ? (
                    <img src={selectedTeacher.id_front_url} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="text-center p-4">
                      <FileText size={24} className="text-slate-500 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-bold">وجه البطاقة غير مرفق</span>
                    </div>
                  )}
                  {selectedTeacher.id_front_url && (
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                      <Maximize2 size={24} className="text-purple-300 animate-bounce" />
                      <span className="text-xs font-bold">تكبير الوجه الأمامي</span>
                    </div>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-slate-950/70 text-white text-[10px] font-bold rounded-xl backdrop-blur-md border border-white/10">
                    الوجه الأمامي للبطاقة
                  </span>
                </div>

                {/* الوجه الخلفي */}
                <div 
                  onClick={() => selectedTeacher.id_back_url && setZoomedImage(selectedTeacher.id_back_url)}
                  className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 h-44 flex items-center justify-center cursor-pointer shadow-md hover:border-purple-500 transition-all"
                >
                  {selectedTeacher.id_back_url ? (
                    <img src={selectedTeacher.id_back_url} alt="ID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="text-center p-4">
                      <FileText size={24} className="text-slate-500 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-bold">ظهر البطاقة غير مرفق</span>
                    </div>
                  )}
                  {selectedTeacher.id_back_url && (
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                      <Maximize2 size={24} className="text-purple-300 animate-bounce" />
                      <span className="text-xs font-bold">تكبير الوجه الخلفي</span>
                    </div>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-slate-950/70 text-white text-[10px] font-bold rounded-xl backdrop-blur-md border border-white/10">
                    الوجه الخلفي للبطاقة
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار القرار النهائي */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block">اتخاذ القرار للتوثيق:</span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.id, 'approved')}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${selectedTeacher.status === 'approved' ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                >
                  <CheckCircle2 size={16} />
                  <span>قبول وتوثيق الحساب</span>
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.id, 'rejected')}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${selectedTeacher.status === 'rejected' ? 'bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                >
                  <XCircle size={16} />
                  <span>رفض طلب التوثيق</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* نافذة تكبير الصورة (Lightbox) */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4 md:p-10"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
          >
            <X size={24} />
          </button>
          
          <img 
            src={zoomedImage} 
            alt="Zoomed ID" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
