import React from "react";
import useMessage from "antd/es/message/useMessage";
import { Layout } from 'antd';
import { Content, Header } from "antd/es/layout/layout";
import { WorkshopPageContextProvider } from "../WorkshopPage/WorkshopPageContext";
import CommodityTitleBar from "./CommodityTitleBar";
import LotteryContent from "./CommodityContent";

const LotteryPage2: React.FC = () => {

  const [messageApi, messageContext] = useMessage();

  return (
    <WorkshopPageContextProvider messageApi={messageApi}>
      <Layout>
        {messageContext}
        <CommodityTitleBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <LotteryContent />
        </Content>
      </Layout>
    </WorkshopPageContextProvider>
  );
}

export default LotteryPage2;