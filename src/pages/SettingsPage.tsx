import React, { useEffect } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { useNotionToken } from "../hooks/useNotionToken";
import { useEcapiSettings } from '../hooks/useEcapiSettings';

const { Title, Paragraph } = Typography;

const SettingsPage: React.FC = () => {
  const { token, setToken } = useNotionToken();
  const { apiKey, baseUrl, setApiKey, setBaseUrl } = useEcapiSettings();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ notionToken: token, ecapiApiKey: apiKey, ecapiBaseUrl: baseUrl });
  }, [token, apiKey, baseUrl, form]);

  return (
    <div className="responsive-padding">
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 24px' }}>
        <Title style={{ margin: 0, flex: 1 }}>设置</Title>
      </div>
      <Form
        form={form}
        initialValues={{ notionToken: token, ecapiApiKey: apiKey, ecapiBaseUrl: baseUrl }}
        onFinish={({ notionToken, ecapiApiKey, ecapiBaseUrl }) => {
          setToken(notionToken);
          setApiKey(ecapiApiKey || null);
          setBaseUrl(ecapiBaseUrl || null);
        }}
      >
        <Paragraph>
          Notion Token
        </Paragraph>
        <Form.Item
          name={'notionToken'}
          rules={[
            { required: true, message: '请输入 Notion Token' },
            { pattern: /^secret_/, message: 'Notion Token 以 secret_ 开头' },
          ]}
        >
          <Input.Password
            placeholder="请输入 Notion Token"
            style={{ width: '100%', maxWidth: 500 }}
          />
        </Form.Item>
        <Paragraph>
          ECAPI API Key
        </Paragraph>
        <Form.Item
          name={'ecapiApiKey'}
          extra="用于概率表导出时从 ECAPI 拉取 cfgLanguage、cfgLanguageMerchandise 和 /items，减少手动导出 JSON。"
        >
          <Input.Password
            placeholder="请输入 ECAPI API Key"
            style={{ width: '100%', maxWidth: 500 }}
          />
        </Form.Item>
        <Paragraph>
          ECAPI Base URL
        </Paragraph>
        <Form.Item name={'ecapiBaseUrl'}>
          <Input
            placeholder="https://api.easecation.net"
            style={{ width: '100%', maxWidth: 500 }}
          />
        </Form.Item>
        <Space>
          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
          <Form.Item label={null}>
            <Button onClick={() => {
              setToken(null);
              setApiKey(null);
              setBaseUrl(null);
              window.location.href = '/';
            }}>清除</Button>
          </Form.Item>
        </Space>
      </Form>
    </div>
  );
};

export default SettingsPage;
