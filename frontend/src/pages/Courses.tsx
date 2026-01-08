import React, { useEffect, useState } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Dialog, 
  Toast, 
  Badge,
  Space,
  Swiper,
  Image
} from 'antd-mobile';
import { 
  AddOutline, 
  EditSOutline, 
  DeleteOutline,
  PlayOutline,
  ClockCircleOutline
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import courseService from '@/services/courseService';
import { Course } from '@/types';
import './Courses.css';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadCourses();
  }, [activeTab]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let coursesData: Course[] = [];
      
      try {
        const params: any = {
          limit: 100,
        };
        
        // 只有当activeTab不是'all'时才添加isActive参数
        if (activeTab === 'active') {
          params.isActive = true;
        } else if (activeTab === 'inactive') {
          params.isActive = false;
        }
        
        console.log('发送请求参数:', params);
        const response = await courseService.getCourses(params);
        
        console.log('课程API响应详情:', response);
        
        // 处理不同的数据结构
        if (response.success && response.data) {
          // 尝试从不同字段获取课程数据
          if ('courses' in response.data && Array.isArray(response.data.courses)) {
            coursesData = response.data.courses;
          } else if ('records' in response.data && Array.isArray(response.data.records)) {
            coursesData = response.data.records;
          } else if (Array.isArray(response.data)) {
            coursesData = response.data;
          } else {
            // 如果数据结构不明确，尝试直接获取数据
            const data = response.data as any;
            if (Array.isArray(data)) {
              coursesData = data;
            }
          }
          
          console.log('解析后的课程数据:', coursesData);
        } else {
          console.warn('API响应不成功或数据为空:', response);
        }
        
        // 如果API调用成功但数据为空，说明确实没有课程
        if (coursesData.length === 0) {
          console.log('从API获取的课程数据为空，显示空列表');
        }
        
        console.log('最终课程数据:', coursesData);
        
      } catch (err) {
        console.error('获取课程数据失败:', err);
        // API调用失败时，显示空列表而不是模拟数据
        coursesData = [];
        setError('课程数据加载失败，请检查网络连接');
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('加载课程失败:', error);
      setError('课程数据加载失败，请检查网络连接');
      Toast.show('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    const confirmed = await Dialog.confirm({
      content: `确定要删除课程"${course.name}"吗？`,
      confirmText: '删除',
      cancelText: '取消',
    });

    if (confirmed) {
      try {
        console.log('正在删除课程:', course.id, course.name);
        await courseService.deleteCourse(course.id.toString());
        Toast.show({
          content: `课程"${course.name}"删除成功`,
          icon: 'success',
        });
        loadCourses();
      } catch (error: any) {
        console.error('删除课程失败:', error);
        Toast.show({
          content: error.message || error.response?.data?.message || '删除失败，请重试',
          icon: 'fail',
        });
      }
    }
  };

  const renderCourseCard = (course: Course) => {
    const progress = courseService.calculateProgress(course);
    const remainingPercent = 100 - progress;
    const status = courseService.formatCourseStatus(course);
    const statusColor = status === '进行中' ? '#52c41a' : status === '即将结束' ? '#faad14' : '#999';

    return (
      <Card
        key={course.id}
        className="course-card"
        onClick={() => navigate(`/courses/${course.id}`)}
      >
        <div className="course-content">
          {/* 课程头部 */}
          <div className="course-header">
            <div className="course-title">
              <h3>{course.name}</h3>
              <Badge 
                content={status} 
                color={statusColor}
                style={{ fontSize: 12 }}
              />
            </div>
            <div className="course-actions">
              <Button
                size="small"
                fill="none"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/courses/${course.id}/edit`);
                }}
              >
                <EditSOutline />
              </Button>
              <Button
                size="small"
                fill="none"
                color="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(course);
                }}
              >
                <DeleteOutline />
              </Button>
            </div>
          </div>

          {/* 课程信息 */}
          <div className="course-info">
            <div className="info-item">
              <PlayOutline className="info-icon" />
              <span>总课时: {course.totalSessions || 0}节</span>
            </div>
            <div className="info-item">
              <ClockCircleOutline className="info-icon" />
              <span>剩余: {course.remainingSessions || 0}节</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="course-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">
              <span>已完成 {progress}%</span>
              <span>剩余 {remainingPercent}%</span>
            </div>
          </div>

          {/* 课程安排 */}
          {course.schedules && course.schedules.length > 0 && (
            <div className="course-schedules">
              {course.schedules.slice(0, 2).map((schedule, index) => (
                <div key={index} className="schedule-item">
                  <span className="schedule-day">
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][schedule.weekday]}
                  </span>
                  <span className="schedule-time">
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>
              ))}
              {course.schedules.length > 2 && (
                <div className="schedule-more">
                  还有 {course.schedules.length - 2} 个时间安排
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderEmpty = () => (
    <div className="empty-courses">
      <div className="empty-icon">
        <PlayOutline fontSize={48} />
      </div>
      <h3>暂无课程</h3>
      <p>点击下方按钮添加您的第一个课程</p>
    </div>
  );

  // 加载状态
  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading-section">
          <div className="loading-spinner">
            <PlayOutline fontSize={48} color="#1677ff" />
          </div>
          <p>课程数据加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="courses-page">
        <div className="error-section">
          <div className="error-content">
            <PlayOutline fontSize={48} color="#ff4d4f" />
            <h3>数据加载失败</h3>
            <p>{error}</p>
            <Button 
              color="primary" 
              onClick={loadCourses}
              style={{ marginTop: '16px' }}
            >
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      {/* 选项卡 */}
      <div className="course-tabs">
        <div className="tab-list">
          <div 
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            全部
          </div>
          <div 
            className={`tab-item ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            进行中
          </div>
          <div 
            className={`tab-item ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            已结束
          </div>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="courses-list">
        {courses.length === 0 ? (
          renderEmpty()
        ) : (
          <Space direction="vertical" block>
            {courses.map(renderCourseCard)}
          </Space>
        )}
      </div>

      {/* 添加按钮 */}
      <Button 
        onClick={() => navigate('/courses/create')}
        className="add-button"
        color="primary"
        size="large"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          zIndex: 1000
        }}
      >
        <AddOutline />
      </Button>
    </div>
  );
};

export default Courses;