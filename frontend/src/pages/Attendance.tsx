import React, { useEffect, useState } from 'react';
import { Card, Button, List, Space, Toast } from 'antd-mobile';
import { CheckCircleOutline, ClockCircleOutline, CloseCircleOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceRecord } from '@/types';

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  const loadAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用模拟数据作为后备
      let attendanceData: AttendanceRecord[] = [];
      
      try {
        const response = await attendanceService.checkReminders();
        attendanceData = response.data || [];
      } catch (err) {
        console.warn('获取出勤记录失败，使用模拟数据:', err);
        attendanceData = [
          {
            id: '1',
            courseName: '数学课程',
            date: '2024-12-19',
            startTime: '09:00',
            endTime: '10:30',
            status: 'attend',
            checkInTime: '08:55'
          },
          {
            id: '2',
            courseName: '英语课程', 
            date: '2024-12-18',
            startTime: '14:00',
            endTime: '15:30',
            status: 'absent',
            note: '生病请假'
          },
          {
            id: '3',
            courseName: '物理课程',
            date: '2024-12-17', 
            startTime: '10:00',
            endTime: '11:30',
            status: 'pending'
          }
        ];
      }
      
      setRecords(attendanceData);
    } catch (error) {
      console.error('加载出勤记录失败:', error);
      setError('出勤记录加载失败，请检查网络连接');
      Toast.show('加载出勤记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attend':
        return <CheckCircleOutline color="#52c41a" />;
      case 'absent':
        return <CloseCircleOutline color="#ff4d4f" />;
      case 'pending':
        return <ClockCircleOutline color="#faad14" />;
      default:
        return <ClockCircleOutline color="#999" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attend':
        return '已签到';
      case 'absent':
        return '已请假';
      case 'pending':
        return '待签到';
      default:
        return '未知状态';
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', marginTop: '100px' }}>
        <div style={{ fontSize: '48px', color: '#1677ff', marginBottom: '16px' }}>
          <ClockCircleOutline />
        </div>
        <p>出勤记录加载中...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', marginTop: '100px' }}>
        <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
          <CloseCircleOutline />
        </div>
        <h3>数据加载失败</h3>
        <p>{error}</p>
        <Button 
          color="primary" 
          onClick={loadAttendanceRecords}
          style={{ marginTop: '16px' }}
        >
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '16px' }}>出勤记录</h1>
      
      {records.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ClockCircleOutline style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <p>暂无出勤记录</p>
            <Button color="primary" onClick={() => navigate('/courses')} style={{ marginTop: '16px' }}>
              查看课程
            </Button>
          </div>
        </Card>
      ) : (
        <Space direction="vertical" block>
          {records.map((record) => (
            <Card key={record.id}>
              <List>
                <List.Item
                  prefix={getStatusIcon(record.status)}
                  extra={getStatusText(record.status)}
                  description={`${record.date} ${record.startTime}-${record.endTime}`}
                >
                  {record.courseName}
                </List.Item>
                {record.checkInTime && (
                  <List.Item description={`签到时间: ${record.checkInTime}`} />
                )}
                {record.note && (
                  <List.Item description={`备注: ${record.note}`} />
                )}
              </List>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
};

export default Attendance;