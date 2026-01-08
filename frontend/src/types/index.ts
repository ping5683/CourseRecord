// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// 课程相关类型
export interface Course {
  id: number;
  userId: number;
  name: string;
  totalAmount: number;
  regularSessions: number;
  bonusSessions: number;
  contractPath?: string;
  contractImages?: string[]; // 多个合同图片路径
  isActive: boolean;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalSessions?: number;
  consumedSessions?: number;
  remainingSessions?: number;
  schedules?: CourseSchedule[];
  attendanceRecords?: AttendanceRecord[];
  consumptions?: SessionConsumption[];
}

export interface CourseSchedule {
  id: number;
  courseId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  location?: string;
  instructor?: string;
  createdAt: string;
  updatedAt: string;
}

// 出勤相关类型
export interface AttendanceRecord {
  id: number;
  courseId: number;
  scheduleDate: string;
  status: 'pending' | 'attend' | 'absent';
  checkInTime?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  course?: Course;
}

export interface SessionConsumption {
  id: number;
  courseId: number;
  attendanceId?: number;
  sessionsConsumed: number;
  sessionType: 'regular' | 'bonus';
  description?: string;
  createdAt: string;
  attendance?: AttendanceRecord;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: any[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    records?: T[];
    courses?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

// 表单类型
export interface CourseForm {
  name: string;
  totalAmount?: number;
  regularSessions: number;
  bonusSessions: number;
  contractPath?: string;
  contractImages?: string[]; // 多个合同图片路径
  category: string;
  description?: string;
  schedules?: CourseScheduleForm[];
}

export interface CourseScheduleForm {
  weekday: number;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
}

export interface CheckInForm {
  status: 'attend' | 'absent';
  notes?: string;
}

// 统计类型
export interface CourseStats {
  totalSessions: number;
  consumedSessions: number;
  remainingSessions: number;
  attendanceRate?: number;
}

// 通知类型
export interface NotificationData {
  type: 'course_reminder' | 'consumption_confirmation';
  courseId?: number;
  courseName?: string;
  date?: string;
  action?: string;
  attendanceId?: number;
  consumptionId?: number;
}

// 课程提醒类型
export interface CourseReminder {
  courseId: string;
  courseName: string;
  scheduleDate: string;
  startTime: string;
  endTime?: string;
}

// 应用状态类型
export interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  reminder: CourseReminder | null;
}

// 路由类型
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  title: string;
  requireAuth?: boolean;
}