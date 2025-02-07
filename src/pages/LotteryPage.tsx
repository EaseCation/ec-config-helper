import React, { useState } from 'react';
import { Button, Input, Space, message, Typography } from 'antd';
import { getNotionToken, fetchNotionAllPages } from '../notion/notionClient';
import { formatLottery } from '../services/lotteryService';
import { downloadJson } from '../utils/download';
import { parseCheckbox, parseRollup } from '../services/commonFormat'

const { Title } = Typography;

const LotteryPage: React.FC = () => {
  const [databaseId, setDatabaseId] = useState('9e151c3d30b14d1bae8dd972d17198c1');
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

      let result: { [key: string]: any } = {}
      for (const item of pages) {
        if (parseCheckbox(item.properties['禁用'])) {
          continue;
        }
        const id = parseRollup(item.properties['exchange_id']);
        if (!result[id]) {
          result[id] = [];
        }
        result[id].push(item);
      }
      // 2. 将pages 转为我们需要的抽奖JSON
      let fullArry: { [key: string]: any } = {};
      let fullWikiArray: { [key: string]: any } = {};
      //循环遍历result 并将他们惊醒
      Object.values(result).forEach(value => {
        const array = formatLottery(value);
        if (array.name && array.name !== '') {
          fullArry[array.name] = array.result;
        }
        if(array.wiki_result) {
          fullWikiArray[array.name] = array.wiki_result;
        }
      });
      // 3. 下载
      downloadJson(JSON.stringify(fullArry), 'lottery.json');
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
          addonBefore="抽奖箱 Database ID："  // 在左侧添加提示
        />
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          生成 Lottery JSON 并下载
        </Button>
      </Space>
    </div>
  );
};

export default LotteryPage;