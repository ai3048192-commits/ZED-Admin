import React, { useState, useEffect } from 'react';
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

      if (data) {
        setTeachers(data);
      }
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
      await supabase.from('teachers_profile').delete().eq('id', id);
      setTeachers(prev => prev.filter(t => t.id !== id));
      setSelectedTeacher(null);
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const name = t.name || t.full_name || "";
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
      <div className="flex items-center justify-center min-h-screen text-purple-600 font-bold bg-slate-50">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50" dir="rtl">
      
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">توثيق حسابات المعلمين</h1>
          <p className="text-sm text-slate-500 mt-1">استعرض بيانات المعلمين ومراجعة هوياتهم</p>
        </div>
        <div>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو البريد..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "all" ? "bg-purple-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          كل الطلبات ({teachers.length})
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "pending" ? "bg-amber-500 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          قيد المراجعة
        </button>
        <button 
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "approved" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          المقبولة
        </button>
        <button 
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "rejected" ? "bg-rose-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
        >
          المرفوضة
        </button>
      </div>

      {/* الشبكة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">{teacher.name || teacher.full_name || "بدون اسم"}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    teacher.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    teacher.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {teacher.status === 'approved' ? 'مقبول' : teacher.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">البريد: {teacher.email}</p>
                <p className="text-xs text-slate-500 mb-4">الهاتف: {teacher.phone || "غير متوفر"}</p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedTeacher(teacher)}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all font-bold text-xs"
                >
                  عرض التفاصيل
                </button>
                <button 
                  onClick={() => handleDelete(teacher.id)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-600 hover:text-white transition-all"
                >
                  حذف
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            لا توجد بيانات مسجلة في جدول `teachers_profile` حالياً.
          </div>
        )}
      </div>

      {/* المودال */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">تفاصيل المعلم</h2>
            <div className="space-y-3 text-xs text-slate-700 mb-6">
              <p><strong>الاسم:</strong> {selectedTeacher.name || selectedTeacher.full_name}</p>
              <p><strong>البريد:</strong> {selectedTeacher.email}</p>
              <p><strong>الهاتف:</strong> {selectedTeacher.phone}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="block mb-1 font-bold">وجه البطاقة:</span>
                  {selectedTeacher.id_front_url ? (
                    <img src={selectedTeacher.id_front_url} alt="ID Front" className="w-full h-32 object-cover rounded-xl border cursor-pointer" onClick={() => setZoomedImage(selectedTeacher.id_front_url)} />
                  ) : <span className="text-slate-400">غير متوفر</span>}
                </div>
                <div>
                  <span className="block mb-1 font-bold">ظهر البطاقة:</span>
                  {selectedTeacher.id_back_url ? (
                    <img src={selectedTeacher.id_back_url} alt="ID Back" className="w-full h-32 object-cover rounded-xl border cursor-pointer" onClick={() => setZoomedImage(selectedTeacher.id_back_url)} />
                  ) : <span className="text-slate-400">غير متوفر</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => handleStatusChange(selectedTeacher.id, 'approved')}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
              >
                موافقة
              </button>
              <button 
                onClick={() => handleStatusChange(selectedTeacher.id, 'rejected')}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs"
              >
                رفض
              </button>
            </div>

            <button 
              onClick={() => setSelectedTeacher(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* تكبير الصورة */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}

    </div>
  );
}
