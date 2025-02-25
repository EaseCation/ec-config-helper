import {Empty, Space, Tag, Tree, TreeDataNode, Typography} from "antd";
import React, {ReactNode, useEffect, useState} from "react";
import {WorkshopCommodityConfig, WorkshopCommodityConfigItem} from "../../types/workshop";
import {highlightLineDiff} from "../../utils/diffHelper";

const {Text, Paragraph} = Typography;

export interface DifferentPart {
  key: string;
  mode: 'add' | 'remove' | 'changed';
  from?: WorkshopCommodityConfigItem
  to?: WorkshopCommodityConfigItem
}

export interface WorkshopTreeProps {
  checkable: boolean;
  fullJson: WorkshopCommodityConfig;
  differentParts?: { [key: string]: DifferentPart };
  checkedKeys?: string[];
  setCheckedKeys?: (keys: string[]) => void;
}

const modePriority: { [key in DifferentPart['mode']]: number } = {
  add: 0,
  changed: 1,
  remove: 2,
};

const WorkshopTree: React.FC<WorkshopTreeProps> = ({ checkable, fullJson, differentParts, checkedKeys, setCheckedKeys }) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  if (checkedKeys === undefined || setCheckedKeys === undefined) {
    const [checkedKeys0, setCheckedKeys0] = useState<string[]>([]);
    checkedKeys = checkedKeys0;
    setCheckedKeys = setCheckedKeys0;
  }

  const renderTreeKeyTitle = (key: string, value: any) => {
    let extra: ReactNode = undefined;
    const diff = differentParts?.[key];
    if (diff) {
      if (diff.mode === 'add') {
        extra = <Tag color={'green'}>新增</Tag>
      } else if (diff.mode === 'remove') {
        extra = <Tag color={'red'}>移除</Tag>
      } else if (diff.mode === 'changed') {
        extra = <Tag color={'blue'}>修改</Tag>
      }
    }
    return <Space>
      <Text>{key}</Text>
      {extra}
    </Space>;
  }

  const renderCode = (
    key: string,
    value: WorkshopCommodityConfigItem,
    diff?: DifferentPart
  ) => {
    if (diff && diff.from && diff.to) {
      // 将 diff.from、diff.to 转成字符串后做高亮
      const fromStr = JSON.stringify(diff.from, null, 4);
      const toStr = JSON.stringify(diff.to, null, 4);

      return (
        <Paragraph>
          {highlightLineDiff(fromStr, toStr)}
        </Paragraph>
      );
    } else {
      // 如果没有 diff 信息，则直接输出
      return (
        <Paragraph>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify(value, null, 4)}
          </pre>
        </Paragraph>
      );
    }
  };

  const treeData: TreeDataNode[] = Object.entries(fullJson.items).map(([key, value]) => {
    return {
      title: renderTreeKeyTitle(key, value),
      diff: differentParts?.[key],
      key: key,
      disableCheckbox: differentParts === undefined || (differentParts && !differentParts[key]),
      children: [
        {
          title: renderCode(key, value, differentParts?.[key]),
          key: key + "_data",
          checkable: false
        }
      ]
    }
  }).sort((a, b) => {
    const priorityA = a.diff?.mode ? modePriority[a.diff?.mode] : undefined;
    const priorityB = b.diff?.mode ? modePriority[b.diff?.mode] : undefined;

    if (priorityA !== undefined && priorityB !== undefined) {
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // 如果 mode 相同，则根据 key 排序
      return a.key.localeCompare(b.key);
    } else if (priorityA !== undefined) {
      // 如果只有 A 的 mode 优先级存在，则 A 排在前面
      return -1;
    } else if (priorityB !== undefined) {
      // 如果只有 B 的 mode 优先级存在，则 B 排在前面
      return 1;
    } else {
      // 如果两个 mode 优先级都不存在，则根据 key 排序
      return a.key.localeCompare(b.key);
    }
  });

  useEffect(() => {
    if (checkable) {
      setCheckedKeys!(Object.keys(fullJson.items));
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

export default WorkshopTree;