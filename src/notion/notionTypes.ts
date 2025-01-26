import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type NotionPage = PageObjectResponse;

export type NotionProperties = Record<string, NotionPropertyValue>;

export type NotionPropertyValue = PageObjectResponse['properties'][string];

/** 用于表达 notion 查询请求体 */
export interface NotionQueryBody {
  filter?: any; // notion 的 filter 结构
  sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>;
  start_cursor?: string;
  page_size?: number;
}