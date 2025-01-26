import React, { useState } from 'react';
import { Button, Input, message, Typography } from 'antd';
import { getNotionToken, fetchNotionAllPages } from '../notion/notionClient';
import { formatCommodity } from '../services/commodityService';
import { downloadJson } from '../utils/download';

const { Title } = Typography;

const CommodityPage: React.FC = () => {
  const [databaseId, setDatabaseId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!databaseId) {
      message.warning('请先输入 Commodity 数据库 ID');
      return;
    }
    const token = getNotionToken();
    if (!token) {
      message.error('尚未设置 Notion Token');
      return;
    }

    setLoading(true);
    try {
      // 1. 获取全部commodity页面
      const pages = await fetchNotionAllPages(databaseId, {});
      // 2. 转换为分类JSON
      const resultJson = formatCommodity(pages);
      // 3. 下载
      downloadJson(resultJson, 'commodity.json');
    } catch (err) {
      message.error('生成失败: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="responsive-padding">
      <Title style={{ margin: "8px 0 16px" }}>Commodity 总分类 JSON 自动生成</Title>
      <Input
        style={{ width: 300 }}
        placeholder="请输入 Commodity 数据库 ID"
        value={databaseId}
        onChange={(e) => setDatabaseId(e.target.value)}
      />
      <div style={{ marginTop: 16 }}>
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          生成并下载 JSON
        </Button>
      </div>
    </div>
  );
};

export default CommodityPage;