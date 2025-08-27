import React, { useState } from 'react';
import { Collapse, Button, Typography, message, Space, Progress, Tag, Upload, Dropdown, Modal, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { CopyOutlined, UploadOutlined, PlayCircleOutlined, ExportOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { fetchNotionAllPages, getNotionToken } from '../notion/notionClient';
import { flatProperty, parseCheckbox, parseRelation } from '../services/commonFormat';
import { formatLottery, WikiResult } from '../services/lottery/lotteryService';
import { buildWikiTables, buildWikiCSVs, buildMarkdownTables } from '../services/lottery/wikiFormatter';
import { NOTION_DATABASE_LOTTERY } from '../services/lottery/lotteryNotionQueries';
import { fetchCommodityNameMap } from '../services/commodity/commodityNameService';
import { fetchLotteryBoxNameMap } from '../services/lottery/lotteryNameService';
import { parseLanguageConfig, parseKillerMerchandise } from '../services/lottery/extraNameParser';
import { downloadCSV, downloadCSVAsZip, downloadMarkdown } from '../utils/download';
import { parseLocalLotteryConfig } from '../services/lottery/configParser';
import wikiDoc from '../../LotteryWikiTab_工作原理.md?raw';

const { Paragraph, Title, Text } = Typography;

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

const stages = ['初始化','检查 Notion Token','获取 Lottery 页面','解析 Lottery 数据','获取名称映射','构建 Wiki 数据','完成'];

const renderMarkdown = (md: string) => {
  const lines = md.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let idx = 0;
  if (lines[idx]?.startsWith('# ')) {
    elements.push(<Title level={4} key="title">{lines[idx].replace(/^# /, '')}</Title>);
    idx++;
  }
  if (lines[idx]?.startsWith('>')) {
    elements.push(<Text type="secondary" key="time">{lines[idx].replace(/^>\s*/, '')}</Text>);
    idx++;
  }
  if (lines[idx] === '') idx++;
  if (lines[idx]?.startsWith('抽取')) {
    elements.push(<Paragraph key="desc">{lines[idx]}</Paragraph>);
    idx += 2; // skip description and blank line
  }
  if (lines[idx]?.startsWith('|')) {
    const header = lines[idx].split('|').slice(1, -1).map(s => s.trim());
    idx += 2; // skip header and separator
    const rows: string[][] = [];
    for (; idx < lines.length; idx++) {
      const row = lines[idx];
      if (!row.trim()) continue;
      const cols = row.split('|').slice(1, -1).map(s => s.trim());
      rows.push(cols);
    }
    elements.push(
      <table key="table" style={{ borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} style={{ border: '1px solid #ddd', padding: '4px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ border: '1px solid #ddd', padding: '4px' }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return <>{elements}</>;
};

const LotteryWikiPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [csvs, setCsvs] = useState<Record<string, string>>({});
  const [markdowns, setMarkdowns] = useState<Record<string, string>>({});
  const [probabilitySums, setProbabilitySums] = useState<Record<string, number>>({});
  const [messageApi, contextHolder] = message.useMessage();
  const [stageIndex, setStageIndex] = useState(0);
  const percent = Math.round((stageIndex / (stages.length - 1)) * 100);
  const currentStage = stages[stageIndex];
  const [infoOpen, setInfoOpen] = useState(false);
  const [notionMap, setNotionMap] = useState<Record<string, WikiResult>>({});
  const [uploadedMap, setUploadedMap] = useState<Record<string, WikiResult>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, size: number}>>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [notionNameMap, setNotionNameMap] = useState<Record<string, string>>({});
  const [boxNameMap, setBoxNameMap] = useState<Record<string, string>>({});
  const [langMap, setLangMap] = useState<Record<string, string>>({});
  const [langFile, setLangFile] = useState<{name: string, size: number} | null>(null);
  const [killerMap, setKillerMap] = useState<Record<string, string>>({});
  const [killerFile, setKillerFile] = useState<{name: string, size: number} | null>(null);

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
      setStageIndex(1);
      const token = getNotionToken();
      if (!token) {
        messageApi.error('尚未设置 Notion Token');
        return;
      }
      setStageIndex(2);
      const pages = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY, {});
      setStageIndex(3);
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

      setStageIndex(4);
      const [nMap, bMap] = await Promise.all([
        fetchCommodityNameMap(),
        fetchLotteryBoxNameMap()
      ]);
      setNotionNameMap(nMap);
      const mergedNameMap = mergeNameMaps(nMap, langMap, killerMap);
      setNameMap(mergedNameMap);
      setBoxNameMap(bMap);

      setStageIndex(5);
      setNotionMap(wikiMap);

      rebuild(wikiMap, uploadedMap, mergedNameMap, bMap);
      setStageIndex(6);
    } catch (err) {
      console.error(err);
      messageApi.error('获取 Lottery 数据失败');
    } finally {
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
        
        // 添加文件到列表
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          size: file.size
        }]);
        
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
        // 替换而不是合并
        setLangMap(parsed);
        setLangFile({
          name: file.name,
          size: file.size
        });
        const merged = mergeNameMaps(notionNameMap, parsed, killerMap);
        setNameMap(merged);
        if (Object.keys(notionMap).length) {
          rebuild(notionMap, uploadedMap, merged, boxNameMap);
        }
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
        // 替换而不是合并
        setKillerMap(parsed);
        setKillerFile({
          name: file.name,
          size: file.size
        });
        const merged = mergeNameMaps(notionNameMap, langMap, parsed);
        setNameMap(merged);
        if (Object.keys(notionMap).length) {
          rebuild(notionMap, uploadedMap, merged, boxNameMap);
        }
        messageApi.success('密室杀手商品 JSON 上传成功');
      } catch (err) {
        messageApi.error('密室杀手商品解析失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleExportAll: MenuProps['onClick'] = ({ key }) => {
    if (key === 'csv') {
      if (Object.keys(csvs).length) {
        downloadCSVAsZip(csvs, 'lottery_csv');
        messageApi.success('已下载全部 CSV');
      } else {
        messageApi.error('CSV 数据缺失');
      }
    } else if (key === 'markdown-copy') {
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
    } else if (key === 'markdown-download') {
      const combined = Object.keys(tables)
        .map((name) => markdowns[name])
        .filter(Boolean)
        .join('\n\n');
      if (combined) {
        downloadMarkdown(combined, 'lottery_markdown');
        messageApi.success('已下载全部 Markdown');
      } else {
        messageApi.error('Markdown 数据缺失');
      }
    }
  };

  const exportAllItems: MenuProps['items'] = [
    { key: 'csv', label: '下载全部 CSV' },
    { key: 'markdown-copy', label: '复制全部 Markdown' },
    { key: 'markdown-download', label: '下载全部 Markdown' }
  ];

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
            <Tag color={sum >= 99 && sum <= 101 ? 'green' : 'red'}>{sum.toFixed(3)}%</Tag>
          )}
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: '下载 CSV' },
                { key: 'markdown-copy', label: '复制 Markdown' },
                { key: 'markdown-download', label: '下载 Markdown' }
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'csv') {
                  if (csv) {
                    downloadCSV(csv, name);
                    messageApi.success('已下载');
                  } else {
                    messageApi.error('CSV 数据缺失');
                  }
                } else if (key === 'markdown-copy') {
                  if (md) {
                    navigator.clipboard.writeText(md);
                    messageApi.success('Markdown 已复制');
                  } else {
                    messageApi.error('Markdown 数据缺失');
                  }
                } else if (key === 'markdown-download') {
                  if (md) {
                    downloadMarkdown(md, name);
                    messageApi.success('Markdown 已下载');
                  } else {
                    messageApi.error('Markdown 数据缺失');
                  }
                }
              }
            }}
          >
            <Button size="small" icon={<ExportOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
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
        <div>{renderMarkdown(md || '')}</div>
      ),
    };
  });

  return (
    <div className="responsive-padding">
      {contextHolder}
      <Modal
        open={infoOpen}
        onCancel={() => setInfoOpen(false)}
        footer={null}
        title="LotteryWikiTab 工作原理"
        width={800}
      >
        <div style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto', lineHeight: 1.7 }}>
          {wikiDoc}
        </div>
      </Modal>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 24px' }}>
        <Title style={{ margin: 0, flex: 1 }}>概率表导出</Title>
        <InfoCircleOutlined
          style={{ fontSize: 20, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => setInfoOpen(true)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
          <Progress
            percent={percent}
            status={stageIndex === stages.length - 1 ? 'success' : 'active'}
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
          />
          <div style={{ marginTop: 16 }}>{currentStage}</div>
        </div>
      ) : (
        <>
          <Space direction="vertical" size="middle" style={{ marginBottom: 16, width: '100%' }}>
            <Space wrap size="small">
              <Space size={4} align="center">
                <Upload beforeUpload={handleUpload} showUploadList={false} accept=".json" multiple>
                  <Button
                    icon={uploadedFiles.length > 0 ? <CheckCircleOutlined /> : <UploadOutlined />}
                    type={uploadedFiles.length > 0 ? 'primary' : 'default'}
                  >
                    {uploadedFiles.length > 0 ? `商品配置 (${uploadedFiles.length})` : '上传JSON抽奖箱配置'}
                  </Button>
                </Upload>
                <Tooltip title="项目 CodeFunCore\\CodeFunCore\\src\\main\\resources\\net\\easecation\\codefuncore\\lottery\\exchange 目录下的 JSON 文件">
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>

              <Space size={4} align="center">
                <Upload beforeUpload={handleLangUpload} showUploadList={false} accept=".json">
                  <Button
                    icon={langFile ? <CheckCircleOutlined /> : <UploadOutlined />}
                    type={langFile ? 'primary' : 'default'}
                  >
                    {langFile ? langFile.name : '上传语言配置'}
                  </Button>
                </Upload>
                <Tooltip title="cfgLanguage 数据库导出的 JSON">
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>

              <Space size={4} align="center">
                <Upload beforeUpload={handleKillerUpload} showUploadList={false} accept=".json">
                  <Button
                    icon={killerFile ? <CheckCircleOutlined /> : <UploadOutlined />}
                    type={killerFile ? 'primary' : 'default'}
                  >
                    {killerFile ? killerFile.name : '上传密室杀手商品配置'}
                  </Button>
                </Upload>
                <Tooltip title="CodeFunCore\\CodeFunCore\\src\\main\\resources\\net\\easecation\\codefuncore\\unlockupgrade\\mm\\merchandise.json">
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>

              <Button type="primary" icon={<PlayCircleOutlined />} onClick={load}>
                开始
              </Button>
              <Dropdown menu={{ items: exportAllItems, onClick: handleExportAll }}>
                <Button icon={<ExportOutlined />}>导出</Button>
              </Dropdown>
            </Space>

            {uploadedFiles.length > 0 && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                已上传的抽奖箱配置文件：
                {uploadedFiles.map((file, index) => (
                  <span key={index} style={{ marginRight: '8px' }}>
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </Space>
          {items.length > 0 && <Collapse accordion items={items} />}
        </>
      )}
    </div>
  );
};

export default LotteryWikiPage;

