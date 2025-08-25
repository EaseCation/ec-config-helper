export const NOTION_DATABASE_LOTTERY =
  '9e151c3d30b14d1bae8dd972d17198c1';

export const NOTION_DATABASE_LOTTERY_BOX_CONFIG =
  '7d22b7c4a4be432a9f746af7c24e6cfb';

export interface LotteryCollback {
  type: string;
  merchandise: string;
}

export interface LotteryConfigItem {
  weight: number;
  merchandises?: [string]
  subExchanges?: string;
  condition?: string;
  callback?: LotteryCollback
}

export interface LotteryConfig {
  spend?: string;
  gain: LotteryConfigItem[]
}


// 校验两个 LotteryConfigItem 是否相同
const areConfigItemsEqual = (item1: LotteryConfigItem, item2: LotteryConfigItem): boolean => {
  // 比较 weight
  if (item1.weight !== item2.weight) return false;

  // 比较 merchandises (如果有)
  if (item1.merchandises && item2.merchandises) {
    if (item1.merchandises.length !== item2.merchandises.length) return false;
    for (let i = 0; i < item1.merchandises.length; i++) {
      if (item1.merchandises[i] !== item2.merchandises[i]) return false;
    }
  } else if (item1.merchandises || item2.merchandises) {
    return false; // 一个有 merchandises，另一个没有
  }

  // 比较 subExchanges: 处理 null, undefined 和 空字符串
  const normalizeSubExchanges = (subExchanges: string | null | undefined): string | null =>
    subExchanges === undefined || subExchanges === null ? null : subExchanges.trim() === "" ? null : subExchanges;

  if (normalizeSubExchanges(item1.subExchanges) !== normalizeSubExchanges(item2.subExchanges)) return false;

  // 比较 condition: 处理 null, undefined 和 空字符串
  const normalizeCondition = (condition: string | null | undefined): string | null =>
    condition === undefined || condition === null ? null : condition.trim() === "" ? null : condition;

  if (normalizeCondition(item1.condition) !== normalizeCondition(item2.condition)) return false;

  // 比较 callback (如果有)
  if (item1.callback && item2.callback) {
    if (item1.callback.type !== item2.callback.type) return false;
    if (item1.callback.merchandise !== item2.callback.merchandise) return false;
  } else if (item1.callback || item2.callback) {
    return false; // 一个有 callback，另一个没有
  }

  return true; // 如果以上都相等，返回 true
};

export interface DifferentParts {
  isEqual: boolean;
  addedItems: LotteryConfigItem[];
  deletedItems: LotteryConfigItem[];
  commonItems: LotteryConfigItem[];
}

export const areLotteryConfigsEqual = (
  config1: LotteryConfig,
  config2: LotteryConfig
): DifferentParts => {
  const addedItems: LotteryConfigItem[] = [];   // config2 里新增的项
  const deletedItems: LotteryConfigItem[] = []; // config1 里删除的项
  const commonItems: LotteryConfigItem[] = [];  // 两者相同的项

  if (!Array.isArray(config1.gain) || !Array.isArray(config2.gain)) {
    return { isEqual: false, addedItems, deletedItems, commonItems };
  }

  // 创建 config2 副本用于删除匹配的元素
  let remainingConfig2 = [...config2.gain];

  // 遍历 config1，逐个匹配 config2 里的元素
  for (const item1 of config1.gain) {
    let foundIndex = -1;

    for (let i = 0; i < remainingConfig2.length; i++) {
      if (areConfigItemsEqual(item1, remainingConfig2[i])) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      // 发现相同的项，加入 commonItems，并从 config2 里移除
      commonItems.push(item1);
      remainingConfig2.splice(foundIndex, 1);
    } else {
      // 没有找到匹配的项，说明 config1 里多了这个 item，加入 deletedItems
      addedItems.push(item1);
    }
  }

  // 遍历完 config1 后，config2 里剩下的项即为新增的项
  deletedItems.push(...remainingConfig2);

  return {
    isEqual: addedItems.length === 0 && deletedItems.length === 0,
    addedItems,
    deletedItems,
    commonItems
  };
};
