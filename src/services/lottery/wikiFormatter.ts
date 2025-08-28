import { WikiResult } from './lotteryService';

interface FlatItem {
  weight: number;
  name: string;
  data: number;
  fallback: boolean;
}

interface ChanceItem {
  name: string;
  data: string | number;
  chance: string;
}

interface DisplayItem {
  fallbackTimes: number;
  items: FlatItem[];
}

const DURATION_PREFIXES = ['prefix', 'ornament.', 'pet.', 'music.', 'zb.', 'sg.','attack-eff.'];

function formatSecondsToReadable(seconds: number): string {
  const units = [
    { label: '天', value: 24 * 3600 },
    { label: '小时', value: 3600 },
    { label: '分钟', value: 60 }
  ];
  for (const u of units) {
    if (seconds >= u.value) {
      const v = seconds / u.value;
      return Number.isInteger(v) ? `${v}${u.label}` : `${v.toFixed(2)}${u.label}`;
    }
  }
  return `${seconds}秒`;
}

function formatItemData(name: string, data: number): string | number {
  const isDuration = DURATION_PREFIXES.some(p => name.startsWith(p));
  if (!isDuration) return data;
  if (data === 0 || data === 1) return '永久';
  return formatSecondsToReadable(data);
}

function stripColorCodes(name: string): string {
  return name.replace(/§./g, '').replace(/\{[^}]+\}/g, '');
}

// 递归展开所有奖品，计算权重
function formatWikiSingleGain(
  entire: Record<string, WikiResult>,
  key: string,
  orgFallback = false,
  totalW = 0
): FlatItem[] {
  const result: Record<string, FlatItem> = {};
  const wiki = entire[key];
  if (!wiki) return [];
  const items = wiki.gain;

  let excTotalWeight = 0;
  if (totalW) {
    excTotalWeight = items.reduce((sum, i) => sum + (i.weight || 0), 0);
  }

  for (const item of items) {
    const fallback = orgFallback || !!item.fallback;
    if (item.exc) {
      const subTotal = item.weight || 0;
      const subItems = formatWikiSingleGain(entire, item.exc, fallback, subTotal);
      for (const si of subItems) {
        const keyStr = `${si.name}:${si.data}/${si.fallback}`;
        if (result[keyStr]) {
          result[keyStr].weight += si.weight;
        } else {
          result[keyStr] = { ...si };
        }
      }
    } else if (item.name) {
      let weight = item.weight || 0;
      if (totalW && excTotalWeight) {
        weight = (weight / excTotalWeight) * totalW;
      }
      const keyStr = `${item.name}:${item.data}/${fallback}`;
      if (result[keyStr]) {
        result[keyStr].weight += weight;
      } else {
        result[keyStr] = {
          weight,
          name: item.name,
          data: item.data || 0,
          fallback
        };
      }
    }
  }

  return Object.values(result);
}

function formatWikiChance(display: Record<string, DisplayItem>): Record<string, {fallbackTimes: number; items: ChanceItem[]}> {
  const res: Record<string, {fallbackTimes: number; items: ChanceItem[]}> = {};
  for (const [name, item] of Object.entries(display)) {
    // 只计算非保底项目的总权重，保底项目不应该参与概率计算
    const totalWeight = item.items
      .filter(i => !i.fallback && i.weight)
      .reduce((sum, i) => sum + i.weight, 0);
    
    const items: ChanceItem[] = item.items.map(i => {
      if (i.fallback || !i.weight) {
        return { name: i.name, data: i.data, chance: '保底' };
      }
      const chance = (i.weight / totalWeight) * 100;
      const fixed = chance < 0.001 ? '0.001' : chance.toFixed(3);
      return { name: i.name, data: i.data, chance: `${fixed}%` };
    });
    res[name] = { fallbackTimes: item.fallbackTimes, items };
  }
  return res;
}

function formatWikiToString(name: string, data: {fallbackTimes: number; items: ChanceItem[]}): string {
  let result = `= ${name} =\n`;
  
  // 只有当保底次数大于0时才显示保底描述
  if (data.fallbackTimes > 0) {
    result += `抽取 ${data.fallbackTimes} 次后触发抽奖保底，会按照玩家商品拥有情况给予某一个保底奖励（保底商品会在"概率"一列中标注"保底"）。\n`;
  }
  
  result += '{| class="wikitable sortable"\n!奖励内容\n!奖励数量\n!概率\n';
  for (const item of data.items) {
    result += "|-\n";
    result += `|${item.name}\n|${item.data}\n|${item.chance}\n`;
  }
  result += "}|\n";
  return result;
}

function translateBoxName(
  wiki: WikiResult,
  boxNameMap: Record<string, string>,
  langMap: Record<string, string> = {},
): string {
  const rawExc = typeof wiki.exc === 'string' ? wiki.exc : '';
  const noPrefix = rawExc.replace(/^exc_lottery_/, '');
  const firstDot = noPrefix.replace('_', '.');
  const allDot = noPrefix.replace(/_/g, '.');
  const candidates = [allDot, firstDot, noPrefix, rawExc];
  for (const key of candidates) {
    if (boxNameMap[key]) {
      return boxNameMap[key];
    }
  }
  const base = noPrefix.replace(/_/g, '-');
  const withHyphenDigits = base.replace(/([a-zA-Z])(\d)/g, '$1-$2');
  const langKeys = [
    `lobby.lottery.${withHyphenDigits}`,
    `lobby.lottery.${base}`,
    `lobby.lottery.${noPrefix}`
  ];
  for (const key of langKeys) {
    if (langMap[key]) {
      return langMap[key];
    }
  }
  return wiki.name;
}

function translateItems(
  items: ChanceItem[],
  nameMap: Record<string, string>,
): ChanceItem[] {
  return items.map((i) => {
    const key = i.name;
    const rawName = nameMap[key] || nameMap[`shop.${key}`] || key;
    const cleanName = stripColorCodes(rawName);
    return { ...i, name: cleanName, data: formatItemData(key, Number(i.data)) };
  });
}

export function buildWikiTables(
  map: Record<string, WikiResult>,
  nameMap: Record<string, string> = {},
  boxNameMap: Record<string, string> = {}
): Record<string, string> {
  const display: Record<string, DisplayItem> = {};
  for (const [key, item] of Object.entries(map)) {
    if (item.display) {
      display[key] = {
        fallbackTimes: item.fallbackTimes,
        items: formatWikiSingleGain(map, key)
      };
    }
  }
  const withChance = formatWikiChance(display);
  const result: Record<string, string> = {};
  for (const [exc, data] of Object.entries(withChance)) {
    const wiki = map[exc];
    const displayName = translateBoxName(wiki, boxNameMap, nameMap);
    const translatedItems = translateItems(data.items, nameMap);
    result[displayName] = formatWikiToString(displayName, {
      fallbackTimes: data.fallbackTimes,
      items: translatedItems
    });
  }
  return result;
}

export function buildMarkdownTables(
  map: Record<string, WikiResult>,
  nameMap: Record<string, string> = {},
  boxNameMap: Record<string, string> = {},
): Record<string, string> {
  const display: Record<string, DisplayItem> = {};
  for (const [key, item] of Object.entries(map)) {
    if (item.display) {
      display[key] = {
        fallbackTimes: item.fallbackTimes,
        items: formatWikiSingleGain(map, key),
      };
    }
  }
  const withChance = formatWikiChance(display);
  const result: Record<string, string> = {};
  for (const [exc, data] of Object.entries(withChance)) {
    const wiki = map[exc];
    const displayName = translateBoxName(wiki, boxNameMap, nameMap);
    const translatedItems = translateItems(data.items, nameMap);
    const lines: string[] = [];
    lines.push(`## ${displayName}`);
    lines.push('');
    if (data.fallbackTimes > 0) {
      lines.push(
        `抽取 ${data.fallbackTimes} 次后触发抽奖保底，会按照玩家商品拥有情况给予某一个保底奖励（保底商品会在"概率"一列中标注"保底"）。`,
      );
      lines.push('');
    }
    lines.push('| 奖励内容 | 奖励数量 | 概率 |');
    lines.push('| --- | --- | --- |');
    for (const item of translatedItems) {
      lines.push(`| ${item.name} | ${item.data} | ${item.chance} |`);
    }
    result[displayName] = lines.join('\n');
  }
  return result;
}

function csvEscape(v: string | number): string {
  const s = String(v ?? '');
  const needsQuote = /[",\r\n]/.test(s) || s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@');
  const safe = (s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@')) ? `'${s}` : s;
  const escaped = safe.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function buildWikiCSVs(
  map: Record<string, WikiResult>,
  nameMap: Record<string, string> = {},
  boxNameMap: Record<string, string> = {}
): Record<string, string> {
  const display: Record<string, DisplayItem> = {};
  for (const [key, item] of Object.entries(map)) {
    if (item.display) {
      display[key] = {
        fallbackTimes: item.fallbackTimes,
        items: formatWikiSingleGain(map, key)
      };
    }
  }
  const withChance = formatWikiChance(display);
  const result: Record<string, string> = {};
  for (const [exc, data] of Object.entries(withChance)) {
    const wiki = map[exc];
    const displayName = translateBoxName(wiki, boxNameMap, nameMap);
    const translatedItems = translateItems(data.items, nameMap);
    const lines: string[] = [];
    if (data.fallbackTimes > 0) {
      lines.push(`${csvEscape('保底次数')},${csvEscape(data.fallbackTimes)}`);
    }
    lines.push([csvEscape('奖励内容'), csvEscape('奖励数量'), csvEscape('概率')].join(','));
    for (const item of translatedItems) {
      lines.push([
        csvEscape(item.name),
        csvEscape(item.data),
        csvEscape(item.chance)
      ].join(','));
    }
    result[displayName] = lines.join('\n');
  }
  return result;
}
