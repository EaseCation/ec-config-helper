import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Flex, Layout, Menu, Space, Typography, theme, BackTop, Spin } from "antd";
import { Content } from "antd/es/layout/layout";
import LotteryTree from "./LotteryTree";
import Sider from "antd/es/layout/Sider";
import { useLotteryData } from "./UseLotteryData";
import {
  CloudDownloadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UpOutlined
} from "@ant-design/icons";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";
import { NOTION_DATABASE_LOTTERY } from "../../services/lottery/lotteryNotionQueries";

const { Text } = Typography;
const COMMODITY_PATH = "CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion/";

const LotteryContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, messageApi, readFile, writeFile } =
    useContext(WorkshopPageContext);

  const [currentTypes, setCurrentTypes] = useState<string[]>([]);
  const [currentType, setCurrentType] = useState<string | null>(null);
  const [missingTypes, setMissingTypes] = useState<string[]>([]); // 远端新增数据
  const [localJson, setLocalJson] = useState<{ [key: string]: any } | null>(null);
  const [loadingLocalJson, setLoadingLocalJson] = useState(false);
  const [localFileExists, setLocalFileExists] = useState(false);
  const [remoteJsonMap, setRemoteJsonMap] = useState<{ [key: string]: any }>({});
  const [remoteJsonLoading, setRemoteJsonLoading] = useState(true); // 初始化加载状态
  const [saving, setSaving] = useState(false);

  // 🔹 获取 notion.json 本地文件内容并更新 currentTypes
  const loadLocalCurrent = async () => {
    try {
      const hasPermission = await ensurePermission("read");
      if (!hasPermission || !dirHandle) return;
      const text = await readFile(`${COMMODITY_PATH}notion.json`);
      const format: { types: string[] } = JSON.parse(text);
      
      setCurrentTypes(format.types);
      setCurrentType(format.types[0]); // 默认选中第一个
    } catch (error: any) {
      messageApi.error("读取 notion.json 文件出错: " + error?.message);
    }
  };

  // 获取远端 Lottery 数据
  const { fileArray: remoteJsonMapData, refetch } = useLotteryData(NOTION_DATABASE_LOTTERY);

  // 监听远端数据加载，并更新数据
  useEffect(() => {
    if (remoteJsonMapData && Object.keys(remoteJsonMapData).length > 0) {
      setRemoteJsonMap(remoteJsonMapData);
      setRemoteJsonLoading(false);
      // 计算远端数据中 `currentTypes` 没有的 key
      const missingKeys = Object.keys(remoteJsonMapData).filter((key) => !currentTypes.includes(key));
      setMissingTypes(missingKeys);
    }
  }, [remoteJsonMapData, currentTypes]);

  // 监听 `dirHandle`，加载 notion.json 并初始化 `currentTypes`
  useEffect(() => {
    if (dirHandle) {
      loadLocalCurrent();
    }
  }, [dirHandle]);

  // 加载本地 JSON 文件
  const loadLocalFile = async () => {
    if (!currentType) return;
    setLoadingLocalJson(true);
    try {
      const hasPermission = await ensurePermission("read");
      if (!hasPermission || !dirHandle) return;
      const text = await readFile(`${COMMODITY_PATH}${currentType}.json`);
      setLocalJson(JSON.parse(text));
      setLocalFileExists(true);
    } catch (error: any) {
      if (error?.message === "NotFoundError") {
        setLocalFileExists(false);
        setLocalJson(null);
      } else {
        messageApi.error("读取本地文件出错: " + error?.message);
      }
    } finally {
      setLoadingLocalJson(false);
    }
  };

  // 监听 `currentType` 变化，自动加载本地文件
  useEffect(() => {
    if (dirHandle && currentType) {
      loadLocalFile();
    }
  }, [dirHandle, currentType]);

  // 远端数据加载
  const handleLoadRemoteJson = async () => {
    if (!currentType) return;
    setRemoteJsonLoading(true);
    try {
      await refetch();
      messageApi.success(`${currentType} 远端数据加载完成`);
    } catch (error: any) {
      messageApi.error("获取远端数据失败: " + error.message);
    } finally {
      setRemoteJsonLoading(false);
    }
  };

  // 同步远端 JSON 到本地
  const handleSyncRemoteJson = async () => {
    if (!dirHandle || !currentType || !remoteJsonMap[currentType]) {
      messageApi.error("请先加载 Notion 数据");
      return;
    }
    setSaving(true);

    try {
      // ✅ 将 JSON 数据写入到 `COMMODITY_PATH/${currentType}.json`
      await writeFile(
        `${COMMODITY_PATH}${currentType}.json`,
        JSON.stringify(remoteJsonMap[currentType], null, 4)
      );

      setLocalJson(remoteJsonMap[currentType]); // 更新本地 JSON 数据
      messageApi.success(`"${currentType}" 同步成功！`);

      // ✅ 检查 currentType 是否已经在 currentTypes 中
      if (!currentTypes.includes(currentType)) {
        const updatedTypes = [...currentTypes, currentType].sort(); // 按字母排序
        setCurrentTypes(updatedTypes); // 更新 UI

        // ✅ 更新 `notion.json`
        const notionFilePath = `${COMMODITY_PATH}notion.json`;
        const updatedNotionData = JSON.stringify({ types: updatedTypes }, null, 4);
        await writeFile(notionFilePath, updatedNotionData);
        messageApi.success(`"${currentType}" 已添加到 notion.json`);
      }
    } catch (error: any) {
      messageApi.error("保存文件出错: " + error?.message);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 生成菜单 items（本地的 currentTypes + 远端缺失的 missingTypes）
  const menuItems = [
    // ✅ 远端新增数据（missingTypes）
    ...missingTypes.map((type) => ({
      key: type,
      label: (
        <span>
          <span
            style={{
              color: '#66bb6a', // softer green color (light green)
              fontSize: '12px', // smaller text
              fontWeight: 'lighter', // thin font
              fontFamily: 'Arial, sans-serif', // rounded font
              border: '1px solid #66bb6a', // softer green border
              borderRadius: '5px', // rounded corners
              padding: '0 4px', // tight padding to fit the border close to the text
              marginRight: '4px', // optional: space between "新增" and type text
            }}
          >
            新增
          </span>
          {type} {/* 后面的 type 保持默认样式 */}
        </span>
      ),
    })),
  
    // ✅ 本地已存在的数据（currentTypes）
    ...currentTypes.map((type) => ({
      key: type,
      label: type, // 默认样式
    })),
  ];
  
  
  
  return (
    <Layout
    style={{
      padding: "15px 0",
      background: colorBgContainer,
      borderRadius: borderRadiusLG,
    }}
  >
    <Sider style={{ background: colorBgContainer }} width={400}>
      <Menu
        mode="inline"
        items={menuItems}
        selectedKeys={currentType ? [currentType] : []}
        onClick={(e) => setCurrentType(e.key)}
        style={{ border: "none" }}
      />
    </Sider>
      <Content style={{ padding: "0 24px", minHeight: 280 }}>
        <Flex gap={16}>
          {/* 本地 JSON 数据 */}
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
              <LotteryTree checkable={false} fullJson={localJson} />
            ) : (
              <Text type="warning">本地 JSON 文件未找到</Text>
            )}
          </Card>

          {/* Notion JSON 数据 */}
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                Notion 数据
                <Button
                  type="text"
                  icon={
                    remoteJsonLoading ? (
                      <LoadingOutlined style={{ fontSize: 16 }} />
                    ) : (
                      <ReloadOutlined style={{ fontSize: 14, opacity: 0.65 }} />
                    )
                  }
                  onClick={handleLoadRemoteJson}
                  disabled={remoteJsonLoading}
                />
              </Space>
            }
            loading={remoteJsonLoading}
            extra={
              remoteJsonMap[currentType || ""] && (
                <Button icon={<SaveOutlined />} type="primary" loading={saving} onClick={handleSyncRemoteJson}>
                  同步到本地
                </Button>
              )
            }
          >
            {remoteJsonMap[currentType || ""] ? (
              <LotteryTree checkable={false} fullJson={remoteJsonMap[currentType || ""]} />
            ) : (
              <Flex style={{ padding: "32px 0", justifyContent: "center", alignItems: "center" }}>
                <Button icon={<CloudDownloadOutlined />} onClick={handleLoadRemoteJson}>
                  从 Notion 加载
                </Button>
              </Flex>
            )}
          </Card>
        </Flex>

        <BackTop visibilityHeight={100}>
          <Button shape="circle" icon={<UpOutlined />} style={{ backgroundColor: "#1890ff", color: "#fff", border: "none" }} />
        </BackTop>
      </Content>
    </Layout>
  );
};

export default LotteryContentWithDirHandle;
