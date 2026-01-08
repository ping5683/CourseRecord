import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Badge,
  Space,
  Toast
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
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 计算今年投资总额
  const calculateTotalInvestment = (courses: Course[]) => {
    const currentYear = new Date().getFullYear();
    let totalAmount = 0;
    
    courses.forEach(course => {
      // 检查课程创建时间是否在今年
      if (course.createdAt) {
        const courseYear = new Date(course.createdAt).getFullYear();
        if (courseYear === currentYear) {
          totalAmount += parseFloat(course.totalAmount || '0');
        }
      }
    });
    
    return totalAmount;
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let coursesData: Course[] = [];
      
      try {
        const response = await courseService.getCourses({ limit: 10 });
        
        console.log('首页课程API响应详情:', response);
        
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
        }
        
        // 如果API调用成功但数据为空，说明确实没有课程
        // 不再使用模拟数据，直接使用空数组
        if (coursesData.length === 0) {
          console.log('从API获取的课程数据为空，显示空列表');
        }
        
        console.log('首页最终课程数据:', coursesData);
        
      } catch (err) {
        console.error('获取课程数据失败:', err);
        // API调用失败，显示空数据
        coursesData = [];
        Toast.show('课程数据加载失败，请检查网络连接');
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
          </div>

          {/* 课程信息 */}
          <div className="course-info">
            <div className="info-item">
              <PlayOutline className="info-icon" />
              <span>总课时: {course.totalSessions || 0}节</span>
            </div>
            <div className="info-item">
              <span>已上: {course.consumedSessions || 0}节</span>
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
      <div className="home-page">
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
      <div className="home-page">
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

  const totalInvestment = calculateTotalInvestment(courses);

  return (
    <div className="home-page">
      {/* 投资金额展示 */}
      <div className="investment-section">
        <div className="investment-card">
          <h2>今年你为自己投资了</h2>
          <div className="investment-amount">¥{totalInvestment.toFixed(2)}</div>
          <p className="investment-motto">越努力越优秀</p>
        </div>
      </div>

      {/* 功能按钮 */}
      <div className="function-buttons">
        <div className="function-grid">
          <Button
            color="primary"
            size="large"
            onClick={() => navigate('/courses')}
            className="function-button"
          >
            <PlayOutline />
            课程管理
          </Button>
          <Button
            color="default"
            size="large"
            onClick={() => navigate('/attendance')}
            className="function-button"
          >
            <ClockCircleOutline />
            出勤记录
          </Button>
          <Button
            color="success"
            size="large"
            onClick={() => navigate('/courses/create')}
            className="function-button"
          >
            <AddOutline />
            添加课程
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;