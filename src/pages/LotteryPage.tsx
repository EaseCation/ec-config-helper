import React, { useState } from 'react';
import { Button, Input, Space, message, Typography } from 'antd';
import { getNotionToken, fetchNotionAllPages } from '../notion/notionClient';
import { formatLottery } from '../services/lotteryService';
import { downloadJsonAsZip } from '../utils/download';
import { parseCheckbox, parseRollup, parseRelation } from '../services/commonFormat';

const { Title } = Typography;

function splitString(input: string): string[] {
  return input.split(', ').filter(item => item !== '');
}

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

      // 2. 根据 exchange_id 分组
      let result: { [key: string]: any } = {};
      let exchangeIdBoxId: { [key: string]: string } = {};

      for (const item of pages) {
        if (parseCheckbox(item.properties['禁用'])) {
          continue;
        }

        const boxId = parseRelation(item.properties['所在抽奖箱']);
        const id = parseRollup(item.properties['exchange_id']);
        if (id === '') {
          continue;
        }

        for (const box of splitString(boxId)) {
          if (!result[box]) {
            result[box] = []; // 初始化数组
          }
          result[box].push(item);

          if (splitString(boxId).length <= 1) {
            exchangeIdBoxId[box] = id;
          }
        }
      }

      // 3. 将 pages 转换为 Lottery JSON 并构建 fileArray
      let fileArray: { [key: string]: any } = {};

      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          const formattedData = formatLottery(result[key]);
          if (formattedData.name && formattedData.name !== '') {
            fileArray[exchangeIdBoxId[key]] = {
              [formattedData.name]: formattedData.result,
            };
          }
        }
      }

      // 4. 下载 ZIP 包
      downloadJsonAsZip(fileArray, 'lottery');
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
          addonBefore="抽奖箱 Database ID："
        />
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          生成 Lottery JSON 并下载
        </Button>
      </Space>
    </div>
  );
};

export default LotteryPage;