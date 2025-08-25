import React from "react";
import useMessage from "antd/es/message/useMessage";
import { Layout, Tabs } from 'antd';
import { Content } from "antd/es/layout/layout";
import { WorkshopPageContextProvider } from "../WorkshopPage/WorkshopPageContext";
import LotteryTitleBar from "./LotteryTitleBar";
import LotteryContent from "./LotteryContent";
import LotteryWikiTab from "./LotteryWikiTab";

const LotteryPage2: React.FC = () => {

  const [messageApi, messageContext] = useMessage();

  return (
    <WorkshopPageContextProvider messageApi={messageApi}>
      <Layout>
        {messageContext}
        <LotteryTitleBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <Tabs
            defaultActiveKey="json"
            items={[
              { key: 'json', label: 'JSON 同步', children: <LotteryContent /> },
              { key: 'wiki', label: '概率表导出', children: <LotteryWikiTab /> },
            ]}
          />
        </Content>
      </Layout>
    </WorkshopPageContextProvider>
  );
}

export default LotteryPage2;