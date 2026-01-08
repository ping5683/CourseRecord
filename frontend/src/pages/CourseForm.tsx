import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Stepper, 
  Toast, 
  Space,
  Selector,
  TextArea,
  Modal,
  DatePicker,
  TimePicker
} from 'antd-mobile';
import { 
  UploadOutline, 
  DeleteOutline, 
  AddOutline,
  ClockCircleOutline 
} from 'antd-mobile-icons';
import { useApp } from '@/contexts/AppContext';
import { createCourse, getCourseById, updateCourse, uploadFile } from '@/services/courseService';
import { CourseScheduleForm } from '@/types';
import './CourseForm.css';

const CourseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contractFiles, setContractFiles] = useState<File[]>([]);
  const [contractUrls, setContractUrls] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<CourseScheduleForm[]>([]);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);
  const [initialValues, setInitialValues] = useState<any>(null);

  const [newSchedule, setNewSchedule] = useState<CourseScheduleForm>({
    weekday: 1,
    startTime: '09:00',
    endTime: '10:30',
    location: '',
    instructor: ''
  });
  
  const isEdit = Boolean(id);

  // 课程分类选项
  const categoryOptions = [
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

  // 星期选项
  const weekdayOptions = [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 7 }
  ];

  // 加载课程详情（编辑模式）
  useEffect(() => {
    if (isEdit && id) {
      loadCourseDetail();
    }
  }, [isEdit, id, form]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      console.log('开始加载课程详情，课程ID:', id);
      
      const courseData = await getCourseById(id!);
      console.log('课程数据:', courseData);
      
      if (!courseData) {
        throw new Error('课程数据为空');
      }
      
      // 设置表单字段值
      const formValues = {
        name: courseData.name || '',
        totalAmount: courseData.totalAmount || 0,
        regularSessions: courseData.regularSessions || 0,
        bonusSessions: courseData.bonusSessions || 0,
        category: courseData.category ? [courseData.category] : [],
        description: courseData.description || ''
      };
      
      console.log('表单字段值:', formValues);
      
      // 设置表单值
      console.log('设置表单值前，表单是否已初始化:', form);
      
      // 确保数值字段是字符串类型，因为antd-mobile的Input组件需要字符串值
      const stringFormValues = {
        ...formValues,
        totalAmount: formValues.totalAmount ? formValues.totalAmount.toString() : '',
        regularSessions: formValues.regularSessions ? formValues.regularSessions.toString() : '',
        bonusSessions: formValues.bonusSessions ? formValues.bonusSessions.toString() : ''
      };
      
      // 设置初始值，用于Form组件的initialValues属性
      setInitialValues(stringFormValues);
      
      // 同时设置表单值，确保数据同步
      form.setFieldsValue(stringFormValues);
      
      // 验证表单值是否正确设置
      setTimeout(() => {
        const currentValues = form.getFieldsValue();
        console.log('表单当前值:', currentValues);
        console.log('totalAmount 字段值:', currentValues.totalAmount);
        console.log('regularSessions 字段值:', currentValues.regularSessions);
        console.log('bonusSessions 字段值:', currentValues.bonusSessions);
        console.log('category 字段值:', currentValues.category);
        
        // 如果值未正确设置，重新设置一次
        if (!currentValues.totalAmount && formValues.totalAmount) {
          console.log('重新设置表单值');
          form.setFieldsValue(stringFormValues);
        }
      }, 200);
      
      // 加载课程安排
      if (courseData.schedules && courseData.schedules.length > 0) {
        setSchedules(courseData.schedules.map(schedule => ({
          weekday: schedule.weekday,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location || '',
          instructor: schedule.instructor || ''
        })));
      }
      
      if (courseData.contractImages && courseData.contractImages.length > 0) {
        setContractUrls(courseData.contractImages);
      }
      
      console.log('课程详情加载完成');
      

    } catch (error) {
      console.error('加载课程详情失败:', error);
      Toast.show({
        content: '加载课程详情失败',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  // 多文件上传处理
  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      
      // 验证文件类型和大小
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
      
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
          duration: 3000
        });
      }
      
      if (validFiles.length === 0) {
        Toast.show({
          content: '没有有效的文件可以上传',
          duration: 2000
        });
        return;
      }
      
      // 上传文件
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const result = await uploadMultipleFiles(formData);
      
      if (result.success && result.uploaded && result.uploaded.length > 0) {
        // 构建相对路径URL
        const newUrls = result.uploaded.map(file => {
          let url = file.url;
          if (url.startsWith('http://localhost:3001')) {
            url = url.replace('http://localhost:3001', '');
          }
          return url;
        });
        
        setContractFiles([...contractFiles, ...validFiles]);
        setContractUrls([...contractUrls, ...newUrls]);
        
        Toast.show({
          content: `上传成功 ${result.uploaded.length} 个文件`,
          duration: 2000
        });
      } else {
        Toast.show({
          content: '文件上传失败',
          duration: 2000
        });
      }
    } catch (error) {
      Toast.show({
        content: '文件上传失败',
        duration: 2000
      });
    } finally {
      setUploading(false);
    }
  };

  // 上课时间管理函数
  const handleAddSchedule = () => {
    setEditingScheduleIndex(null);
    setNewSchedule({
      weekday: 1,
      startTime: '09:00',
      endTime: '10:30',
      location: '',
      instructor: ''
    });
    setScheduleModalVisible(true);
  };

  const handleEditSchedule = (index: number) => {
    setEditingScheduleIndex(index);
    setNewSchedule({ ...schedules[index] });
    setScheduleModalVisible(true);
  };

  const handleDeleteSchedule = (index: number) => {
    Modal.confirm({
      content: '确定要删除这个排课安排吗？删除后需要点击"更新课程"按钮保存修改才能生效。',
      onConfirm: () => {
        const newSchedules = [...schedules];
        newSchedules.splice(index, 1);
        setSchedules(newSchedules);
        
        // 添加日志以便调试
        console.log('删除排课安排，索引:', index, '剩余安排数量:', newSchedules.length);
        
        Toast.show({
          content: '排课安排已删除，请点击"更新课程"保存修改',
          duration: 3000
        });
      }
    });
  };

  const handleSaveSchedule = () => {
    // 验证下课时间晚于上课时间
    const startTime = newSchedule.startTime;
    const endTime = newSchedule.endTime;
    
    // 将时间字符串转换为分钟数进行比较
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    if (startMinutes >= endMinutes) {
      Toast.show({
        content: '下课时间不能早于上课时间',
        duration: 2000
      });
      return;
    }

    // 验证时间冲突
    const isDuplicate = schedules.some((schedule, index) => {
      if (editingScheduleIndex !== null && index === editingScheduleIndex) {
        return false;
      }
      return schedule.weekday === newSchedule.weekday &&
             schedule.startTime === newSchedule.startTime &&
             schedule.endTime === newSchedule.endTime;
    });

    if (isDuplicate) {
      Toast.show({
        content: '同一时间段不能重复安排课程',
        duration: 2000
      });
      return;
    }

    if (editingScheduleIndex !== null) {
      // 编辑现有安排
      const newSchedules = [...schedules];
      newSchedules[editingScheduleIndex] = { ...newSchedule };
      setSchedules(newSchedules);
    } else {
      // 添加新安排
      setSchedules([...schedules, { ...newSchedule }]);
    }
    
    setScheduleModalVisible(false);
    setEditingScheduleIndex(null);
  };

  // 表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 转换数据类型，确保数值字段是数字类型
      const formData = {
        name: values.name,
        totalAmount: parseFloat(values.totalAmount) || 0,
        regularSessions: parseInt(values.regularSessions) || 0,
        bonusSessions: parseInt(values.bonusSessions) || 0,
        contractImages: contractUrls,
        category: values.category?.[0] || 'general',
        description: values.description || '',
        schedules: schedules
      };

      // 调试日志：显示提交的数据
      console.log('提交课程数据:', {
        name: formData.name,
        totalAmount: formData.totalAmount,
        regularSessions: formData.regularSessions,
        bonusSessions: formData.bonusSessions,
        schedulesCount: formData.schedules.length,
        schedules: formData.schedules
      });

      // 验证必填字段
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('课程名称不能为空');
      }
      
      if (isNaN(formData.regularSessions) || formData.regularSessions <= 0) {
        throw new Error('正式课时数必须大于0');
      }

      if (isEdit && id) {
        await updateCourse(id, formData);
        Toast.show({
          content: '课程更新成功',
          duration: 2000,
          afterClose: () => navigate('/courses')
        });
      } else {
        await createCourse(formData);
        Toast.show({
          content: '课程创建成功',
          duration: 2000,
          afterClose: () => navigate('/courses')
        });
      }
    } catch (error: any) {
      Toast.show({
        content: error.message || '操作失败',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-form">
      <div className="form-header">
        <h1>{isEdit ? '编辑课程' : '创建课程'}</h1>
        <p>请填写课程信息，带*号为必填项</p>
      </div>
      
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        requiredMarkStyle="text-required"
        initialValues={initialValues}
        footer={
          <Space direction="vertical" block>
            <Button 
              type="submit" 
              color="primary" 
              size="large" 
              block 
              loading={loading}
            >
              {isEdit ? '更新课程' : '创建课程'}
            </Button>
            <Button 
              size="large" 
              block 
              onClick={() => navigate('/courses')}
            >
              取消
            </Button>
          </Space>
        }
      >
        {/* 课程名称 */}
        <Form.Item
          name="name"
          label="课程名称"
          rules={[
            { required: true, message: '请输入课程名称' },
            { min: 1, max: 100, message: '课程名称长度应在1-100字符之间' }
          ]}
        >
          <Input 
            placeholder="请输入课程名称" 
            clearable 
          />
        </Form.Item>

        {/* 课程金额 */}
        <Form.Item
          name="totalAmount"
          label="课程金额（元）"
          extra="非必填"
        >
          <Input
            placeholder="请输入课程金额"
            type="number"
            step="0.01"
            min="0"
            prefix="¥"
          />
        </Form.Item>

        {/* 正式课时 */}
        <Form.Item
          name="regularSessions"
          label="正式课时数"
          rules={[
            { required: true, message: '请输入正式课时数' },
            {
              validator: (_, value) => {
                const numValue = parseInt(value);
                if (isNaN(numValue) || numValue <= 0) {
                  return Promise.reject(new Error('课时数必须大于0'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input
            placeholder="请输入正式课时数"
            type="number"
            min="1"
            step="1"
          />
        </Form.Item>

        {/* 赠送课时 */}
        <Form.Item
          name="bonusSessions"
          label="赠送课时数"
          extra="非必填"
        >
          <Input
            placeholder="请输入赠送课时数"
            type="number"
            min="0"
            step="1"
          />
        </Form.Item>

        {/* 课程分类 */}
        <Form.Item
          name="category"
          label="课程分类"
          extra="非必填"
        >
          <Selector
            options={categoryOptions}
            columns={3}
          />
        </Form.Item>

        {/* 合同文件上传 */}
        <Form.Item
          label="合同文件"
          extra="非必填，支持PDF、DOC、DOCX、PNG、JPG格式，可一次上传多个文件，最大10MB"
        >
          <div className="upload-section">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => handleFilesUpload(e.target.files)}
              style={{ display: 'none' }}
              id="contract-file-input"
            />
            
            <label htmlFor="contract-file-input" className="upload-trigger">
              <UploadOutline />
              <span>点击上传合同文件</span>
            </label>
            
            {uploading && (
              <div className="upload-preview">
                <p>上传中...</p>
              </div>
            )}
            
            {contractUrls.length > 0 && (
              <div className="upload-preview">
                <p>已上传文件 ({contractUrls.length}个)：</p>
                <div className="uploaded-files">
                  {contractUrls.map((url, index) => (
                    <div key={index} className="uploaded-file-item">
                      <a href={`http://localhost:3001${url}`} target="_blank" rel="noopener noreferrer">
                        查看文件 {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {contractFiles.length > 0 && (
              <div className="selected-files">
                <p>已选择文件：</p>
                <ul>
                  {contractFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Form.Item>

        {/* 上课时间管理 */}
        <Form.Item
          label="上课时间安排"
          extra="可添加多个上课时间，同一时间段不能重复。删除排课安排后需要点击'更新课程'保存修改。"
        >
          <div className="schedule-section">
            <Button
              color="primary"
              fill="outline"
              size="small"
              onClick={handleAddSchedule}
              style={{ marginBottom: '16px' }}
            >
              <AddOutline />
              添加上课时间
            </Button>
            
            {schedules.length === 0 ? (
              <div className="empty-schedules">
                <ClockCircleOutline fontSize={24} color="#ccc" />
                <p>暂无上课时间安排</p>
              </div>
            ) : (
              <div className="schedules-list">
                {schedules.map((schedule, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-info">
                      <div className="schedule-time">
                        <span className="weekday">
                          {weekdayOptions.find(w => w.value === schedule.weekday)?.label}
                        </span>
                        <span className="time-range">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      {schedule.location && (
                        <div className="schedule-detail">地点: {schedule.location}</div>
                      )}
                      {schedule.instructor && (
                        <div className="schedule-detail">教师: {schedule.instructor}</div>
                      )}
                    </div>
                    <div className="schedule-actions">
                      <Button
                        size="mini"
                        fill="none"
                        onClick={() => handleEditSchedule(index)}
                      >
                        编辑
                      </Button>
                      <Button
                        size="mini"
                        fill="none"
                        color="danger"
                        onClick={() => handleDeleteSchedule(index)}
                      >
                        <DeleteOutline />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form.Item>

        {/* 课程描述 */}
        <Form.Item
          name="description"
          label="课程描述"
          extra="非必填"
        >
          <TextArea
            placeholder="请输入课程描述（可选）"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>

      {/* 上课时间编辑模态框 */}
      <Modal
        visible={scheduleModalVisible}
        title={editingScheduleIndex !== null ? '编辑上课时间' : '添加上课时间'}
        content={
          <div className="schedule-modal">
            <div className="form-group">
              <label>星期</label>
              <Selector
                options={weekdayOptions}
                value={[newSchedule.weekday]}
                onChange={(value) => setNewSchedule({...newSchedule, weekday: value[0]})}
                columns={7}
              />
            </div>
            
            <div className="form-group">
              <label>开始时间</label>
              <input
                type="time"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                className="time-input"
              />
            </div>
            
            <div className="form-group">
              <label>结束时间</label>
              <input
                type="time"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                className="time-input"
              />
            </div>
            
            <div className="form-group">
              <label>上课地点（可选）</label>
              <Input
                placeholder="请输入上课地点"
                value={newSchedule.location}
                onChange={(value) => setNewSchedule({...newSchedule, location: value})}
              />
            </div>
            
            <div className="form-group">
              <label>授课教师（可选）</label>
              <Input
                placeholder="请输入授课教师"
                value={newSchedule.instructor}
                onChange={(value) => setNewSchedule({...newSchedule, instructor: value})}
              />
            </div>
          </div>
        }
        closeOnAction
        onClose={() => setScheduleModalVisible(false)}
        actions={[
          { key: 'cancel', text: '取消' },
          { key: 'save', text: '保存', primary: true, onClick: handleSaveSchedule }
        ]}
      />
    </div>
  );
};

export default CourseForm;