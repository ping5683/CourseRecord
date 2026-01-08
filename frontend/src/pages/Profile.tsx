import React, { useEffect, useState } from 'react';
import { Card, List, Button, Avatar, Space, Toast } from 'antd-mobile';
import { 
  UserOutline, 
  RightOutline,
  EditSOutline
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { User } from '@/types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用模拟数据作为后备
      let userData: User = state.user || {
        id: '1',
        username: 'testuser',
        name: '测试用户',
        phone: '138****5678',
        email: 'test@example.com',
        role: 'teacher'
      };
      
      setUser(userData);
    } catch (error) {
      console.error('加载用户信息失败:', error);
      setError('用户信息加载失败');
      Toast.show('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 加载状态
  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', marginTop: '100px' }}>
        <div style={{ fontSize: '48px', color: '#1677ff', marginBottom: '16px' }}>
          <UserOutline />
        </div>
        <p>用户信息加载中...</p>
      </div>
    );
  }

  // 错误状态
  if (error || !user) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', marginTop: '100px' }}>
        <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
          <UserOutline />
        </div>
        <h3>数据加载失败</h3>
        <p>{error || '用户信息获取失败'}</p>
        <Button 
          color="primary" 
          onClick={loadUserProfile}
          style={{ marginTop: '16px' }}
        >
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* 用户信息卡片 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Avatar 
            src={user.avatar} 
            style={{ '--size': '64px', marginRight: '16px' }}
          >
            {user.name?.charAt(0) || user.username?.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, marginBottom: '4px' }}>{user.name || user.username}</h2>
            <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
              {user.role === 'teacher' ? '教师' : '学生'}
            </p>
          </div>
          <Button 
            size="small" 
            fill="none" 
            onClick={() => navigate('/profile/edit')}
          >
            <EditSOutline />
          </Button>
        </div>
        
        <Space direction="vertical" block>
          <List.Item
            prefix={<span style={{ fontSize: '20px' }}>📱</span>}
            extra={user.phone}
          >
            手机号
          </List.Item>
          <List.Item
            prefix={<span style={{ fontSize: '20px' }}>✉️</span>}
            extra={user.email}
          >
            邮箱
          </List.Item>
        </Space>
      </Card>

      {/* 功能菜单 */}
      <Card style={{ marginTop: '16px' }}>
        <List>
          <List.Item
            prefix={<span style={{ fontSize: '20px' }}>⚙️</span>}
            suffix={<RightOutline />}
            onClick={() => Toast.show('设置功能开发中')}
          >
            系统设置
          </List.Item>
          <List.Item
            prefix={<span style={{ fontSize: '20px' }}>❓</span>}
            suffix={<RightOutline />}
            onClick={() => Toast.show('帮助中心开发中')}
          >
            帮助中心
          </List.Item>
          <List.Item
            prefix={<span style={{ fontSize: '20px' }}>🚪</span>}
            suffix={<RightOutline />}
            onClick={handleLogout}
          >
            退出登录
          </List.Item>
        </List>
      </Card>

      {/* 统计信息 */}
      <Card style={{ marginTop: '16px' }}>
        <h3 style={{ marginBottom: '16px' }}>统计信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>12</div>
            <div style={{ fontSize: '12px', color: '#666' }}>总课程数</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>45</div>
            <div style={{ fontSize: '12px', color: '#666' }}>已完成课时</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>8</div>
            <div style={{ fontSize: '12px', color: '#666' }}>待上课时</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>95%</div>
            <div style={{ fontSize: '12px', color: '#666' }}>出勤率</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;