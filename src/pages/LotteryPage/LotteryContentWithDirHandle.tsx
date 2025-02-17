import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Flex, Layout, Menu, Space, Typography, theme, BackTop } from "antd";
import { Content } from "antd/es/layout/layout";
import LotteryTree from "./LotteryTree";
import Sider from "antd/es/layout/Sider";
import { useLotteryData } from "./UseLotteryData";  // 引入自定义 hook
import {
  CloudDownloadOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  UpOutlined
} from "@ant-design/icons";  // 引入回到顶部需要的图标
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";
import { NOTION_DATABASE_LOTTERY, LOTTERY_TYPES } from "../../services/lottery/lotteryNotionQueries";

const { Text } = Typography;
const COMMODITY_PATH = "CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion/";
const PAGE_SIZE = 15; // 每页显示多少个 WORKSHOP_TYPES

const LotteryContentWithDirHandle: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { dirHandle, ensurePermission, messageApi, readFile, writeFile } =
    useContext(WorkshopPageContext);

  const [currentType, setCurrentType] = useState<string>(LOTTERY_TYPES[0]);
  const [localJson, setLocalJson] = useState<{ [key: string]: any } | null>(null);
  const [loadingLocalJson, setLoadingLocalJson] = useState(false);
  const [localFileExists, setLocalFileExists] = useState(false);
  const [remoteJsonMap, setRemoteJsonMap] = useState<{ [key: string]: any }>({});
  const [remoteJsonLoadingList, setRemoteJsonLoadingList] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState<number>(0);
  const totalPages = Math.ceil(LOTTERY_TYPES.length / PAGE_SIZE);

  // 获取 Lottery 数据
  const {
    fileArray: remoteJsonMapData,
    refetch,
  } = useLotteryData(NOTION_DATABASE_LOTTERY);

  // 切换 tab 时的状态重置
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

  // 从 Notion 拉取数据
  const handleLoadRemoteJson = async (type: string, flush: boolean) => {
    setRemoteJsonLoadingList((prev) => [...prev, type]);
    messageApi.open({
      key: "processing",
      type: "loading",
      content: `正在从 Notion 加载 ${type} ...`,
      duration: 0,
    });

    // 重新获取 Notion 数据
    if (flush) {
      await refetch();
    }

    setRemoteJsonMap((prev) => ({ ...prev, [type]: remoteJsonMapData[type] }));
    messageApi.destroy("processing");
    setRemoteJsonLoadingList((prev) => prev.filter((item) => item !== type));
    messageApi.success(`${type} 处理完成`);
  };

  // 在 remoteJsonMapData 加载完毕后，主动更新页面并调用 handleLoadRemoteJson
  useEffect(() => {
    if (remoteJsonMapData && Object.keys(remoteJsonMapData).length > 0) {
      handleLoadRemoteJson(currentType, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteJsonMapData, currentType]);

  // 同步到本地
  const handleSyncRemoteJson = async () => {
    if (!dirHandle) {
      messageApi.error("请选择你的代码中的 commodity 文件夹");
    }
    if (localJson && remoteJsonMap[currentType]) {
      setSaving(true);
      const remoteJson = remoteJsonMap[currentType];
      try {
        await writeFile(
          `${COMMODITY_PATH}${currentType}.json`,
          JSON.stringify(remoteJson, null, 4)
        );
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

  /**
   * 获取当前分页下的 WorkshopType 列表
   */
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentPageTypes = LOTTERY_TYPES.slice(startIndex, endIndex);

  /**
   * 构造 Menu 的 items
   * 这里在顶部只添加一个“上一页”按钮，在底部只添加一个“下一页”按钮为例。
   */
  const menuItems = [
    {
      key: "prev-top",
      label: "上一页",
      disabled: currentPage === 0,
    },
    ...currentPageTypes.map((value) => ({
      key: value,
      label: value,
    })),
    {
      key: "next-bottom",
      label: "下一页",
      disabled: currentPage === totalPages - 1 || totalPages <= 1,
    },
  ];

  /**
   * 点击菜单时的处理
   */
  const handleMenuClick = (e: any) => {
    if (e.key === "prev-top" || e.key === "prev-bottom") {
      // 上一页
      setCurrentPage((page) => Math.max(0, page - 1));
      return;
    }
    if (e.key === "next-top" || e.key === "next-bottom") {
      // 下一页
      setCurrentPage((page) => Math.min(totalPages - 1, page + 1));
      return;
    }
    // 普通菜单项
    setCurrentType(e.key);
  };

  return (
    <Layout
      style={{
        padding: "15px 0",
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      <Sider style={{ background: colorBgContainer }} width={200}>
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[currentType]}
          onClick={handleMenuClick}
          style={{ border: "none" }}
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
                  type={"text"}
                  icon={<ReloadOutlined />}
                  onClick={() => loadLocalFile()}
                  disabled={loadingLocalJson}
                />
              </Space>
            }
            loading={loadingLocalJson}
          >
            {localFileExists && localJson ? (
              <LotteryTree checkable={false} fullJson={localJson} />
            ) : (
              <Text type="warning">
                {`${currentType}.json 未找到或无法读取`}
              </Text>
            )}
          </Card>

          <Card
            style={{ flex: 2, minHeight: "80vh" }}
            title={
              <Space>
                <span>
                  Notion
                  {remoteJsonLoadingList.includes(currentType) && (
                    <span
                      style={{
                        color: "#faad14",
                        marginLeft: 8,
                        fontSize: 12,
                      }}
                    >
                      （正在拉取数据中，请耐心等待...）
                    </span>
                  )}
                </span>
                <Button
                  type="text"
                  icon={
                    remoteJsonLoadingList.includes(currentType) ? (
                      <LoadingOutlined style={{ fontSize: 16 }} />
                    ) : (
                      <ReloadOutlined style={{ fontSize: 14, opacity: 0.65 }} />
                    )
                  }
                  onClick={() => handleLoadRemoteJson(currentType, true)}
                  disabled={remoteJsonLoadingList.includes(currentType)}
                />
              </Space>
            }
            loading={remoteJsonLoadingList.includes(currentType)}
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
              <LotteryTree
                checkable={false}
                fullJson={remoteJsonMap[currentType]}
                checkedKeys={checkedKeys}
                setCheckedKeys={setCheckedKeys}
              />
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
                  onClick={() => handleLoadRemoteJson(currentType, true)}
                >
                  从 Notion 加载
                </Button>
              </Flex>
            )}
          </Card>
        </Flex>

        {/* 
            一键返回顶部：设置 visibilityHeight = 100（示例值），
            当页面滚动大于这个距离时就会显示该按钮 
        */}
        <BackTop visibilityHeight={100}>
          {/* 自定义按钮样式和图标 */}
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

export default LotteryContentWithDirHandle;
