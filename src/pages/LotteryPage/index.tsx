import React from "react";
import { Layout } from "antd";
import { DirectoryContextProvider } from "../../context/DirectoryContext";
import LotteryTitleBar from "./LotteryTitleBar";
import LotteryContent from "./LotteryContent";

const { Content } = Layout;

const LotteryPage: React.FC = () => {
  return (
    <DirectoryContextProvider>
      <Layout>
        <LotteryTitleBar />
        <Content className={"responsive-padding"} style={{ paddingTop: 8 }}>
          <LotteryContent />
        </Content>
      </Layout>
    </DirectoryContextProvider>
  );
}

export default LotteryPage;