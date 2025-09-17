import React, { useContext, useState } from "react";
import { Typography, Flex, Button, Modal } from "antd";
import { WorkshopPageContext } from "./WorkshopPageContext";
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WorkshopTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory, ensurePermission, messageApi } =
    useContext(WorkshopPageContext);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Flex vertical gap={12} className={"responsive-padding"}>
      <Modal
        title="商品表同步说明"
        open={infoOpen}
        onOk={() => setInfoOpen(false)}
        onCancel={() => setInfoOpen(false)}
      >
        <Typography>
          <Text>
            连接 Notion 商品表数据库，拉取所有商品记录，生成对应的 JSON
            配置文件并写入所选项目目录，用于商城或其他功能的商品数据。
          </Text>
        </Typography>
      </Modal>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 0' }}>
        <Title style={{ margin: 0, flex: 1 }}>商品表 JSON 同步</Title>
        <InfoCircleOutlined
          style={{ fontSize: 20, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => setInfoOpen(true)}
        />
      </div>
      { dirHandle && (
        <Text>
          已选择的项目目录：{dirHandle.name}
          <Button size={'small'} type={'link'} onClick={() => {chooseDirectory().then()}}>
            重新选择
          </Button>
        </Text>
      )}
    </Flex>
  );
}

export default WorkshopTitleBar;