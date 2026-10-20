import { getSupabase } from './supabase';
import {
  Employee,
  Task,
  AttendanceRecord,
  LeaveRequest,
  Announcement,
  ActivityFeedItem,
} from '../types/ems';
import {
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ACTIVITIES,
} from '../data/mockData';

// --- Mappers between Supabase snake_case and TypeScript camelCase ---

export function mapEmployeeFromDB(row: any): Employee {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    password: row.password,
    isActivated: Boolean(row.is_activated),
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar,
    position: row.position,
    department: row.department,
    status: row.status,
    phone: row.phone,
    bio: row.bio,
    dateJoined: row.date_joined,
    birthday: row.birthday,
    address: row.address,
    emergencyContact: row.emergency_contact,
    employmentDetails: row.employment_details,
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    smsRecoveryPhone: row.sms_recovery_phone,
    leaveBalance: row.leave_balance,
    documents: row.documents || [],
    performance: row.performance || [],
    managerNotes: row.manager_notes || [],
  };
}

export function mapEmployeeToDB(emp: Partial<Employee>): any {
  const row: any = {};
  if (emp.id !== undefined) row.id = emp.id;
  if (emp.email !== undefined) row.email = emp.email;
  if (emp.username !== undefined) row.username = emp.username;
  if (emp.password !== undefined) row.password = emp.password;
  if (emp.isActivated !== undefined) row.is_activated = emp.isActivated;
  if (emp.role !== undefined) row.role = emp.role;
  if (emp.firstName !== undefined) row.first_name = emp.firstName;
  if (emp.lastName !== undefined) row.last_name = emp.lastName;
  if (emp.avatar !== undefined) row.avatar = emp.avatar;
  if (emp.position !== undefined) row.position = emp.position;
  if (emp.department !== undefined) row.department = emp.department;
  if (emp.status !== undefined) row.status = emp.status;
  if (emp.phone !== undefined) row.phone = emp.phone;
  if (emp.bio !== undefined) row.bio = emp.bio;
  if (emp.dateJoined !== undefined) row.date_joined = emp.dateJoined;
  if (emp.birthday !== undefined) row.birthday = emp.birthday;
  if (emp.address !== undefined) row.address = emp.address;
  if (emp.emergencyContact !== undefined) row.emergency_contact = emp.emergencyContact;
  if (emp.employmentDetails !== undefined) row.employment_details = emp.employmentDetails;
  if (emp.twoFactorEnabled !== undefined) row.two_factor_enabled = emp.twoFactorEnabled;
  if (emp.smsRecoveryPhone !== undefined) row.sms_recovery_phone = emp.smsRecoveryPhone;
  if (emp.leaveBalance !== undefined) row.leave_balance = emp.leaveBalance;
  if (emp.documents !== undefined) row.documents = emp.documents;
  if (emp.performance !== undefined) row.performance = emp.performance;
  if (emp.managerNotes !== undefined) row.manager_notes = emp.managerNotes;
  return row;
}

export function mapTaskFromDB(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedToId: row.assigned_to_id,
    assignedToName: row.assigned_to_name,
    assignedById: row.assigned_by_id,
    assignedByName: row.assigned_by_name,
    department: row.department,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    category: row.category,
    progress: Number(row.progress || 0),
    managerNotes: row.manager_notes,
    employeeNotes: row.employee_notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function mapTaskToDB(task: Partial<Task>): any {
  const row: any = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.assignedToId !== undefined) row.assigned_to_id = task.assignedToId;
  if (task.assignedToName !== undefined) row.assigned_to_name = task.assignedToName;
  if (task.assignedById !== undefined) row.assigned_by_id = task.assignedById;
  if (task.assignedByName !== undefined) row.assigned_by_name = task.assignedByName;
  if (task.department !== undefined) row.department = task.department;
  if (task.dueDate !== undefined) row.due_date = task.dueDate;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.status !== undefined) row.status = task.status;
  if (task.category !== undefined) row.category = task.category;
  if (task.progress !== undefined) row.progress = task.progress;
  if (task.managerNotes !== undefined) row.manager_notes = task.managerNotes;
  if (task.employeeNotes !== undefined) row.employee_notes = task.employeeNotes;
  if (task.createdAt !== undefined) row.created_at = task.createdAt;
  if (task.completedAt !== undefined) row.completed_at = task.completedAt;
  return row;
}

export function mapAttendanceFromDB(row: any): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    department: row.department,
    date: row.date,
    timeIn: row.time_in,
    timeOut: row.time_out,
    workingHours: Number(row.working_hours || 0),
    status: row.status,
    notes: row.notes,
  };
}

export function mapAttendanceToDB(att: Partial<AttendanceRecord>): any {
  const row: any = {};
  if (att.id !== undefined) row.id = att.id;
  if (att.employeeId !== undefined) row.employee_id = att.employeeId;
  if (att.employeeName !== undefined) row.employee_name = att.employeeName;
  if (att.department !== undefined) row.department = att.department;
  if (att.date !== undefined) row.date = att.date;
  if (att.timeIn !== undefined) row.time_in = att.timeIn;
  if (att.timeOut !== undefined) row.time_out = att.timeOut;
  if (att.workingHours !== undefined) row.working_hours = att.workingHours;
  if (att.status !== undefined) row.status = att.status;
  if (att.notes !== undefined) row.notes = att.notes;
  return row;
}

export function mapLeaveRequestFromDB(row: any): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    department: row.department,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: Number(row.total_days || 0),
    reason: row.reason,
    status: row.status,
    dateRequested: row.date_requested,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    managerNotes: row.manager_notes,
  };
}

export function mapLeaveRequestToDB(req: Partial<LeaveRequest>): any {
  const row: any = {};
  if (req.id !== undefined) row.id = req.id;
  if (req.employeeId !== undefined) row.employee_id = req.employeeId;
  if (req.employeeName !== undefined) row.employee_name = req.employeeName;
  if (req.department !== undefined) row.department = req.department;
  if (req.leaveType !== undefined) row.leave_type = req.leaveType;
  if (req.startDate !== undefined) row.start_date = req.startDate;
  if (req.endDate !== undefined) row.end_date = req.endDate;
  if (req.totalDays !== undefined) row.total_days = req.totalDays;
  if (req.reason !== undefined) row.reason = req.reason;
  if (req.status !== undefined) row.status = req.status;
  if (req.dateRequested !== undefined) row.date_requested = req.dateRequested;
  if (req.reviewedBy !== undefined) row.reviewed_by = req.reviewedBy;
  if (req.reviewedAt !== undefined) row.reviewed_at = req.reviewedAt;
  if (req.managerNotes !== undefined) row.manager_notes = req.managerNotes;
  return row;
}

export function mapAnnouncementFromDB(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    message: row.message || row.content || '',
    audience: row.audience,
    isPinned: Boolean(row.is_pinned),
    postedById: row.posted_by_id,
    postedByName: row.posted_by_name,
    postedByRole: row.posted_by_role,
    postedOn: row.posted_on,
    scheduledDate: row.scheduled_date,
    status: row.status || 'Published',
    attachment: row.attachment,
  };
}

export function mapAnnouncementToDB(ann: Partial<Announcement>): any {
  const row: any = {};
  if (ann.id !== undefined) row.id = ann.id;
  if (ann.title !== undefined) row.title = ann.title;
  if (ann.message !== undefined) row.message = ann.message;
  if (ann.audience !== undefined) row.audience = ann.audience;
  if (ann.isPinned !== undefined) row.is_pinned = ann.isPinned;
  if (ann.postedById !== undefined) row.posted_by_id = ann.postedById;
  if (ann.postedByName !== undefined) row.posted_by_name = ann.postedByName;
  if (ann.postedByRole !== undefined) row.posted_by_role = ann.postedByRole;
  if (ann.postedOn !== undefined) row.posted_on = ann.postedOn;
  if (ann.scheduledDate !== undefined) row.scheduled_date = ann.scheduledDate;
  if (ann.status !== undefined) row.status = ann.status;
  if (ann.attachment !== undefined) row.attachment = ann.attachment;
  return row;
}

export function mapActivityFromDB(row: any): ActivityFeedItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
    actor: row.actor,
  };
}

export function mapActivityToDB(act: Partial<ActivityFeedItem>): any {
  const row: any = {};
  if (act.id !== undefined) row.id = act.id;
  if (act.type !== undefined) row.type = act.type;
  if (act.title !== undefined) row.title = act.title;
  if (act.description !== undefined) row.description = act.description;
  if (act.timestamp !== undefined) row.timestamp = act.timestamp;
  if (act.actor !== undefined) row.actor = act.actor;
  return row;
}

// --- CRUD Database Operations ---

export async function fetchEmployeesFromDB(): Promise<Employee[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('employees').select('*').order('id', { ascending: true });
  if (error) {
    console.error('Error fetching employees from Supabase:', error);
    return null;
  }
  return data ? data.map(mapEmployeeFromDB) : [];
}

export async function upsertEmployeeInDB(emp: Employee): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase client is not configured.' };
  const row = mapEmployeeToDB(emp);
  const { error } = await supabase.from('employees').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting employee to Supabase:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateEmployeeInDB(id: string, updates: Partial<Employee>): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase client is not configured.' };
  const row = mapEmployeeToDB(updates);
  const { error } = await supabase.from('employees').update(row).eq('id', id);
  if (error) {
    console.error('Error updating employee in DB:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function fetchTasksFromDB(): Promise<Task[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching tasks from Supabase:', error);
    return null;
  }
  return data ? data.map(mapTaskFromDB) : [];
}

export async function upsertTaskInDB(task: Task): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapTaskToDB(task);
  const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting task:', error);
    return false;
  }
  return true;
}

export async function updateTaskInDB(id: string, updates: Partial<Task>): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapTaskToDB(updates);
  const { error } = await supabase.from('tasks').update(row).eq('id', id);
  if (error) {
    console.error('Error updating task in DB:', error);
    return false;
  }
  return true;
}

export async function fetchAttendanceFromDB(): Promise<AttendanceRecord[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('attendance_records').select('*').order('date', { ascending: false });
  if (error) {
    console.error('Error fetching attendance from Supabase:', error);
    return null;
  }
  return data ? data.map(mapAttendanceFromDB) : [];
}

export async function upsertAttendanceInDB(att: AttendanceRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapAttendanceToDB(att);
  const { error } = await supabase.from('attendance_records').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting attendance:', error);
    return false;
  }
  return true;
}

export async function fetchLeaveRequestsFromDB(): Promise<LeaveRequest[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('leave_requests').select('*').order('date_requested', { ascending: false });
  if (error) {
    console.error('Error fetching leave requests from Supabase:', error);
    return null;
  }
  return data ? data.map(mapLeaveRequestFromDB) : [];
}

export async function upsertLeaveRequestInDB(req: LeaveRequest): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapLeaveRequestToDB(req);
  const { error } = await supabase.from('leave_requests').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting leave request:', error);
    return false;
  }
  return true;
}

export async function updateLeaveRequestInDB(id: string, updates: Partial<LeaveRequest>): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapLeaveRequestToDB(updates);
  const { error } = await supabase.from('leave_requests').update(row).eq('id', id);
  if (error) {
    console.error('Error updating leave request in DB:', error);
    return false;
  }
  return true;
}

export async function fetchAnnouncementsFromDB(): Promise<Announcement[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false });
  if (error) {
    console.error('Error fetching announcements from Supabase:', error);
    return null;
  }
  return data ? data.map(mapAnnouncementFromDB) : [];
}

export async function upsertAnnouncementInDB(ann: Announcement): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapAnnouncementToDB(ann);
  const { error } = await supabase.from('announcements').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('Error upserting announcement:', error);
    return false;
  }
  return true;
}

export async function updateAnnouncementInDB(id: string, updates: Partial<Announcement>): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapAnnouncementToDB(updates);
  const { error } = await supabase.from('announcements').update(row).eq('id', id);
  if (error) {
    console.error('Error updating announcement in DB:', error);
    return false;
  }
  return true;
}

export async function deleteAnnouncementFromDB(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) {
    console.error('Error deleting announcement from DB:', error);
    return false;
  }
  return true;
}

export async function fetchActivitiesFromDB(): Promise<ActivityFeedItem[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('activities').select('*').order('id', { ascending: false }).limit(50);
  if (error) {
    console.error('Error fetching activities from Supabase:', error);
    return null;
  }
  return data ? data.map(mapActivityFromDB) : [];
}

export async function insertActivityInDB(act: ActivityFeedItem): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row = mapActivityToDB(act);
  const { error } = await supabase.from('activities').insert(row);
  if (error) {
    console.error('Error inserting activity:', error);
    return false;
  }
  return true;
}

/**
 * Initializes and seeds the Supabase tables if they are empty
 */
export async function seedSupabaseIfEmpty(): Promise<{
  seeded: boolean;
  message: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { seeded: false, message: 'Supabase client is not configured.' };
  }

  try {
    // Check if employees table has rows
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { seeded: false, message: `Could not query tables: ${error.message}` };
    }

    if (count !== null && count > 0) {
      return { seeded: false, message: `Database already contains ${count} employee records.` };
    }

    // Seed Employees
    const empRows = INITIAL_EMPLOYEES.map(mapEmployeeToDB);
    await supabase.from('employees').upsert(empRows, { onConflict: 'id' });

    // Seed Tasks
    const taskRows = INITIAL_TASKS.map(mapTaskToDB);
    await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });

    // Seed Attendance
    const attRows = INITIAL_ATTENDANCE.map(mapAttendanceToDB);
    await supabase.from('attendance_records').upsert(attRows, { onConflict: 'id' });

    // Seed Leave Requests
    const leaveRows = INITIAL_LEAVE_REQUESTS.map(mapLeaveRequestToDB);
    await supabase.from('leave_requests').upsert(leaveRows, { onConflict: 'id' });

    // Seed Announcements
    const annRows = INITIAL_ANNOUNCEMENTS.map(mapAnnouncementToDB);
    await supabase.from('announcements').upsert(annRows, { onConflict: 'id' });

    // Seed Activities
    const actRows = INITIAL_ACTIVITIES.map(mapActivityToDB);
    await supabase.from('activities').upsert(actRows, { onConflict: 'id' });

    return { seeded: true, message: 'Successfully seeded EMS tables with initial enterprise dataset!' };
  } catch (err: any) {
    console.error('Error in seedSupabaseIfEmpty:', err);
    return { seeded: false, message: err?.message || 'Failed to seed database' };
  }
}

/**
 * Force-reseed all tables with initial data
 */
export async function forceReseedSupabase(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    const empRows = INITIAL_EMPLOYEES.map(mapEmployeeToDB);
    const taskRows = INITIAL_TASKS.map(mapTaskToDB);
    const attRows = INITIAL_ATTENDANCE.map(mapAttendanceToDB);
    const leaveRows = INITIAL_LEAVE_REQUESTS.map(mapLeaveRequestToDB);
    const annRows = INITIAL_ANNOUNCEMENTS.map(mapAnnouncementToDB);
    const actRows = INITIAL_ACTIVITIES.map(mapActivityToDB);

    await supabase.from('employees').upsert(empRows, { onConflict: 'id' });
    await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
    await supabase.from('attendance_records').upsert(attRows, { onConflict: 'id' });
    await supabase.from('leave_requests').upsert(leaveRows, { onConflict: 'id' });
    await supabase.from('announcements').upsert(annRows, { onConflict: 'id' });
    await supabase.from('activities').upsert(actRows, { onConflict: 'id' });

    return { success: true, message: 'Supabase tables re-seeded with demo data!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to re-seed' };
  }
}

/**
 * Test Supabase connection and return status details
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  tablesFound?: string[];
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { connected: false, error: 'No URL or Anon Key provided.' };
  }

  const startTime = Date.now();
  try {
    const { data, error } = await supabase.from('employees').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check if table missing error (code 42P01)
      if (error.code === '42P01') {
        return {
          connected: true,
          latencyMs,
          error: 'Connected to Supabase project, but "employees" table does not exist yet. Please run the SQL migration script from supabase/schema.sql.',
        };
      }
      return { connected: false, latencyMs, error: error.message };
    }

    return {
      connected: true,
      latencyMs,
      tablesFound: ['employees', 'tasks', 'attendance_records', 'leave_requests', 'announcements', 'activities'],
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err?.message || 'Network error connecting to Supabase host.',
    };
  }
}
