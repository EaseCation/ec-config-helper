import { NotionQueryBody } from './notionTypes';
import {
  PageObjectResponse,
  BlockObjectResponse,
  DatabaseObjectResponse,
  ListBlockChildrenResponse,
  CreatePageParameters,
  UpdatePageParameters,
  SearchParameters,
  SearchResponse,
} from '@notionhq/client/build/src/api-endpoints';

const NOTION_TOKEN_KEY = 'NOTION_TOKEN';
const NOTION_PROXY_BASE = 'https://notion.boybook.workers.dev/https://api.notion.com/v1';

// 内存中的 token（用于 Node.js 环境）
let memoryToken: string | null = null;

// 工具函数：获取当前用户存储的 notion token
export function getNotionToken(): string | null {
  // 优先使用内存中的 token（Node.js 环境）
  if (memoryToken) return memoryToken;
  // 浏览器环境使用 localStorage
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(NOTION_TOKEN_KEY) || null;
  }
  return null;
}

// 手动设置 token（用于 Node.js 环境或测试）
export function setNotionToken(token: string | null): void {
  memoryToken = token;
}

/**
 * 通用请求函数
 */
async function notionRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: object;
  } = {}
): Promise<T> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('未设置Notion Token');
  }

  const { method = 'GET', body } = options;
  const url = `${NOTION_PROXY_BASE}${endpoint}`;

  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      'Authorization': `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Notion API Error ${resp.status}: ${text}`);
  }
  return resp.json();
}

/**
 * 用 fetch 调用 notion 代理地址查询数据库
 */
export async function notionQueryDatabase(
  databaseId: string,
  body: NotionQueryBody
): Promise<{ results: PageObjectResponse[]; has_more: boolean; next_cursor?: string }> {
  return notionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body,
  });
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
    const body: NotionQueryBody = {
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

// ==================== Page API ====================

/**
 * 获取单个 Page
 * https://developers.notion.com/reference/retrieve-a-page
 */
export async function notionGetPage(pageId: string): Promise<PageObjectResponse> {
  return notionRequest<PageObjectResponse>(`/pages/${pageId}`);
}

/**
 * 创建 Page
 * https://developers.notion.com/reference/post-page
 */
export async function notionCreatePage(
  params: CreatePageParameters
): Promise<PageObjectResponse> {
  return notionRequest<PageObjectResponse>('/pages', {
    method: 'POST',
    body: params,
  });
}

/**
 * 更新 Page 属性
 * https://developers.notion.com/reference/patch-page
 */
export async function notionUpdatePage(
  pageId: string,
  params: Omit<UpdatePageParameters, 'page_id'>
): Promise<PageObjectResponse> {
  return notionRequest<PageObjectResponse>(`/pages/${pageId}`, {
    method: 'PATCH',
    body: params,
  });
}

// ==================== Block API ====================

/**
 * 获取 Block 的子 Block 列表
 * https://developers.notion.com/reference/get-block-children
 */
export async function notionGetBlockChildren(
  blockId: string,
  options?: { start_cursor?: string; page_size?: number }
): Promise<ListBlockChildrenResponse> {
  const params = new URLSearchParams();
  if (options?.start_cursor) params.set('start_cursor', options.start_cursor);
  if (options?.page_size) params.set('page_size', String(options.page_size));
  const query = params.toString() ? `?${params.toString()}` : '';
  return notionRequest<ListBlockChildrenResponse>(`/blocks/${blockId}/children${query}`);
}

/**
 * 获取 Page 的所有内容 Block（自动分页）
 */
export async function fetchNotionPageContent(pageId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let hasMore = true;
  let nextCursor: string | undefined = undefined;

  while (hasMore) {
    const response: ListBlockChildrenResponse = await notionGetBlockChildren(pageId, { start_cursor: nextCursor });
    blocks.push(...(response.results as BlockObjectResponse[]));
    hasMore = response.has_more;
    nextCursor = response.next_cursor ?? undefined;
  }
  return blocks;
}

/**
 * 获取单个 Block
 * https://developers.notion.com/reference/retrieve-a-block
 */
export async function notionGetBlock(blockId: string): Promise<BlockObjectResponse> {
  return notionRequest<BlockObjectResponse>(`/blocks/${blockId}`);
}

// ==================== Database API ====================

/**
 * 获取 Database 元数据
 * https://developers.notion.com/reference/retrieve-a-database
 */
export async function notionGetDatabase(databaseId: string): Promise<DatabaseObjectResponse> {
  return notionRequest<DatabaseObjectResponse>(`/databases/${databaseId}`);
}

// ==================== Search API ====================

/**
 * 搜索 Notion（支持搜索 Page 和 Database）
 * https://developers.notion.com/reference/post-search
 */
export async function notionSearch(params: SearchParameters): Promise<SearchResponse> {
  return notionRequest<SearchResponse>('/search', {
    method: 'POST',
    body: params,
  });
}