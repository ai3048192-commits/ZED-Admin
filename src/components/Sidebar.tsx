import React from 'react';
import { 
  LayoutDashboard,
  FolderTree,
  Users,
  Bell,
  LogOut,
  X,
  Info,
  ShieldCheck,
  CreditCard,
  Settings,
  MessageSquare,
  Package,
  HelpCircle,
  Shield,
  UserCheck
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  children?: { name: string; path: string }[];
}

// تم إضافة مسار "توثيق حسابات المعلمين" ضمن مصفوفة الروابط مع أيقونة معبرة
const menuItems: MenuItem[] = [
  { name: "لوحة التحكم", icon: LayoutDashboard, path: "/" },
  { name: "إدارة المحتوى", icon: FolderTree, path: "/admin-content" },
  { name: "إدارة الأقسام", icon: Users, path: "/admin-users" },
  { 
    name: "توثيق حسابات المعلمين", 
    icon: UserCheck, 
    path: "/admin-teacher-verification",
  },
  { name: "من نحن", icon: Info, path: "/admin-about" },
  {
    name: "إدارة الاشتراكات",
    icon: CreditCard,
    path: "/admin-subscriptions",
  },
  { 
    name: "إدارة الباقات", 
    icon: Package, 
    path: "/admin-packages", 
  },

  {
    name: "الإشعارات والتنبيهات",
    icon: Bell,
    path: "/admin-notifications",
  },
  {
    name: "التعليقات والمناقشات",
    icon: MessageSquare,
    path: "/admin-comments",
  },
  { name: "إعدادات النظام", icon: Settings, path: "/admin-settings" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <>
      {/* خلفية شفافة مع ضبابية للموبايل عند فتح القائمة */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* القائمة الجانبية بتصميم بنفسجي راقي للأدمن أحمد إسماعيل */}
      <aside
        aria-label="القائمة الجانبية للمسؤول"
        className={`fixed top-0 right-0 h-screen w-72 bg-white text-slate-700 z-50 border-l border-slate-200 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* خط إضاءة بنفسجي رفيع في الأعلى */}
        <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400" />

        <div className="h-full flex flex-col justify-between p-5">
          {/* الجزء العلوي والقائمة */}
          <div className="space-y-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {/* بطاقة التعريف بالمنصة / الأدمن */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm shrink-0">
                  <Shield size={22} />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-wide text-slate-900">
                    أحمد إسماعيل
                  </h2>
                  <span className="text-[11px] text-purple-600 font-semibold tracking-wider block mt-0.5">
                    لوحة تحكم المسؤول (Admin)
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="lg:hidden p-2 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl border border-slate-200 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* عناصر القائمة */}
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.children && location.pathname.startsWith(item.path));

                return (
                  <div key={item.path} className="space-y-1">
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`group relative flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 font-medium text-sm ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                          : "text-slate-600 hover:text-purple-600 hover:bg-purple-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className={`p-2 rounded-xl transition-all duration-300 shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:text-purple-600 group-hover:bg-purple-100/50"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="tracking-wide">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full relative z-10 shrink-0 ${
                            isActive
                              ? "bg-white text-purple-600"
                              : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* الفروع الخاصة بإدارة الأقسام والهيكلة */}
                    {item.children && isActive && (
                      <div className="pr-9 space-y-1 pt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onClose}
                            className={`block py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${
                              location.pathname === child.path
                                ? "text-purple-600 bg-purple-50 font-bold"
                                : "text-slate-500 hover:text-purple-600 hover:bg-slate-50"
                            }`}
                          >
                            - {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* الجزء السفلي: حالة النظام وزر الخروج */}
          <div className="pt-4 mt-auto border-t border-slate-100 space-y-3">
            {/* بطاقة الحالة */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">
                    النظام يعمل بكفاءة
                  </span>
                </div>
              </div>
              <ShieldCheck size={16} className="text-purple-600" />
            </div>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="group flex w-full items-center justify-center gap-2.5 p-3 text-rose-600 hover:text-white hover:bg-rose-600 rounded-2xl border border-rose-100 hover:border-rose-600 transition-all font-semibold text-sm shadow-sm"
            >
              <LogOut
                size={18}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
