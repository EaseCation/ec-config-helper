import React, { useEffect, useState, useContext, useMemo } from "react";
import { Button, Card, Flex, Layout, Menu, Space, Typography, theme, BackTop, Spin } from "antd";
import { Content } from "antd/es/layout/layout";
import {LotteryTree} from "./LotteryTree";
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
import { NOTION_DATABASE_LOTTERY, LotteryConfig, areLotteryConfigsEqual } from "../../services/lottery/lotteryNotionQueries";
const { Text } = Typography;
const COMMODITY_PATH = "CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion/";

const LotteryContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, messageApi, readFile, writeFile } =
    useContext(WorkshopPageContext);

  const [currentTypes, setCurrentTypes] = useState<string[]>([]); // Local types
  const [currentType, setCurrentType] = useState<string | null>(null); // Current selected type
  const [missingTypes, setMissingTypes] = useState<string[]>([]); // Missing types from remote
  const [modifiedKeys, setModifiedKeys] = useState<string[]>([]); // Local types
  const [localJson, setLocalJson] = useState<{ [key: string]: any }>({}); // Local JSON data
  const [loadingLocalJson, setLoadingLocalJson] = useState(false); // Loading state for local JSON
  const [localFileExists, setLocalFileExists] = useState(false); // Check if local file exists
  const [remoteJsonMap, setRemoteJsonMap] = useState<{ [key: string]: any }>({}); // Remote JSON data
  const [remoteJsonLoading, setRemoteJsonLoading] = useState(true); // Loading state for remote JSON
  const [saving, setSaving] = useState(false); // Saving state for sync

  // 🔹 Compare the values of keys in both local and remote JSON
  const compareJsonData = (localJson: { [key: string]: any }, remoteJsonMap: { [key: string]: any }) => {
    const modifiedKeys: string[] = [];
    for (const key in localJson) {
      if (localJson.hasOwnProperty(key) && remoteJsonMap.hasOwnProperty(key)) {
        // If local and remote JSON data for the same key is different
        if (JSON.stringify(localJson[key]) !== JSON.stringify(remoteJsonMap[key])) {
          modifiedKeys.push(key);
        }
      }
    }
    return modifiedKeys;
  };

  // 🔹 Generate the menu items with missing and modified types
  const generateMenuItems = () => {
    return [
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
            {type}
          </span>
        ),
      })),

      // // ✅ 远端有但本地有差异的 key（modified keys）
      ...modifiedKeys.map((key) => ({
        key,
        label: (
          <span>
            <span
              style={{
                color: 'yellow', // Yellow for modified items
                fontSize: '12px', // Smaller text size
                fontWeight: 'lighter', // Thin font
                fontFamily: 'Arial, sans-serif', // Rounded font
                border: '1px solid yellow', // Yellow border
                borderRadius: '5px', // Rounded corners
                padding: '0 4px', // Tight padding to fit the border close to the text
                marginRight: '4px', // Optional: space between "修改" and key text
              }}
            >
              修改
            </span>
            {key} {/* Key with modification */}
          </span>
        ),
      })),

      // ✅ 本地已存在的数据（currentTypes）
      ...currentTypes.filter(type => !modifiedKeys.includes(type)).map((type) => ({
        key: type,
        label: type, // 默认样式
      })),
    ];
  };

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

  // 更新侧边栏数据
  const updateItems = () => {
    let modifieds: string[] = [];
    // 校验 remoteJsonMap 和 localJson 中的每个 LotteryConfig 是否相同
    Object.keys(remoteJsonMap).forEach((key) => {
      if (remoteJsonMap[key] && localJson[key]) {
        
        // 假设 remoteJsonMap[key] 和 localJson[key] 都是 LotteryConfig 类型
        let temp = Object.keys(remoteJsonMap[key])[0];
        const remotConfig: LotteryConfig = remoteJsonMap[key][temp];
        const localConfig: LotteryConfig = localJson[key][temp];

        // 校验两个 LotteryConfig 是否相同
        const isEqual = areLotteryConfigsEqual(remotConfig, localConfig);
        
        if (!isEqual) {
          // console.log(`${key} 的配置有差异`);
          modifieds.push(key);
        } else {
          // console.log(`${key} 的配置无差异`);
        }
      }
    });
    setModifiedKeys(modifieds);
  }

  // 监听远端数据加载，并更新数据
  useEffect(() => {
    if (remoteJsonMapData && Object.keys(remoteJsonMapData).length > 0) {
      setRemoteJsonMap(remoteJsonMapData);
      setRemoteJsonLoading(false);
      // 计算远端数据中 `currentTypes` 没有的 key
      const missingKeys = Object.keys(remoteJsonMapData).filter((key) => !currentTypes.includes(key));
      setMissingTypes(missingKeys);
      updateItems();
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
    if (currentTypes.length === 0) return;  // 如果没有类型，直接返回
    setLoadingLocalJson(true);

    const allLocalJsonData: { [key: string]: any } = {}; // 用来存储所有加载的 JSON 数据
    try {
      const hasPermission = await ensurePermission("read");
      if (!hasPermission || !dirHandle) return;

      // 遍历 currentTypes 中的每个类型，尝试读取对应的文件
      for (const type of currentTypes) {
        try {
          const text = await readFile(`${COMMODITY_PATH}${type}.json`);
          allLocalJsonData[type] = JSON.parse(text);  // 存储读取的 JSON 数据
        } catch (error: any) {
          if (error?.message === "NotFoundError") {
            allLocalJsonData[type] = null;  // 如果文件不存在，存储 null
          } else {
            messageApi.error(`读取 ${type}.json 文件出错: ${error?.message}`);  // 错误提示
          }
        }
      }
      setLocalJson(allLocalJsonData);  // 更新本地 JSON 数据
      setLocalFileExists(true);  // 文件存在标记
      updateItems();//更新侧边栏
    } catch (error: any) {
      messageApi.error("读取本地文件出错: " + error?.message);
    } finally {
      setLoadingLocalJson(false);
    }
  };

  // 监听 `currentType` 变化，自动加载本地文件
  useEffect(() => {
    if (dirHandle && currentType) {
      loadLocalFile();
    }
  }, [dirHandle, currentType, currentTypes]);

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
      messageApi.success(`"${currentType}" 同步成功！`);

      // ✅ 检查 currentType 是否已经在 currentTypes 中
      if (!currentTypes.includes(currentType)) {
         // 更新侧边栏
        let updatedTypes = missingTypes.filter(type => type !== currentType);
        setMissingTypes(updatedTypes);
        updatedTypes = [...currentTypes, currentType].sort(); // 按字母排序
        setCurrentTypes(updatedTypes); // 更新 UI

        // ✅ 更新 `notion.json`
        const notionFilePath = `${COMMODITY_PATH}notion.json`;
        const updatedNotionData = JSON.stringify({ types: updatedTypes }, null, 4);
        await writeFile(notionFilePath, updatedNotionData);
        setCurrentType(currentType);
        messageApi.success(`"${currentType}" 已添加到 notion.json`);
      }
    } catch (error: any) {
      messageApi.error("保存文件出错: " + error?.message);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = useMemo(() => generateMenuItems(), [modifiedKeys, missingTypes, currentTypes, localJson]);
  
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
            {localFileExists && currentType && localJson[currentType] ? (
              <LotteryTree checkable={false} fullJson={localJson[currentType]} />
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
