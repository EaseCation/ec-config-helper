import React from "react";
import { Layout } from "antd";
import { DirectoryContextProvider } from "../../context/DirectoryContext";
import CommodityTitleBar from "./CommodityTitleBar";
import CommodityContent from "./CommodityContent";

const { Content } = Layout;

const CommodityPage: React.FC = () => {
  return (
    <DirectoryContextProvider>
      <Layout>
        <CommodityTitleBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <CommodityContent />
        </Content>
      </Layout>
    </DirectoryContextProvider>
  );
};

export default CommodityPage;
