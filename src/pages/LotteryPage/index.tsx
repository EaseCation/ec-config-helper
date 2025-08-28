import React from "react";
import { Layout } from 'antd';
import { Content } from "antd/es/layout/layout";
import { DirectoryContextProvider } from "../../context/DirectoryContext";
import LotteryTitleBar from "./LotteryTitleBar";
import LotteryContent from "./LotteryContent";

const LotteryPage2: React.FC = () => {
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

export default LotteryPage2;