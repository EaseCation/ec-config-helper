import React, { useEffect, useRef } from 'react';
import { Button, Form, Input, Space, Typography } from 'antd';
import { useNotionToken } from "../hooks/useNotionToken";

const { Title, Paragraph } = Typography;

const SettingsPage: React.FC = () => {
  const { token, setToken } = useNotionToken();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ notionToken: token });
  }, [token, form]);

  const testFileSystemAPI = async () => {
    try {
      const handle = await window.showDirectoryPicker()
      console.log('Selected directory:', handle);
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <div className="responsive-padding">
      <Title level={2}>设置</Title>
      <Button
        onClick={testFileSystemAPI}
      >
        测试文件系统API
      </Button>
      <Paragraph>
        Notion Token
      </Paragraph>
      <Form
        form={form}
        initialValues={{ notionToken: token }}
        onFinish={({ notionToken }) => {
          setToken(notionToken);
        }}
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
        <Space>
          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
          <Form.Item label={null}>
            <Button onClick={() => {
              setToken(null);
              window.location.href = '/';
            }}>清除</Button>
          </Form.Item>
        </Space>
      </Form>
    </div>
  );
};

export default SettingsPage;