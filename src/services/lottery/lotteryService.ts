import { NotionPage } from "../../notion/notionTypes";
import { flatProperty, parseCheckbox, parseRollup } from "../commonFormat";


const DEFAULT_WIKI_RESULT: WikiResult = {
  name: "",
  exc: "",
  display: false,
  fallbackTimes: 0,
  gain: []
};

const DEFAULT_RESULT = { error: 'No lottery data' };

interface WikiGainItem {
  weight: number;
  exc?: string;       // 条件存在的属性
  fallback?: boolean; // 条件存在的属性
  name?: string;      // 条件存在的属性
  data?: number;      // 条件存在的属性
}

// 创建 wikiResult 对象（需先定义类型）
interface WikiResult {
  name: string;
  exc: string;
  display: boolean;
  fallbackTimes: number;
  gain: WikiGainItem[]; // 使用定义的类型
}

export interface ResultType {
  /** 原始的 exchangeId，用于后续格式化 */
  exchangeId: string;
  result: { [key: string]: any };
  wiki_result: WikiResult;
}

/**
 * Convert raw exchange ID to the final lottery key.
 * This is intentionally deferred so translation happens only
 * at the output step, keeping the computation phase free of formatting.
 */
export const translateExchangeId = (exchangeId: string): string =>
  `exc_lottery_${exchangeId.replace(/\./g, "_")}`;

/** 生成 Lottery 所需 JSON */
export function formatLottery(pages: NotionPage[]): ResultType {
  if (pages.length === 0) {
    return {
      exchangeId: "",
      result: DEFAULT_RESULT,
      wiki_result: DEFAULT_WIKI_RESULT,
    };
  }

  const first = pages[0];
  const exchangeId = parseRollup(first.properties.exchange_id);
  const ifNeedKeyDefult = parseRollup(first.properties['需要钥匙？']);
  let ifNeedKey;
  if(ifNeedKeyDefult === '') {
    ifNeedKey = false;
  } else {
    ifNeedKey = JSON.parse(ifNeedKeyDefult);
  }


  const whenCallFallback = Number(flatProperty(first.properties.whenCallFallback));
  const exchangeCallFallbackName = `lottery.times.${exchangeId}`;

  const ifWikiCopy = parseRollup(first.properties['展示到wiki？']);
  let ifWiki;
  if (ifWikiCopy === '') {
    ifWiki = false;
  } else {
    ifWiki = JSON.parse(ifWikiCopy)
  }
  const wikiDisplayName = parseRollup(first.properties['wikiDisplayName']);
  
  const wikiResult: WikiResult = {
    name: wikiDisplayName || '', // 处理空值情况
    exc: exchangeId,
    display: ifWiki, // 转换为布尔值
    fallbackTimes: whenCallFallback, // 转换为数字
    gain: []
  };

  let result: { [key: string]: any } = {}; // 保持 result 为一个对象而不是 null
  if (ifNeedKey) {
      // need key
      result["spend"] = `key.${exchangeId}:1`;
  }
  result["gain"] = [];

  for (const item of pages) {
    let itemExchangeID = parseRollup(item.properties.gainExchangeID);
    if (itemExchangeID) {
      itemExchangeID = translateExchangeId(itemExchangeID);
    }
    const itemWeight = Number(flatProperty(item.properties['权重']));
    const itemResult: any = {
      weight: itemWeight
    };
    const itemWikiResult: any = {
      weight: itemWeight
    };
    
    itemResult["weight"] = itemWeight;
    itemWikiResult["weight"] = itemWeight;
    const itemData = Number(flatProperty(item.properties['数量'])) || 1;
    const itemMerchandise = `${parseRollup(item.properties['商品全称'])}:${itemData}`;
    if(itemExchangeID) {
      // exchange item
      const itemExchangeCallFallback = parseCheckbox(item.properties['保底？']);
      //wiki
      itemWikiResult["exc"] = itemExchangeID;
      itemWikiResult["fallback"] = itemExchangeCallFallback;

      itemResult["subExchanges"] = itemExchangeID;
      if(whenCallFallback){
        // has call back
        if (!itemExchangeCallFallback) {
          // not fall back
          itemResult["condition"] = `{${exchangeCallFallbackName}} < ${whenCallFallback}`;
          itemResult["callback"] = {
            type: "merchandise.add",
            merchandise: `${exchangeCallFallbackName}:1`
          };
        } else {
          //fallback
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
      itemWikiResult["name"] = parseRollup(item.properties.wikiDisplayItemName);
      itemWikiResult["data"] = itemData;
    }

    result["gain"].push(itemResult);
    wikiResult["gain"].push(itemWikiResult);
    // if (itemExchangeID) {
    //   result["gain"].push(itemResult);
    //   wikiResult["gain"].push(itemWikiResult);
    // } else {
    //   result['gain'] = []
    // }
  }

  return {
    exchangeId,
    result: result,
    wiki_result: wikiResult,
  };
}
