import React from "react";
import { Layout } from 'antd';
import { Content } from "antd/es/layout/layout";
import { DirectoryContextProvider } from "../../context/DirectoryContext";
import WorkshopHeaderBar from "./WorkshopTitleBar";
import WorkshopContent from "./WorkshopContent";

const WorkshopPage: React.FC = () => {
  return (
    <DirectoryContextProvider>
      <Layout>
        <WorkshopHeaderBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <WorkshopContent />
        </Content>
      </Layout>
    </DirectoryContextProvider>
  );
}

export default WorkshopPage;