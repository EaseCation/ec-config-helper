import React, { useContext } from "react";
import { Button, Card, Flex, Space, Typography } from "antd";
import WorkshopContentWithDirHandle from "./WorkshopContentWithDirHandle";
import { WorkshopPageContext } from "./WorkshopPageContext";
import { FolderOpenOutlined } from "@ant-design/icons";

const { Text } = Typography;

const WorkshopContent: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(WorkshopPageContext);

  return dirHandle ? (
    <WorkshopContentWithDirHandle />
  ) : (
    <Card bordered={false}>
      <Flex
        vertical
        gap={24}
        justify="center"
        align="center"
        className="empty-state-container"
      >
        <Space size={'small'} direction={"vertical"} style={{ textAlign: 'center' }}>
          <Text>此功能仅支持 Chrome，选择你的 CodeFunCoreMaven 代码库目录，浏览器即可对此目录进行访问。</Text>
          <Text type={'secondary'}>一键同步Notion商品表配置到你的本地代码中，并提供完善的核查和应用范围选择功能。</Text>
        </Space>
        <Button
          type={'primary'}
          icon={<FolderOpenOutlined />}
          onClick={() => chooseDirectory("readwrite")}
        >
          选择你的EC代码库
        </Button>
      </Flex>
    </Card>
  );
};

export default WorkshopContent;