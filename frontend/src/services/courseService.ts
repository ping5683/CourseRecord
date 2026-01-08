import api from './api';
import { Course, CourseForm, PaginatedResponse, CourseStats } from '@/types';

class CourseService {
  // 获取课程列表
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses', { params });
    
    // 调试日志
    console.log('课程API响应:', response);
    
    // 处理不同的数据结构
    if (response.success) {
      // 如果数据直接是数组（后端直接返回课程数组）
      if (Array.isArray(response.data)) {
        return {
          ...response,
          data: {
            courses: response.data,
            pagination: response.pagination || {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1
            }
          }
        };
      }
      
      // 如果数据包含courses字段
      if (response.data && 'courses' in response.data) {
        return {
          ...response,
          data: {
            ...response.data,
            courses: response.data.courses || []
          }
        };
      }
      
      // 如果数据包含records字段
      if (response.data && 'records' in response.data) {
        return {
          ...response,
          data: {
            ...response.data,
            courses: response.data.records || []
          }
        };
      }
      
      // 如果数据是其他结构，尝试直接提取课程数据
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        // 检查是否是数组形式的课程数据
        if (Array.isArray(data)) {
          return {
            ...response,
            data: {
              courses: data,
              pagination: response.pagination || {
                page: 1,
                limit: data.length,
                total: data.length,
                totalPages: 1
              }
            }
          };
        }
      }
    }
    
    // 返回默认结构
    return {
      ...response,
      data: {
        courses: [],
        pagination: response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      }
    };
  }

  // 获取今日课程
  async getTodayCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>('/courses/today');
    return response.data || [];
  }

  // 获取课程详情
  async getCourseById(id: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data!;
  }

  // 创建课程
  async createCourse(courseData: CourseForm): Promise<Course> {
    const response = await api.post<Course>('/courses', courseData);
    return response.data!;
  }

  // 更新课程
  async updateCourse(id: string, courseData: Partial<CourseForm>): Promise<Course> {
    const response = await api.put<Course>(`/courses/${id}`, courseData);
    return response.data!;
  }

  // 删除课程
  async deleteCourse(id: string): Promise<void> {
    console.log('调用删除课程API，课程ID:', id);
    const response = await api.delete(`/courses/${id}`);
    console.log('删除课程API响应:', response);
    
    if (!response.success) {
      throw new Error(response.message || '删除失败');
    }
  }

  // 单文件上传
  async uploadFile(formData: FormData): Promise<{ filename: string; path: string; url: string }> {
    console.log('开始上传文件...');
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('文件上传响应:', response);
    return response.data!;
  }

  // 多文件上传
  async uploadMultipleFiles(formData: FormData): Promise<{
    success: boolean;
    uploaded: Array<{ filename: string; path: string; url: string; originalName: string }>;
    errors: string[];
    total: number;
    successCount: number;
    errorCount: number;
  }> {
    console.log('开始批量上传文件...');
    
    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('批量上传响应:', response);
    return response.data!;
  }

  // 上传合同文件（单文件）
  async uploadContract(courseId: string, formData: FormData, courseData: any): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      console.log('开始上传合同文件...');
      
      // 先上传文件
      const uploadResponse = await this.uploadFile(formData);
      console.log('文件上传成功:', uploadResponse);
      
      if (uploadResponse && uploadResponse.url) {
        // 将完整的URL转换为相对路径
        let contractPath = uploadResponse.url;
        if (contractPath.startsWith('http://localhost:3001')) {
          contractPath = contractPath.replace('http://localhost:3001', '');
        }
        
        // 更新课程的合同图片数组，同时发送完整的课程数据
        const contractImages = [...(courseData.contractImages || []), contractPath];
        const updateData = {
          ...courseData,
          contractImages: contractImages
        };
        
        console.log('更新课程数据:', updateData);
        const updateResponse = await api.put(`/courses/${courseId}`, updateData);
        console.log('课程更新响应:', updateResponse);
        
        return {
          success: updateResponse.success,
          message: updateResponse.message,
          data: {
            fileUrl: uploadResponse.url,
            course: updateResponse.data
          }
        };
      }
      
      console.log('文件上传失败，无URL返回');
      return {
        success: false,
        message: '文件上传失败'
      };
    } catch (error: any) {
      console.error('上传合同出错:', error);
      return {
        success: false,
        message: error.message || '上传失败'
      };
    }
  }

  // 删除文件
  async deleteFile(filename: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('开始删除文件:', filename);
      const response = await api.delete(`/upload/${filename}`);
      console.log('文件删除响应:', response);
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('删除文件出错:', error);
      return {
        success: false,
        message: error.message || '删除失败'
      };
    }
  }

  // 批量上传合同文件
  async uploadMultipleContracts(courseId: string, formData: FormData, courseData: any): Promise<{ 
    success: boolean; 
    message?: string; 
    data?: {
      uploaded: Array<{ filename: string; path: string; url: string; originalName: string }>;
      errors: string[];
      total: number;
      successCount: number;
      errorCount: number;
    } 
  }> {
    try {
      console.log('开始批量上传合同文件，FormData已创建');
      
      // 批量上传文件
      const uploadResponse = await this.uploadMultipleFiles(formData);
      console.log('批量上传成功:', uploadResponse);
      
      if (uploadResponse.success && uploadResponse.uploaded.length > 0) {
        // 构建合同路径数组（只包含相对路径）
        const contractPaths = uploadResponse.uploaded.map(file => {
          let contractPath = file.url;
          if (contractPath.startsWith('http://localhost:3001')) {
            contractPath = contractPath.replace('http://localhost:3001', '');
          }
          return contractPath;
        });
        
        // 更新课程的合同图片数组
        // 处理existingImages：可能是数组，也可能是JSON字符串
        let existingImages: string[] = [];
        if (courseData.contractImages) {
          if (typeof courseData.contractImages === 'string') {
            try {
              existingImages = JSON.parse(courseData.contractImages);
            } catch (error) {
              console.warn('解析contractImages失败，使用空数组:', error);
              existingImages = [];
            }
          } else if (Array.isArray(courseData.contractImages)) {
            existingImages = courseData.contractImages;
          }
        }
        
        const updateData = {
          ...courseData,
          contractImages: [...existingImages, ...contractPaths] // 合并现有图片和新上传的图片，保持数组格式
        };
        
        console.log('更新课程数据:', updateData);
        const updateResponse = await api.put(`/courses/${courseId}`, updateData);
        console.log('课程更新响应:', updateResponse);
        
        return {
          success: updateResponse.success,
          message: updateResponse.message,
          data: uploadResponse
        };
      }
      
      console.log('文件上传失败');
      return {
        success: false,
        message: uploadResponse.errors ? uploadResponse.errors.join('; ') : '文件上传失败'
      };
    } catch (error: any) {
      console.error('批量上传合同出错:', error);
      return {
        success: false,
        message: error.message || '批量上传失败'
      };
    }
  }

  // 获取课程统计信息
  async getCourseStats(id: string): Promise<CourseStats> {
    const course = await this.getCourseById(id);
    return {
      totalSessions: course.totalSessions || 0,
      consumedSessions: course.consumedSessions || 0,
      remainingSessions: course.remainingSessions || 0,
    };
  }

  // 计算课程进度百分比
  calculateProgress(course: Course): number {
    const total = course.totalSessions || (course.regularSessions + course.bonusSessions);
    const consumed = course.consumedSessions || 0;
    return total > 0 ? Math.round((consumed / total) * 100) : 0;
  }

  // 获取分类选项
  getCategoryOptions(): { label: string; value: string }[] {
    return [
      { label: '英语', value: 'english' },
      { label: '数学', value: 'math' },
      { label: '语文', value: 'chinese' },
      { label: '物理', value: 'physics' },
      { label: '化学', value: 'chemistry' },
      { label: '编程', value: 'programming' },
      { label: '艺术', value: 'art' },
      { label: '体育', value: 'sports' },
      { label: '其他', value: 'other' }
    ];
  }

  // 获取星期选项
  getWeekdayOptions(): { label: string; value: number }[] {
    return [
      { label: '周一', value: 1 },
      { label: '周二', value: 2 },
      { label: '周三', value: 3 },
      { label: '周四', value: 4 },
      { label: '周五', value: 5 },
      { label: '周六', value: 6 },
      { label: '周日', value: 7 },
    ];
  }

  // 格式化课程状态
  formatCourseStatus(course: Course): string {
    if (!course.isActive) return '已停用';
    const remaining = course.remainingSessions || 0;
    if (remaining === 0) return '已结束';
    if (remaining <= 3) return '即将结束';
    return '进行中';
  }
}

const courseService = new CourseService();

export default courseService;

// 导出单个函数以便在组件中使用
export const {
  getCourses,
  getTodayCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadFile,
  getCourseStats,
  calculateProgress,
  getCategoryOptions,
  getWeekdayOptions,
  formatCourseStatus
} = courseService;