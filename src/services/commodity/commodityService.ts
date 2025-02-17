import { message } from 'antd';
import { NotionQueryBody } from '../../notion/notionTypes';
import { getNotionToken, fetchNotionAllPages } from '../../notion/notionClient';

interface NotionProperty {
  [key:string]:any
}

/**
 * 将 Notion 返回的属性数据扁平化为字符串或数字
 * @param data 原始属性结构
 * @returns string | number
 */
export function flatDatabaseProperty(data: NotionProperty): string | number {
  if (!data?.type) {
    console.error(
      "Property has no 'type':",
      JSON.stringify(data, null, 2)
    );
    return "";
  }

  switch (data.type) {
    case "checkbox":
      return data.checkbox ? "Yes" : "No";

    case "created_time":
      return data.created_time || "";

    case "date": {
      const start = data.date?.start || "";
      const end = data.date?.end || "";
      return end ? `${start} - ${end}` : start;
    }

    case "email":
      return data.email || "";

    case "files": {
      const files = data.files || [];
      const fileNames = files.map((file: any) => file.name);
      return fileNames.join(", ");
    }

    case "formula": {
      const formulaType = data.formula?.type;
      switch (formulaType) {
        case "boolean":
          return data.formula.boolean ? "Yes" : "No";
        case "date": {
          const fStart = data.formula.date?.start || "";
          const fEnd = data.formula.date?.end || "";
          return fEnd ? `${fStart} - ${fEnd}` : fStart;
        }
        case "number":
          return data.formula.number ?? 0;
        case "string":
          return data.formula.string || "";
        default:
          return "Unknown Formula Type";
      }
    }

    case "last_edited_by":
      // 具体结构可能需要改，根据实际 Notion 返回值
      return data.last_edited_by?.name || "";

    case "last_edited_time":
      return data.last_edited_time || "";

    case "multi_select": {
      const multiSelect = data.multi_select || [];
      return multiSelect.map((item: any) => item.name).join(", ");
    }

    case "number":
      return data.number ?? 0;

    case "people": {
      const people = data.people || [];
      return people.map((p: any) => p.name).join(", ");
    }

    case "phone_number":
      return data.phone_number || "";

    case "relation": {
      const relation = data.relation || [];
      return relation.map((item: any) => item.id).join(", ");
    }

    case "rollup": {
      const rollupArr = data.rollup?.array || [];
      const rollupValues = rollupArr.map((item: any) => {
        switch (item.type) {
          case "text":
            return item.text?.[0]?.plain_text || "";
          case "checkbox":
            return item.checkbox ? "Yes" : "No";
          case "number":
            return item.number ?? 0;
          case "formula":
            if (item.formula?.type === "string") {
              return item.formula.string;
            } else if (item.formula?.type === "number") {
              return item.formula.number ?? 0;
            } else {
              return JSON.stringify(item.formula);
            }
          default:
            return "";
        }
      });
      return rollupValues.join(", ");
    }

    case "rich_text": {
      const texts = data.rich_text || [];
      return texts.map((t: any) => t.plain_text).join("");
    }

    case "select":
      return data.select?.name || "";

    case "status":
      return data.status?.name || "";

    case "title": {
      const titles = data.title || [];
      return titles.map((t: any) => t.plain_text).join("");
    }

    case "url":
      return data.url || "";

    default:
      console.error("Unknown Type:", data.type);
      return `Unknown Type ${data.type}`;
  }
}

const body: NotionQueryBody = {
  sorts: [
    {
      property: "typeId",
      direction: "ascending",
    },
  ],
};

/**
 * 生成 Commodity JSON
 */
export const formatCommodity = async (databaseId: string) => {
  if (!databaseId) {
    throw new Error("请先输入 Commodity 数据库 ID");
  }

  const token = getNotionToken();
  if (!token) {
    throw new Error("尚未设置 Notion Token");
  }

  const result = {
    _comment: "Commodity total categories, auto-generated.",
    types: [] as any[],
  };

  try {
    // 1. 获取全部 commodity 页面
    const pages: any[] = await fetchNotionAllPages(databaseId, body);

    // 确保 pages 是数组，否则报错
    if (!Array.isArray(pages)) {
      throw new Error("从 Notion 获取的 Commodity 数据异常");
    }

    // 遍历 pages，将每条数据转换为 JSON 结构
    for (const page of pages) {
      if (!page || typeof page !== "object" || !page.properties) continue;

      // 临时对象 data，保存扁平化的字段
      const data: Record<string, string | number> = {};

      // 遍历 page.properties，进行扁平化处理
      for (const [propName, propValue] of Object.entries(
        page.properties as Record<string, any>
      )) {
        data[propName] = flatDatabaseProperty(propValue);
      }

      const typeId = data["typeId"];
      if (!typeId) continue; // 确保 typeId 存在

      const commodityItem: any = {
        typeId: typeId,
        generic: {
          translateKey: data["translateKey"] || "",
        },
      };

      // 如果 fallback完整商品ID 存在且不为空，则添加 exchange 字段
      if (data["fallback完整商品ID"]) {
        commodityItem.exchange = {
          fallbackExchange: {
            key: `workshop_fallback_type_${typeId}`,
            gain: `${data["fallback完整商品ID"]}:${data["fallback商品数量"]}`,
          },
        };
      }

      // 推入 result.types
      result.types.push(commodityItem);
    }
  } catch (err) {
    console.error("生成 Commodity JSON 失败:", err);
    throw new Error(`生成失败: ${(err as Error).message}`);
  }

  return result;
};
