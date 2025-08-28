import React, { useContext } from "react";
import { Typography, Flex, Button, Input } from "antd";
import { WorkshopPageContext } from "../WorkshopPage/WorkshopPageContext";

const { Title, Text } = Typography;

const LotteryTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory } = useContext(WorkshopPageContext);

  return (
    <Flex vertical gap={12} className="responsive-padding">
      <Title style={{ margin: "8px 0 0" }}>抽奖箱 JSON 同步</Title>

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
