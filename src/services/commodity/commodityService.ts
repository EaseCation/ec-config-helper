import { NotionPage } from '../../notion/notionTypes';


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

/**
 * 生成 Commodity JSON
 */
export function formatCommodity(pages: NotionPage[]): Record<string, any> {
  const result = {
    _comment: 'Commodity total categories, auto-generated.',
    types: [] as any[]
  };

  // 使用类似于 rawToFullResult 的逻辑，把每条 page 的所有 properties 进行扁平化处理
  for (const page of pages) {
    // 准备一个临时对象 data，用来保存各个字段的扁平化结果
    const data: Record<string, string | number> = {};

    // 遍历 page.properties
    for (const [propName, propValue] of Object.entries(page.properties)) {
      // 调用 flatDatabaseProperty 得到可读字符串/数值
      data[propName] = flatDatabaseProperty(propValue);
    }

    const typeId =  data['typeId']
    const e: any = {
      typeId: typeId,
      generic: {
        translateKey: data['translateKey']
      }
    };
    // 如果 fallback完整商品ID 存在且不为空，则添加 exchange 字段
    if (data["fallback完整商品ID"]) {
      e.exchange = {
        fallbackExchange: {
          key: "workshop_fallback_type_" + typeId,
          gain: data["fallback完整商品ID"] + ":" + data["fallback商品数量"]
        }
      };
    }

    // 推入 result.data
    result.types.push(e);
  }

  return result;
}