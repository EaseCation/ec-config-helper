import { NotionPage } from '../../notion/notionTypes';
import { flatProperty } from '../commonFormat'


const DEFAULT_WIKI_RESULT: WikiResult = {
  name: "",
  exc: "",
  display: false,
  fallbackTimes: 0,
  gain: []
};

const DEFAULT_RESULT = { error: 'No lottery data' };

export interface WikiGainItem {
  weight: number;
  exc?: string;       // 条件存在的属性
  fallback?: boolean; // 条件存在的属性
  name?: string;      // 条件存在的属性
  data?: number;      // 条件存在的属性
}

// 创建 wikiResult 对象（需先定义类型）
export interface WikiResult {
  name: string;
  exc: string;
  display: boolean;
  fallbackTimes: number;
  gain: WikiGainItem[]; // 使用定义的类型
}

export interface ResultType {
  name: string;
  result: { [key: string]: any }; 
  wiki_result: WikiResult;
}

/** 生成 Lottery 所需 JSON */
export function formatLottery(pages: NotionPage[]): ResultType  {
  if (pages.length === 0) {
    return { 
      name: "",
      result: DEFAULT_RESULT,
      wiki_result: DEFAULT_WIKI_RESULT
    };
  }

  const first = pages[0];
  const exchangeId = String(flatProperty(first.properties.exchange_id) || '');
  const exchangeRealName: string = `exc_lottery_${exchangeId.replace(/\./g, '_')}`;

  const ifNeedKey = Boolean(flatProperty(first.properties['需要钥匙？']));

  const whenCallFallback = Number(flatProperty(first.properties.whenCallFallback));
  const exchangeCallFallbackName = `lottery.times.${exchangeId}`;

  const ifWiki = Boolean(flatProperty(first.properties['展示到wiki？']));
  const wikiDisplayName = String(flatProperty(first.properties['wikiDisplayName']) || exchangeId || exchangeRealName);
  
  const wikiResult: WikiResult = {
    name: wikiDisplayName,
    exc: exchangeRealName,
    display: ifWiki,
    fallbackTimes: whenCallFallback,
    gain: []
  };

  let result: { [key: string]: any } = {}; // 保持 result 为一个对象而不是 null
  if (ifNeedKey) {
      // need key
      result["spend"] = `key.${exchangeId}:1`;
  }
  result["gain"] = [];

  for (const item of pages) {
    let itemExchangeID = String(flatProperty(item.properties.gainExchangeID) || '');
    if (itemExchangeID) {
      itemExchangeID = `exc_lottery_${itemExchangeID.replace(/\./g, '_')}`;
    }
    const itemWeight = Number(flatProperty(item.properties['权重']));
    const itemResult: any = { weight: itemWeight };
    const itemWikiResult: any = { weight: itemWeight };

    const itemData = Number(flatProperty(item.properties['数量'])) || 1;
    const itemName = String(flatProperty(item.properties['商品全称']) || '');
    const itemMerchandise = `${itemName}:${itemData}`;
    if (itemExchangeID) {
      // exchange item
      const itemExchangeCallFallback = Boolean(flatProperty(item.properties['保底？']));
      // wiki
      itemWikiResult["exc"] = itemExchangeID;
      itemWikiResult["fallback"] = itemExchangeCallFallback;

      itemResult["subExchanges"] = itemExchangeID;
      if (whenCallFallback) {
        // has call back
        if (!itemExchangeCallFallback) {
          // not fall back
          itemResult["condition"] = `{${exchangeCallFallbackName}} < ${whenCallFallback}`;
          itemResult["callback"] = {
            type: "merchandise.add",
            merchandise: `${exchangeCallFallbackName}:1`
          };
        } else {
          // fallback
          itemResult["condition"] = `{${exchangeCallFallbackName}} >= ${whenCallFallback}`;
          itemResult["callback"] = {
            type: "merchandise.set",
            merchandise: `${exchangeCallFallbackName}:0`
          };
        }
      }
    } else {
      // other items
      itemResult["merchandises"] = [itemMerchandise];

      // wiki
      itemWikiResult["name"] = itemName;
      itemWikiResult["data"] = itemData;
    }

    result["gain"].push(itemResult);
    if (itemWikiResult.exc || itemWikiResult.name) {
      wikiResult["gain"].push(itemWikiResult);
    }
    // if (itemExchangeID) {
    //   result["gain"].push(itemResult);
    //   wikiResult["gain"].push(itemWikiResult);
    // } else {
    //   result['gain'] = []
    // }
  }

  return {
    name: exchangeRealName,
    result: result,
    wiki_result: wikiResult
  };
}