import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import ContentManagement from "./pages/ContentManagement";
import AdminAboutUs from "./pages/AdminAboutUs";
import AdminTeacherSubscriptions from "./pages/AdminTeacherSubscriptions";
import AdminExtraContent from "./pages/AdminExtraContent";
import AdminNotifications from "./pages/AdminNotifications";
import SupportContact from "./pages/SupportContact";
import AdminPackages from "./pages/AdminPackages";
import AdminSettings from "./pages/AdminSettings";
import TeacherRegistration from "./pages/TeacherRegistration";

import "./index.css";
export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden lg:pr-72 transition-all">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin-users" element={<AdminExtraContent />} />
              <Route path="/admin-about" element={<AdminAboutUs />} />
              <Route
                path="/admin-notifications"
                element={<AdminNotifications />}
              />

              <Route
                path="/admin-teacher-verification"
                element={<TeacherRegistration />}
              />

              <Route path="/admin-comments" element={<SupportContact />} />
              <Route path="/admin-packages" element={<AdminPackages />} />
              <Route path="/admin-settings" element={<AdminSettings />} />
              <Route
                path="/admin-subscriptions"
                element={<AdminTeacherSubscriptions />}
              />
              <Route path="/admin-content" element={<ContentManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
