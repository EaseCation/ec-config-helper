import React, { useEffect, useState } from 'react';
import { Collapse, Spin, Button, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty, parseCheckbox, parseRelation } from '../../services/commonFormat';
import { formatLottery, WikiResult } from '../../services/lottery/lotteryService';
import { buildWikiTables } from '../../services/lottery/wikiFormatter';
import { NOTION_DATABASE_LOTTERY } from '../../services/lottery/lotteryNotionQueries';

const { Panel } = Collapse;
const { Paragraph } = Typography;

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

const LotteryWikiTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const token = getNotionToken();
        if (!token) {
          message.error('尚未设置 Notion Token');
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
        const map = buildWikiTables(wikiMap);
        setTables(map);
      } catch (err) {
        console.error(err);
        message.error('获取 Lottery 数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <Spin />;
  }

  return (
    <Collapse accordion>
      {Object.entries(tables).map(([name, table]) => (
        <Panel
          header={name}
          key={name}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(table);
                message.success('已复制');
              }}
            />
          }
        >
          <Paragraph>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{table}</pre>
          </Paragraph>
        </Panel>
      ))}
    </Collapse>
  );
};

export default LotteryWikiTab;

