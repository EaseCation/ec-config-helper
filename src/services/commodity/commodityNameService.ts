import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty } from '../commonFormat';
import { NOTION_DATABASE_TRANSLATION } from './translationNotionQueries';
import { NotionPage } from '../../notion/notionTypes';

export async function fetchCommodityNameMap(): Promise<Record<string, string>> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('尚未设置 Notion Token');
  }

  const pages: NotionPage[] = await fetchNotionAllPages(NOTION_DATABASE_TRANSLATION, {});
  const map: Record<string, string> = {};
  
  for (const page of pages) {
    // 从"商品完整ID"属性获取ID
    const idProp = page.properties['商品完整ID'];
    // 从"名称"属性获取名称
    const nameProp = page.properties['名称'];

    if (!idProp || !nameProp) continue;

    const id = String(flatProperty(idProp) || '');
    const name = String(flatProperty(nameProp) || '');

    // music 类型商品不使用 Notion 名称
    if (id.startsWith('music.')) continue;

    if (id && name) {
      map[id] = name;
    }
  }
  
  if (Object.keys(map).length > 0) {
    const sampleId = Object.keys(map)[0];
    const sampleName = map[sampleId];
  }
  
  // 特殊处理：coin 和 exp 的翻译
  map['coin'] = 'EC币';
  map['exp'] = '大厅经验';
  
  return map;
}


