import React from "react";
import useMessage from "antd/es/message/useMessage";
import { Layout } from 'antd';
import { Content, Header } from "antd/es/layout/layout";
import { WorkshopPageContextProvider } from "../WorkshopPage/WorkshopPageContext";
import LotteryTitleBar from "./LotteryTitleBar";
import LotteryContent from "./LotteryContent";

const LotteryPage2: React.FC = () => {

  const [messageApi, messageContext] = useMessage();

  return (
    <WorkshopPageContextProvider messageApi={messageApi}>
      <Layout>
        {messageContext}
        <LotteryTitleBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <LotteryContent />
        </Content>
      </Layout>
    </WorkshopPageContextProvider>
  );
}

export default LotteryPage2;