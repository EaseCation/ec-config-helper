import React from "react";
import { Empty, Typography } from "antd";
import { LotteryConfigItem } from "../../services/lottery/lotteryNotionQueries";

const { Text } = Typography;

interface EnhancedLotteryConfigItem extends LotteryConfigItem {
  _type?: "added" | "deleted"; // 仅用于标记，不展示在最终 JSON
}

interface LotteryJsonViewerProps {
  fullJson: any;
  differentParts?: {
    addedItems?: LotteryConfigItem[];
    deletedItems?: LotteryConfigItem[];
    commonItems?: LotteryConfigItem[];
  };
}

// **获取背景颜色样式**
const getItemStyle = (type?: "added" | "deleted") => {
  if (type === "added") return { backgroundColor: "rgba(40, 167, 69, 0.2)", borderRadius: "4px", padding: "4px" };
  if (type === "deleted") return { backgroundColor: "rgba(220, 53, 69, 0.2)", borderRadius: "4px", padding: "4px" };
  return {}; // 默认无样式
};

// **递归渲染 JSON 并隐藏 _type**
const renderValue = (value: any, type?: "added" | "deleted"): React.ReactNode => {
  if (typeof value === "string") return <span>"{value}"</span>;
  if (typeof value === "number") return <span>{value}</span>;
  if (value === null) return "null";

  if (Array.isArray(value)) {
    return (
      <>
        {"["}
        {value.map((item, index) => {
          if (typeof item === "object" && item !== null) {
            const { _type, ...filteredItem } = item; // **去除 _type**
            return (
              <div key={index} style={{ paddingLeft: 20, ...getItemStyle(_type) }}>
                {renderValue(filteredItem)}
                {index < value.length - 1 ? "," : ""}
              </div>
            );
          }
          return (
            <div key={index} style={{ paddingLeft: 20 }}>
              {renderValue(item)}
              {index < value.length - 1 ? "," : ""}
            </div>
          );
        })}
        {"]"}
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <>
        {"{"}
        {Object.entries(value)
          .filter(([key]) => key !== "_type") // **隐藏 _type**
          .map(([key, val], index, arr) => (
            <div key={key} style={{ paddingLeft: 20 }}>
              "{key}": {renderValue(val, type)}
              {index < arr.length - 1 ? "," : ""}
            </div>
          ))}
        {"}"}
      </>
    );
  }

  return JSON.stringify(value);
};

export const LotteryJsonViewer: React.FC<LotteryJsonViewerProps> = ({ fullJson, differentParts }) => {
  if (!fullJson) return <Empty style={{ marginTop: 80 }} description="Notion 数据为空" />;

  // **如果 differentParts 为空或没有数据，直接渲染 fullJson**
  const noChanges =
    !differentParts ||
    (!differentParts.addedItems?.length && !differentParts.deletedItems?.length && !differentParts.commonItems?.length);

  if (noChanges) {
    return (
      <div style={{ background: "#282c34", padding: 16, borderRadius: 8, color: "#fff", overflowX: "auto" }}>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", margin: 0 }}>
          {renderValue(fullJson)}
        </pre>
      </div>
    );
  }

  // **深拷贝 JSON 避免污染原始数据**
  const processedJson = JSON.parse(JSON.stringify(fullJson));

  // **找到包含 `gain` 的对象**
  Object.keys(processedJson).forEach((key) => {
    if (typeof processedJson[key] === "object" && processedJson[key] !== null && Array.isArray(processedJson[key].gain)) {
      processedJson[key].gain = [
        ...(differentParts.deletedItems?.map((item) => ({ ...item, _type: "deleted" })) || []),
        ...(differentParts.addedItems?.map((item) => ({ ...item, _type: "added" })) || []),
        ...(differentParts.commonItems?.map((item) => ({ ...item, _type: undefined })) || []),
      ];
    }
  });

  return (
    <div style={{ background: "#282c34", padding: 16, borderRadius: 8, color: "#fff", overflowX: "auto" }}>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", margin: 0 }}>
        {"{"}
        {Object.entries(processedJson).map(([key, value], index, arr) => {
          if (typeof value === "object" && value !== null && "gain" in value && Array.isArray(value.gain)) {
            return (
              <div key={key} style={{ paddingLeft: 20 }}>
                "{key}": {"{"}
                <div style={{ paddingLeft: 20 }}>
                  "gain": [
                  {(value.gain as EnhancedLotteryConfigItem[]).map((item, idx) => {
                    const { _type, ...filteredItem } = item; // **去除 _type**
                    return (
                      <div key={idx} style={{ ...getItemStyle(_type), paddingLeft: 20 }}>
                        {renderValue(filteredItem)}
                        {idx < (value.gain as EnhancedLotteryConfigItem[]).length - 1 ? "," : ""}
                      </div>
                    );
                  })}
                  ]
                </div>
                {"}"}
                {index < arr.length - 1 ? "," : ""}
              </div>
            );
          }

          return (
            <div key={key} style={{ paddingLeft: 20 }}>
              "{key}": {renderValue(value)}
              {index < arr.length - 1 ? "," : ""}
            </div>
          );
        })}
        {"}"}
      </pre>
    </div>
  );
};
