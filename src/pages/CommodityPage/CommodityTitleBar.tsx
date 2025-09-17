import React, { useContext, useState } from "react";
import { Typography, Flex, Button, Input, Modal } from "antd";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const CommodityTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(WorkshopPageContext);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Flex vertical gap={12} className="responsive-padding">
      <Modal
        title="Commodity 分类说明"
        open={infoOpen}
        onOk={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
      >
        <Typography>
          <Text>
            从 Notion 商品分类数据库读取数据，生成包含全部分类层级的 JSON
            文件，并保存到所选项目目录，供客户端读取商品分类配置。
          </Text>
        </Typography>
      </Modal>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 16px' }}>
        <Title style={{ margin: 0, flex: 1 }}>Commodity 总分类 JSON 自动生成</Title>
        <InfoCircleOutlined
          style={{ fontSize: 20, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => setInfoOpen(true)}
        />
      </div>

      <Flex align="center" gap={12}>
        <Input
          value="1959ff1f-c1d4-4754-9014-cd4f3c80c36f"
          style={{ width: 400 }}
          addonBefore="抽奖箱 Database ID："
          disabled
        />
        {dirHandle && (
          <Text>
            已选择的项目目录：{dirHandle.name}
            <Button size="small" type="link" onClick={() => chooseDirectory().then()}>
              重新选择
            </Button>
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default CommodityTitleBar;
