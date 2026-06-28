import { ECAPIClient } from '@easecation/ecapi-sdk';
import { getEcapiApiKey, getEcapiBaseUrl } from './ecapiSettings';

type NameMap = Record<string, string>;

interface EcapiSourceOptions {
  apiKey?: string | null;
  baseUrl?: string;
}

export interface EcapiLotteryNameSources {
  commodityNameMap: NameMap;
  languageMap: NameMap;
  languageMerchandiseMap: NameMap;
  stats: {
    commodityItems: number;
    languageRows: number;
    languageMerchandiseRows: number;
  };
}

function createClient(options: EcapiSourceOptions = {}) {
  const apiKey = options.apiKey ?? getEcapiApiKey();
  if (!apiKey) {
    throw new Error('请先在设置中填写 ECAPI API Key');
  }
  return new ECAPIClient({
    baseUrl: options.baseUrl ?? getEcapiBaseUrl(),
    apiKey,
    timeoutMs: 60_000,
  });
}

function unwrapData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload &&
    (payload as { success?: unknown }).success === true
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function pickRows(payload: unknown): Array<Record<string, unknown>> {
  const data = unwrapData<any>(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getTotalPages(payload: unknown): number {
  const data = unwrapData<any>(payload);
  const totalPages = Number(data?.totalPages ?? 1);
  return Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
}

function getDisplayText(row: Record<string, unknown>): string {
  const zh = row.zh ?? row.zh_CN ?? row.zh_TW ?? row.en;
  return typeof zh === 'string' ? zh.trim() : '';
}

async function fetchLanguageMap(
  client: ECAPIClient,
  table: 'cfgLanguage' | 'cfgLanguageMerchandise',
): Promise<{ map: NameMap; rows: number }> {
  const pageSize = 1000;
  const firstPage = await client.server.languageConfig.list({
    table,
    env: 'prod',
    current: 1,
    pageSize,
  });

  const map: NameMap = {};
  let rows = 0;
  const mergeRows = (records: Array<Record<string, unknown>>) => {
    rows += records.length;
    for (const row of records) {
      const key = typeof row.key === 'string' ? row.key.trim() : '';
      const text = getDisplayText(row);
      if (key && text) map[key] = text;
    }
  };

  mergeRows(pickRows(firstPage));

  const totalPages = getTotalPages(firstPage);
  for (let current = 2; current <= totalPages; current += 1) {
    const page = await client.server.languageConfig.list({
      table,
      env: 'prod',
      current,
      pageSize,
    });
    mergeRows(pickRows(page));
  }

  return { map, rows };
}

function readCommodityName(item: Record<string, unknown>): string {
  const workshop = item.workshop;
  if (workshop && typeof workshop === 'object' && !Array.isArray(workshop)) {
    const name = (workshop as Record<string, unknown>).name;
    return typeof name === 'string' ? name.trim() : '';
  }
  return '';
}

function addCommodityName(map: NameMap, id: string, name: string) {
  if (!id || !name) return;
  map[id] = name;
  map[`shop.${id}`] = name;
}

async function fetchCommodityNameMap(
  client: ECAPIClient,
): Promise<{ map: NameMap; items: number }> {
  const payload = await client.server.item.getCommodity({ lang: 'zh' });
  const data = unwrapData<any>(payload);
  const map: NameMap = {
    coin: 'EC币',
    exp: '大厅经验',
  };
  let items = 0;

  const groups = Array.isArray(data?.groups) ? data.groups : [];
  for (const group of groups) {
    if (!group || typeof group !== 'object') continue;
    const groupItems = Array.isArray((group as any).items) ? (group as any).items : [];
    for (const item of groupItems) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      const name = readCommodityName(record);
      const id = typeof record.id === 'string' ? record.id.trim() : '';
      const key = typeof record.key === 'string' ? record.key.trim() : '';
      if (name) {
        addCommodityName(map, id, name);
        addCommodityName(map, key, name);
      }
      items += 1;
    }
  }

  return { map, items };
}

export async function fetchEcapiLotteryNameSources(
  options: EcapiSourceOptions = {},
): Promise<EcapiLotteryNameSources> {
  const client = createClient(options);
  const [commodity, language, languageMerchandise] = await Promise.all([
    fetchCommodityNameMap(client),
    fetchLanguageMap(client, 'cfgLanguage'),
    fetchLanguageMap(client, 'cfgLanguageMerchandise'),
  ]);

  return {
    commodityNameMap: commodity.map,
    languageMap: language.map,
    languageMerchandiseMap: languageMerchandise.map,
    stats: {
      commodityItems: commodity.items,
      languageRows: language.rows,
      languageMerchandiseRows: languageMerchandise.rows,
    },
  };
}
