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
  Loader2,
  PlusCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TeacherVerification() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachersData();
  }, []);

  const fetchTeachersData = async () => {
    try {
      setLoading(true);
      setDbError(null);

      // استعلام من جدول teachers_profile
      const { data, error } = await supabase
        .from('teachers_profile')
        .select('*');

      console.log("Supabase Response - Data:", data);
      console.log("Supabase Response - Error:", error);

      if (error) {
        setDbError(error.message);
        throw error;
      }

      if (data && data.length > 0) {
        const formattedTeachers = data.map((t: any) => ({
          id: t.user_id || t.id,
          name: t.name || t.full_name || "مدرس بدون اسم",
          email: t.email || "غير متوفر",
          phone: t.phone || "غير متوفر",
          subject: t.role || t.subject || "مدرس خبير",
          date: t.updated_at ? t.updated_at.split('T')[0] : "حديث",
          idCardFront: t.id_front_url || t.idCardFront || "",
          idCardBack: t.id_back_url || t.idCardBack || "",
          status: t.status || "pending"
        }));
        setTeachers(formattedTeachers);
      } else {
        setTeachers([]);
      }
    } catch (err: any) {
      console.error("خطأ في جلب بيانات المعلمين:", err);
    } finally {
      setLoading(false);
    }
  };

  // دالة لإضافة بيانات تجريبية مؤقتة للتأكد من عمل الواجهة
  const addMockData = () => {
    const mockTeacher = {
      id: "mock-1",
      name: "أحمد محمد (تجريبي)",
      email: "ahmed@teacher.com",
      phone: "01012345678",
      subject: "مدرس رياضيات",
      date: "2026-06-06",
      idCardFront: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
      idCardBack: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
      status: "pending"
    };
    setTeachers([mockTeacher]);
    setSelectedTeacher(mockTeacher);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (id.startsWith("mock-")) {
      setTeachers(teachers.map(t => t.id === id ? { ...t, status: newStatus } : t));
      if (selectedTeacher) setSelectedTeacher((prev: any) => ({ ...prev, status: newStatus }));
      return;
    }

    try {
      const { error } = await supabase
        .from('teachers_profile')
        .update({ status: newStatus })
        .eq('user_id', id);

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
    if (id.startsWith("mock-")) {
      setTeachers(teachers.filter(t => t.id !== id));
      setSelectedTeacher(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('teachers_profile')
        .delete()
        .eq('user_id', id);

      if (error) throw error;

      setTeachers(prev => prev.filter(t => t.id !== id));
      if (selectedTeacher && selectedTeacher.id === id) setSelectedTeacher(null);
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "pending") return matchesSearch && t.status === "pending";
    if (activeTab === "approved") return matchesSearch && t.status === "approved";
    if (activeTab === "rejected") return matchesSearch && t.status === "rejected";
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-purple-600 font-bold bg-slate-50">
        <Loader2 size={36} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-200/85 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm shrink-0">
            <UserCheck size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold mb-2">
              <Sparkles size={12} />
              <span>لوحة الاعتمادات والتوثيق</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              توثيق حسابات المعلمين
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">
              استعرض بيانات المعلمين القادمة من قاعدة البيانات وراجع هوياتهم ومنحهم الموافقات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button 
            onClick={addMockData}
            className="px-4 py-3 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 border border-purple-200"
          >
            <PlusCircle size={16} />
            <span>تجربة بيانات وهمية</span>
          </button>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {dbError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>خطأ في قاعدة البيانات من Supabase: {dbError} (تحقق من الـ Console لمزيد من التفاصيل).</span>
        </div>
      )}

      {/* التبويبات */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "all" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          كل الطلبات ({teachers.length})
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "pending" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          قيد المراجعة ({teachers.filter(t => t.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "approved" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المقبولة ({teachers.filter(t => t.status === 'approved').length})
        </button>
        <button 
          onClick={() => setActiveTab("rejected")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${activeTab === "rejected" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >
          المرفوضة ({teachers.filter(t => t.status === 'rejected').length})
        </button>
      </div>

      {/* شبكة الكروت */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <div 
              key={teacher.id}
              className="group bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-base border border-purple-100 shadow-sm shrink-0">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                        {teacher.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {teacher.email}
                      </span>
                    </div>
                  </div>

                  <div>
                    {teacher.status === 'pending' && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60 text-[10px] font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        قيد المراجعة
                      </span>
                    )}
                    {teacher.status === 'approved' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        تم التوثيق
                      </span>
                    )}
                    {teacher.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 text-[10px] font-bold inline-flex items-center gap-1">
                        <XCircle size={12} />
                        مرفوض
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 my-4 text-xs font-medium text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الدور / المادة:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {teacher.subject}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">رقم الهاتف:</span>
                    <span className="font-semibold text-slate-800" dir="ltr">{teacher.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={() => setSelectedTeacher(teacher)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye size={15} />
                  <span>عرض التفاصيل والبطاقة</span>
                </button>
                <button 
                  onClick={() => handleDelete(teacher.id)}
                  title="حذف الطلب"
                  className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-bold text-sm">لا توجد طلبات معلمين مسجلة في قاعدة البيانات حتى الآن.</p>
            <button 
              onClick={addMockData}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 transition-all inline-flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>إضافة بطاقة تجريبية للعرض</span>
            </button>
          </div>
        )}
      </div>

      {/* مودال التفاصيل الكاملة */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setSelectedTeacher(null)}
              className="absolute top-6 left-6 p-2 rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors z-10"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
                {selectedTeacher.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{selectedTeacher.name}</h2>
                <span className="text-xs text-purple-600 font-semibold">{selectedTeacher.subject}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-1">البريد الإلكتروني</span>
                <span className="font-bold text-slate-800">{selectedTeacher.email}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-1">رقم الهاتف</span>
                <span className="font-bold text-slate-800" dir="ltr">{selectedTeacher.phone}</span>
              </div>
            </div>

            {/* صور البطاقة */}
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-700 block mb-3 flex items-center gap-1.5">
                <FileText size={16} className="text-purple-600" />
                <span>صور بطاقة الهوية (اضغط للتكبير):</span>
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => selectedTeacher.idCardFront && setZoomedImage(selectedTeacher.idCardFront)}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-lg transition-all"
                >
                  {selectedTeacher.idCardFront ? (
                    <img src={selectedTeacher.idCardFront} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">لا توجد صورة وجه للبطاقة</span>
                  )}
                  {selectedTeacher.idCardFront && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                      <Maximize2 size={24} />
                      <span className="text-xs font-bold">تكبير الوجه الأمامي</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">الوجه الأمامي</span>
                </div>

                <div 
                  onClick={() => selectedTeacher.idCardBack && setZoomedImage(selectedTeacher.idCardBack)}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-40 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-lg transition-all"
                >
                  {selectedTeacher.idCardBack ? (
                    <img src={selectedTeacher.idCardBack} alt="ID Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">لا توجد صورة ظهر للبطاقة</span>
                  )}
                  {selectedTeacher.idCardBack && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                      <Maximize2 size={24} />
                      <span className="text-xs font-bold">تكبير الوجه الخلفي</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">الوجه الخلفي</span>
                </div>
              </div>
            </div>

            {/* أزرار اتخاذ القرار */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block">اتخاذ القرار النهائي للتوثيق:</span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.id, 'approved')}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${selectedTeacher.status === 'approved' ? 'bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-2' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                >
                  <CheckCircle2 size={16} />
                  <span>موافق (توثيق الحساب)</span>
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTeacher.id, 'rejected')}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${selectedTeacher.status === 'rejected' ? 'bg-rose-600 text-white ring-2 ring-rose-600 ring-offset-2' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                >
                  <XCircle size={16} />
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
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 md:p-10"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
          >
            <X size={24} />
          </button>
          
          <img 
            src={zoomedImage} 
            alt="Zoomed ID Card" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
