import React, { useState } from 'react';
import { Button, Input, Space, message, Typography } from 'antd';
import { getNotionToken, fetchNotionAllPages } from '../notion/notionClient';
import { formatLottery } from '../services/lotteryService';
import { downloadJson } from '../utils/download';

const { Title } = Typography;

const LotteryPage: React.FC = () => {
  const [databaseId, setDatabaseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!databaseId) {
      message.warning('请先输入 Lottery 数据库 ID');
      return;
    }
    const token = getNotionToken();
    if (!token) {
      message.error('尚未设置 Notion Token');
      return;
    }

    setLoading(true);
    try {
      // 1. 获取所有页面
      const pages = await fetchNotionAllPages(databaseId, {});
      // 2. 将pages 转为我们需要的抽奖JSON
      const resultJson = formatLottery(pages);
      // 3. 下载
      downloadJson(resultJson, 'lottery.json');
    } catch (err) {
      message.error('生成失败: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-padding">
      <Space direction="vertical">
        <Title style={{ margin: "8px 0 16px" }}>抽奖箱配置自动生成</Title>
        <Input
          placeholder="请输入抽奖箱 Database ID"
          value={databaseId}
          onChange={(e) => setDatabaseId(e.target.value)}
          style={{ width: 400 }}
        />
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          生成 Lottery JSON 并下载
        </Button>
      </Space>
    </div>
  );
};

export default LotteryPage;