'use client';

import React from 'react';
import { useEMS } from '../../context/EMSContext';
import {
  LayoutGrid,
  Users,
  CheckSquare,
  FileText,
  Settings,
  HelpCircle,
  CalendarDays,
  Clock,
  Megaphone,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenHelp?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenHelp,
}: SidebarProps) {
  const { currentUser, logout, resetAllData } = useEMS();

  const isManager = currentUser?.role === 'manager';

  // Navigation matching Figma
  const employeeNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'tasks', label: 'Task', icon: CheckSquare },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
  ];

  const managerNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance Record', icon: Clock },
    { id: 'tasks', label: 'Task', icon: CheckSquare },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const currentNav = isManager ? managerNav : employeeNav;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#EAF0EE] text-[#2C4A42] border-r border-[#D0DDD8] flex flex-col justify-between transition-transform duration-200 ease-in-out select-none shadow-md ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Logo matching Figma "Maqui" */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-[#1F3630] flex items-center justify-center text-white font-black text-sm shadow-md">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1D352F]">
              Maqui
            </span>
          </div>

          {/* Main Menu Section */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-[#6D8B83] uppercase tracking-wider">
              MAIN MENU
            </p>
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-[#4A7268] text-white shadow-md'
                        : 'text-[#41635B] hover:bg-[#D9E5E1] hover:text-[#1F3731]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Administration Section */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-[#6D8B83] uppercase tracking-wider">
              ADMINISTRATION
            </p>
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === 'settings'
                  ? 'bg-[#4A7268] text-white shadow-md'
                  : 'text-[#41635B] hover:bg-[#D9E5E1] hover:text-[#1F3731]'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>
          </div>

          {/* Support Section */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-[#6D8B83] uppercase tracking-wider">
              SUPPORT
            </p>
            <button
              onClick={() => {
                alert('EMS Help & Support Documentation (Version 3.0)\n\nPrepared by: James Maqui R. Pantas\nFeatures: Attendance clock in/out, Task delegation, Leave applications, Bulletins & Reports.');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#41635B] hover:bg-[#D9E5E1] hover:text-[#1F3731] transition-all text-left"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Help & Support</span>
            </button>
          </div>
        </div>

        {/* Bottom Profile Card matching Figma */}
        <div className="p-4 border-t border-[#D0DDD8] bg-[#E1EAE7]">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.firstName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#4A7268]"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-[#1F3731] truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-[10px] text-[#52776E] truncate">
                    {currentUser.role === 'manager' ? 'Department Manager' : currentUser.position}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-[#52776E] hover:text-rose-600 hover:bg-[#D5E1DC] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2 bg-[#4A7268] text-white rounded-xl text-xs font-bold"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
