// import { Empty, Typography, Collapse } from "antd";
// import React from "react";
// import { DifferentParts, CommodityData } from "../../services/commodity/compareCommodityData";

// const { Paragraph } = Typography;
// const { Panel } = Collapse;

// export interface CommodityTreeProps {
//   fullJson: CommodityData;
//   differentParts?: DifferentParts;
// }

// // 🔹 计算高亮颜色
// const getItemStyle = (type?: "added" | "deleted" | "modified" | "common") => {
//   if (type === "added")
//     return { backgroundColor: "rgba(40, 167, 69, 0.2)", borderRadius: "4px", padding: "4px" };
//   if (type === "deleted")
//     return { backgroundColor: "rgba(220, 53, 69, 0.2)", borderRadius: "4px", padding: "4px" };
//   if (type === "modified")
//     return { backgroundColor: "rgba(0, 123, 255, 0.2)", borderRadius: "4px", padding: "4px" };
//   // Default style for common items
//   return { padding: "4px" }; // No background for common items
// };

// // 🔹 递归渲染 JSON
// const renderValue = (value: any, type?: "added" | "deleted" | "modified" | "common"): React.ReactNode => {
//   if (typeof value === "string") return <span style={getItemStyle(type)}>"{value}"</span>;
//   if (typeof value === "number") return <span style={getItemStyle(type)}>{value}</span>;
//   if (value === null) return "null";

//   if (Array.isArray(value)) {
//     return (
//       <>
//         {"["}
//         {value.map((item, index) => (
//           <div key={index} style={{ paddingLeft: 50, ...getItemStyle(item._type || type) }}>
//             {renderValue(item, item._type || type)} {/* use _type if available, otherwise fallback to `type` */}
//             {index < value.length - 1 ? "," : ""}
//           </div>
//         ))}
//         {"]"}
//       </>
//     );
//   }

//   if (typeof value === "object" && value !== null) {
//     return (
//       <>
//         {"{"}
//         {Object.entries(value)
//           .filter(([key]) => key !== "_type")
//           .map(([key, val], index, arr) => (
//             <div key={key} style={{ paddingLeft: 20 }}>
//               "{key}": {renderValue(val, type)}
//               {index < arr.length - 1 ? "," : ""}
//             </div>
//           ))}
//         {"}"}
//       </>
//     );
//   }

//   return JSON.stringify(value);
// };

// const CommodityTree: React.FC<CommodityTreeProps> = ({ fullJson, differentParts }) => {
//   if (!fullJson || !fullJson.types || fullJson.types.length === 0)
//     return <Empty style={{ marginTop: 80 }} description="Notion 数据为空" />;

//   let processedJson = JSON.parse(JSON.stringify(fullJson));

//   if (differentParts) {
//     processedJson.types = [
//       ...differentParts.deletedItems.map((item) => ({ ...item, _type: "deleted" })),
//       ...differentParts.addedItems.map((item) => ({ ...item, _type: "added" })),
//       ...differentParts.modifiedItems.map((item) => ({ ...item, _type: "modified" })),
//       ...differentParts.commonItems.map((item) => ({ ...item, _type: "common" })), // Include commonItems without special highlight
//     ];
//   }

//   // Group items by their type for the collapse sections
//   const groupedByType = {
//     added: processedJson.types.filter(item => item._type === "added"),
//     deleted: processedJson.types.filter(item => item._type === "deleted"),
//     modified: processedJson.types.filter(item => item._type === "modified"),
//     common: processedJson.types.filter(item => item._type === "common"),
//   };

//   return (
//     <Paragraph>
//       <Collapse defaultActiveKey={['added', 'deleted', 'modified', 'common']}>
//         {/* Added Items */}
//         {groupedByType.added.length > 0 && (
//           <Panel header="新增项" key="added">
//             <pre
//               style={{
//                 background: "#1e1e1e",
//                 color: "#ffffff",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 overflowX: "auto",
//                 fontSize: 14,
//               }}
//             >
//               {renderValue(groupedByType.added)}
//             </pre>
//           </Panel>
//         )}
        
//         {/* Deleted Items */}
//         {groupedByType.deleted.length > 0 && (
//           <Panel header="移除项" key="deleted">
//             <pre
//               style={{
//                 background: "#1e1e1e",
//                 color: "#ffffff",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 overflowX: "auto",
//                 fontSize: 14,
//               }}
//             >
//               {renderValue(groupedByType.deleted)}
//             </pre>
//           </Panel>
//         )}

//         {/* Modified Items */}
//         {groupedByType.modified.length > 0 && (
//           <Panel header="修改项" key="modified">
//             <pre
//               style={{
//                 background: "#1e1e1e",
//                 color: "#ffffff",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 overflowX: "auto",
//                 fontSize: 14,
//               }}
//             >
//               {renderValue(groupedByType.modified)}
//             </pre>
//           </Panel>
//         )}

//         {/* Common Items */}
//         {groupedByType.common.length > 0 && (
//           <Panel header="常规项" key="common">
//             <pre
//               style={{
//                 background: "#1e1e1e",
//                 color: "#ffffff",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 overflowX: "auto",
//                 fontSize: 14,
//               }}
//             >
//               {renderValue(groupedByType.common)}
//             </pre>
//           </Panel>
//         )}
//       </Collapse>
//     </Paragraph>
//   );
// };

// export default CommodityTree;
