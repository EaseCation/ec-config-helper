import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Antd v5 主题自动跟随系统
// 你可以在这里进行更多 vite 配置
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
});