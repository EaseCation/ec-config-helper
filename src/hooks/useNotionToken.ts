import { useState, useEffect } from "react";

const NOTION_TOKEN_KEY = "NOTION_TOKEN";

export function useNotionToken() {
  // 使用 React 状态存储 token
  const [token, setToken] = useState<string | null>(null);

  // 从 localStorage 初始化 token
  useEffect(() => {
    const storedToken = localStorage.getItem(NOTION_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // 更新 token 并同步到 localStorage
  const updateToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem(NOTION_TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(NOTION_TOKEN_KEY);
    }
    setToken(newToken);
  };

  return { token, setToken: updateToken };
}