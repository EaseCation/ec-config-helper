import React, { useEffect, useState, useContext, useMemo } from "react";
import { Button, Card, Flex, Layout, Menu, Space, Tag, theme, BackTop, Checkbox, message } from "antd";
import { Content } from "antd/es/layout/layout";
import {LotteryJsonViewer} from "./LotteryTree";
import Sider from "antd/es/layout/Sider";
import { useLotteryData } from "./UseLotteryData";
import {
  CloudDownloadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UpOutlined
} from "@ant-design/icons";
import { DirectoryContext } from "../../context/DirectoryContext";
import {
  NOTION_DATABASE_LOTTERY,
  LotteryConfig,
  areLotteryConfigsEqual,
  DifferentParts,
} from "../../services/lottery/lotteryNotionQueries";
const COMMODITY_PATH = "CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion/";

const LotteryContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, readFile, writeFile } =
    useContext(DirectoryContext);

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);// 用来记录哪些 key 被勾选
  const [currentTypes, setCurrentTypes] = useState<string[]>([]); // Local types
  const [currentType, setCurrentType] = useState<string | null>(null); // Current selected type
  const [missingTypes, setMissingTypes] = useState<string[]>([]); // Missing types from remote
  const [modifiedKeys, setModifiedKeys] = useState<string[]>([]); // Local types
  const [differentParts, setDifferentParts] = useState<{ [key: string]: DifferentParts }>({}); // Local JSON data
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
  // 当复选框状态改变时，更新 checkedKeys
  const handleCheckboxChange = (key: string, checked: boolean) => {
    setCheckedKeys((prev) => {
      if (checked) {
        // 如果勾选，就把 key 加入数组
        return [...prev, key];
      } else {
        // 如果取消勾选，就从数组移除 key
        return prev.filter((k) => k !== key);
      }
    });
  };

  // 渲染一个带复选框和 tag 的自定义 label
  const renderCheckableLabel = (
    key: string, 
    tagColor: string, 
    tagText: string
  ) => (
    <Space>
      <Checkbox
        checked={checkedKeys.includes(key)}
        onChange={(e) => handleCheckboxChange(key, e.target.checked)}
      >
        <span
          style={{
            color: tagColor,
            fontSize: '12px',
            fontWeight: 'lighter',
            fontFamily: 'Arial, sans-serif',
            border: `1px solid ${tagColor}`,
            borderRadius: '5px',
            padding: '0 4px',
          }}
        >
          {tagText}
        </span>
      </Checkbox>
      <span>{key}</span>
    </Space>
  );

  // 🔹 Generate the menu items with missing and modified types
  const generateMenuItems = () => {
    return [
      // ✅ 远端新增数据（missingTypes）: 带 Checkbox
      ...missingTypes.map((type) => ({
        key: type,
        label: renderCheckableLabel(type, '#66bb6a', '新增'),
      })),

      // ✅ 远端有但本地有差异（modified keys）: 带 Checkbox
      ...modifiedKeys.map((key) => ({
        key,
        label: renderCheckableLabel(key, 'yellow', '修改'),
      })),

      // ✅ 本地已存在的数据（不加复选框）
      ...currentTypes
        .filter(type => !modifiedKeys.includes(type) && !missingTypes.includes(type))
        .map((type) => ({
          key: type,
          label: type, // 默认样式，没有 Checkbox
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
      message.error("读取 notion.json 文件出错: " + error?.message);
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
        
        setDifferentParts((prev) => ({
          ...prev,
          [key]: isEqual,
        }));

        if (!isEqual.isEqual && !modifiedKeys.includes(key)) {
          modifieds.push(key);
        } else {
          // console.log(`${key} 的配置无差异`);
        }
      }
    });
    if(modifieds.length === 0) return;
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
            message.error(`读取 ${type}.json 文件出错: ${error?.message}`);  // 错误提示
          }
        }
      }
      setLocalJson(allLocalJsonData);  // 更新本地 JSON 数据
      setLocalFileExists(true);  // 文件存在标记
      updateItems();//更新侧边栏
    } catch (error: any) {
      message.error("读取本地文件出错: " + error?.message);
    } finally {
      setLoadingLocalJson(false);
    }
  };

  // 监听 `currentType` 变化，自动加载本地文件
  useEffect(() => {
    if (dirHandle && currentType) {
      loadLocalFile();
    }
  }, [dirHandle, currentType, currentTypes, modifiedKeys]);

  // 远端数据加载
  const handleLoadRemoteJson = async () => {
    if (!currentType) return;
    setRemoteJsonLoading(true);
    try {
      await refetch();
      message.success(`${currentType} 远端数据加载完成`);
    } catch (error: any) {
      message.error("获取远端数据失败: " + error.message);
    } finally {
      setRemoteJsonLoading(false);
    }
  };

  // 同步远端 JSON 到本地（一次性同步所有勾选的 key）
  const handleSyncRemoteJson = async () => {
    // 如果没有勾选任何 key，就使用 currentType 作为默认同步对象
    const keysToSync  = checkedKeys.length > 0 ? checkedKeys : currentType ? [currentType] : [];

    if (!dirHandle || keysToSync.length === 0) {
      message.error("请先选择至少一个要同步的 Key，或加载 Notion 数据");
      return;
    }

    setSaving(true);

    try {
      // 把最新的 currentTypes、missingTypes 做副本，方便批量更新
      let newCurrentTypes = [...currentTypes];
      let newMissingTypes = [...missingTypes];
      let newModifiedKeys = [...modifiedKeys];

      // 逐个 key 同步到本地
      for (const key of keysToSync) {
        // 如果远端数据里不存在这个 key，跳过
        if (!remoteJsonMap[key]) continue;

        // 1. 把远端数据写到本地
        await writeFile(
          `${COMMODITY_PATH}${key}.json`,
          JSON.stringify(remoteJsonMap[key], null, 4)
        );

        // 2. 如果此 key 不在 currentTypes 中，需要插入并更新 notion.json
        if (!newCurrentTypes.includes(key)) {
          newMissingTypes = newMissingTypes.filter((t) => t !== key);
          newCurrentTypes.push(key);
        }
        if (newModifiedKeys.includes(key)) {
          newModifiedKeys = newModifiedKeys.filter((t) => t !== key);
        }
      }


      // 如果我们在循环中新增了 key 到 currentTypes，需要写回 notion.json
      if (newCurrentTypes.length !== currentTypes.length) {
        newCurrentTypes.sort(); // 按字母排序
        const notionFilePath = `${COMMODITY_PATH}notion.json`;
        const updatedNotionData = JSON.stringify({ types: newCurrentTypes }, null, 4);
        await writeFile(notionFilePath, updatedNotionData);

        // 更新本地状态
        setMissingTypes(newMissingTypes);
        setCurrentTypes(newCurrentTypes);
      }
      if (newModifiedKeys.length !== modifiedKeys.length) {
        setModifiedKeys(newModifiedKeys);
      }
      // 如果只同步了一个 key，可以把 currentType 设为它
      setCurrentType(keysToSync[0]);

      setCheckedKeys([]);
      // 提示成功
      message.success(`已同步 ${keysToSync.join(", ")} 到本地！`);
    } catch (error: any) {
      message.error("保存文件出错: " + error?.message);
    } finally {
      setSaving(false);
    }
  };


  const menuItems = useMemo(() => generateMenuItems(), [
    modifiedKeys,
    missingTypes,
    currentTypes,
    localJson,
    checkedKeys
  ]);
  
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
            {localFileExists && currentType && localJson[currentType] ? (
              <LotteryJsonViewer fullJson={localJson[currentType]} differentParts={differentParts[currentType]} />
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
                      remoteJsonLoading ? (
                        <LoadingOutlined style={{ fontSize: 16 }} />
                      ) : (
                        <ReloadOutlined style={{ fontSize: 14, opacity: 0.65 }} />
                      )
                    }
                    onClick={handleLoadRemoteJson}
                    disabled={remoteJsonLoading}
                  />
                  {currentType &&
                    differentParts[currentType]?.addedItems.length > 0 && (
                      <Tag color="green">新增</Tag>
                    )}
                  {currentType &&
                    differentParts[currentType]?.deletedItems.length > 0 && (
                      <Tag color="red">移除</Tag>
                    )}
                </Space>
              }
              loading={remoteJsonLoading}
              extra={
                remoteJsonMap[currentType || ""] && (
                  <Button
                    icon={<SaveOutlined />}
                    type="primary"
                    loading={saving}
                    onClick={handleSyncRemoteJson}
                    disabled={
                      // 当 checkedKeys 没有勾选，且 currentType 既不在 missingTypes 也不在 modifiedKeys 时，禁用按钮
                      checkedKeys.length === 0 &&
                      (!currentType || (!missingTypes.includes(currentType) && !modifiedKeys.includes(currentType)))
                    }
                  >
                    同步到本地
                  </Button>
                )
              }
            >
            { currentType && remoteJsonMap[currentType] ? (
              <LotteryJsonViewer fullJson={remoteJsonMap[currentType]} differentParts={differentParts[currentType]} />
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
