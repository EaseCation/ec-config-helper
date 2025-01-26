import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import './index.css';

// antd v5 主题：自动跟随系统色
const { defaultAlgorithm, darkAlgorithm } = theme;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: [defaultAlgorithm, darkAlgorithm],
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);