import React from "react";
import useMessage from "antd/es/message/useMessage";
import { Layout } from 'antd';
import { Content, Header } from "antd/es/layout/layout";
import { WorkshopPageContextProvider } from "./WorkshopPageContext";
import WorkshopHeaderBar from "./WorkshopTitleBar";
import WorkshopContent from "./WorkshopContent";

const WorkshopPage: React.FC = () => {

  const [messageApi, messageContext] = useMessage();

  return (
    <WorkshopPageContextProvider messageApi={messageApi}>
      <Layout>
        {messageContext}
        <WorkshopHeaderBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <WorkshopContent />
        </Content>
      </Layout>
    </WorkshopPageContextProvider>
  );
}

export default WorkshopPage;