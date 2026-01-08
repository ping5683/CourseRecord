import React, { useState } from 'react';
import { Form, Input, Button, Toast, Tabs } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import authService from '@/services/authService';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, state } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      Toast.show('请填写用户名和密码');
      return;
    }

    setLoading(true);
    try {
      await login(formData.username, formData.password);
      Toast.show('登录成功');
      navigate('/', { replace: true });
    } catch (error: any) {
      Toast.show({
        content: error.response?.data?.message || '登录失败',
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      Toast.show('请填写完整信息');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Toast.show('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      Toast.show('密码长度至少6个字符');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: formData.username,
        password: formData.password,
        email: formData.email || undefined,
      });
      Toast.show('注册成功');
      navigate('/', { replace: true });
    } catch (error: any) {
      Toast.show({
        content: error.response?.data?.message || '注册失败',
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  };

  if (state.isAuthenticated) {
    // 使用 useEffect 来处理重定向，避免在渲染时直接调用 navigate
    React.useEffect(() => {
      navigate('/', { replace: true });
    }, [navigate]);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#999'
      }}>
        正在跳转...
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <h1>课程管理</h1>
        <p>管理您的培训班、健身卡和美容卡</p>
      </div>

      <div className="login-form">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="登录" key="login">
            <Form layout="vertical">
              <Form.Item label="用户名">
                <Input
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={value => handleInputChange('username', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item label="密码">
                <Input
                  placeholder="请输入密码"
                  type="password"
                  value={formData.password}
                  onChange={value => handleInputChange('password', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item>
                <Button
                  block
                  color="primary"
                  size="large"
                  loading={loading}
                  onClick={handleLogin}
                >
                  登录
                </Button>
              </Form.Item>
              
              {/* 注册提示 */}
              <div className="register-tip">
                <p>没有账号？<span onClick={() => setActiveTab('register')} className="register-link">立即注册</span></p>
              </div>
            </Form>
          </Tabs.Tab>

          <Tabs.Tab title="注册" key="register">
            <Form layout="vertical">
              <Form.Item label="用户名">
                <Input
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={value => handleInputChange('username', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item label="密码">
                <Input
                  placeholder="请输入密码（至少6位）"
                  type="password"
                  value={formData.password}
                  onChange={value => handleInputChange('password', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item label="确认密码">
                <Input
                  placeholder="请再次输入密码"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={value => handleInputChange('confirmPassword', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item label="邮箱（可选）">
                <Input
                  placeholder="请输入邮箱"
                  type="email"
                  value={formData.email}
                  onChange={value => handleInputChange('email', value)}
                  clearable
                />
              </Form.Item>
              <Form.Item>
                <Button
                  block
                  color="primary"
                  size="large"
                  loading={loading}
                  onClick={handleRegister}
                >
                  注册
                </Button>
              </Form.Item>
              
              {/* 登录提示 */}
              <div className="login-tip">
                <p>已有账号？<span onClick={() => setActiveTab('login')} className="login-link">立即登录</span></p>
              </div>
            </Form>
          </Tabs.Tab>
        </Tabs>
      </div>

      <div className="login-tips">
        <p>测试账号: testuser / 123456</p>
      </div>
    </div>
  );
};

export default Login;