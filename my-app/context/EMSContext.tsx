'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Employee,
  Task,
  AttendanceRecord,
  LeaveRequest,
  Announcement,
  ActivityFeedItem,
  UserRole,
  TaskStatus,
  LeaveStatus,
  AttendanceStatus,
} from '../types/ems';
import {
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ACTIVITIES,
} from '../data/mockData';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import {
  sendDefaultPasswordEmail,
  generateDefaultPassword,
} from '../lib/emailService';
import {
  fetchEmployeesFromDB,
  fetchTasksFromDB,
  fetchAttendanceFromDB,
  fetchLeaveRequestsFromDB,
  fetchAnnouncementsFromDB,
  fetchActivitiesFromDB,
  upsertEmployeeInDB,
  updateEmployeeInDB,
  upsertTaskInDB,
  updateTaskInDB,
  upsertAttendanceInDB,
  upsertLeaveRequestInDB,
  updateLeaveRequestInDB,
  upsertAnnouncementInDB,
  updateAnnouncementInDB,
  deleteAnnouncementFromDB,
  insertActivityInDB,
  seedSupabaseIfEmpty,
  forceReseedSupabase,
  mapEmployeeFromDB,
  mapTaskFromDB,
  mapAttendanceFromDB,
  mapLeaveRequestFromDB,
  mapAnnouncementFromDB,
  mapActivityFromDB,
} from '../lib/supabaseService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export type DbSyncStatus = 'synced' | 'syncing' | 'offline' | 'local_fallback';

interface EMSContextType {
  currentUser: Employee | null;
  employees: Employee[];
  tasks: Task[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  announcements: Announcement[];
  activities: ActivityFeedItem[];
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Supabase Database Connection & Sync Status
  isSupabaseActive: boolean;
  dbSyncStatus: DbSyncStatus;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  refreshFromDatabase: () => Promise<void>;

  // Auth
  login: (emailOrId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  activateAccount: (empId: string, email: string, username: string, newPassword: string) => Promise<{ success: boolean; error?: string; supabaseSynced?: boolean }>;
  forgotPassword: (emailOrId: string, newPassword: string) => { success: boolean; error?: string };
  sendDefaultPassword: (emailOrId: string) => Promise<{
    success: boolean;
    message: string;
    isSimulated: boolean;
    defaultPassword?: string;
    email?: string;
  }>;
  switchUser: (employeeId: string) => void;

  // Attendance
  clockIn: (employeeId: string) => { success: boolean; message: string };
  clockOut: (employeeId: string) => { success: boolean; message: string };
  getTodayAttendance: (employeeId: string) => AttendanceRecord | undefined;

  // Tasks
  updateTaskByEmployee: (taskId: string, status: TaskStatus, notes?: string) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'progress'> & { progress?: number }) => void;
  updateTaskByManager: (taskId: string, updates: Partial<Task>) => void;

  // Leave
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'dateRequested' | 'employeeName' | 'department'>) => { success: boolean; message: string };
  reviewLeaveRequest: (requestId: string, status: 'Approved' | 'Rejected', managerNotes?: string) => void;

  // Announcements
  createAnnouncement: (data: Omit<Announcement, 'id' | 'postedOn' | 'postedById' | 'postedByName' | 'postedByRole'>) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;

  // User Profile & Settings
  updateUserProfile: (userId: string, data: Partial<Employee>) => void;
  changePassword: (userId: string, currentPass: string, newPass: string) => { success: boolean; error?: string };
  toggle2FA: (userId: string) => void;
  updateSMSPhone: (userId: string, phone: string) => void;
  addManagerNote: (employeeId: string, note: string) => void;

  // Reset
  resetAllData: () => void;
}

const EMSContext = createContext<EMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'ems_current_user_id_v3',
  EMPLOYEES: 'ems_employees_v3',
  TASKS: 'ems_tasks_v3',
  ATTENDANCE: 'ems_attendance_v3',
  LEAVE_REQUESTS: 'ems_leave_requests_v3',
  ANNOUNCEMENTS: 'ems_announcements_v3',
  ACTIVITIES: 'ems_activities_v3',
};

export function EMSProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [activities, setActivities] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITIES);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Supabase states
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<DbSyncStatus>('local_fallback');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addActivity = useCallback((type: ActivityFeedItem['type'], title: string, description: string, actorName: string) => {
    const newAct: ActivityFeedItem = {
      id: 'act-' + Date.now(),
      type,
      title,
      description,
      timestamp: 'Just now',
      actor: actorName,
    };
    setActivities((prev) => [newAct, ...prev]);

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      insertActivityInDB(newAct).catch((err) => console.error('Failed to log activity to DB:', err));
    }
  }, []);

  // Fetch all entities from Supabase and seed if empty
  const refreshFromDatabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseActive(false);
      setDbSyncStatus('local_fallback');
      return;
    }

    setDbSyncStatus('syncing');

    try {
      // Check & auto-seed database if empty
      await seedSupabaseIfEmpty();

      // Parallel fetch from Supabase PostgreSQL tables
      const [dbEmps, dbTasks, dbAtt, dbLeave, dbAnn, dbActs] = await Promise.all([
        fetchEmployeesFromDB(),
        fetchTasksFromDB(),
        fetchAttendanceFromDB(),
        fetchLeaveRequestsFromDB(),
        fetchAnnouncementsFromDB(),
        fetchActivitiesFromDB(),
      ]);

      let hasData = false;

      if (dbEmps && dbEmps.length > 0) {
        setEmployees(dbEmps);
        hasData = true;
      }
      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
        hasData = true;
      }
      if (dbAtt && dbAtt.length > 0) {
        setAttendanceRecords(dbAtt);
        hasData = true;
      }
      if (dbLeave && dbLeave.length > 0) {
        setLeaveRequests(dbLeave);
        hasData = true;
      }
      if (dbAnn && dbAnn.length > 0) {
        setAnnouncements(dbAnn);
        hasData = true;
      }
      if (dbActs && dbActs.length > 0) {
        setActivities(dbActs);
        hasData = true;
      }

      if (hasData || dbEmps !== null) {
        setIsSupabaseActive(true);
        setDbSyncStatus('synced');
      } else {
        setIsSupabaseActive(false);
        setDbSyncStatus('local_fallback');
      }
    } catch (err) {
      console.error('Error synchronizing with Supabase:', err);
      setIsSupabaseActive(false);
      setDbSyncStatus('offline');
    }
  }, []);

  // Initial load: load from localStorage cache first for zero layout shift, then sync from Supabase
  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const storedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      const storedLeave = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const storedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      const storedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);

      const emps: Employee[] = storedEmployees ? JSON.parse(storedEmployees) : INITIAL_EMPLOYEES;
      setEmployees(emps);

      if (storedTasks) setTasks(JSON.parse(storedTasks));
      if (storedAttendance) setAttendanceRecords(JSON.parse(storedAttendance));
      if (storedLeave) setLeaveRequests(JSON.parse(storedLeave));
      if (storedAnnouncements) setAnnouncements(JSON.parse(storedAnnouncements));
      if (storedActivities) setActivities(JSON.parse(storedActivities));

      if (storedUserId) {
        const found = emps.find((e) => e.id === storedUserId);
        if (found) {
          setCurrentUser(found);
        }
      }
    } catch (err) {
      console.error('Error loading EMS local cache:', err);
    } finally {
      setIsHydrated(true);
    }

    // Try synchronizing with Supabase
    if (isSupabaseConfigured()) {
      refreshFromDatabase();
    }
  }, [refreshFromDatabase]);

  // Setup Supabase Realtime Channel
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel('ems-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedEmp = mapEmployeeFromDB(payload.new);
          setEmployees((prev) => {
            const exists = prev.some((e) => e.id === updatedEmp.id);
            if (exists) return prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
            return [...prev, updatedEmp];
          });
          setCurrentUser((curr) => (curr && curr.id === updatedEmp.id ? updatedEmp : curr));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedTask = mapTaskFromDB(payload.new);
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === updatedTask.id);
            if (exists) return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
            return [updatedTask, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedAtt = mapAttendanceFromDB(payload.new);
          setAttendanceRecords((prev) => {
            const exists = prev.some((a) => a.id === updatedAtt.id);
            if (exists) return prev.map((a) => (a.id === updatedAtt.id ? updatedAtt : a));
            return [updatedAtt, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedLeave = mapLeaveRequestFromDB(payload.new);
          setLeaveRequests((prev) => {
            const exists = prev.some((l) => l.id === updatedLeave.id);
            if (exists) return prev.map((l) => (l.id === updatedLeave.id ? updatedLeave : l));
            return [updatedLeave, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedAnn = mapAnnouncementFromDB(payload.new);
          setAnnouncements((prev) => {
            const exists = prev.some((a) => a.id === updatedAnn.id);
            if (exists) return prev.map((a) => (a.id === updatedAnn.id ? updatedAnn : a));
            return [updatedAnn, ...prev];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setAnnouncements((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAct = mapActivityFromDB(payload.new);
          setActivities((prev) => {
            if (prev.some((a) => a.id === newAct.id)) return prev;
            return [newAct, ...prev];
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseActive(true);
          setDbSyncStatus('synced');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync to localStorage as offline cache
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
      localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(leaveRequests));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (err) {
      console.error('Error saving EMS local cache:', err);
    }
  }, [employees, tasks, attendanceRecords, leaveRequests, announcements, activities, currentUser, isHydrated]);

  // Auth functions
  const login = (emailOrId: string, password: string): { success: boolean; error?: string } => {
    const trimmed = emailOrId.trim().toLowerCase();
    const user = employees.find(
      (e) => e.email.toLowerCase() === trimmed || e.id.toLowerCase() === trimmed || e.username.toLowerCase() === trimmed
    );

    if (!user) {
      return { success: false, error: 'No account found with this Email or Employee ID.' };
    }

    // Strictly match the password stored in the database / user record
    if (!user.password || user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
    }

    // If logging in with the default password and account is not yet activated, auto-activate it
    if (!user.isActivated) {
      const activatedUser = { ...user, isActivated: true };
      setEmployees((prev) => prev.map((e) => (e.id === user.id ? activatedUser : e)));
      if (isSupabaseConfigured()) {
        updateEmployeeInDB(user.id, { isActivated: true }).catch((err) =>
          console.error('Failed to sync auto-activation to Supabase:', err)
        );
      }
      setCurrentUser(activatedUser);
      addToast('success', 'Welcome!', `Logged in as ${user.firstName} ${user.lastName} (${user.role === 'manager' ? 'Department Manager' : 'Employee'}).`);
      return { success: true };
    }

    setCurrentUser(user);
    addToast('success', 'Welcome Back!', `Logged in as ${user.firstName} ${user.lastName} (${user.role === 'manager' ? 'Department Manager' : 'Employee'}).`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addToast('info', 'Logged Out', 'You have been safely signed out.');
    }
    setCurrentUser(null);
  };

  const activateAccount = async (
    empId: string,
    email: string,
    username: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; supabaseSynced?: boolean }> => {
    const trimmedId = empId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    const employeeIndex = employees.findIndex(
      (e) => e.id.toUpperCase() === trimmedId || e.email.toLowerCase() === trimmedEmail
    );

    if (employeeIndex === -1) {
      // System creates a new employee entry with the generated Employee ID
      const nameParts = (username.trim() || trimmedEmail.split('@')[0]).split(/[._-]/);
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'New';
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Employee';

      const newEmp: Employee = {
        id: trimmedId || `EMP-2026-${String(employees.length + 1).padStart(3, '0')}`,
        email: trimmedEmail,
        username: username.trim() || trimmedEmail.split('@')[0],
        password: newPassword,
        isActivated: true,
        role: 'employee',
        firstName,
        lastName,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        position: 'Staff Associate',
        department: 'IT',
        status: 'Active',
        phone: '+1 (555) 300-1122',
        bio: 'Team member in the Employee Management System.',
        dateJoined: new Date().toISOString().split('T')[0],
        birthday: '1998-05-18',
        address: 'Headquarters Office',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: '+1 (555) 999-8877',
        },
        employmentDetails: {
          employmentType: 'Full-Time',
          workSchedule: '8:00 AM - 5:00 PM (PST)',
          officeLocation: 'Headquarters - Building B, Floor 3',
          salary: '$72,000 / yr',
          reportsTo: 'Sarah Jenkins (IT Department Manager)',
        },
        twoFactorEnabled: false,
        leaveBalance: {
          vacation: { total: 15, used: 0 },
          sick: { total: 10, used: 0 },
          personal: { total: 5, used: 0 },
          emergency: { total: 3, used: 0 },
        },
        documents: [],
        performance: [],
      };

      setEmployees([newEmp, ...employees]);

      let dbSynced = false;
      if (isSupabaseConfigured()) {
        const dbRes = await upsertEmployeeInDB(newEmp);
        if (dbRes.success) {
          dbSynced = true;
          addToast(
            'success',
            'Saved to Supabase!',
            `Employee record (${newEmp.id}) was successfully saved to your Supabase PostgreSQL database.`
          );
        } else {
          addToast(
            'error',
            'Supabase Sync Error',
            `Saved locally, but failed to save to Supabase: ${dbRes.error || 'Unknown error'}. Make sure schema.sql has been run in your Supabase SQL Editor.`
          );
        }
      } else {
        addToast(
          'warning',
          'Supabase Not Connected',
          'Account activated in local browser mode. Supabase credentials are not configured yet. Click the "Database" button at the top right to configure Supabase URL & Key.'
        );
      }

      addActivity('security', 'Account Activated', `${newEmp.firstName} ${newEmp.lastName} registered and activated new account (${newEmp.id}).`, `${newEmp.firstName} ${newEmp.lastName}`);
      addToast('success', 'Account Activated!', `Welcome aboard, ${newEmp.firstName}! Your EMS credentials have been created. Please log in with your password.`);
      return { success: true, supabaseSynced: dbSynced };
    }

    const employee = employees[employeeIndex];
    if (employee.isActivated) {
      return { success: false, error: 'This account is already activated. Please use regular login.' };
    }

    const updated: Employee = {
      ...employee,
      username: username.trim() || employee.email.split('@')[0],
      password: newPassword,
      isActivated: true,
    };

    const newEmployees = [...employees];
    newEmployees[employeeIndex] = updated;
    setEmployees(newEmployees);

    // Sync to Supabase
    let dbSynced = false;
    if (isSupabaseConfigured()) {
      const dbRes = await upsertEmployeeInDB(updated);
      if (dbRes.success) {
        dbSynced = true;
        addToast('success', 'Saved to Supabase!', `Employee (${updated.id}) credentials updated in Supabase cloud.`);
      } else {
        addToast('error', 'Supabase Sync Error', dbRes.error || 'Failed to update user in Supabase.');
      }
    } else {
      addToast(
        'warning',
        'Supabase Not Connected',
        'Saved to local storage only. Click the "Database" button at the top to configure your Supabase URL & Key.'
      );
    }

    addActivity('security', 'Account Activated', `${updated.firstName} ${updated.lastName} completed first-time activation.`, `${updated.firstName} ${updated.lastName}`);
    addToast('success', 'Account Activated!', `Welcome aboard, ${updated.firstName}! Your EMS credentials have been saved. Please log in with your password.`);

    return { success: true, supabaseSynced: dbSynced };
  };

  const forgotPassword = (emailOrId: string, newPassword: string) => {
    const trimmed = emailOrId.trim().toLowerCase();
    const employeeIndex = employees.findIndex(
      (e) => e.email.toLowerCase() === trimmed || e.id.toLowerCase() === trimmed || e.username.toLowerCase() === trimmed
    );

    if (employeeIndex === -1) {
      return { success: false, error: 'No account found matching this identifier.' };
    }

    const updatedEmp: Employee = {
      ...employees[employeeIndex],
      password: newPassword,
    };

    const newEmployees = [...employees];
    newEmployees[employeeIndex] = updatedEmp;
    setEmployees(newEmployees);

    if (currentUser && currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateEmployeeInDB(updatedEmp.id, { password: newPassword }).catch((err) =>
        console.error('Failed to sync password reset to Supabase:', err)
      );
    }

    addToast('success', 'Password Reset Successful', 'You can now log in with your updated password.');
    return { success: true };
  };

  const sendDefaultPassword = async (
    emailOrId: string
  ): Promise<{ success: boolean; message: string; isSimulated: boolean; defaultPassword?: string; email?: string }> => {
    const trimmed = emailOrId.trim().toLowerCase();
    if (!trimmed) {
      return {
        success: false,
        message: 'Please provide an Employee ID or Company Email.',
        isSimulated: false,
      };
    }

    const employeeIndex = employees.findIndex(
      (e) =>
        e.email.toLowerCase() === trimmed ||
        e.id.toLowerCase() === trimmed ||
        e.username.toLowerCase() === trimmed
    );

    if (employeeIndex === -1) {
      return {
        success: false,
        message: 'No registered employee found with this ID or Email.',
        isSimulated: false,
      };
    }

    const emp = employees[employeeIndex];
    const newDefaultPass = generateDefaultPassword();

    const updatedEmp: Employee = {
      ...emp,
      password: newDefaultPass,
      isActivated: true,
    };

    const newEmployees = [...employees];
    newEmployees[employeeIndex] = updatedEmp;
    setEmployees(newEmployees);

    if (currentUser && currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        await updateEmployeeInDB(updatedEmp.id, {
          password: newDefaultPass,
          isActivated: true,
        });
      } catch (err) {
        console.error('Failed to sync generated default password to Supabase:', err);
      }
    }

    // Dispatch via EmailJS
    const emailResult = await sendDefaultPasswordEmail({
      toEmail: emp.email,
      toName: `${emp.firstName} ${emp.lastName}`,
      employeeId: emp.id,
      defaultPassword: newDefaultPass,
    });

    addActivity(
      'security',
      'Default Password Dispatched',
      `Default password sent to ${emp.email} (${emailResult.isSimulated ? 'Simulated' : 'EmailJS'}).`,
      `${emp.firstName} ${emp.lastName}`
    );

    if (emailResult.isSimulated) {
      addToast(
        'info',
        'Default Password Dispatched',
        `Password generated for ${emp.email} (EmailJS keys pending in .env.local).`
      );
    } else {
      addToast(
        'success',
        'Email Sent Successfully',
        `Default password dispatched to ${emp.email} via EmailJS.`
      );
    }

    return {
      success: emailResult.success,
      message: emailResult.message,
      isSimulated: emailResult.isSimulated,
      defaultPassword: newDefaultPass,
      email: emp.email,
    };
  };

  const switchUser = (employeeId: string) => {
    const target = employees.find((e) => e.id === employeeId);
    if (target) {
      setCurrentUser(target);
      addToast('info', 'Switched User Profile', `Now previewing EMS as ${target.firstName} ${target.lastName} (${target.role}).`);
    }
  };

  // Attendance
  const getTodayAttendance = (employeeId: string) => {
    const todayStr = '2026-10-08';
    return attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
  };

  const clockIn = (employeeId: string) => {
    const todayStr = '2026-10-08';
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const existing = attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (existing && existing.timeIn) {
      return { success: false, message: 'You have already clocked in today at ' + existing.timeIn };
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = Number(hours) >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    const isLate = Number(hours) > 8 || (Number(hours) === 8 && Number(minutes) > 15);
    const status: AttendanceStatus = isLate ? 'Late' : 'Present';

    let recordToSave: AttendanceRecord;
    let updatedAttendance: AttendanceRecord[];

    if (existing) {
      recordToSave = {
        ...existing,
        timeIn: formattedTime,
        status,
        notes: isLate ? 'Clocked in after 8:15 AM grace window' : 'Clocked in on time',
      };
      updatedAttendance = attendanceRecords.map((a) => (a.id === existing.id ? recordToSave : a));
    } else {
      recordToSave = {
        id: 'att-' + Date.now(),
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        date: todayStr,
        timeIn: formattedTime,
        timeOut: null,
        workingHours: 8.0,
        status,
        notes: isLate ? 'Clocked in after 8:15 AM grace window' : 'Clocked in on time',
      };
      updatedAttendance = [recordToSave, ...attendanceRecords];
    }

    setAttendanceRecords(updatedAttendance);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      upsertAttendanceInDB(recordToSave).catch((err) => console.error('Failed to sync clock in to Supabase:', err));
    }

    addActivity('attendance', 'Daily Time In', `${emp.firstName} recorded Time In at ${formattedTime} (${status})`, `${emp.firstName} ${emp.lastName}`);
    addToast('success', 'Time In Recorded!', `Successfully punched in at ${formattedTime}. Status: ${status}`);
    return { success: true, message: 'Time in recorded successfully.' };
  };

  const clockOut = (employeeId: string) => {
    const todayStr = '2026-10-08';
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const existing = attendanceRecords.find((a) => a.employeeId === employeeId && a.date === todayStr);
    if (!existing || !existing.timeIn) {
      return { success: false, message: 'Please record Time In first before clocking out.' };
    }

    if (existing.timeOut) {
      return { success: false, message: 'You have already clocked out today at ' + existing.timeOut };
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = Number(hours) >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    const recordToSave: AttendanceRecord = {
      ...existing,
      timeOut: formattedTime,
      workingHours: 8.5,
    };

    const updated = attendanceRecords.map((a) => (a.id === existing.id ? recordToSave : a));
    setAttendanceRecords(updated);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      upsertAttendanceInDB(recordToSave).catch((err) => console.error('Failed to sync clock out to Supabase:', err));
    }

    addActivity('attendance', 'Daily Time Out', `${emp.firstName} recorded Time Out at ${formattedTime}`, `${emp.firstName} ${emp.lastName}`);
    addToast('success', 'Time Out Recorded!', `Punched out at ${formattedTime}. Thank you for your hard work today!`);
    return { success: true, message: 'Time out recorded successfully.' };
  };

  // Tasks
  const updateTaskByEmployee = (taskId: string, status: TaskStatus, notes?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let progress = task.progress;
    if (status === 'Completed') progress = 100;
    else if (status === 'In Progress' && progress === 0) progress = 25;
    else if (status === 'Pending') progress = 0;

    const updatedTask: Task = {
      ...task,
      status,
      progress,
      employeeNotes: notes !== undefined ? notes : task.employeeNotes,
      completedAt: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
    };

    const updated = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    setTasks(updated);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateTaskInDB(taskId, updatedTask).catch((err) => console.error('Failed to sync task update to Supabase:', err));
    }

    addActivity('task', 'Task Status Updated', `Status changed to "${status}" for "${task.title}"`, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Employee');
    addToast('success', 'Task Updated', `Task status marked as ${status}.`);
  };

  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'progress'> & { progress?: number }) => {
    const newTask: Task = {
      ...taskData,
      id: 'TSK-' + Math.floor(1000 + Math.random() * 9000),
      progress: taskData.progress ?? 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks((prev) => [newTask, ...prev]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      upsertTaskInDB(newTask).catch((err) => console.error('Failed to sync task creation to Supabase:', err));
    }

    addActivity('task', 'New Task Assigned', `Assigned "${newTask.title}" to ${newTask.assignedToName}`, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Manager');
    addToast('success', 'Task Created', `Assigned to ${newTask.assignedToName} successfully.`);
  };

  const updateTaskByManager = (taskId: string, updates: Partial<Task>) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updatedTask = { ...target, ...updates };
    setTasks(tasks.map((t) => (t.id === taskId ? updatedTask : t)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateTaskInDB(taskId, updates).catch((err) => console.error('Failed to sync task manager update to Supabase:', err));
    }

    addActivity('task', 'Task Modified by Manager', `Manager updated progress/details on "${target.title}"`, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Manager');
    addToast('success', 'Task Updated', 'Task modifications saved.');
  };

  // Leave
  const submitLeaveRequest = (data: Omit<LeaveRequest, 'id' | 'status' | 'dateRequested' | 'employeeName' | 'department'>) => {
    if (!currentUser) return { success: false, message: 'Not authenticated.' };

    const newReq: LeaveRequest = {
      ...data,
      id: 'LEV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
      employeeId: currentUser.id,
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      department: currentUser.department,
      status: 'Pending',
      dateRequested: '2026-10-08',
    };

    setLeaveRequests((prev) => [newReq, ...prev]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      upsertLeaveRequestInDB(newReq).catch((err) => console.error('Failed to sync leave request to Supabase:', err));
    }

    addActivity('leave', 'Leave Application Filed', `${currentUser.firstName} submitted a ${data.leaveType} leave request for ${data.totalDays} day(s).`, `${currentUser.firstName} ${currentUser.lastName}`);
    addToast('success', 'Leave Request Submitted', `Your request for ${data.totalDays} day(s) of ${data.leaveType} leave has been sent for manager review.`);
    return { success: true, message: 'Request submitted.' };
  };

  const reviewLeaveRequest = (requestId: string, status: 'Approved' | 'Rejected', managerNotes?: string) => {
    const req = leaveRequests.find((r) => r.id === requestId);
    if (!req) return;

    const reviewerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Sarah Jenkins';

    const updatedReq: LeaveRequest = {
      ...req,
      status,
      reviewedBy: reviewerName,
      reviewedAt: '2026-10-08',
      managerNotes: managerNotes || req.managerNotes,
    };

    setLeaveRequests((prev) => prev.map((r) => (r.id === requestId ? updatedReq : r)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateLeaveRequestInDB(requestId, updatedReq).catch((err) =>
        console.error('Failed to sync leave review to Supabase:', err)
      );
    }

    // If approved, update employee leave balance used
    if (status === 'Approved') {
      const typeKey = req.leaveType.toLowerCase() as keyof Employee['leaveBalance'];
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id === req.employeeId && emp.leaveBalance && emp.leaveBalance[typeKey]) {
            const currentBalance = emp.leaveBalance[typeKey];
            const updatedEmp: Employee = {
              ...emp,
              leaveBalance: {
                ...emp.leaveBalance,
                [typeKey]: {
                  ...currentBalance,
                  used: Math.min(currentBalance.total, currentBalance.used + req.totalDays),
                },
              },
            };
            if (isSupabaseConfigured()) {
              updateEmployeeInDB(emp.id, { leaveBalance: updatedEmp.leaveBalance }).catch((err) =>
                console.error('Failed to sync leave balance to Supabase:', err)
              );
            }
            return updatedEmp;
          }
          return emp;
        })
      );
    }

    addActivity('leave', `Leave Request ${status}`, `Leave request for ${req.employeeName} (${req.leaveType}) was ${status.toLowerCase()}`, reviewerName);
    addToast(status === 'Approved' ? 'success' : 'warning', `Leave Request ${status}`, `Leave application for ${req.employeeName} has been ${status.toLowerCase()}.`);
  };

  // Announcements
  const createAnnouncement = (data: Omit<Announcement, 'id' | 'postedOn' | 'postedById' | 'postedByName' | 'postedByRole'>) => {
    const poster = currentUser || INITIAL_EMPLOYEES[1];
    const newAnn: Announcement = {
      ...data,
      id: 'ANN-' + Math.floor(100 + Math.random() * 900),
      postedById: poster.id,
      postedByName: `${poster.firstName} ${poster.lastName}`,
      postedByRole: poster.position,
      postedOn: 'October 08, 2026 at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAnnouncements((prev) => [newAnn, ...prev]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      upsertAnnouncementInDB(newAnn).catch((err) => console.error('Failed to sync announcement to Supabase:', err));
    }

    addActivity('announcement', 'New Announcement', `"${newAnn.title}" published for ${newAnn.audience}`, `${poster.firstName} ${poster.lastName}`);
    addToast('success', 'Announcement Posted', `Successfully broadcasted to ${newAnn.audience}.`);
  };

  const updateAnnouncement = (id: string, data: Partial<Announcement>) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateAnnouncementInDB(id, data).catch((err) => console.error('Failed to sync announcement update to Supabase:', err));
    }

    addToast('success', 'Announcement Updated', 'Changes have been published.');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      deleteAnnouncementFromDB(id).catch((err) => console.error('Failed to sync announcement delete to Supabase:', err));
    }

    addToast('info', 'Announcement Removed', 'The announcement has been deleted.');
  };

  const togglePinAnnouncement = (id: string) => {
    let updatedPinned = false;
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedPinned = !a.isPinned;
          return { ...a, isPinned: updatedPinned };
        }
        return a;
      })
    );

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      updateAnnouncementInDB(id, { isPinned: updatedPinned }).catch((err) =>
        console.error('Failed to sync pin update to Supabase:', err)
      );
    }

    addToast('info', 'Pin Status Changed', 'Announcement priority updated.');
  };

  // User Profile & Settings
  const updateUserProfile = (userId: string, data: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === userId) {
          const updated = { ...emp, ...data };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          if (isSupabaseConfigured()) {
            updateEmployeeInDB(userId, data).catch((err) => console.error('Failed to sync profile update to Supabase:', err));
          }
          return updated;
        }
        return emp;
      })
    );
    addToast('success', 'Profile Updated', 'Your personal details have been saved.');
  };

  const changePassword = (userId: string, currentPass: string, newPass: string) => {
    const emp = employees.find((e) => e.id === userId);
    if (!emp) return { success: false, error: 'User not found.' };

    if (emp.password && emp.password !== currentPass) {
      return { success: false, error: 'Current password does not match.' };
    }

    setEmployees((prev) =>
      prev.map((e) => (e.id === userId ? { ...e, password: newPass } : e))
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, password: newPass });
    }

    if (isSupabaseConfigured()) {
      updateEmployeeInDB(userId, { password: newPass }).catch((err) =>
        console.error('Failed to sync password change to Supabase:', err)
      );
    }

    addToast('success', 'Password Changed', 'Your security credentials have been updated.');
    return { success: true };
  };

  const toggle2FA = (userId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === userId) {
          const updated = { ...emp, twoFactorEnabled: !emp.twoFactorEnabled };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          if (isSupabaseConfigured()) {
            updateEmployeeInDB(userId, { twoFactorEnabled: updated.twoFactorEnabled }).catch((err) =>
              console.error('Failed to sync 2FA to Supabase:', err)
            );
          }
          addToast('info', '2FA Status', `Two-factor authentication is now ${updated.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}.`);
          return updated;
        }
        return emp;
      })
    );
  };

  const updateSMSPhone = (userId: string, phone: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === userId) {
          const updated = { ...emp, smsRecoveryPhone: phone };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          if (isSupabaseConfigured()) {
            updateEmployeeInDB(userId, { smsRecoveryPhone: phone }).catch((err) =>
              console.error('Failed to sync SMS phone to Supabase:', err)
            );
          }
          return updated;
        }
        return emp;
      })
    );
    addToast('success', 'SMS Recovery Configured', `Backup recovery number set to ${phone}.`);
  };

  const addManagerNote = (employeeId: string, note: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          const existingNotes = emp.managerNotes || [];
          const updatedNotes = [note, ...existingNotes];
          if (isSupabaseConfigured()) {
            updateEmployeeInDB(employeeId, { managerNotes: updatedNotes }).catch((err) =>
              console.error('Failed to sync manager note to Supabase:', err)
            );
          }
          return {
            ...emp,
            managerNotes: updatedNotes,
          };
        }
        return emp;
      })
    );
    addToast('success', 'Manager Note Added', 'Saved private note to employee profile.');
  };

  const resetAllData = () => {
    localStorage.clear();
    setEmployees(INITIAL_EMPLOYEES);
    setTasks(INITIAL_TASKS);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setActivities(INITIAL_ACTIVITIES);
    setCurrentUser(INITIAL_EMPLOYEES[0]);

    if (isSupabaseConfigured()) {
      forceReseedSupabase().catch((err) => console.error('Failed to reseed Supabase:', err));
    }

    addToast('info', 'Reset Complete', 'EMS database has been restored to factory defaults.');
  };

  return (
    <EMSContext.Provider
      value={{
        currentUser,
        employees,
        tasks,
        attendanceRecords,
        leaveRequests,
        announcements,
        activities,
        toasts,
        addToast,
        removeToast,
        isSupabaseActive,
        dbSyncStatus,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        refreshFromDatabase,
        login,
        logout,
        activateAccount,
        forgotPassword,
        sendDefaultPassword,
        switchUser,
        clockIn,
        clockOut,
        getTodayAttendance,
        updateTaskByEmployee,
        createTask,
        updateTaskByManager,
        submitLeaveRequest,
        reviewLeaveRequest,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        updateUserProfile,
        changePassword,
        toggle2FA,
        updateSMSPhone,
        addManagerNote,
        resetAllData,
      }}
    >
      {children}
    </EMSContext.Provider>
  );
}

export function useEMS() {
  const context = useContext(EMSContext);
  if (!context) {
    throw new Error('useEMS must be used within an EMSProvider');
  }
  return context;
}
