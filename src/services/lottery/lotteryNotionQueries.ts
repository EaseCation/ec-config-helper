export const NOTION_DATABASE_LOTTERY = '9e151c3d30b14d1bae8dd972d17198c1';

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


// 校验两个 LotteryConfig 是否相同
export const areLotteryConfigsEqual = (config1: LotteryConfig, config2: LotteryConfig): boolean => {
  // 确保 gain 是有效的数组
  if (!Array.isArray(config1.gain) || !Array.isArray(config2.gain)) return false; // 如果 gain 不是数组，则认为两个 config 不相同
  // 比较 gain 数组的长度
  if (config1.gain?.length !== config2.gain?.length) return false;
  // 遍历 gain 数组并对比每个 item
  for (let i = 0; i < config1.gain.length; i++) {
    if (!areConfigItemsEqual(config1.gain[i], config2.gain[i])) {
      console.log(JSON.stringify(config1.gain[i]));
      console.log(JSON.stringify(config2.gain[i]));
      return false;
    }
  }

  return true; // 所有 items 都相等
};

/**
 * 对应 PHP中 WORKSHOP_TYPES 的每个 typeId -> filter & sorts
 */
export const LOTTERY_TYPES: string[] = [
  "fallback.sgnew",
  "sub.8",
  "sgnew",
  "fallback.act_2025_newyear",
  "sub.act_2025_newyear",
  "main.act_2025_newyear",
  "fallback.act_2024_panda",
  "sub.act_2024_panda",
  "main.act_2024_panda",
  "main.act_2024_idol",
  "fallback.act_2024_idol",
  "sub.act_2024_idol",
  "main.act_2024_joker",
  "fallback.act_2024_joker",
  "sub.act_2024_joker",
  "sw",
  "fallback.act_2024_newyear",
  "sub.act_2024_newyear",
  "main.act_2024_newyear",
  "sub.3",
  "sub.5",
  "main.stone",
  "sub.7",
  "sub.rare.4d.suit",
  "main.diamond",
  "sub.item.super.ouhuang",
  "sub.rare.prefix",
  "main.act_2023_duanwu",
  "fallback.act_2023_duanwu",
  "main.gold",
  "main.iron",
  "main.wood",
  "sub.6",
  "sub.rare.ornament",
  "sub.inner.gold",
  "sub.inner.diamond",
  "sub.rare.zb",
  "sub.rare.pet",
  "fallback.credit",
  "sub.4",
  "sub.2",
  "sub.1"
];