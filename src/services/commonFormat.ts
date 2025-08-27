import { NotionPropertyValue } from '../notion/notionTypes';

export function flatProperty(data: NotionPropertyValue): string | boolean | number | null {
  switch (data.type) {
    case 'checkbox':
      return parseCheckbox(data);
    case 'created_time':
      return parseCreatedTime(data);
    case 'date':
      return parseDate(data);
    case 'email':
      return parseEmail(data);
    case 'files':
      return parseFiles(data);
    case 'formula':
      return parseFormula(data);
    case 'last_edited_by':
      return parseLastEditedBy(data);
    case 'last_edited_time':
      return parseLastEditedTime(data);
    case 'multi_select':
      return parseMultiSelect(data);
    case 'number':
      return parseNumber(data);
    case 'people':
      return parsePeople(data);
    case 'phone_number':
      return parsePhoneNumber(data);
    case 'relation':
      return parseRelation(data);
    case 'rollup':
      return parseRollup(data);
    case 'rich_text':
      return parseRichText(data);
    case 'select':
      return parseSelect(data);
    case 'status':
      return parseStatus(data);
    case 'title':
      return parseTitle(data);
    case 'url':
      return parseUrl(data);
    default:
      console.error(`Unknown property type: ${data.type}`);
      return `Unknown Type ${data.type}`;
  }
}

export class NotionPropertyParseError extends Error {
  public data: NotionPropertyValue;
  constructor(message: string, data: NotionPropertyValue) {
    super(message);
    this.name = 'NotionPropertyParseError';
    this.data = data;
    console.error(data);
  }
}

/** 解析 checkbox: "Yes" or "No" */
export function parseCheckbox(data: NotionPropertyValue): boolean {
  if (data.type !== 'checkbox') {
    throw new NotionPropertyParseError('parseCheckbox: Not a checkbox property', data);
  }
  return data.checkbox;
}

/** created_time -> 直接返回时间字符串 */
export function parseCreatedTime(data: NotionPropertyValue): string {
  if (data.type !== 'created_time') {
    throw new NotionPropertyParseError('parseCreatedTime: Not a created_time property', data);
  }
  return data.created_time;
}

/** date -> "start - end" */
export function parseDate(data: NotionPropertyValue): string {
  if (data.type !== 'date') {
    throw new NotionPropertyParseError('parseDate: Not a date property', data);
  }
  const start = data.date?.start ?? '';
  const end = data.date?.end ? ` - ${data.date.end}` : '';
  return start + end;
}

/** email -> 直接返回 email */
export function parseEmail(data: NotionPropertyValue): string {
  if (data.type !== 'email') {
    throw new NotionPropertyParseError('parseEmail: Not a email property', data);
  }
  return data.email ?? '';
}

/** files -> 取 file.name 组合成逗号分隔 */
export function parseFiles(data: NotionPropertyValue): string | null {
  if (data.type !== 'files') {
    throw new NotionPropertyParseError('parseFiles: Not a files property', data);
  }
  return data.files.map((f) => f.name).join(', ');
}

/** formula -> 根据 formula.type 区分 boolean, date, number, string */
export function parseFormula(data: NotionPropertyValue): string | boolean | number | null {
  if (data.type !== 'formula') {
    throw new NotionPropertyParseError('parseFormula: Not a formula property', data);
  }
  const f = data.formula;
  if (f.type === 'string') {
    return f.string;
  } else if (f.type === 'number') {
    return f.number;
  } else if (f.type === 'date') {
    return f.date?.start ?? null;
  } else if (f.type === 'boolean') {
    return f.boolean;
  } else {
    throw new NotionPropertyParseError('parseFormula: Unknown formula type', data);
  }
}

/** last_edited_by -> user name */
export function parseLastEditedBy(data: NotionPropertyValue): string | null {
  if (data.type !== 'last_edited_by') {
    throw new NotionPropertyParseError('parseLastEditedBy: Not a last_edited_by property', data);
  }
  // Notion user object => 取 name
  return data.last_edited_by?.id ?? null;
}

/** last_edited_time -> 直接返回日期 */
export function parseLastEditedTime(data: NotionPropertyValue): string {
  if (data.type !== 'last_edited_time') {
    throw new NotionPropertyParseError('parseLastEditedTime: Not a last_edited_time property', data);
  }
  return data.last_edited_time;
}

/** multi_select -> 用逗号拼接 item.name */
export function parseMultiSelect(data: NotionPropertyValue): string {
  if (data.type !== 'multi_select') {
    throw new NotionPropertyParseError('parseMultiSelect: Not a multi_select property', data);
  }
  return data.multi_select.map((item) => item.name).join(', ');
}

/** number -> 转字符串 */
export function parseNumber(data: NotionPropertyValue): number | null {
  if (data.type === 'rich_text') {
    const richText = parseRichText(data);
    return richText ? Number(richText) : null;
  }
  if (data.type !== 'number') {
    throw new NotionPropertyParseError('parseNumber: Not a number property', data);
  }
  return data.number;
}

/** people -> 用逗号拼接每个 user.name */
export function parsePeople(data: NotionPropertyValue): string {
  if (data.type !== 'people') {
    throw new NotionPropertyParseError('parsePeople: Not a people property', data);
  }
  return data.people.map((p) => p.id).join(', ');
}

/** phone_number -> 直接返回 */
export function parsePhoneNumber(data: NotionPropertyValue): string {
  if (data.type !== 'phone_number') {
    throw new NotionPropertyParseError('parsePhoneNumber: Not a phone_number property', data);
  }
  return data.phone_number ?? '';
}

/** relation -> 拼接 relation[].id */
export function parseRelation(data: NotionPropertyValue): string {
  if (data.type !== 'relation') {
    throw new NotionPropertyParseError('parseRelation: Not a relation property', data);
  }
  return data.relation.map((r) => r.id).join(', ');
}

/** rollup -> 如果 type=array，则处理里面每个 item */
export function parseRollup(data: NotionPropertyValue): string {
  if (data.type !== 'rollup' || data.rollup.type !== 'array') {
    throw new NotionPropertyParseError('parseRollup: Not a rollup array property', data);
  }
  const arr = data.rollup.array;
  return arr
    .map((item) => {
      // item 也有 type
      switch (item.type) {
        case 'rich_text':
          return parseRichText(item as NotionPropertyValue);
        case 'checkbox':
          return parseCheckbox(item as NotionPropertyValue);
        case 'number':
          return parseNumber(item as NotionPropertyValue)
        case 'formula':
          return parseFormula(item as NotionPropertyValue);
        // ... 其他类型可自行补充
        default:
          return '';
      }
    })
    .join(', ');
}

/** rollup checkbox -> 读取 rollup 数组的第一个元素并解析为布尔值 */
export function parseRollupBoolean(data: NotionPropertyValue): boolean {
  if (data.type !== 'rollup' || data.rollup.type !== 'array') {
    throw new NotionPropertyParseError('parseRollupBoolean: Not a rollup array property', data);
  }
  const arr = data.rollup.array;
  if (arr.length === 0) return false;
  const first = arr[0];
  if (first.type === 'checkbox') {
    return (first as any).checkbox as boolean;
  }
  // 退化处理：使用 parseRollup 拆解字符串并取首个值
  const text = parseRollup(data).split(',')[0]?.trim().toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === '1') return true;
  if (text === '0') return false;
  return Boolean(text);
}

/** rich_text -> 拼接 rich_text[].plain_text */
export function parseRichText(data: NotionPropertyValue): string | null {
  if (data.type !== 'rich_text') {
    throw new NotionPropertyParseError('parseRichText: Not a rich_text property', data);
  }
  if (data.rich_text.length === 0) return null;
  return data.rich_text.map((rt) => rt.plain_text).join('');
}

/** select -> select.name */
export function parseSelect(data: NotionPropertyValue): string | null {
  if (data.type !== 'select') {
    throw new NotionPropertyParseError('parseSelect: Not a select property', data);
  }
  return data.select?.name ?? null;
}

/** status -> status.name */
export function parseStatus(data: NotionPropertyValue): string | null {
  if (data.type !== 'status') {
    throw new NotionPropertyParseError('parseStatus: Not a status property', data);
  }
  return data.status?.name ?? null;
}

/** title -> 拼接 title[].plain_text */
export function parseTitle(data: NotionPropertyValue): string {
  if (data.type !== 'title') {
    throw new NotionPropertyParseError('parseTitle: Not a title property', data);
  }
  return data.title.map((t) => t.plain_text).join('');
}

/** url -> data.url */
export function parseUrl(data: NotionPropertyValue): string | null {
  if (data.type !== 'url') {
    throw new NotionPropertyParseError('parseUrl: Not a url property', data);
  }
  return data.url;
}