import React, { useEffect, useState } from "react";
import { Button, Card, Flex, Layout, Menu, MenuProps, Space, Spin, theme, Typography } from "antd";
import Sider from "antd/es/layout/Sider";
import { Content } from "antd/es/layout/layout";
import WorkshopTree, { DifferentPart } from "./WorkshopTree";
import { fetchNotionAllPages } from "../../notion/notionClient";
import { formatWorkshop } from "../../services/workshop/workshopService";
import { WorkshopCommodityConfig } from "../../types/workshop";
import { CloudDownloadOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { WorkshopPageContext } from "./WorkshopPageContext";
import { NOTION_DATABASE_WORKSHOP, WORKSHOP_TYPES } from "../../services/workshop/workshopNotionQueries";

const { Text } = Typography;

const COMMODITY_PATH = 'CodeFunCore/src/main/resources/net/easecation/codefuncore/commodity/types/';

const WorkshopContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, messageApi, readFile, writeFile } = React.useContext(WorkshopPageContext);

  const [currentType, setCurrentType] = useState<string>(Object.keys(WORKSHOP_TYPES)[0]);
  const [localJson, setLocalJson] = useState<WorkshopCommodityConfig | null>(null);
  const [loadingLocalJson, setLoadingLocalJson] = useState(false);
  const [localFileExists, setLocalFileExists] = useState(false);
  const [remoteJsonMap, setRemoteJsonMap] = useState<{ [key: string]: WorkshopCommodityConfig }>({});
  const [remoteJsonLoadingList, setRemoteJsonLoadingList] = useState<string[]>([]);
  const [mergedJson, setMergedJson] = useState<WorkshopCommodityConfig | null>(null);
  const [differentParts, setDifferentParts] = useState<{[key: string]: DifferentPart}>({});
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 切换tab时的状态重置
  useEffect(() => {
    setDifferentParts({});
    setLoadingLocalJson(false);
    setLocalJson(null);
  }, [currentType]);

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

  const handleLoadRemoteJson = async (type: string) => {
    setRemoteJsonLoadingList((prev) => [...prev, type]);
    messageApi.open({ key: "processing", type: "loading", content: `正在从 Notion 加载 ${type} ...`, duration: 0 });

    const filterConfig = WORKSHOP_TYPES[type];
    const pages = await fetchNotionAllPages(NOTION_DATABASE_WORKSHOP, { filter: filterConfig.filter, sorts: filterConfig.sorts });
    const workshopJson = formatWorkshop(type, pages);

    setRemoteJsonMap((prev) => ({ ...prev, [type]: workshopJson }));
    messageApi.destroy("processing");
    setRemoteJsonLoadingList((prev) => prev.filter((item) => item !== type));
    messageApi.success(`${type} 处理完成`);
  };

  useEffect(() => {
    if (localJson && remoteJsonMap[currentType] && localJson.typeId === remoteJsonMap[currentType].typeId) {
      const findDifferentParts = (local: WorkshopCommodityConfig, remote: WorkshopCommodityConfig): { [key: string]: DifferentPart } => {
        const differentParts: { [key: string]: DifferentPart } = {};
        for (let key in remote.items) {
          if (!local.items[key]) {
            differentParts[key] = { key, mode: "add", to: remote.items[key] };
          } else if (JSON.stringify(local.items[key]) !== JSON.stringify(remote.items[key])) {
            differentParts[key] = { key, mode: "changed", from: local.items[key], to: remote.items[key] };
          }
        }
        for (let key in local.items) {
          if (!remote.items[key]) {
            differentParts[key] = { key, mode: "remove", from: local.items[key] }
          }
        }
        return differentParts;
      };
      setDifferentParts(findDifferentParts(localJson, remoteJsonMap[currentType]));
      setMergedJson(mergeJson(localJson, remoteJsonMap[currentType]))
    }
  }, [localJson, remoteJsonMap, currentType]);

  const menuItems: MenuProps["items"] = Object.keys(WORKSHOP_TYPES).map((key) => ({
    key,
    label: key,
  }));

  const mergeJson = (local: WorkshopCommodityConfig, remote: WorkshopCommodityConfig): WorkshopCommodityConfig => {
    const mergedItems: { [key: string]: any } = {};
    for (const key of Object.keys(remote.items)) {
      mergedItems[key] = remote.items[key];
    }
    for (const key of Object.keys(local.items)) {
      if (!mergedItems[key]) {
        mergedItems[key] = local.items[key];
      }
    }
    return {
      ...remote,
      items: mergedItems
    };
  };

  const findSelectedDifferentParts = (): { [key: string]: DifferentPart } => {
    const selectedDifferentParts: { [key: string]: DifferentPart } = {};
    for (const key in differentParts) {
      if (checkedKeys.includes(key)) {
        selectedDifferentParts[key] = differentParts[key];
      }
    }
    return selectedDifferentParts;
  }

  const handleSyncRemoteJson = async () => {
    if (!dirHandle) {
      messageApi.error("请选择你的代码中的 commodity 文件夹");
    }
    if (localJson && remoteJsonMap[currentType]) {
      setSaving(true);
      const selectedDifferentParts = findSelectedDifferentParts();
      const remoteJson = remoteJsonMap[currentType];
      const newJson: WorkshopCommodityConfig = {
        ...remoteJson,
        items: {
          ...localJson.items
        }
      }

      // 根据 selectedDifferentParts 处理newJson的items，考虑 'add' | 'remove' | 'changed' 三种情况
      for (const key in selectedDifferentParts) {
        if (selectedDifferentParts[key].mode === 'add') {
          newJson.items[key] = remoteJson.items[key];
        } else if (selectedDifferentParts[key].mode === 'remove') {
          delete newJson.items[key];
        } else if (selectedDifferentParts[key].mode === 'changed') {
          newJson.items[key] = remoteJson.items[key];
        }
      }

      try {
        await writeFile(`${COMMODITY_PATH}${currentType}.json`, JSON.stringify(newJson, null, 4));
        // 完成后，刷新localJson
        setLocalJson(newJson);
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
          style={{
            border: 'none'
          }}
        />
      </Sider>
      <Content style={{ padding: "0 24px", minHeight: 280 }}>
        <Flex gap={16}>
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                本地
                <Button
                  type={'text'}
                  icon={<ReloadOutlined style={{ fontSize: 14, opacity: 0.65 }} />}
                  onClick={() => loadLocalFile()}
                  disabled={loadingLocalJson}
                />
              </Space>
            }
            loading={loadingLocalJson}

          >
            {(localFileExists && localJson) ? (
              <WorkshopTree checkable={false} fullJson={localJson} />
            ) : (
              <Text type="warning">{`${currentType}.json 未找到或无法读取`}</Text>
            )}
          </Card>
          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                Notion
                {remoteJsonMap[currentType] && (
                  <Button
                    type={'text'}
                    icon={remoteJsonLoadingList.includes(currentType) ? <LoadingOutlined style={{fontSize: 16}}/> :
                      <ReloadOutlined style={{fontSize: 14, opacity: 0.65}}/>}
                    onClick={() => handleLoadRemoteJson(currentType)}
                    disabled={remoteJsonLoadingList.includes(currentType)}
                  />
                )}
              </Space>
            }
            loading={remoteJsonLoadingList.includes(currentType)}
            extra={
              remoteJsonMap[currentType] && (
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  disabled={Object.keys(findSelectedDifferentParts()).length === 0}
                  loading={saving}
                  onClick={handleSyncRemoteJson}
                >
                  同步到本地 {Object.keys(findSelectedDifferentParts()).length > 0 ? `(${Object.keys(findSelectedDifferentParts()).length} 处变更)` : ''}
                </Button>
              )
            }
          >
            {remoteJsonMap[currentType] ? (
              <WorkshopTree
                checkable={!!localJson}
                fullJson={mergedJson ? mergedJson : remoteJsonMap[currentType]}
                differentParts={localJson ? differentParts : undefined}
                checkedKeys={checkedKeys}
                setCheckedKeys={setCheckedKeys}
              />
            ) : !remoteJsonLoadingList.includes(currentType) ? (
              <Flex style={{
                padding: "32px 0",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={() => handleLoadRemoteJson(currentType)}
                >
                  从 Notion 加载
                </Button>
              </Flex>
            ) : undefined}
          </Card>
        </Flex>
      </Content>
    </Layout>
  );
};

export default WorkshopContentWithDirHandle;