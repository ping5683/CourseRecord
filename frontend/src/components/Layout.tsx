import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { 
  AppOutline, 
  UnorderedListOutline, 
  CalendarOutline, 
  UserOutline 
} from 'antd-mobile-icons';
import { useApp } from '@/contexts/AppContext';
import './Layout.css';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useApp();
  const [activeKey, setActiveKey] = useState(location.pathname);
  
  console.log('Layout组件渲染，当前路径:', location.pathname);
  console.log('Outlet应该渲染的内容');

  const tabs = [
    {
      key: '/',
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: '/courses',
      title: '课程',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/attendance',
      title: '出勤',
      icon: <CalendarOutline />,
    },
    {
      key: '/profile',
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    navigate(key);
  };

  return (
    <div className="layout">
      <div className="layout-content">
        <Outlet />
      </div>
      
      <TabBar
        activeKey={activeKey}
        onChange={handleTabChange}
        className="layout-tabbar"
      >
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  );
};

export default Layout;