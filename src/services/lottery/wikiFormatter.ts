import { WikiResult } from './lotteryService';

interface FlatItem {
  weight: number;
  name: string;
  data: number;
  fallback: boolean;
}

interface ChanceItem {
  name: string;
  data: number;
  chance: string;
}

interface DisplayItem {
  fallbackTimes: number;
  items: FlatItem[];
}

function csvEscape(v: string | number): string {
  const s = String(v ?? '');
  const startsWithSpecial = s.startsWith('=') || s.startsWith('+') || s.startsWith('-') || s.startsWith('@');
  const needsQuote = /[",\r\n]/.test(s) || startsWithSpecial;
  const safe = startsWithSpecial ? `'${s}` : s;
  const escaped = safe.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
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
    const totalWeight = item.items.reduce((sum, i) => sum + i.weight, 0);
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

function translateBoxName(wiki: WikiResult, boxNameMap: Record<string, string>): string {
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
  return wiki.name;
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
    const displayName = translateBoxName(wiki, boxNameMap);
    const translatedItems = data.items.map((i) => ({
      ...i,
      name: nameMap[i.name] || i.name
    }));
    result[displayName] = formatWikiToString(displayName, {
      fallbackTimes: data.fallbackTimes,
      items: translatedItems
    });
  }
  return result;
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
    const displayName = translateBoxName(wiki, boxNameMap);
    const translatedItems = data.items.map((i) => ({
      ...i,
      name: nameMap[i.name] || i.name
    }));
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
