import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Flex, Layout, Tag, Space, Typography, theme, BackTop, message } from "antd";
import { Content } from "antd/es/layout/layout";
import CommodityTree from "./CommodityTree";
import { formatCommodity } from '../../services/commodity/commodityService';
import { NOTION_DATABASE_COMMODITY } from '../../services/commodity/commodityNotionQueries';
import {
  CloudDownloadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UpOutlined
} from "@ant-design/icons";
import { DirectoryContext } from "../../context/DirectoryContext";
import {
  DifferentParts,
  compareCommodityData,
  CommodityData,
} from "../../services/commodity/compareCommodityData";

const { Text } = Typography;
const COMMODITY_PATH =
  "CodeFunCore/src/main/resources/net/easecation/codefuncore/commodity/";

const CommodityContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, readFile, writeFile } =
    useContext(DirectoryContext);

  const [localJson, setLocalJson] = useState<CommodityData>();
  const [loadingLocalJson, setLoadingLocalJson] = useState(false);
  const [localFileExists, setLocalFileExists] = useState(false);
  const [remoteJson, setRemoteJson] = useState<CommodityData>();
  const [differentParts, setDifferentParts] = useState<DifferentParts>();
  const [loadingRemoteJson, setLoadingRemoteJson] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 1. 自动获取 Notion 数据（页面加载时）
  useEffect(() => {
    fetchRemoteCommodityData();
    loadLocalFile();
  }, []);

  // 🔹 2. 获取 Notion Commodity 数据
  const fetchRemoteCommodityData = async () => {
    setLoadingRemoteJson(true);
    try {
      const data = await formatCommodity(NOTION_DATABASE_COMMODITY);
      setRemoteJson(data);
      message.success("成功获取 Notion 数据");
    } catch (error: any) {
      message.error("获取 Notion 数据失败: " + error.message);
    } finally {
      setLoadingRemoteJson(false);
    }
  };

  const compareDataSafely = () => {
    if (localJson && remoteJson) {
      // 当 localJson 和 remoteJson 都不为 null 时才执行对比
      const difference = compareCommodityData(localJson, remoteJson);
      // 更新差异状态，进行高亮显示
      setDifferentParts(difference);
    } else {
      message.error("数据未加载完全，无法进行对比");
    }
  };

  // 调用时：
  useEffect(() => {
    if (localJson && remoteJson) {
      compareDataSafely();
    }
  }, [localJson, remoteJson]);

  // 🔹 3. 加载本地 JSON 文件
  const loadLocalFile = async () => {
    setLoadingLocalJson(true);
    try {
      const hasPermission = await ensurePermission("read");
      if (!hasPermission) return;
      if (!dirHandle) return;
      const text = await readFile(`${COMMODITY_PATH}commodity.json`);
      setLocalJson(JSON.parse(text));
      setLocalFileExists(true);
    } catch (error: any) {
      if (error?.message === "NotFoundError") {
        setLocalFileExists(false);
      } else {
        message.error("读取本地文件出错: " + error?.message);
      }
    } finally {
      setLoadingLocalJson(false);
    }
  };

  // 🔹 4. 将 Notion 数据同步到本地 JSON 文件
  const handleSyncRemoteJson = async () => {
    if (!dirHandle) {
      message.error("请选择你的代码中的 commodity 文件夹");
      return;
    }
    if (!remoteJson) {
      message.error("请先加载 Notion 数据");
      return;
    }

    setSaving(true);
    try {
      await writeFile(
        `${COMMODITY_PATH}commodity.json`,
        JSON.stringify(remoteJson, null, 4)
      );
      setLocalJson(remoteJson);
      message.success("同步成功！");
    } catch (error: any) {
      message.error("保存文件出错: " + error?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      style={{
        padding: "15px 0",
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      <Content style={{ padding: "0 24px", minHeight: 280 }}>
        <Flex gap={16}>
          {/* 本地 JSON 数据
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                本地 JSON
                <Button
                  type={"text"}
                  icon={<ReloadOutlined />}
                  onClick={loadLocalFile}
                  disabled={loadingLocalJson}
                />
              </Space>
            }
            loading={loadingLocalJson}
          >
            {localFileExists && localJson ? (
              <CommodityTree fullJson={localJson} />
            ) : (
              <Text type="warning">本地 JSON 文件未找到</Text>
            )}
          </Card> */}
          {/* Notion JSON 数据 */}
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                Notion 数据
                <Button
                  type="text"
                  icon={
                    loadingRemoteJson ? (
                      <LoadingOutlined style={{ fontSize: 16 }} />
                    ) : (
                      <ReloadOutlined style={{ fontSize: 14, opacity: 0.65 }} />
                    )
                  }
                  onClick={fetchRemoteCommodityData}
                  disabled={loadingRemoteJson}
                />
                <Tag color="green">新增</Tag>
                <Tag color="red">移除</Tag>
                <Tag color="blue">修改</Tag>
              </Space>
            }
            loading={loadingRemoteJson}
            extra={
              remoteJson && (
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  loading={saving}
                  onClick={handleSyncRemoteJson}
                >
                  同步到本地
                </Button>
              )
            }
          >
            {remoteJson ? (
              <CommodityTree fullJson={remoteJson} differentParts={differentParts} />
            ) : (
              <Flex
                style={{
                  padding: "32px 0",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={fetchRemoteCommodityData}
                >
                  从 Notion 加载
                </Button>
              </Flex>
            )}
          </Card>
        </Flex>

        {/* 回到顶部按钮 */}
        <BackTop visibilityHeight={100}>
          <Button
            shape="circle"
            icon={<UpOutlined />}
            style={{
              backgroundColor: "#1890ff",
              color: "#fff",
              border: "none",
            }}
          />
        </BackTop>
      </Content>
    </Layout>
  );
};

export default CommodityContentWithDirHandle;
