import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty } from '../commonFormat';
import { NOTION_DATABASE_COMMODITY } from './commodityNotionQueries';
import { NotionPage } from '../../notion/notionTypes';

export async function fetchCommodityNameMap(): Promise<Record<string, string>> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('尚未设置 Notion Token');
  }

  const pages: NotionPage[] = await fetchNotionAllPages(NOTION_DATABASE_COMMODITY, {});
  const map: Record<string, string> = {};
  for (const page of pages) {
    const id = String(flatProperty(page.properties['typeId']) || '');
    const name = String(
      flatProperty(page.properties['wikiDisplayName']) ||
      flatProperty(page.properties['translateKey']) ||
      ''
    );
    if (id && name) {
      map[id] = name;
    }
  }
  return map;
}
