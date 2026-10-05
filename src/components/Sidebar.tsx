import React, { useState } from 'react';
import { 
  LayoutDashboard,
  FolderTree,
  Users,
  Bell,
  X,
  Info,
  CreditCard,
  Settings,
  MessageSquare,
  Package,
  Shield,
  UserCheck,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SubItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  badge?: string;
  category: string;
  children?: SubItem[];
}

// تنظيم العناصر في فئات واضحة مع دعم القوائم الفرعية (الفلاتر)
const menuItems: MenuItem[] = [
  { 
    name: "لوحة التحكم", 
    icon: LayoutDashboard, 
    path: "/", 
    category: "الرئيسية" 
  },
  
  { 
    name: "إدارة المحتوى والأقسام", 
    icon: FolderTree, 
    category: "الإدارة والتشغيل",
    children: [
      { name: "إدارة المحتوى العام", path: "/admin-content" },
      { name: "إدارة الأقسام", path: "/admin-users" },
    ]
  },
  { 
    name: "توثيق حسابات المعلمين", 
    icon: UserCheck, 
    path: "/admin-teacher-verification",
    badge: "جديد",
    category: "الإدارة والتشغيل"
  },
  {
    name: "صلاحيات المستخدمين",
    icon: Shield,
    path: "/user-permissions",
    category: "الإدارة والتشغيل"
  },
  
  {
    name: "المالية والباقات",
    icon: CreditCard,
    category: "المالية والاشتراكات",
    children: [
      { name: "الاشتراكات النشطة", path: "/admin-subscriptions" },
      { name: "إدارة الباقات", path: "/admin-packages" },
    ]
  },
  
  {
    name: "النظام والإعدادات",
    icon: Settings,
    category: "النظام والتواصل",
    children: [
      { name: "الإشعارات والتنبيهات", path: "/admin-notifications" },
      { name: "التعليقات والمناقشات", path: "/admin-comments" },
      { name: "من نحن", path: "/admin-about" },
      { name: "إعدادات النظام العامة", path: "/admin-settings" },
    ]
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  // تفعيل فتح القسم تلقائياً إذا كانت إحدى صفحاته الفرعية نشطة حالياً
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>(() => {
    const initialState: { [key: string]: boolean } = {};
    menuItems.forEach(item => {
      if (item.children?.some(child => location.pathname === child.path)) {
        initialState[item.name] = true;
      }
    });
    return initialState;
  });

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const categories = ["الرئيسية", "الإدارة والتشغيل", "المالية والاشتراكات", "النظام والتواصل"];

  return (
    <>
      {/* خلفية شفافة مع ضبابية للموبايل عند فتح القائمة */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* القائمة الجانبية بالهوية البيضاء والبنفسجية الأصلية للأدمن أحمد إسماعيل */}
      <aside
        aria-label="القائمة الجانبية للمسؤول"
        className={`fixed top-0 right-0 h-screen w-72 bg-white text-slate-700 z-50 border-l border-slate-200/80 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* خط إضاءة بنفسجي رفيع في الأعلى */}
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400" />

        <div className="h-full flex flex-col justify-between p-4 sm:p-5">
          {/* الجزء العلوي والقائمة */}
          <div className="space-y-5 overflow-y-auto pr-1 pl-1 scrollbar-thin scrollbar-thumb-purple-200">
            
            {/* بطاقة التعريف بالأدمن أحمد إسماعيل */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-600/20 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wide text-slate-900 flex items-center gap-1.5">
                    أحمد إسماعيل
                    <Sparkles size={13} className="text-purple-600" />
                  </h2>
                  <span className="text-[10px] text-purple-600 font-bold tracking-wider block mt-0.5 bg-purple-50 px-2 py-0.5 rounded-md w-fit border border-purple-100/50">
                    لوحة تحكم المسؤول
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="lg:hidden p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* عناصر القائمة مقسمة ومنظمة مع الفلاتر المنسدلة */}
            <nav className="space-y-4">
              {categories.map((cat) => {
                const categoryItems = menuItems.filter((item) => item.category === cat);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    {cat !== "الرئيسية" && (
                      <p className="px-3 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                        {cat}
                      </p>
                    )}
                    
                    <div className="space-y-1.5">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const hasChildren = item.children && item.children.length > 0;
                        const isCategoryOpen = openCategories[item.name] || false;
                        const isDirectActive = item.path ? location.pathname === item.path : false;
                        const isChildActive = item.children?.some(c => location.pathname === c.path);

                        return (
                          <div key={item.name} className="space-y-1">
                            {hasChildren ? (
                              // زر القسم الرئيسي الذي يفتح القائمة المنسدلة (الفلتر) عند النقر
                              <button
                                type="button"
                                onClick={() => toggleCategory(item.name)}
                                className={`w-full group relative flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 font-semibold text-xs ${
                                  isChildActive
                                    ? "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm"
                                    : "text-slate-600 hover:text-purple-600 hover:bg-purple-50/50"
                                }`}
                              >
                                <div className="flex items-center gap-3 relative z-10">
                                  <div className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${
                                    isChildActive ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500 group-hover:text-purple-600 group-hover:bg-purple-100/80"
                                  }`}>
                                    <Icon size={16} />
                                  </div>
                                  <span className="tracking-wide">{item.name}</span>
                                </div>

                                <ChevronDown 
                                  size={16} 
                                  className={`transition-transform duration-300 text-slate-400 ${isCategoryOpen ? "rotate-180 text-purple-600" : ""}`} 
                                />
                              </button>
                            ) : (
                              // رابط مباشر عادي
                              <Link
                                to={item.path!}
                                onClick={onClose}
                                className={`group relative flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 font-semibold text-xs ${
                                  isDirectActive
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                                    : "text-slate-600 hover:text-purple-600 hover:bg-purple-50/70"
                                }`}
                              >
                                <div className="flex items-center gap-3 relative z-10">
                                  <div className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${
                                    isDirectActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:text-purple-600 group-hover:bg-purple-100/80"
                                  }`}>
                                    <Icon size={16} />
                                  </div>
                                  <span className="tracking-wide">{item.name}</span>
                                </div>

                                {item.badge && (
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full relative z-10 shrink-0 ${
                                    isDirectActive ? "bg-white text-purple-600 shadow-sm" : "bg-purple-100 text-purple-600"
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            )}

                            {/* القائمة الفرعية (الروابط التي تظهر عند النقر على القسم) */}
                            {hasChildren && isCategoryOpen && (
                              <div className="pr-10 pl-2 space-y-1 pt-1">
                                {item.children!.map((child) => {
                                  const isSubActive = location.pathname === child.path;
                                  return (
                                    <Link
                                      key={child.path}
                                      to={child.path}
                                      onClick={onClose}
                                      className={`block py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                                        isSubActive
                                          ? "text-purple-700 bg-purple-100/80 font-bold shadow-sm"
                                          : "text-slate-500 hover:text-purple-600 hover:bg-slate-50"
                                      }`}
                                    >
                                      • {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* الجزء السفلي: مؤشر حالة النظام فقط */}
          <div className="pt-4 mt-auto border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-slate-700">النظام يعمل بكفاءة</span>
              </div>
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                أمن 100%
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
