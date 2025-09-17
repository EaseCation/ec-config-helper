import React, { useContext, useState } from "react";
import { Typography, Flex, Button, Input, Modal } from "antd";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LotteryTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(WorkshopPageContext);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Flex vertical gap={12} className="responsive-padding">
      <Modal
        title="抽奖箱同步说明"
        open={infoOpen}
        onOk={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
      >
        <Typography>
          <Text>
            读取 Notion 抽奖箱数据库中的奖品及概率设置，生成相应的 JSON
            配置文件，并同步到所选项目目录，供抽奖逻辑使用。
          </Text>
        </Typography>
      </Modal>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 0' }}>
        <Title style={{ margin: 0, flex: 1 }}>抽奖箱 JSON 同步</Title>
        <InfoCircleOutlined
          style={{ fontSize: 20, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => setInfoOpen(true)}
        />
      </div>

      <Flex align="center" gap={12}>
        <Input
          value="9e151c3d30b14d1bae8dd972d17198c1"
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

export default LotteryTitleBar;
