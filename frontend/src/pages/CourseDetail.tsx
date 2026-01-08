import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Toast, 
  Space,
  Loading
} from 'antd-mobile';
import { 
  EditSOutline, 
  DeleteOutline,
  PlayOutline,
  ClockCircleOutline,
  FileOutline,
  LeftOutline
} from 'antd-mobile-icons';
import courseService from '@/services/courseService';
import { Course } from '@/types';
import './CourseDetail.css';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadCourseDetail();
    }
  }, [id]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData = await courseService.getCourseById(id!);
      if (!courseData) {
        throw new Error('课程不存在');
      }
      
      setCourse(courseData);
    } catch (error) {
      console.error('加载课程详情失败:', error);
      setError('课程详情加载失败');
      Toast.show('加载课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    
    const confirmed = confirm(`确定要删除课程"${course.name}"吗？`);
    if (confirmed) {
      try {
        await courseService.deleteCourse(course.id.toString());
        Toast.show({
          content: `课程"${course.name}"删除成功`,
          icon: 'success',
        });
        navigate('/courses');
      } catch (error: any) {
        console.error('删除课程失败:', error);
        Toast.show({
          content: error.message || '删除失败，请重试',
          icon: 'fail',
        });
      }
    }
  };

  // 处理文件选择
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理多文件上传
  const handleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !course) return;

    // 验证文件类型和大小
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    // 验证每个文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 验证文件类型
      if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext))) {
        invalidFiles.push(`${file.name} - 不支持的文件类型`);
        continue;
      }

      // 验证文件大小（最大10MB）
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} - 文件大小超过10MB`);
        continue;
      }

      validFiles.push(file);
    }

    // 如果有无效文件，显示警告
    if (invalidFiles.length > 0) {
      Toast.show({
        content: `有 ${invalidFiles.length} 个文件不符合要求，已跳过`,
        icon: 'fail',
        duration: 3000,
      });
    }

    if (validFiles.length === 0) {
      Toast.show({
        content: '没有有效的文件可以上传',
        icon: 'fail',
      });
      return;
    }

    setUploading(true);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // 准备完整的课程数据用于更新
      const courseUpdateData = {
        name: course.name,
        totalAmount: course.totalAmount || 0,
        regularSessions: course.regularSessions || 0,
        bonusSessions: course.bonusSessions || 0,
        category: course.category || 'general',
        description: course.description || '',
        schedules: course.schedules || [],
        contractImages: course.contractImages || [] // 包含当前的合同图片数据
      };
      
      const result = await courseService.uploadMultipleContracts(course.id.toString(), formData, courseUpdateData);
      
      if (result.success) {
        Toast.show({
          content: `上传成功 ${result.data?.successCount || validFiles.length} 个文件`,
          icon: 'success',
          duration: 4000,
        });
        
        // 如果上传失败，显示具体错误信息
        if (result.data?.errors && result.data.errors.length > 0) {
          setTimeout(() => {
            Toast.show({
              content: `上传失败的文件：${result.data!.errors.join('; ')}`,
              icon: 'fail',
              duration: 5000,
            });
          }, 1000);
        }
        
        // 重新加载课程详情
        await loadCourseDetail();
      } else {
        Toast.show({
          content: result.message || '上传失败',
          icon: 'fail',
        });
      }
    } catch (error: any) {
      console.error('上传合同失败:', error);
      Toast.show({
        content: error.message || '上传失败，请重试',
        icon: 'fail',
      });
    } finally {
      setUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除合同文件
  const handleDeleteContractFile = async (filePath: string) => {
    if (!course) return;
    
    // 从文件路径中提取文件名
    const filename = filePath.split('/').pop();
    if (!filename) {
      Toast.show({
        content: '文件名无效',
        icon: 'fail',
      });
      return;
    }
    
    const confirmed = confirm('确定要删除这个合同图片吗？');
    if (!confirmed) return;
    
    try {
      setDeletingFiles(prev => new Set(prev).add(filePath));
      
      // 先删除物理文件，然后再更新数据库
      const deleteResult = await courseService.deleteFile(filename);
      
      if (deleteResult.success) {
        // 文件删除成功，再更新课程数据
        let updatedCourse = { ...course };
        
        // 从合同图片数组中删除对应文件路径
        if (course.contractImages) {
          updatedCourse.contractImages = course.contractImages.filter(img => img !== filePath);
        }
        
        // 更新课程信息
        const updateData = {
          name: course.name,
          totalAmount: course.totalAmount || 0,
          regularSessions: course.regularSessions || 0,
          bonusSessions: course.bonusSessions || 0,
          category: course.category || 'general',
          description: course.description || '',
          schedules: course.schedules || [],
          contractImages: updatedCourse.contractImages || []
        };
        
        // 更新课程数据
        await courseService.updateCourse(course.id.toString(), updateData);
        
        Toast.show({
          content: '合同图片删除成功',
          icon: 'success',
        });
        
        // 立即更新前端状态
        setCourse(updatedCourse);
        
        // 延迟重新加载，确保数据一致性
        setTimeout(() => {
          loadCourseDetail();
        }, 300);
      } else {
        // 文件删除失败
        Toast.show({
          content: deleteResult.message || '文件删除失败',
          icon: 'fail',
        });
      }
    } catch (error: any) {
      console.error('删除合同文件失败:', error);
      
      // 回滚课程数据更新
      try {
        const rollbackData = {
          name: course.name,
          totalAmount: course.totalAmount || 0,
          regularSessions: course.regularSessions || 0,
          bonusSessions: course.bonusSessions || 0,
          category: course.category || 'general',
          description: course.description || '',
          schedules: course.schedules || [],
          contractImages: course.contractImages || []
        };
        await courseService.updateCourse(course.id.toString(), rollbackData);
      } catch (rollbackError) {
        console.error('回滚课程数据失败:', rollbackError);
      }
      
      Toast.show({
        content: error.message || '删除失败，请重试',
        icon: 'fail',
      });
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }
  };



  const calculateTotalSessions = (course: Course) => {
    return (course.regularSessions || 0) + (course.bonusSessions || 0);
  };

  const formatWeekday = (weekday: number) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[weekday] || `周${weekday}`;
  };

  // 更新合同图片显示数量
  const updateContractImagesCount = () => {
    const container = document.querySelector('.contract-images-section');
    if (!container) return;
    
    const visibleItems = container.querySelectorAll('.contract-image-item[style*="display: none"]');
    const totalItems = container.querySelectorAll('.contract-image-item').length;
    const visibleCount = totalItems - visibleItems.length;
    
    const titleElement = container.querySelector('h4');
    if (titleElement) {
      titleElement.textContent = `合同图片 (${visibleCount}张)`;
    }
  };

  if (loading) {
    return (
      <div className="course-detail">
        <div className="loading-section">
          <Loading size="large" />
          <p>课程详情加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail">
        <div className="error-section">
          <PlayOutline fontSize={48} />
          <h3>课程加载失败</h3>
          <p>{error || '课程不存在'}</p>
          <Button 
            color="primary" 
            onClick={() => navigate('/courses')}
            style={{ marginTop: '16px' }}
          >
            返回课程列表
          </Button>
        </div>
      </div>
    );
  }

  const progress = courseService.calculateProgress(course);
  const totalSessions = calculateTotalSessions(course);
  const remainingSessions = course.remainingSessions || 0;

  return (
    <div className="course-detail">
      {/* 头部 */}
      <div className="course-header">
        <Button 
          fill="none" 
          color="white" 
          size="small"
          onClick={() => navigate('/courses')}
          style={{ position: 'absolute', top: '16px', left: '16px' }}
        >
          <LeftOutline />
        </Button>
        
        <div className="course-title">
          <h1>{course.name}</h1>
          <div className="course-status">
            {courseService.formatCourseStatus(course)}
          </div>
        </div>
      </div>

      {/* 课程进度 */}
      <div className="progress-section">
        <div className="section-title">
          <PlayOutline />
          课程进度
        </div>
        <div className="progress-info">
          <span>已上 {course.consumedSessions || 0}节</span>
          <span>剩余 {remainingSessions}节</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-info">
          <span>总课时 {totalSessions}节</span>
          <span>已完成 {progress}%</span>
        </div>
      </div>

      {/* 课程基本信息 */}
      <div className="info-section">
        <div className="section-title">课程信息</div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">课程名称</div>
            <div className="info-value">{course.name}</div>
          </div>
          {course.totalAmount && (
            <div className="info-item">
              <div className="info-label">课程金额</div>
              <div className="info-value amount">¥{course.totalAmount}</div>
            </div>
          )}
          <div className="info-item">
            <div className="info-label">正式课时</div>
            <div className="info-value">{course.regularSessions || 0}节</div>
          </div>
          <div className="info-item">
            <div className="info-label">赠送课时</div>
            <div className="info-value">{course.bonusSessions || 0}节</div>
          </div>
          <div className="info-item">
            <div className="info-label">总课时数</div>
            <div className="info-value">{totalSessions}节</div>
          </div>
          <div className="info-item">
            <div className="info-label">剩余课时</div>
            <div className="info-value">{remainingSessions}节</div>
          </div>
        </div>
      </div>

      {/* 上课时间 */}
      <div className="info-section">
        <div className="section-title">
          <ClockCircleOutline />
          上课时间安排
        </div>
        {course.schedules && course.schedules.length > 0 ? (
          <div className="schedule-list">
            {course.schedules.map((schedule, index) => (
              <div key={index} className="schedule-item">
                <div className="schedule-time">
                  <div className="schedule-day">
                    {formatWeekday(schedule.weekday)}
                  </div>
                  <div className="schedule-range">
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                </div>
                <div className="schedule-details">
                  {schedule.location && <div>地点: {schedule.location}</div>}
                  {schedule.instructor && <div>教师: {schedule.instructor}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-schedules">
            <ClockCircleOutline fontSize={32} />
            <p>暂无上课时间安排</p>
          </div>
        )}
      </div>

      {/* 合同文件 */}
      <div className="info-section">
        <div className="section-title">
          <FileOutline />
          合同文件
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          multiple
          style={{ display: 'none' }}
          onChange={handleFilesUpload}
        />
        
        {course.contractImages && course.contractImages.length > 0 ? (
          <div className="contract-section">
            {/* 合同图片列表 */}
            <div className="contract-images-section">
              <h4>合同图片 ({course.contractImages.length}张)</h4>
              <div className="contract-images-grid">
                {course.contractImages.map((imagePath, index) => (
                  <div key={index} className="contract-image-item" data-image-path={imagePath}>
                    <img 
                      src={`http://localhost:3001${imagePath}`} 
                      alt={`合同图片 ${index + 1}`}
                      className="contract-image"
                      onError={(e) => {
                        // 如果图片加载失败，隐藏整个图片项
                        const target = e.target as HTMLImageElement;
                        const parent = target.closest('.contract-image-item') as HTMLElement;
                        if (parent) {
                          parent.style.display = 'none';
                          updateContractImagesCount();
                        }
                      }}
                      onLoad={(e) => {
                        // 图片加载成功后，检查是否真的存在
                        const target = e.target as HTMLImageElement;
                        const parent = target.closest('.contract-image-item') as HTMLElement;
                        if (parent) {
                          fetch(target.src, { method: 'HEAD' })
                            .then(response => {
                              if (!response.ok) {
                                // 如果文件不存在，隐藏整个图片项
                                parent.style.display = 'none';
                                updateContractImagesCount();
                              }
                            })
                            .catch(() => {
                              // 如果检查失败，也隐藏图片项
                              parent.style.display = 'none';
                              updateContractImagesCount();
                            });
                        }
                      }}
                    />
                    <div className="contract-image-actions">
                      <a 
                        href={`http://localhost:3001${imagePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="contract-image-link"
                        onClick={(e) => {
                          // 检查链接是否有效，如果无效则阻止默认行为
                          fetch(`http://localhost:3001${imagePath}`, { method: 'HEAD' })
                            .then(response => {
                              if (!response.ok) {
                                e.preventDefault();
                                Toast.show({
                                  content: '文件不存在',
                                  icon: 'fail',
                                });
                              }
                            })
                            .catch(() => {
                              e.preventDefault();
                              Toast.show({
                                content: '文件不存在',
                                icon: 'fail',
                              });
                            });
                        }}
                      >
                        查看图片
                      </a>
                      <Button 
                        color="danger" 
                        size="mini"
                        fill="outline"
                        className="delete-image-button"
                        onClick={() => handleDeleteContractFile(imagePath)}
                        loading={deletingFiles.has(imagePath)}
                        disabled={deletingFiles.has(imagePath)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="contract-actions">
              <Button 
                color="primary" 
                size="small"
                className="upload-button"
                onClick={handleFileSelect}
                loading={uploading}
              >
                点击上传文件
              </Button>
            </div>
          </div>
        ) : (
          <div className="contract-upload-section">
            <FileOutline className="contract-placeholder-icon" />
            <p className="contract-placeholder-text">暂未上传合同</p>
            <p className="contract-format-info">支持格式：PDF、DOC、DOCX、PNG、JPG，可一次上传多个文件</p>
            <div className="upload-buttons">
              <Button 
                color="primary" 
                size="small"
                className="upload-button"
                onClick={handleFileSelect}
                loading={uploading}
              >
                点击上传文件
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="action-buttons">
        <Button 
          color="primary" 
          className="action-button"
          onClick={() => navigate(`/courses/${course.id}/edit`)}
        >
          <EditSOutline />
          编辑课程
        </Button>
        <Button 
          color="danger" 
          fill="outline"
          className="action-button"
          onClick={handleDelete}
        >
          <DeleteOutline />
          删除课程
        </Button>
      </div>
    </div>
  );
};

export default CourseDetail;