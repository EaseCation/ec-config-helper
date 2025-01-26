import { NotionQueryBody } from './notionTypes';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const NOTION_TOKEN_KEY = 'NOTION_TOKEN';

// 工具函数：获取当前用户存储的 notion token
export function getNotionToken(): string | null {
  return localStorage.getItem(NOTION_TOKEN_KEY) || null;
}

/**
 * 用 fetch 调用 notion 代理地址
 */
export async function notionQueryDatabase(
  databaseId: string,
  body: NotionQueryBody
): Promise<{ results: PageObjectResponse[]; has_more: boolean; next_cursor?: string }> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('未设置Notion Token');
  }

  // 注意，这里是调用你的代理地址
  const url = `https://notion.boybook.workers.dev/https://api.notion.com/v1/databases/${databaseId}/query`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Notion API Error ${resp.status}: ${text}`);
  }
  return resp.json();
}

/**
 * 分页获取所有页面
 */
export async function fetchNotionAllPages(
  databaseId: string,
  initialBody: NotionQueryBody
): Promise<PageObjectResponse[]> {
  let all: PageObjectResponse[] = [];
  let hasMore = true;
  let nextCursor: string | undefined = undefined;

  while (hasMore) {
    const body: any = {
      ...initialBody,
      start_cursor: nextCursor
    };

    const { results, has_more, next_cursor } = await notionQueryDatabase(databaseId, body);
    all = all.concat(results);
    hasMore = has_more;
    nextCursor = next_cursor;
  }
  return all;
}