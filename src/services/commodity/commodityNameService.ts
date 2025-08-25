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
    const idProp = page.properties['typeId'];
    const nameProp =
      page.properties['wikiDisplayName'] || page.properties['translateKey'];

    if (!idProp || !nameProp) continue;

    const id = String(flatProperty(idProp) || '');
    const name = String(flatProperty(nameProp) || '');
    if (id && name) {
      map[id] = name;
    }
  }
  return map;
}
