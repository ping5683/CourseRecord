import { Toast } from 'antd-mobile';
import { attendanceService } from '@/services/attendanceService';

// 存储已提醒的课程ID和提醒时间
const remindedCourses = new Map<string, number>();

// 检查课程是否已经在24小时内提醒过
const isCourseRemindedIn24Hours = (courseId: string): boolean => {
  const remindedTime = remindedCourses.get(courseId);
  if (!remindedTime) return false;
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return (now - remindedTime) < twentyFourHours;
};

// 标记课程为已提醒
const markCourseAsReminded = (courseId: string) => {
  remindedCourses.set(courseId, Date.now());
};

// 清理过期的提醒记录（超过24小时）
const cleanupExpiredReminders = () => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [courseId, remindedTime] of remindedCourses.entries()) {
    if (now - remindedTime > twentyFourHours) {
      remindedCourses.delete(courseId);
    }
  }
};

// 检查并发送上课提醒
const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    console.log('🎯 开始检查24小时课程提醒...');
    console.log('⏰ 当前时间:', now.toLocaleString('zh-CN'));
    console.log('📅 今天是星期', now.getDay() === 0 ? 7 : now.getDay());
    
    // 清理过期记录
    cleanupExpiredReminders();
    console.log('✅ 已清理过期提醒记录');
    
    console.log('📡 发送提醒API请求...');
    const response = await attendanceService.checkReminders();
    console.log('📊 提醒API响应:', response);
    
    // 添加更详细的调试信息
    if (response) {
      console.log('📋 API响应详情:', {
        success: response.success,
        message: response.message,
        dataLength: response.data ? response.data.length : 0
      });
      
      if (response.data && response.data.length > 0) {
        console.log('📋 提醒数据详情:');
        response.data.forEach((reminder: any, index: number) => {
          console.log(`  📅 提醒 ${index + 1}:`, {
            courseId: reminder.courseId,
            courseName: reminder.courseName,
            scheduleDate: reminder.scheduleDate,
            startTime: reminder.startTime,
            endTime: reminder.endTime
          });
        });
      }
    }
    
    // 添加null检查，确保response存在
    if (response && response.success && response.data && response.data.length > 0) {
      console.log(`🎉 发现 ${response.data.length} 个需要提醒的课程`);
      response.data.forEach((reminder: any) => {
        console.log('📅 处理课程提醒:', reminder);
        showReminderNotification(reminder);
      });
    } else {
      console.log('❌ 没有需要提醒的课程');
      console.log('🔍 详细诊断:');
      console.log('  1. 检查当前时间:', now.toLocaleString('zh-CN'));
      console.log('  2. 检查课程是否在24小时内');
      console.log('  3. 检查课程状态是否活跃');
      console.log('  4. 检查排课设置是否正确');
      console.log('  5. 检查后端API是否返回数据');
      
      // 添加明天的日期检查
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      console.log('  6. 明天是:', tomorrow.toLocaleDateString('zh-CN'), '星期', tomorrow.getDay() === 0 ? 7 : tomorrow.getDay());
    }
  } catch (error) {
    console.error('💥 检查提醒失败:', error);
    console.log('🔍 错误详情:', error);
  }
};

// 显示提醒通知
const showReminderNotification = (reminder: any) => {
  const { courseId, courseName, scheduleDate, startTime } = reminder;
  const date = new Date(scheduleDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  console.log(`📅 检查课程: ${courseName} (${scheduleDate} ${startTime})`);
  console.log(`⏰ 当前时间: ${today.toLocaleString()}`);
  console.log(`📆 课程时间: ${date.toLocaleString()}`);
  
  // 检查是否是24小时内的课程
  const timeDiff = date.getTime() - today.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  console.log(`⏱️ 时间差: ${timeDiff}ms (24小时: ${twentyFourHours}ms)`);
  
  // 如果课程在24小时内（包括当前时间或稍后时间），且未提醒过
  if (Math.abs(timeDiff) <= twentyFourHours) {
    console.log('✅ 课程在24小时内，检查是否已提醒过...');
    // 检查是否已经提醒过
    if (!isCourseRemindedIn24Hours(courseId)) {
      console.log('🎉 课程未提醒过，显示弹窗！');
      // 显示24小时提醒弹窗
      show24HourReminderModal(reminder);
      // 标记为已提醒
      markCourseAsReminded(courseId);
    } else {
      console.log('⚠️ 课程已在24小时内提醒过，跳过');
    }
  } else {
    console.log('❌ 课程不在24小时内');
  }
  
  // 检查是否是明天的课程（保持原有功能，与24小时提醒不冲突）
  if (date.toDateString() === tomorrow.toDateString()) {
    console.log('📢 显示明天课程Toast提醒');
    Toast.show({
      content: `明天 ${startTime} 有${courseName}课程`,
      duration: 5000,
      position: 'top'
    });
  }
};

// 显示24小时提醒弹窗
const show24HourReminderModal = (reminder: any) => {
  // 触发全局事件来显示提醒弹窗
  window.dispatchEvent(new CustomEvent('showCourseReminder', { detail: reminder }));
};

// 检查用户课程数据
const checkUserCourses = async () => {
  try {
    console.log('🔍 检查用户课程数据...');
    const response = await fetch('/api/courses?limit=100', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 用户课程数据:', {
        totalCourses: data.data?.length || 0,
        activeCourses: data.data?.filter((c: any) => c.isActive).length || 0,
        hasSchedules: data.data?.filter((c: any) => c.schedules && c.schedules.length > 0).length || 0
      });
      
      // 显示详细的课程信息
      if (data.data && data.data.length > 0) {
        data.data.forEach((course: any, index: number) => {
          console.log(`📚 课程 ${index + 1}:`, {
            name: course.name,
            isActive: course.isActive,
            schedulesCount: course.schedules ? course.schedules.length : 0,
            schedules: course.schedules ? course.schedules.map((s: any) => ({
              weekday: s.weekday,
              startTime: s.startTime,
              endTime: s.endTime
            })) : []
          });
        });
      }
    }
  } catch (error) {
    console.error('❌ 检查课程数据失败:', error);
  }
};

// 初始化提醒系统
const initReminderSystem = () => {
  console.log('🚀 初始化提醒系统...');
  
  // 检查用户课程数据
  checkUserCourses();
  
  // 页面加载时检查一次
  console.log('📝 立即检查一次提醒');
  checkAndSendReminders();
  
  // 设置定时检查（每30分钟检查一次）
  console.log('⏰ 设置30分钟定时检查');
  setInterval(checkAndSendReminders, 30 * 60 * 1000);
  
  // 每天9点检查一次
  const now = new Date();
  const nineAM = new Date(now);
  nineAM.setHours(9, 0, 0, 0);
  
  if (now > nineAM) {
    nineAM.setDate(nineAM.getDate() + 1);
  }
  
  const timeUntilNineAM = nineAM.getTime() - now.getTime();
  console.log(`⏳ 距离下次9点检查还有: ${Math.round(timeUntilNineAM/1000/60)}分钟`);
  
  setTimeout(() => {
    console.log('🕘 9点定时检查开始');
    checkAndSendReminders();
    // 设置每天9点定时检查
    setInterval(checkAndSendReminders, 24 * 60 * 60 * 1000);
  }, timeUntilNineAM);
};

// 检查课后确认（课后两小时）
const checkPostClassConfirmation = async () => {
  try {
    const response = await attendanceService.getTodayCourses();
    
    if (response.success && response.data) {
      const now = new Date();
      
      response.data.forEach((course: any) => {
        if (course.schedules && course.schedules.length > 0) {
          course.schedules.forEach((schedule: any) => {
            const endTime = new Date(`${now.toDateString()} ${schedule.endTime}`);
            const twoHoursAfter = new Date(endTime.getTime() + 2 * 60 * 60 * 1000);
            
            // 如果当前时间在课后两小时内，且没有确认出勤
            if (now >= endTime && now <= twoHoursAfter && !course.hasAttendance) {
              showPostClassConfirmation(course, schedule);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('检查课后确认失败:', error);
  }
};

// 显示课后确认对话框（需要与AttendanceConfirmation组件配合）
const showPostClassConfirmation = (course: any, schedule: any) => {
  // 这里需要与全局状态管理配合，触发AttendanceConfirmation组件显示
  // 暂时使用console.log模拟
  console.log(`需要确认出勤: ${course.name} - ${schedule.startTime}-${schedule.endTime}`);
  
  // 在实际应用中，这里应该触发一个全局事件或状态更新
  // 例如：window.dispatchEvent(new CustomEvent('showAttendanceConfirmation', { detail: { course, schedule } }));
};

// 初始化课后确认检查
const initPostClassCheck = () => {
  // 每10分钟检查一次
  setInterval(checkPostClassConfirmation, 10 * 60 * 1000);
};

export const reminderUtils = {
  initReminderSystem,
  initPostClassCheck,
  checkAndSendReminders,
  checkPostClassConfirmation
};