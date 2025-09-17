import React, { useState } from 'react';
import { Button, Checkbox, Space, Typography, Flex, Modal } from 'antd';
import { getNotionToken, fetchNotionAllPages } from '../notion/notionClient';
import { formatWorkshop } from '../services/workshop/workshopService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import useMessage from "antd/es/message/useMessage";
import { NOTION_DATABASE_WORKSHOP, WORKSHOP_TYPES } from "../services/workshop/workshopNotionQueries";
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const LegacyWorkshopPage: React.FC = () => {
  const [checkedTypes, setCheckedTypes] = useState<string[]>(Object.keys(WORKSHOP_TYPES));
  const [loading, setLoading] = useState(false);
  const [messageApi, messageContext] = useMessage();

  const onCheck = (type: string) => {
    setCheckedTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
    );
  };

  const selectAll = () => {
    setCheckedTypes(Object.keys(WORKSHOP_TYPES));
  };

  const deselectAll = () => {
    setCheckedTypes([]);
  };

  const handleGenerate = async () => {
    const token = getNotionToken();
    if (!token) {
      messageApi.error('尚未设置 Notion Token');
      return;
    }
    if (checkedTypes.length === 0) {
      messageApi.warning('请至少选择一种类型');
      return;
    }
    setLoading(true);

    messageApi.open({
      key: 'processing',
      type: 'loading',
      content: '正在处理...',
      duration: 0,
    });

    try {
      const zip = new JSZip();

      for (const typeId of checkedTypes) {
        messageApi.open({
          key: 'processing',
          type: 'loading',
          content: `正在从Notion加载 ${typeId} ...`,
          duration: 0,
        });
        const filterConfig = WORKSHOP_TYPES[typeId];
        // 拉取该类型的所有记录
        const pages = await fetchNotionAllPages(NOTION_DATABASE_WORKSHOP, {
          filter: filterConfig.filter,
          sorts: filterConfig.sorts,
        });
        messageApi.open({
          key: 'processing',
          type: 'loading',
          content: `正在从处理 ${typeId} ...`,
          duration: 0,
        });
        const workshopJson = formatWorkshop(typeId, pages);

        // 将结果添加到 zip 中
        zip.file(`${typeId}.json`, JSON.stringify(workshopJson, null, 4));
      }

      // 生成 zip 并下载
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'workshop.zip');
    } catch (err) {
      messageApi.error('生成失败: ' + (err as Error).message);
      console.error(err);
    } finally {
      setLoading(false);
      messageApi.destroy('processing');
    }
  };

  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="responsive-padding">
      {messageContext}
      <Modal
        title="旧版商品表说明"
        open={infoOpen}
        onOk={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
      >
        <Typography>
          <Paragraph>
            选择需要的商品类型后，从 Notion 旧版商品数据库拉取数据，生成对应的
            JSON 文件，并打包成 zip 提供下载，便于离线导入旧版项目。
          </Paragraph>
        </Typography>
      </Modal>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px' }}>
        <Title style={{ margin: 0, flex: 1 }}>商品表 JSON 生成（旧版）</Title>
        <InfoCircleOutlined
          style={{ fontSize: 20, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => setInfoOpen(true)}
        />
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={selectAll}>全选</Button>
        <Button onClick={deselectAll}>全不选</Button>
      </Space>
      <Flex vertical gap={4}>
        {Object.keys(WORKSHOP_TYPES).map((typeId) => (
          <Checkbox
            key={typeId}
            checked={checkedTypes.includes(typeId)}
            onChange={() => onCheck(typeId)}
          >
            {typeId}
          </Checkbox>
        ))}
      </Flex>
      <Button
        type="primary"
        style={{ marginTop: 16 }}
        onClick={handleGenerate}
        loading={loading}
      >
        生成并下载 JSON
      </Button>
    </div>
  );
};

export default LegacyWorkshopPage;