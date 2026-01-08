import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, User, CourseReminder } from '@/types';
import authService from '@/services/authService';

type AppAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SHOW_REMINDER'; payload: CourseReminder | null }
  | { type: 'HIDE_REMINDER' };

const initialState: AppState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  reminder: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'SHOW_REMINDER':
      return {
        ...state,
        reminder: action.payload,
      };
    case 'HIDE_REMINDER':
      return {
        ...state,
        reminder: null,
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  showReminder: (reminder: CourseReminder) => void;
  hideReminder: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化应用状态
  useEffect(() => {
    const initApp = async () => {
      try {
        const token = authService.getToken();
        console.log('App初始化 - Token存在:', !!token);
        
        if (token) {
          console.log('开始获取用户信息...');
          const user = await authService.getProfile();
          console.log('用户信息获取成功:', user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } else {
          console.log('Token不存在，设置未认证状态');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error);
        // 清除无效的token
        authService.logout();
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('初始化失败，已清除token并设置加载完成');
      }
    };

    initApp();
  }, []);

  const login = async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.login(username, password);
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const showReminder = (reminder: CourseReminder) => {
    dispatch({ type: 'SHOW_REMINDER', payload: reminder });
  };

  const hideReminder = () => {
    dispatch({ type: 'HIDE_REMINDER' });
  };

  const value: AppContextType = {
    state,
    login,
    logout,
    setLoading,
    showReminder,
    hideReminder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};