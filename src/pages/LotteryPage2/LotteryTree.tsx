import { Empty, Space, Tag, Tree, TreeDataNode, Typography } from "antd";
import React, { ReactNode, useEffect, useState } from "react";
import { highlightLineDiff } from "../../utils/diffHelper";

const { Text, Paragraph } = Typography;

const LotteryTree: React.FC<{[key:string]: any}> = ({ checkable, fullJson, differentParts, checkedKeys, setCheckedKeys }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  if (checkedKeys === undefined || setCheckedKeys === undefined) {
    const [checkedKeys0, setCheckedKeys0] = useState<string[]>([]);
    checkedKeys = checkedKeys0;
    setCheckedKeys = setCheckedKeys0;
  }

  const renderTreeKeyTitle = (key: string, value: any) => {
    return <Space>
      <Text>{key}</Text>
    </Space>;
  }

  const renderCode = (
    key: string,
    value: any,
  ) => {
    return (
      <Paragraph>
        <pre style={{ margin: 0, fontSize: 12 }}>
          {JSON.stringify(value, null, 4)}
        </pre>
      </Paragraph>
    );
  };

  const treeData: TreeDataNode[] = Object.entries(fullJson).map(([key, value]) => {
    return {
      title: renderTreeKeyTitle(key, value),
      key: key,
      disableCheckbox: false,
      children: [
        {
          title: renderCode(key, value),
          key: key + "_data",
          checkable: false
        }
      ]
    }
  });

  useEffect(() => {
    if (checkable) {
      setCheckedKeys!(Object.keys(fullJson));
    }
  }, [checkable, fullJson, differentParts]);

  return treeData.length > 0 ? (
    <Tree
      blockNode
      expandedKeys={expandedKeys}
      checkable={checkable}
      checkedKeys={checkedKeys}
      onCheck={(keys) => {
        setCheckedKeys!(keys as string[]);
      }}
      selectedKeys={selectedKeys}  // 固定不可选
      onSelect={(keys, e) => {
        if (expandedKeys.includes(e.node.key.toString())) {
          setExpandedKeys(expandedKeys.filter((key) => key !== e.node.key.toString()));
        } else {
          setExpandedKeys([...expandedKeys, e.node.key.toString()]);
        }
      }}
      onExpand={(keys) => {
        setExpandedKeys(keys as string[]);
      }}
      treeData={treeData}
    />
  ) :
    <Empty
      style={{ marginTop: 80 }}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={"Notion 中的数据为空"}
    />
}

export default LotteryTree;