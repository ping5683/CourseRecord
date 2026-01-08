import { NotificationData } from '@/types';

class NotificationManager {
  private isSupported: boolean;
  private subscription: PushSubscription | null = null;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // 检查是否支持推送通知
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // 请求通知权限
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('当前浏览器不支持推送通知');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('用户拒绝了通知权限');
    }

    return permission;
  }

  // 注册推送订阅
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      console.warn('推送通知不支持');
      return null;
    }

    try {
      // 获取 Service Worker 注册
      const registration = await navigator.serviceWorker.ready;
      
      // 订阅推送服务
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
      });

      this.subscription = subscription;
      
      // 将订阅信息发送到服务器
      await this.sendSubscriptionToServer(subscription);
      
      console.log('推送订阅成功:', subscription);
      return subscription;
    } catch (error) {
      console.error('推送订阅失败:', error);
      return null;
    }
  }

  // 取消推送订阅
  async unsubscribeFromPush(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('已取消推送订阅');
    }
  }

  // 发送订阅信息到服务器
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('保存订阅信息失败');
      }

      console.log('订阅信息已保存到服务器');
    } catch (error) {
      console.error('保存订阅信息失败:', error);
      throw error;
    }
  }

  // 显示本地通知（用于立即提醒）
  showLocalNotification(title: string, options: NotificationOptions = {}, data?: NotificationData): void {
    if (!('Notification' in window)) {
      console.warn('当前浏览器不支持通知');
      return;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        requireInteraction: true,
        ...options
      });

      // 添加自定义数据
      if (data) {
        (notification as any).data = data;
      }

      // 点击通知时的处理
      notification.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(notification, data);
        notification.close();
      };

      // 自动关闭通知
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // 处理通知点击事件
  private handleNotificationClick(notification: Notification, data?: NotificationData): void {
    window.focus();

    if (data) {
      switch (data.type) {
        case 'course_reminder':
          if (data.courseId) {
            // 导航到课程详情页
            window.location.href = `/courses/${data.courseId}`;
          }
          break;
        case 'consumption_confirmation':
          if (data.courseId) {
            // 导航到课程详情页
            window.location.href = `/courses/${data.courseId}`;
          }
          break;
      }
    } else {
      // 默认导航到首页
      window.location.href = '/';
    }
  }

  // 安装Service Worker
  async installServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker 注册成功:', registration);
      } catch (error) {
        console.error('Service Worker 注册失败:', error);
      }
    }
  }

  // VAPID公钥转换工具
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 检查订阅状态
  async getSubscriptionStatus(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('获取订阅状态失败:', error);
      return false;
    }
  }

  // 初始化通知系统
  async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('推送通知不支持');
      return;
    }

    try {
      // 安装Service Worker
      await this.installServiceWorker();

      // 检查权限
      if (Notification.permission === 'default') {
        // 如果是默认状态，不自动请求权限
        console.log('通知权限尚未授予');
      } else if (Notification.permission === 'granted') {
        // 如果已授权，尝试订阅推送
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('初始化通知系统失败:', error);
    }
  }
}

export default new NotificationManager();