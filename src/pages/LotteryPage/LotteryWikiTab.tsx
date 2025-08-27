import React, { useState } from 'react';
import { Collapse, Button, Typography, message, Space, Progress, Tag, Upload } from 'antd';
import { CopyOutlined, DownloadOutlined, FileMarkdownOutlined, UploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty, parseCheckbox, parseRelation } from '../../services/commonFormat';
import { formatLottery, WikiResult } from '../../services/lottery/lotteryService';
import { buildWikiTables, buildWikiCSVs, buildMarkdownTables } from '../../services/lottery/wikiFormatter';
import { NOTION_DATABASE_LOTTERY } from '../../services/lottery/lotteryNotionQueries';
import { fetchCommodityNameMap } from '../../services/commodity/commodityNameService';
import { fetchLotteryBoxNameMap } from '../../services/lottery/lotteryNameService';
import { parseLanguageConfig, parseKillerMerchandise } from '../../services/lottery/extraNameParser';
import { downloadCSV, downloadCSVAsZip } from '../../utils/download';
import { parseLocalLotteryConfig } from '../../services/lottery/configParser';

const { Paragraph } = Typography;

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

const LotteryWikiTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [csvs, setCsvs] = useState<Record<string, string>>({});
  const [markdowns, setMarkdowns] = useState<Record<string, string>>({});
  const [probabilitySums, setProbabilitySums] = useState<Record<string, number>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState('初始化');
  const [notionMap, setNotionMap] = useState<Record<string, WikiResult>>({});
  const [uploadedMap, setUploadedMap] = useState<Record<string, WikiResult>>({});
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [notionNameMap, setNotionNameMap] = useState<Record<string, string>>({});
  const [boxNameMap, setBoxNameMap] = useState<Record<string, string>>({});
  const [langMap, setLangMap] = useState<Record<string, string>>({});
  const [killerMap, setKillerMap] = useState<Record<string, string>>({});

  const mergeNameMaps = (
    nMap: Record<string, string>,
    lMap: Record<string, string>,
    kMap: Record<string, string>
  ) => {
    const merged: Record<string, string> = { ...nMap };
    for (const [k, v] of Object.entries(lMap)) {
      if (!merged[k]) merged[k] = v;
    }
    for (const [k, v] of Object.entries(kMap)) {
      if (!merged[k]) merged[k] = v;
    }
    return merged;
  };

  const rebuild = (
    nMap: Record<string, WikiResult>,
    uMap: Record<string, WikiResult>,
    nNameMap: Record<string, string> = nameMap,
    nBoxNameMap: Record<string, string> = boxNameMap
  ) => {
    const combined: Record<string, WikiResult> = { ...nMap, ...uMap };
    const map = buildWikiTables(combined, nNameMap, nBoxNameMap);
    const csvMap = buildWikiCSVs(combined, nNameMap, nBoxNameMap);
    const mdMap = buildMarkdownTables(combined, nNameMap, nBoxNameMap);

    const sums: Record<string, number> = {};
    for (const [key, csv] of Object.entries(csvMap)) {
      const lines = csv.split(/\r?\n/);
      let startIndex = 1;
      if (lines[0] && lines[0].startsWith('保底次数')) {
        startIndex = 2;
      }
      let total = 0;
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const chance = parts[2];
        if (chance && chance !== '保底') {
          const num = parseFloat(chance.replace(/"|%/g, ''));
          if (!isNaN(num)) total += num;
        }
      }
      sums[key] = total;
    }

    setTables(map);
    setCsvs(csvMap);
    setMarkdowns(mdMap);
    setProbabilitySums(sums);
  };

  const load = async () => {
    try {
      setLoading(true);
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
      for (const key in grouped) {
        const formatted = formatLottery(grouped[key]);
        const wiki = formatted.wiki_result;
        if (wiki.name && wiki.gain.length) {
          wikiMap[wiki.exc] = wiki;
        }
      }

      setStage('获取名称映射');
      setPercent(70);
      const [nMap, bMap] = await Promise.all([
        fetchCommodityNameMap(),
        fetchLotteryBoxNameMap()
      ]);
      setNotionNameMap(nMap);
      const mergedNameMap = mergeNameMaps(nMap, langMap, killerMap);
      setNameMap(mergedNameMap);
      setBoxNameMap(bMap);

      setStage('构建 Wiki 数据');
      setPercent(90);
      setNotionMap(wikiMap);

      rebuild(wikiMap, uploadedMap, mergedNameMap, bMap);
      setPercent(100);
    } catch (err) {
      console.error(err);
      messageApi.error('获取 Lottery 数据失败');
    } finally {
      setStage('完成');
      setLoading(false);
    }
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || '{}'));
        const parsed = parseLocalLotteryConfig(json);
        setUploadedMap((prev) => {
          const newMap = { ...prev, ...parsed };
          if (Object.keys(notionMap).length) {
            rebuild(notionMap, newMap);
          }
          return newMap;
        });
        messageApi.success('JSON 上传成功');
      } catch (err) {
        messageApi.error('JSON 解析失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleLangUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || '{}'));
        const parsed = parseLanguageConfig(json);
        setLangMap((prev) => {
          const newMap = { ...prev, ...parsed };
          const merged = mergeNameMaps(notionNameMap, newMap, killerMap);
          setNameMap(merged);
          if (Object.keys(notionMap).length) {
            rebuild(notionMap, uploadedMap, merged, boxNameMap);
          }
          return newMap;
        });
        messageApi.success('语言配置 JSON 上传成功');
      } catch (err) {
        messageApi.error('语言配置解析失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleKillerUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result || '{}'));
        const parsed = parseKillerMerchandise(json);
        setKillerMap((prev) => {
          const newMap = { ...prev, ...parsed };
          const merged = mergeNameMaps(notionNameMap, langMap, newMap);
          setNameMap(merged);
          if (Object.keys(notionMap).length) {
            rebuild(notionMap, uploadedMap, merged, boxNameMap);
          }
          return newMap;
        });
        messageApi.success('密室杀手商品 JSON 上传成功');
      } catch (err) {
        messageApi.error('密室杀手商品解析失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

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
    const md = markdowns[name];
    const sum = probabilitySums[name];
    return {
      key: name,
      label: name,
      extra: (
        <Space>
          {sum !== undefined && (
            <Tag color={Math.abs(sum - 100) < 0.01 ? 'green' : 'red'}>{sum.toFixed(3)}%</Tag>
          )}
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
          <Button
            size="small"
            icon={<FileMarkdownOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              if (md) {
                navigator.clipboard.writeText(md);
                messageApi.success('Markdown 已复制');
              } else {
                messageApi.error('Markdown 数据缺失');
              }
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
      <Space style={{ marginBottom: 16 }}>
        <Upload beforeUpload={handleUpload} showUploadList={false} accept=".json" multiple>
          <Button icon={<UploadOutlined />}>上传 JSON</Button>
        </Upload>
        <Upload beforeUpload={handleLangUpload} showUploadList={false} accept=".json" multiple>
          <Button icon={<UploadOutlined />}>上传语言配置</Button>
        </Upload>
        <Upload beforeUpload={handleKillerUpload} showUploadList={false} accept=".json" multiple>
          <Button icon={<UploadOutlined />}>上传密室杀手商品</Button>
        </Upload>
        <Button icon={<PlayCircleOutlined />} onClick={load}>
          开始
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => {
            if (Object.keys(csvs).length) {
              downloadCSVAsZip(csvs, 'lottery_csv');
              messageApi.success('已下载全部 CSV');
            } else {
              messageApi.error('CSV 数据缺失');
            }
          }}
        >
          下载全部 CSV
        </Button>
        <Button
          icon={<FileMarkdownOutlined />}
          onClick={() => {
            const combined = Object.keys(tables)
              .map((name) => markdowns[name])
              .filter(Boolean)
              .join('\n\n');
            if (combined) {
              navigator.clipboard.writeText(combined);
              messageApi.success('已复制全部 Markdown');
            } else {
              messageApi.error('Markdown 数据缺失');
            }
          }}
        >
          复制全部 Markdown
        </Button>
      </Space>
      <Collapse accordion items={items} />
    </>
  );
};

export default LotteryWikiTab;

