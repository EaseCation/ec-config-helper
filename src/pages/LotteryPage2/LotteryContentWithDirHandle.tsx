import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Flex, Layout, Menu, Space, Typography, message, theme } from "antd";
import { Content } from "antd/es/layout/layout";
import LotteryTree from "./LotteryTree";
import Sider from "antd/es/layout/Sider";
import { useLotteryData } from "./UseLotteryData";  // 引入自定义 hook
import { CloudDownloadOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";
import { NOTION_DATABASE_LOTTERY,WORKSHOP_TYPES } from "../../services/lottery/lotteryNotionQueries";

const { Text } = Typography;
const COMMODITY_PATH = 'CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion/';

const LotteryContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, messageApi, readFile, writeFile } = useContext(WorkshopPageContext);

  const [currentType, setCurrentType] = useState<string>(WORKSHOP_TYPES[0]);
  const [localJson, setLocalJson] = useState<{ [key: string]: any } | null>(null);
  const [loadingLocalJson, setLoadingLocalJson] = useState(false);
  const [localFileExists, setLocalFileExists] = useState(false);
  const [remoteJsonMap, setRemoteJsonMap] = useState<{ [key: string]: any }>({});
  const [remoteJsonLoadingList, setRemoteJsonLoadingList] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 获取 Lottery 数据
  const { loading: remoteJsonLoading, fileArray: remoteJsonMapData } = useLotteryData(NOTION_DATABASE_LOTTERY);

  // 切换tab时的状态重置
  useEffect(() => {
    setLoadingLocalJson(false);
    setLocalJson(null);
  }, [currentType]);

  // 加载本地文件
  const loadLocalFile = async () => {
    setLoadingLocalJson(true);
    try {
      const hasPermission = await ensurePermission("read");
      if (!hasPermission) return;
      if (!dirHandle) return;
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

  useEffect(() => {
    if (dirHandle) {
      loadLocalFile().then();
    }
  }, [dirHandle, currentType, ensurePermission, messageApi]);

  // 处理加载远程 Notion 数据
  const handleLoadRemoteJson = async (type: string) => {
    setRemoteJsonLoadingList((prev) => [...prev, type]);
    messageApi.open({ key: "processing", type: "loading", content: `正在从 Notion 加载 ${type} ...`, duration: 0 });

    setRemoteJsonMap((prev) => ({ ...prev, [type]: remoteJsonMapData[currentType] }));

    messageApi.destroy("processing");
    setRemoteJsonLoadingList((prev) => prev.filter((item) => item !== type));
    messageApi.success(`${type} 处理完成`);
  };

  const menuItems = WORKSHOP_TYPES.map((value) => ({
    key: value,
    label: value,
  }));


// 在 remoteJsonMapData 加载完毕后，主动更新页面并调用 handleLoadRemoteJson
useEffect(() => {
  if (remoteJsonMapData && Object.keys(remoteJsonMapData).length > 0) {
    // 获取到数据后，主动调用 handleLoadRemoteJson 来更新页面
    handleLoadRemoteJson(currentType);
  }
}, [remoteJsonMapData, currentType]);

  const handleSyncRemoteJson = async () => {
    if (!dirHandle) {
      messageApi.error("请选择你的代码中的 commodity 文件夹");
    }
    if (localJson && remoteJsonMap[currentType]) {
      setSaving(true);
      const remoteJson = remoteJsonMap[currentType];

      try {
        await writeFile(`${COMMODITY_PATH}${currentType}.json`, JSON.stringify(remoteJson, null, 4));
        setLocalJson(remoteJson); // 刷新本地 JSON
      } catch (error: any) {
        messageApi.error("保存文件出错: " + error?.message);
      } finally {
        setSaving(false);
      }
    } else {
      messageApi.error("请先加载本地文件");
    }
  };

  return (
    <Layout style={{ padding: "16px 0", background: colorBgContainer, borderRadius: borderRadiusLG }}>
      <Sider style={{ background: colorBgContainer }} width={200}>
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[currentType]}
          onClick={(e) => setCurrentType(e.key)}
          style={{ border: 'none' }}
        />
      </Sider>
      <Content style={{ padding: "0 24px", minHeight: 280 }}>
        <Flex gap={16}>
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={<Space>本地<Button type={'text'} icon={<ReloadOutlined />} onClick={() => loadLocalFile()} disabled={loadingLocalJson} /></Space>}
            loading={loadingLocalJson}
          >
            {localFileExists && localJson ? (
              <LotteryTree checkable={false} fullJson={localJson} />
            ) : (
              <Text type="warning">{`${currentType}.json 未找到或无法读取`}</Text>
            )}
          </Card>

          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                Notion
                <Button
                  type={'text'}
                  icon={remoteJsonLoading ? <LoadingOutlined /> : <ReloadOutlined />}
                  onClick={() => handleLoadRemoteJson(currentType)}
                  disabled={remoteJsonLoading}
                />
              </Space>
            }
            extra={
              remoteJsonMap[currentType] && (
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
            {remoteJsonMap[currentType] ? (
              <LotteryTree checkable={false} fullJson={remoteJsonMap[currentType]} checkedKeys={checkedKeys} setCheckedKeys={setCheckedKeys} />
            ) : (
              <Flex style={{ padding: "32px 0", justifyContent: "center", alignItems: "center" }}>
                <Button icon={<CloudDownloadOutlined />} onClick={() => handleLoadRemoteJson(currentType)}>
                  从 Notion 加载
                </Button>
              </Flex>
            )}
          </Card>
        </Flex>
      </Content>
    </Layout>
  );
};

export default LotteryContentWithDirHandle;