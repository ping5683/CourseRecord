import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import { AppProvider, useApp } from '@/contexts/AppContext';
import Layout from '@/components/Layout';
import CourseReminderModal from '@/components/CourseReminderModal';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Courses from '@/pages/Courses';
import Attendance from '@/pages/Attendance';
import Profile from '@/pages/Profile';
import CourseDetail from '@/pages/CourseDetail';
import CourseForm from '@/pages/CourseForm';
import { reminderUtils } from '@/utils/reminder';
import 'antd-mobile/bundle/style.css';
import './App.css';

// 主应用路由组件（包含提醒弹窗）
const AppRoutes: React.FC = () => {
  const { state, showReminder, hideReminder } = useApp();
  
  // 设置全局事件监听器
  useEffect(() => {
    const handleShowReminder = (event: CustomEvent) => {
      showReminder(event.detail);
    };

    window.addEventListener('showCourseReminder', handleShowReminder as EventListener);
    
    return () => {
      window.removeEventListener('showCourseReminder', handleShowReminder as EventListener);
    };
  }, [showReminder]);

  // 初始化提醒系统（只在认证成功后）
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      console.log('🔐 认证成功，开始初始化提醒系统...');
      reminderUtils.initReminderSystem();
      reminderUtils.initPostClassCheck();
    } else {
      console.log('⏳ 等待认证状态: isAuthenticated=', state.isAuthenticated, 'isLoading=', state.isLoading);
    }
  }, [state.isAuthenticated, state.isLoading]);
  
  // 调试信息
  console.log('AppRoutes状态:', {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    hasUser: !!state.user,
    hasToken: !!state.token,
    hasReminder: !!state.reminder
  });
  
  if (state.isLoading) {
    console.log('显示加载状态...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#999'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div>应用初始化中...</div>
          <div style={{ fontSize: '12px', color: '#ccc', marginTop: '8px' }}>
            检查认证状态
          </div>
        </div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    console.log('未认证，重定向到登录页');
    return <Navigate to="/login" replace />;
  }

  console.log('认证成功，渲染主界面');
  
  return (
    <>
      {/* 课程提醒弹窗 */}
      <CourseReminderModal
        visible={!!state.reminder}
        reminder={state.reminder}
        onClose={hideReminder}
        onConfirm={hideReminder}
      />
      
      {/* 主路由内容 */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/create" element={<CourseForm />} />
          <Route path="/courses/:id/edit" element={<CourseForm />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <AppProvider>
          <Router>
            <div className="app">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<AppRoutes />} />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;