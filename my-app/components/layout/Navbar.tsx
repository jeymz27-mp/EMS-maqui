'use client';

import React, { useState } from 'react';
import { useEMS } from '../../context/EMSContext';
import {
  Search,
  Bell,
  Clock,
  Play,
  Square,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SupabaseModal } from '../ui/SupabaseModal';

interface NavbarProps {
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ onOpenAuth, activeTab, setActiveTab }: NavbarProps) {
  const {
    currentUser,
    clockIn,
    clockOut,
    getTodayAttendance,
    activities,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  } = useEMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const todayAtt = currentUser ? getTodayAttendance(currentUser.id) : undefined;
  const isClockedIn = Boolean(todayAtt && todayAtt.timeIn);
  const isClockedOut = Boolean(todayAtt && todayAtt.timeOut);

  // Subtitles matching Figma screenshots
  const titlesMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Manage your work and monitor your activities.',
    },
    attendance: {
      title: 'Attendance',
      subtitle: 'Track your attendance records.',
    },
    tasks: {
      title: currentUser?.role === 'manager' ? 'Create & Assign Tasks' : 'My Work',
      subtitle:
        currentUser?.role === 'manager'
          ? 'Create, assign and track tasks for your team.'
          : 'Manage your tasks and stay on top of your goals.',
    },
    announcements: {
      title: 'Announcements',
      subtitle: 'Stay updated with the latest company news and updates.',
    },
    leave: {
      title: 'Leave Requests',
      subtitle: 'Submit and manage your leave request.',
    },
    employees: {
      title: 'Employees',
      subtitle: 'View employees within your department.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Analyze departmental performance and timesheet summaries.',
    },
    settings: {
      title: 'Account Settings',
      subtitle: 'Manage account settings, and customize your profile.',
    },
  };

  const headerInfo = titlesMap[activeTab] || {
    title: 'Dashboard',
    subtitle: 'Manage your work and monitor your activities.',
  };

  return (
    <header className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#436A60]">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {headerInfo.title}
        </h1>
        <p className="text-xs text-white/80 font-medium mt-0.5">
          {headerInfo.subtitle}
        </p>
      </div>

      {/* Right: Search Bar, Quick Punch Widget & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Punch widget */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#3B5F56] border border-white/15 px-3 py-1.5 rounded-full text-xs text-white">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            {!isClockedIn ? (
              <button
                onClick={() => clockIn(currentUser.id)}
                className="font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                Punch Time In
              </button>
            ) : !isClockedOut ? (
              <button
                onClick={() => clockOut(currentUser.id)}
                className="font-bold text-rose-300 hover:text-rose-200 transition-colors flex items-center gap-1"
              >
                <span>Time Out</span>
                <span className="text-[10px] text-white/70">({todayAtt?.timeIn})</span>
              </button>
            ) : (
              <span className="text-[11px] text-white/80 font-mono">
                Punched: {todayAtt?.timeIn} - {todayAtt?.timeOut}
              </span>
            )}
          </div>
        )}

        {/* Figma Search Input pill */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6D8C84]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Something..."
            className="w-48 sm:w-64 pl-10 pr-4 py-2 bg-white text-[#1E3731] placeholder:text-[#7A9890] text-xs rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Notification Bell Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-white text-[#2B4B43] hover:bg-white/90 flex items-center justify-center shadow-md transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-[#1F3731] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in border border-[#C6D8D2]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifications & Updates</span>
                <span className="text-[10px] text-slate-400">{activities.length} total</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-2 bg-[#F3F7F5] rounded-xl text-xs">
                    <p className="font-bold text-[#2A4B43]">{act.title}</p>
                    <p className="text-[11px] text-[#557970] mt-0.5">{act.description}</p>
                    <span className="text-[9px] text-[#81A39B]">{act.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Interactive Connection Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </header>
  );
}
