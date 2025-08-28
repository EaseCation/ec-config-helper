import React, { useContext } from "react";
import { Button, Card, Flex, Space, Typography } from "antd";
import LotteryContentWithDirHandle from "./LotteryContentWithDirHandle";
import { DirectoryContext } from "../../context/DirectoryContext";
import { FolderOpenOutlined } from "@ant-design/icons";

const { Text } = Typography;

const LotteryContent: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(DirectoryContext);

  return dirHandle ? (
    <LotteryContentWithDirHandle />
  ) : (
    <Card bordered={false}>
      <Flex vertical gap={24} justify="center" align="center" style={{ padding: "100px 0 120px" }}>
        <Space size={'small'} direction={"vertical"} style={{ textAlign: 'center' }}>
          <Text>此功能仅支持 Chrome，选择你的 CodeFunCoreMaven 代码库目录，浏览器即可对此目录进行访问。</Text>
          <Text type={'secondary'}>一键同步Notion抽奖箱配置到你的本地代码中，并提供完善的核查和应用范围选择功能。</Text>
        </Space>
        <Button type={'primary'} icon={<FolderOpenOutlined />} onClick={() => chooseDirectory("readwrite")}>选择你的EC代码库</Button>
      </Flex>
    </Card>
  );
};

export default LotteryContent;