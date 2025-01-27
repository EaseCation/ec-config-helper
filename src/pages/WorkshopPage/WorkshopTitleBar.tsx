import React, { useContext } from "react";
import { Typography, Flex, Button } from "antd";
import { WorkshopPageContext } from "./WorkshopPageContext";

const { Title, Text } = Typography;

const WorkshopTitleBar: React.FC = () => {
  const { dirHandle, chooseDirectory, ensurePermission, messageApi } =
    useContext(WorkshopPageContext);

  return (
    <Flex vertical gap={12} className={"responsive-padding"}>
      <Title style={{ margin: "8px 0 0" }}>商品表 JSON 同步</Title>
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