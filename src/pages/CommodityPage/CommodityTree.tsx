import { Empty, Typography } from "antd";
import React from "react";
import { DifferentParts, CommodityData } from "../../services/commodity/compareCommodityData";
import { formatDuration } from "../../utils/timeFormat";

const { Paragraph } = Typography;

export interface CommodityTreeProps {
  fullJson: CommodityData;
  differentParts?: DifferentParts;
}

// 🔹 计算高亮颜色
const getItemStyle = (type?: "added" | "deleted" | "modified" | "common") => {
  if (type === "added")
    return { backgroundColor: "rgba(40, 167, 69, 0.2)", borderRadius: "4px", padding: "4px" };
  if (type === "deleted")
    return { backgroundColor: "rgba(220, 53, 69, 0.2)", borderRadius: "4px", padding: "4px" };
  if (type === "modified")
    return { backgroundColor: "rgba(0, 123, 255, 0.2)", borderRadius: "4px", padding: "4px" };
  // Default style for common items
  return { padding: "4px" }; // No background for common items
};

// 🔹 递归渲染 JSON
const renderValue = (value: any, type?: "added" | "deleted" | "modified" | "common"): React.ReactNode => {
  if (typeof value === "string") return <span style={getItemStyle(type)}>"{value}"</span>;
  if (typeof value === "number") return <span style={getItemStyle(type)}>{value}</span>;
  if (value === null) return "null";

  if (Array.isArray(value)) {
    return (
      <>
        {"["}
        {value.map((item, index) => (
          <div key={index} style={{ paddingLeft: 30, ...getItemStyle(item._type || type) }}>
            {renderValue(item, item._type || type)} {/* use _type if available, otherwise fallback to type */}
            {index < value.length - 1 ? "," : ""}
          </div>
        ))}
        {"]"}
      </>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <>
        {"{"}
        {Object.entries(value)
          .filter(([key]) => key !== "_type")
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

const CommodityTree: React.FC<CommodityTreeProps> = ({ fullJson, differentParts }) => {
  if (!fullJson || !fullJson.types || fullJson.types.length === 0)
    return <Empty style={{ marginTop: 80 }} description="Notion 数据为空" />;

  let processedJson = JSON.parse(JSON.stringify(fullJson));

  if (differentParts) {
    processedJson.types = [
      ...differentParts.deletedItems.map((item) => ({ ...item, _type: "deleted" })),
      ...differentParts.addedItems.map((item) => ({ ...item, _type: "added" })),
      ...differentParts.modifiedItems.map((item) => ({ ...item, _type: "modified" })),
      ...differentParts.commonItems.map((item) => ({ ...item, _type: "common" })), // Include commonItems without special highlight
    ];
  }

  // 🔹 格式化特定商品的 gain 字段，将秒数转换为可读时间
  const prefixes = ["prefix", "ornament.", "pet.", "music.", "zb."];
  processedJson.types.forEach((item: any) => {
    const gain = item?.exchange?.fallbackExchange?.gain;
    if (gain && typeof gain === "string") {
      const [id, value] = gain.split(":");
      const seconds = Number(value);
      if (!Number.isNaN(seconds) && prefixes.some((p) => id.startsWith(p))) {
        const human = formatDuration(seconds);
        item.exchange.fallbackExchange.gain =
          human === "永久" ? `${id}:${human}` : `${id}:${seconds}(${human})`;
      }
    }
  });

  return (
    <Paragraph>
      <pre
        style={{
          background: "#1e1e1e",
          color: "#ffffff",
          padding: "12px",
          borderRadius: "8px",
          overflowX: "auto",
          fontSize: 14
        }}
      >
        {renderValue(processedJson)}
      </pre>
    </Paragraph>
  );
};

export default CommodityTree;