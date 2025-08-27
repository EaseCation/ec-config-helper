import React, { useEffect, useState } from 'react';
import { Collapse, Button, Typography, message, Space, Progress } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty, parseCheckbox, parseRelation } from '../../services/commonFormat';
import { formatLottery, WikiResult } from '../../services/lottery/lotteryService';
import { buildWikiTables, buildWikiCSVs } from '../../services/lottery/wikiFormatter';
import { NOTION_DATABASE_LOTTERY } from '../../services/lottery/lotteryNotionQueries';
import { fetchCommodityNameMap } from '../../services/commodity/commodityNameService';
import { fetchLotteryBoxNameMap } from '../../services/lottery/lotteryNameService';
import { downloadCSV } from '../../utils/download';

const { Paragraph } = Typography;

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

const LotteryWikiTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [csvs, setCsvs] = useState<Record<string, string>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState('初始化');

  useEffect(() => {
    const load = async () => {
      try {
        setStage('检查 Notion Token');
        setPercent(10);
        const token = getNotionToken();
        if (!token) {
          messageApi.error('尚未设置 Notion Token');
          return;
        }
        setStage('获取 Lottery 页面');
        setPercent(30);
        const pages = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY, {});
        setStage('解析 Lottery 数据');
        setPercent(50);
        const grouped: Record<string, any[]> = {};
        for (const page of pages) {
          if (parseCheckbox(page.properties['禁用'])) continue;
          const boxId = parseRelation(page.properties['所在抽奖箱']);
          const id = String(flatProperty(page.properties['exchange_id']) || '');
          if (!boxId || !id) continue;
          const boxes = splitString(boxId);
          for (const box of boxes) {
            if (!grouped[box]) grouped[box] = [];
            grouped[box].push(page);
          }
        }
        const wikiMap: Record<string, WikiResult> = {};
        const hiddenLotteries: string[] = []; // 记录被隐藏的抽奖箱

        for (const key in grouped) {
          const formatted = formatLottery(grouped[key]);
          const wiki = formatted.wiki_result;

          // 所有抽奖箱都参与Wiki表格构建，但记录哪些应该被隐藏
          if (wiki.name && wiki.gain.length) {
            wikiMap[wiki.exc] = wiki;
            if (!wiki.display) {
              hiddenLotteries.push(wiki.exc);
            }
          }
        }

        setStage('获取名称映射');
        setPercent(70);
        // 获取商品名称映射和抽奖箱名称映射
        const [nameMap, boxNameMap] = await Promise.all([
          fetchCommodityNameMap(),
          fetchLotteryBoxNameMap()
        ]);

        setStage('构建 Wiki 数据');
        setPercent(90);
        const map = buildWikiTables(wikiMap, nameMap, boxNameMap);
        const csvMap = buildWikiCSVs(wikiMap, nameMap, boxNameMap);

        // 根据hiddenLotteries过滤显示结果
        const filteredMap: Record<string, string> = {};
        const filteredCsvMap: Record<string, string> = {};

        for (const [key, value] of Object.entries(map)) {
          if (!hiddenLotteries.includes(key)) {
            filteredMap[key] = value;
            if (csvMap[key]) {
              filteredCsvMap[key] = csvMap[key];
            }
          }
        }
        setTables(filteredMap);
        setCsvs(filteredCsvMap);
        setPercent(100);
      } catch (err) {
        console.error(err);
        messageApi.error('获取 Lottery 数据失败');
      } finally {
        setStage('完成');
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Progress percent={percent} status={percent === 100 ? 'success' : 'active'} />
        <div style={{ marginTop: 16 }}>{stage}</div>
      </div>
    );
  }

  const items = Object.entries(tables).map(([name, table]) => {
    const csv = csvs[name];
    return {
      key: name,
      label: name,
      extra: (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (csv) {
                downloadCSV(csv, name);
                messageApi.success('已下载');
              } else {
                messageApi.error('CSV 数据缺失');
              }
            }}
          />
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(table);
              messageApi.success('已复制');
            }}
          />
        </Space>
      ),
      children: (
        <Paragraph>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{table}</pre>
        </Paragraph>
      ),
    };
  });

  return (
    <>
      {contextHolder}
      <Collapse accordion items={items} />
    </>
  );
};

export default LotteryWikiTab;

