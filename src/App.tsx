import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, HashRouter } from 'react-router-dom';

import LayoutContainer from './components/LayoutContainer';
import WelcomePage from './pages/WelcomePage';
import LotteryPage from './pages/LotteryPage2';
import LegacyWorkshopPage from './pages/LegacyWorkshopPage';
import WorkshopPage from './pages/WorkshopPage';
import CommodityPage from './pages/CommodityPage';
import SettingsPage from './pages/SettingsPage';
import { useNotionToken } from "./hooks/useNotionToken";

const App: React.FC = () => {
  const { token } = useNotionToken();

  // 如果尚未设置 NotionToken
  // => 直接全部跳转到 /welcome
  if (!token) {
    return (
      <HashRouter>
        <Routes>
          {/* 专门放行 /welcome，让用户可以看到欢迎页 */}
          <Route path="/welcome" element={<WelcomePage />} />
          {/* 其他任意路径，全部重定向到 /welcome */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  // 如果有 notionToken，则渲染主布局
  // 默认 / => /workshop
  return (
    <HashRouter>
      <LayoutContainer>
        <Routes>
          {/* 默认首页重定向到 /workshop */}
          <Route path="/" element={<Navigate to="/workshop" replace />} />
          <Route path="/lottery" element={<LotteryPage />} />
          <Route path="/lworkshop" element={<LegacyWorkshopPage />} />
          <Route path="/workshop" element={<WorkshopPage />} />
          <Route path="/commodity" element={<CommodityPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* 如果输错了路由，如 /abc，做个保护，跳回 /workshop */}
          <Route path="*" element={<Navigate to="/workshop" replace />} />
        </Routes>
      </LayoutContainer>
    </HashRouter>
  );
};

export default App;