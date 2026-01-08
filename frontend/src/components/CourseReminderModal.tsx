import React from 'react';
import { Modal, Button } from 'antd-mobile';

interface CourseReminder {
  courseId: string;
  courseName: string;
  scheduleDate: string;
  startTime: string;
  endTime?: string;
}

interface CourseReminderModalProps {
  visible: boolean;
  reminder: CourseReminder | null;
  onClose: () => void;
  onConfirm: () => void;
}

const CourseReminderModal: React.FC<CourseReminderModalProps> = ({
  visible,
  reminder,
  onClose,
  onConfirm
}) => {
  if (!reminder) return null;

  // 计算距离课程开始的时间
  const getTimeRemaining = () => {
    const now = new Date();
    const courseTime = new Date(`${reminder.scheduleDate} ${reminder.startTime}`);
    const timeDiff = courseTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return '课程即将开始';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `课程将在 ${hours} 小时 ${minutes} 分钟后开始`;
    } else {
      return `课程将在 ${minutes} 分钟后开始`;
    }
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  return (
    <Modal
      visible={visible}
      title="课程提醒"
      content={
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '18px', 
              color: '#1677FF',
              fontWeight: 'bold'
            }}>
              📚 {reminder.courseName}
            </h3>
            
            <div style={{ 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#666',
              lineHeight: '1.5'
            }}>
              <div>📅 {formatDate(reminder.scheduleDate)}</div>
              <div>🕐 {reminder.startTime}{reminder.endTime ? ` - ${reminder.endTime}` : ''}</div>
            </div>
            
            <div style={{
              margin: '16px 0',
              padding: '12px',
              backgroundColor: '#f0f8ff',
              borderRadius: '8px',
              border: '1px solid #d0e7ff',
              fontSize: '14px',
              color: '#1677FF',
              fontWeight: '500'
            }}>
              ⏰ {getTimeRemaining()}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '8px'
            }}>
              同一课程24小时内仅提醒一次
            </div>
          </div>
        </div>
      }
      closeOnAction
      onClose={onClose}
      actions={[
        {
          key: 'confirm',
          text: '知道了',
          primary: true,
          onClick: onConfirm
        }
      ]}
    />
  );
};

export default CourseReminderModal;