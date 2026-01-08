import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 开发环境完全禁用 Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
  // 注销所有已注册的 Service Worker
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
      console.log('Service Worker 已注销')
    }
  })
}

// 只在生产环境注册 Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)