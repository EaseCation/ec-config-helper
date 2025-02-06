import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingOutlined, SettingOutlined, BuildOutlined, GiftOutlined} from '@ant-design/icons';
import Sider from "antd/es/layout/Sider";

const { Header, Content, Footer } = Layout;

const LayoutContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const selectedKey = location.pathname;

  const items = [
    /*{ label: <Link to="/lottery">抽奖箱生成</Link>, key: '/lottery', icon: <GiftOutlined /> },*/
    { label: <Link to="/workshop">商品表同步</Link>, key: '/workshop', icon: <ShoppingOutlined /> },
    { label: <Link to="/lworkshop">商品表（旧版）</Link>, key: '/lworkshop', icon: <BuildOutlined/> },
    /*{ label: <Link to="/commodity">总分类生成</Link>, key: '/commodity', icon: <AppstoreAddOutlined /> },*/
    { label: <Link to="/lottery">抽奖箱生成</Link>, key: '/lottery', icon: <GiftOutlined />},
    { label: <Link to="/settings">设置</Link>, key: '/settings', icon: <SettingOutlined />}
  ];

  const {
    token: { colorTextBase },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth={56}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        {!collapsed && (<div style={{
          height: 32,
          margin: "12px 16px",
          color: colorTextBase,
          fontSize: 18,
          display: "flex",
          alignItems: "center"
        }}>
          EC 配置生成器
        </div>)}
        <Menu
          theme="dark"
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={items}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '0 16px' }}>
          {children}
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          EC Config Helper ©{new Date().getFullYear()} Created by EaseCation
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutContainer;