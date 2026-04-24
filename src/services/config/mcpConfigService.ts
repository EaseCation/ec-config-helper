import { fetchNotionAllPages } from '../../notion/notionClient.js';
import { NotionPage } from '../../notion/notionTypes.js';
import { compareCommodityData, CommodityData } from '../commodity/compareCommodityData.js';
import { NOTION_DATABASE_COMMODITY } from '../commodity/commodityNotionQueries.js';
import { formatCommodity } from '../commodity/commodityService.js';
import { parseCheckbox, parseRelation, parseRollup } from '../commonFormat.js';
import { NOTION_DATABASE_LOTTERY } from '../lottery/lotteryNotionQueries.js';
import { formatLottery } from '../lottery/lotteryService.js';
import { WORKSHOP_TYPES, NOTION_DATABASE_WORKSHOP } from '../workshop/workshopNotionQueries.js';
import { formatWorkshop } from '../workshop/workshopService.js';
import { WorkshopCommodityConfig } from '../../types/workshop.js';
import { compareKeyedRecords, KeyedDiffSummary, KeyedDifferentPart } from './jsonDiff.js';

const splitString = (input: string): string[] => input.split(', ').filter(Boolean);

export interface GeneratedWithDiff<TData, TDiff = unknown> {
  data: TData;
  diff?: TDiff;
  localExists?: boolean;
}

export interface FileStore {
  readJson<T>(relativePath: string): Promise<T | null>;
  writeJson(relativePath: string, value: unknown): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
}

export async function generateCommodityConfig(
  fileStore?: FileStore,
  relativePath?: string
): Promise<GeneratedWithDiff<CommodityData, ReturnType<typeof compareCommodityData>>> {
  const data = await formatCommodity(NOTION_DATABASE_COMMODITY) as CommodityData;
  if (!fileStore || !relativePath) return { data };

  const local = await fileStore.readJson<CommodityData>(relativePath);
  return {
    data,
    localExists: local !== null,
    diff: local ? compareCommodityData(local, data) : undefined,
  };
}

export async function generateWorkshopTypeConfig(
  typeId: string,
  fileStore?: FileStore,
  relativePath?: string
): Promise<GeneratedWithDiff<WorkshopCommodityConfig, KeyedDiffSummary>> {
  const filterConfig = WORKSHOP_TYPES[typeId];
  if (!filterConfig) {
    throw new Error(`Unsupported workshop typeId: ${typeId}`);
  }

  const pages = await fetchNotionAllPages(NOTION_DATABASE_WORKSHOP, {
    filter: filterConfig.filter,
    sorts: filterConfig.sorts,
  });
  const data = formatWorkshop(typeId, pages);

  if (!fileStore || !relativePath) return { data };

  const local = await fileStore.readJson<WorkshopCommodityConfig>(relativePath);
  return {
    data,
    localExists: local !== null,
    diff: local ? compareKeyedRecords(local.items, data.items) : undefined,
  };
}

export interface LotteryConfigMap {
  [key: string]: any;
}

export async function generateLotteryConfigs(
  fileStore?: FileStore,
  baseDir?: string
): Promise<GeneratedWithDiff<LotteryConfigMap, KeyedDiffSummary>> {
  const data = await fetchLotteryConfigMap();
  if (!fileStore || !baseDir) return { data };

  const local: LotteryConfigMap = {};
  let localExists = false;
  const index = await fileStore.readJson<{ types: string[] }>(`${baseDir}/notion.json`);
  if (index?.types?.length) {
    localExists = true;
    for (const key of index.types) {
      const item = await fileStore.readJson<any>(`${baseDir}/${key}.json`);
      if (item !== null) local[key] = item;
    }
  }

  return {
    data,
    localExists,
    diff: localExists ? compareKeyedRecords(local, data) : undefined,
  };
}

export async function fetchLotteryConfigMap(): Promise<LotteryConfigMap> {
  const pages = await fetchNotionAllPages(NOTION_DATABASE_LOTTERY, {});
  const grouped: Record<string, NotionPage[]> = {};
  const exchangeIdBoxId: Record<string, string> = {};

  for (const page of pages) {
    if (parseCheckbox(page.properties['禁用'])) continue;

    const boxId = parseRelation(page.properties['所在抽奖箱']);
    const id = parseRollup(page.properties['exchange_id']);
    if (typeof id !== 'string' || id === '') continue;

    const boxes = splitString(boxId);
    for (const box of boxes) {
      if (!grouped[box]) grouped[box] = [];
      grouped[box].push(page);
      if (boxes.length <= 1) {
        exchangeIdBoxId[box] = id;
      }
    }
  }

  const fileMap: LotteryConfigMap = {};
  for (const key of Object.keys(grouped)) {
    const formattedData = formatLottery(grouped[key]);
    if (formattedData.name) {
      fileMap[exchangeIdBoxId[key]] = {
        [formattedData.name]: formattedData.result,
      };
    }
  }

  return Object.keys(fileMap).sort().reduce<LotteryConfigMap>((acc, key) => {
    acc[key] = fileMap[key];
    return acc;
  }, {});
}

export function mergeWorkshopConfig(
  local: WorkshopCommodityConfig | null,
  remote: WorkshopCommodityConfig,
  selectedItemKeys?: string[]
): WorkshopCommodityConfig {
  if (!local) return remote;

  const merged: WorkshopCommodityConfig = {
    ...remote,
    items: { ...remote.items },
  };

  for (const key of Object.keys(local.items)) {
    if (!merged.items[key]) {
      merged.items[key] = local.items[key];
    }
  }

  if (!selectedItemKeys?.length) {
    return remote;
  }

  const selected = new Set(selectedItemKeys);
  const diff = compareKeyedRecords(local.items, remote.items).parts as Record<string, KeyedDifferentPart<any>>;

  for (const key of Object.keys(diff)) {
    const part = diff[key];
    if (!selected.has(key)) {
      if ((part.mode === 'add' || part.mode === 'changed') && part.from === undefined) {
        delete merged.items[key];
      } else if ((part.mode === 'remove' || part.mode === 'changed') && part.from !== undefined) {
        merged.items[key] = part.from;
      }
    } else if (part.mode === 'remove') {
      delete merged.items[key];
    }
  }

  return merged;
}
