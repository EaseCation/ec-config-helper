import React, { useEffect, useState } from 'react';
import { Collapse, Spin, Button, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty, parseCheckbox, parseRelation } from '../../services/commonFormat';
import { formatLottery, WikiResult } from '../../services/lottery/lotteryService';
import { buildWikiTables } from '../../services/lottery/wikiFormatter';
import { NOTION_DATABASE_LOTTERY } from '../../services/lottery/lotteryNotionQueries';
import { fetchCommodityNameMap } from '../../services/commodity/commodityNameService';
import { fetchLotteryBoxNameMap } from '../../services/lottery/lotteryNameService';
import { translateLotteryBoxNames } from '../../services/lottery/lotteryNameService';

const { Paragraph } = Typography;

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

const LotteryWikiTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const load = async () => {
      try {
        const token = getNotionToken();
        if (!token) {
          messageApi.error('尚未设置 Notion Token');
          return;
        }
        const pages = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY, {});
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
        for (const key in grouped) {
          const formatted = formatLottery(grouped[key]);
          const wiki = formatted.wiki_result;
          if (wiki.display && wiki.name && wiki.gain.length) {
            wikiMap[wiki.exc] = wiki;
          }
        }

        // 获取商品名称映射和抽奖箱名称映射
        const [nameMap] = await Promise.all([
          fetchCommodityNameMap()
        ]);

        // 应用抽奖箱名称翻译
        await translateLotteryBoxNames(wikiMap);
        
        // 翻译商品名称
        for (const wiki of Object.values(wikiMap)) {
          wiki.gain.forEach((item) => {
            if (item.name && nameMap[item.name]) {
              item.name = nameMap[item.name];
            }
          });
        }

        const map = buildWikiTables(wikiMap);
        setTables(map);
      } catch (err) {
        console.error(err);
        messageApi.error('获取 Lottery 数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <Spin />;
  }

  const items = Object.entries(tables).map(([name, table]) => ({
    key: name,
    label: name,
    extra: (
      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(table);
          messageApi.success('已复制');
        }}
      />
    ),
    children: (
      <Paragraph>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{table}</pre>
      </Paragraph>
    ),
  }));

  return (
    <>
      {contextHolder}
      <Collapse accordion items={items} />
    </>
  );
};

export default LotteryWikiTab;

