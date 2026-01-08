import { api } from './api';
import { AttendanceRecord, CheckInForm, ApiResponse } from '@/types';

// 获取今日课程
const getTodayCourses = async () => {
  const response = await api.get('/courses/today');
  return response.data;
};

// 获取即将开始的课程（用于提醒）
const getUpcomingCourses = async (daysAhead = 1) => {
  const response = await api.get(`/courses/upcoming?days=${daysAhead}`);
  return response.data;
};

// 创建出勤记录
const createAttendanceRecord = async (courseId: number, scheduleDate: string) => {
  const response = await api.post('/attendance', {
    courseId,
    scheduleDate
  });
  return response.data;
};

// 更新出勤状态
const updateAttendanceStatus = async (attendanceId: number, formData: CheckInForm) => {
  const response = await api.put(`/attendance/${attendanceId}`, formData);
  return response.data;
};

// 获取课程出勤记录
const getCourseAttendance = async (courseId: number) => {
  const response = await api.get(`/courses/${courseId}/attendance`);
  return response.data;
};

// 发送上课提醒
const sendReminder = async (attendanceId: number) => {
  const response = await api.post(`/attendance/${attendanceId}/reminder`);
  return response.data;
};

// 检查是否有需要提醒的课程
const checkReminders = async () => {
  const response = await api.get('/attendance/reminders');
  return response.data;
};

// 课时消耗确认
const confirmConsumption = async (attendanceId: number, sessionsConsumed: number) => {
  const response = await api.post('/consumptions', {
    attendanceId,
    sessionsConsumed,
    sessionType: 'regular'
  });
  return response.data;
};

export const attendanceService = {
  getTodayCourses,
  getUpcomingCourses,
  createAttendanceRecord,
  updateAttendanceStatus,
  getCourseAttendance,
  sendReminder,
  checkReminders,
  confirmConsumption
};