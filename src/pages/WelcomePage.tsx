import React from 'react';
import { Button, Form, Input, Layout, Typography } from 'antd';
import { Content } from "antd/es/layout/layout";
import { useNavigate } from "react-router-dom";
import { useNotionToken } from "../hooks/useNotionToken";

const { Title, Paragraph } = Typography;

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, setToken } = useNotionToken();

  return (
    <Layout style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh' }}>
      <Content style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flex: 1, paddingBottom: 80 }}>
        <Title level={2}>欢迎使用 EC 配置生成工具</Title>
        <Paragraph style={{ marginBottom: 32 }}>
          请先输入 Notion Token 以继续使用
        </Paragraph>
        <Form
          initialValues={{ notionToken: token }}
          onFinish={({ notionToken }) => {
            setToken(notionToken);
            // navigate('/');
            window.location.href = '/';
          }}
          style={{ width: 300 }}
        >
          <Form.Item
            name={'notionToken'}
            rules={[
              { required: true, message: '请输入 Notion Token' },
              { pattern: /^secret_/, message: 'Notion Token 以 secret_ 开头' },
            ]}
          >
            <Input
              type={'password'}
              placeholder="请输入 Notion Token"
            />
          </Form.Item>
          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              保存并继续
            </Button>
          </Form.Item>
        </Form>
      </Content>
    </Layout>
  );
};

export default WelcomePage;