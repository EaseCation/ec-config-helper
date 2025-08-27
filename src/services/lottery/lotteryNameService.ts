import { fetchNotionAllPages, getNotionToken } from '../../notion/notionClient';
import { flatProperty, parseRelation, parseRichText, parseTitle } from '../commonFormat';
import { NOTION_DATABASE_LOTTERY, NOTION_DATABASE_LOTTERY_BOX_CONFIG } from './lotteryNotionQueries';
import { NotionPage } from '../../notion/notionTypes';

/**
 * 抽奖箱配置信息接口
 */
interface LotteryBoxConfig {
  id: string;           // 抽奖箱id
  name: string;         // 抽奖箱名称
  openMethod: string;   // 抽奖箱开启方式/次
  fallback: string;     // 保底
}

/**
 * 从抽奖箱配置数据库获取抽奖箱信息
 * @returns Promise<{configs: Record<string, LotteryBoxConfig>, pageIdToConfig: Record<string, LotteryBoxConfig>}> 两个映射表
 */
async function fetchLotteryBoxConfigs(): Promise<{
  configs: Record<string, LotteryBoxConfig>;
  pageIdToConfig: Record<string, LotteryBoxConfig>;
}> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('尚未设置 Notion Token');
  }

  const pages: NotionPage[] = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY_BOX_CONFIG, {});
  const configs: Record<string, LotteryBoxConfig> = {};
  const pageIdToConfig: Record<string, LotteryBoxConfig> = {};
  for (const page of pages) {
    if (page.properties['禁用'] && flatProperty(page.properties['禁用'])) {
      continue;
    }

    const id = String(flatProperty(page.properties['抽奖箱id']) || '');
    let name = '';
    if (page.properties['抽奖箱名称']) {
      const nameProp = page.properties['抽奖箱名称'];
      if (nameProp.type === 'relation') {
        const relationIds = parseRelation(nameProp);
        name = relationIds;
      } else {
        name = String(flatProperty(nameProp) || '');
      }
    }

    const openMethod = String(flatProperty(page.properties['抽奖箱开启方式/次']) || '');
    const fallback = String(flatProperty(page.properties['保底']) || '');

    if (id && name) {
      const config = { id, name, openMethod, fallback };
      configs[id] = config;
      pageIdToConfig[page.id] = config;
    }
  }
  return { configs, pageIdToConfig };
}

/**
 * 获取抽奖箱名称映射表
 */
export async function fetchLotteryBoxNameMap(): Promise<Record<string, string>> {
  const token = getNotionToken();
  if (!token) {
    throw new Error('尚未设置 Notion Token');
  }
  const { configs: boxConfigs, pageIdToConfig } = await fetchLotteryBoxConfigs();
  const pages: NotionPage[] = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY, {});
  const map: Record<string, string> = {};

  for (const page of pages) {
    if (page.properties['禁用'] && flatProperty(page.properties['禁用'])) {
      continue;
    }
    const exchangeId = String(flatProperty(page.properties['exchange_id']) || '');
    let boxName = '';
    if (page.properties['所在抽奖箱']) {
      const prop = page.properties['所在抽奖箱'];
      if (prop.type === 'rich_text') {
        boxName = parseRichText(prop) || '';
      } else if (prop.type === 'title') {
        boxName = parseTitle(prop);
      } else if (prop.type === 'relation') {
        const relationIds = parseRelation(prop);
        const ids = relationIds.split(', ').filter(Boolean);
        for (const id of ids) {
          if (pageIdToConfig[id]) {
            boxName = pageIdToConfig[id].name;
            break;
          }
          if (boxConfigs[id]) {
            boxName = boxConfigs[id].name;
            break;
          }
        }
      }
    }
    if (!boxName && page.properties['抽奖箱名称']) {
      boxName = String(flatProperty(page.properties['抽奖箱名称']) || '');
    }
    if (!boxName && page.properties['名称']) {
      boxName = String(flatProperty(page.properties['名称']) || '');
    }
    if (exchangeId && boxName) {
      map[exchangeId] = boxName;
    }
  }
  return map;
}

export async function getLotteryBoxName(exchangeId: string): Promise<string | null> {
  const nameMap = await fetchLotteryBoxNameMap();
  return nameMap[exchangeId] || null;
}

export async function getLotteryBoxConfig(boxId: string): Promise<LotteryBoxConfig | null> {
  const { configs } = await fetchLotteryBoxConfigs();
  return configs[boxId] || null;
}

/**
 * 翻译抽奖箱名称
 * @param wikiMap 抽奖箱wiki结果映射
 * @returns 翻译后的wikiMap
 */
export async function translateLotteryBoxNames(
  wikiMap: Record<string, any>,
  langMap: Record<string, string> = {},
): Promise<void> {
  const boxNameMap = await fetchLotteryBoxNameMap();
  
  for (const wiki of Object.values(wikiMap)) {
    const rawExc = typeof wiki.exc === 'string' ? wiki.exc : '';
    const noPrefix = rawExc.replace(/^exc_lottery_/, '');
    const firstDot = noPrefix.replace('_', '.');
    const allDot = noPrefix.replace(/_/g, '.');
    const candidates = [allDot, firstDot, noPrefix, rawExc];
    
    let translatedName = '';
    for (const key of candidates) {
      if (boxNameMap[key]) { 
        translatedName = boxNameMap[key]; 
        break; 
      }
    }
    
    if (!translatedName) {
      const base = noPrefix.replace(/_/g, '-');
      const withHyphenDigits = base.replace(/([a-zA-Z])(\d)/g, '$1-$2');
      const langKeys = [
        `lobby.lottery.${withHyphenDigits}`,
        `lobby.lottery.${base}`,
        `lobby.lottery.${noPrefix}`
      ];
      for (const key of langKeys) {
        if (langMap[key]) {
          translatedName = langMap[key];
          break;
        }
      }
    }

    if (translatedName) {
      wiki.name = translatedName;
    }
  }
}
