import React, { useContext } from "react";
import { Typography, Flex, Button, Input } from "antd";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";

const { Title, Text } = Typography;

const CommodityTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(WorkshopPageContext);

  return (
    <Flex vertical gap={12} className="responsive-padding">
      <Title style={{ margin: "8px 0 16px" }}>Commodity 总分类 JSON 自动生成</Title>

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
