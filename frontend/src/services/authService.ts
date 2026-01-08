import api from './api';
import { User, AuthResponse } from '@/types';

class AuthService {
  // 用户登录
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      username,
      password,
    });

    if (response.success && response.data) {
      // 保存token和用户信息到本地存储
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  // 用户注册
  async register(userData: {
    username: string;
    password: string;
    email?: string;
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);

    if (response.success && response.data) {
      // 保存token和用户信息到本地存储
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  // 获取当前用户信息
  async getProfile(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/profile');
    
    if (response.success && response.data) {
      const userData = response.data as { user: User };
      localStorage.setItem('user', JSON.stringify(userData.user));
      return userData.user;
    }
    
    throw new Error('获取用户信息失败');
  }

  // 用户登出
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // 获取当前用户
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

export default new AuthService();