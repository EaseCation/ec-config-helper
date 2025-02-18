import { Empty, Typography } from "antd";
import React, { useEffect } from "react";
import { LotteryConfig, LotteryConfigItem } from "../../services/lottery/lotteryNotionQueries";

export const { Text, Paragraph } = Typography;


export interface DifferentPart {
  key: string;
  mode: 'add' | 'remove' | 'changed';
  from?: LotteryConfigItem
  to?: LotteryConfigItem
}

export const LotteryTree: React.FC<{[key:string]: any}> = ({ checkable, fullJson, differentParts, checkedKeys, setCheckedKeys }) => {
  useEffect(() => {
    if (checkable) {
      setCheckedKeys!(Object.keys(fullJson));
    }
  }, [checkable, fullJson, differentParts]);

  return Object.keys(fullJson).length > 0 ? (
    <Paragraph>
    <pre
      style={{
        background: "#1e1e1e",
        color: "#ffffff",
        padding: "12px",
        borderRadius: "8px",
        overflowX: "auto",
        fontSize: 14,
      }}
    >
      {JSON.stringify(fullJson, null, 4)}
    </pre>
  </Paragraph>
    ) : (
      <Empty
        style={{ marginTop: 80 }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={"Notion 中的数据为空"}
      />
    );
}

