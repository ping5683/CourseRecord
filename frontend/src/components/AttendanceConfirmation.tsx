import React, { useState, useEffect } from 'react';
import { Modal, Button, Toast } from 'antd-mobile';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceRecord } from '@/types';

interface AttendanceConfirmationProps {
  visible: boolean;
  attendance: AttendanceRecord | null;
  onClose: () => void;
  onConfirm: (attendanceId: number, status: 'attend' | 'absent' | 'holiday') => void;
}

const AttendanceConfirmation: React.FC<AttendanceConfirmationProps> = ({
  visible,
  attendance,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (status: 'attend' | 'absent' | 'holiday') => {
    if (!attendance) return;

    try {
      setLoading(true);
      
      if (status === 'attend') {
        // 确认上课，消耗课时
        await attendanceService.updateAttendanceStatus(attendance.id, { status: 'attend', notes: '正常上课' });
        // 消耗1个课时
        await attendanceService.confirmConsumption(attendance.id, 1);
        Toast.show({
          content: '已确认上课，课时已扣除',
          duration: 2000
        });
      } else if (status === 'absent') {
        // 请假，不消耗课时
        await attendanceService.updateAttendanceStatus(attendance.id, { status: 'absent', notes: '请假' });
        Toast.show({
          content: '已记录请假',
          duration: 2000
        });
      } else if (status === 'holiday') {
        // 放假，不消耗课时
        await attendanceService.updateAttendanceStatus(attendance.id, { status: 'absent', notes: '放假' });
        Toast.show({
          content: '已记录放假',
          duration: 2000
        });
      }

      onConfirm(attendance.id, status);
      onClose();
    } catch (error) {
      console.error('确认出勤失败:', error);
      Toast.show({
        content: '操作失败，请重试',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!attendance) return null;

  return (
    <Modal
      visible={visible}
      title="课程出勤确认"
      content={
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              {attendance.course?.name || '课程'}
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              上课日期: {new Date(attendance.scheduleDate).toLocaleDateString()}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              请选择本次课程的状态：
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              color="primary"
              size="large"
              block
              loading={loading}
              onClick={() => handleConfirm('attend')}
            >
              上课（消耗1课时）
            </Button>
            
            <Button
              color="warning"
              size="large"
              block
              loading={loading}
              onClick={() => handleConfirm('absent')}
            >
              请假（不消耗课时）
            </Button>
            
            <Button
              color="default"
              size="large"
              block
              loading={loading}
              onClick={() => handleConfirm('holiday')}
            >
              放假（不消耗课时）
            </Button>
          </div>
        </div>
      }
      closeOnAction
      onClose={onClose}
      actions={[
        { key: 'cancel', text: '稍后确认' }
      ]}
    />
  );
};

export default AttendanceConfirmation;