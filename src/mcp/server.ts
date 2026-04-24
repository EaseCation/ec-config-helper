#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { setNotionToken } from '../notion/notionClient.js';
import { NOTION_DATABASE_COMMODITY } from '../services/commodity/commodityNotionQueries.js';
import { NOTION_DATABASE_LOTTERY } from '../services/lottery/lotteryNotionQueries.js';
import { NOTION_DATABASE_WORKSHOP, WORKSHOP_TYPES } from '../services/workshop/workshopNotionQueries.js';
import {
  generateCommodityConfig,
  generateLotteryConfigs,
  generateWorkshopTypeConfig,
  mergeWorkshopConfig,
} from '../services/config/mcpConfigService.js';
import {
  COMMODITY_CONFIG_PATH,
  LOTTERY_NOTION_DIR,
  WORKSHOP_TYPES_DIR,
  lotteryConfigPath,
  lotteryIndexPath,
  workshopTypeConfigPath,
} from '../services/config/configPaths.js';
import { createRepoFileStore } from './fileStore.js';
import { runTool } from './response.js';

if (process.env.NOTION_TOKEN) {
  setNotionToken(process.env.NOTION_TOKEN);
}

const server = new McpServer({
  name: 'ec-config-helper',
  version: '0.1.0',
});

const dryRunSchema = z.boolean().optional().default(true);
const compareLocalSchema = z.boolean().optional().default(false);
const typeIdSchema = z.enum(Object.keys(WORKSHOP_TYPES) as [string, ...string[]]);
const itemKeysSchema = z.array(z.string()).optional();

function previewData(data: unknown) {
  const text = JSON.stringify(data, null, 2);
  return {
    chars: text.length,
    preview: text.slice(0, 4000),
    truncated: text.length > 4000,
  };
}

function diffSummary(diff: any) {
  if (!diff) return undefined;
  return {
    isEqual: diff.isEqual,
    addedCount: diff.added?.length ?? diff.addedItems?.length ?? 0,
    removedCount: diff.removed?.length ?? diff.deletedItems?.length ?? 0,
    changedCount: diff.changed?.length ?? diff.modifiedItems?.length ?? 0,
    added: diff.added ?? diff.addedItems?.map((item: any) => item.typeId),
    removed: diff.removed ?? diff.deletedItems?.map((item: any) => item.typeId),
    changed: diff.changed ?? diff.modifiedItems?.map((item: any) => item.typeId),
  };
}

function pickRecordEntries<T>(record: Record<string, T>, keys?: string[]) {
  if (!keys?.length) {
    return record;
  }

  return keys.reduce<Record<string, T>>((acc, key) => {
    if (key in record) {
      acc[key] = record[key];
    }
    return acc;
  }, {});
}

function commodityDiffDetails(localData: any, remoteData: any, diff: any, keys?: string[]) {
  if (!diff) return undefined;

  const localById = Object.fromEntries((localData?.types ?? []).map((item: any) => [item.typeId, item]));
  const remoteById = Object.fromEntries((remoteData?.types ?? []).map((item: any) => [item.typeId, item]));
  const changedKeys = keys?.length ? keys : [...(diff.added ?? []), ...(diff.removed ?? []), ...(diff.changed ?? [])];

  return changedKeys.reduce<Record<string, unknown>>((acc, key) => {
    if ((diff.added ?? []).includes(key)) {
      acc[key] = { mode: 'add', remote: remoteById[key] };
    } else if ((diff.removed ?? []).includes(key)) {
      acc[key] = { mode: 'remove', local: localById[key] };
    } else if ((diff.changed ?? []).includes(key)) {
      acc[key] = { mode: 'changed', local: localById[key], remote: remoteById[key] };
    }
    return acc;
  }, {});
}

function keyedDiffDetails(diff: any, keys?: string[]) {
  if (!diff?.parts) return undefined;
  const parts = pickRecordEntries(diff.parts, keys);

  return Object.fromEntries(
    Object.entries(parts).map(([key, part]: [string, any]) => [
      key,
      {
        mode: part.mode,
        local: part.from,
        remote: part.to,
      },
    ])
  );
}

server.registerTool(
  'list_supported_workshop_types',
  {
    title: 'List supported workshop type IDs',
    description: 'Return workshop type IDs supported by the Notion workshop config generator.',
    inputSchema: {},
  },
  async () => runTool(async () => ({
    ok: true,
    summary: {
      count: Object.keys(WORKSHOP_TYPES).length,
      notionDatabaseId: NOTION_DATABASE_WORKSHOP,
    },
    data: {
      typeIds: Object.keys(WORKSHOP_TYPES),
    },
  }))
);

server.registerTool(
  'generate_commodity_config',
  {
    title: 'Generate commodity config',
    description: 'Generate commodity/commodity.json from Notion. Optionally compare with EC_REPO_ROOT local file.',
    inputSchema: {
      compareLocal: compareLocalSchema,
    },
  },
  async ({ compareLocal }) => runTool(async () => {
    const store = compareLocal ? createRepoFileStore() : undefined;
    const result = await generateCommodityConfig(store, compareLocal ? COMMODITY_CONFIG_PATH : undefined);
    return {
      ok: true,
      paths: { target: COMMODITY_CONFIG_PATH },
      summary: {
        notionDatabaseId: NOTION_DATABASE_COMMODITY,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: compareLocal ? previewData(result.data) : result.data,
    };
  })
);

server.registerTool(
  'compare_commodity_config',
  {
    title: 'Compare commodity config',
    description: 'Compare generated commodity/commodity.json with EC_REPO_ROOT local file and return diff summary plus only the differing entries.',
    inputSchema: {
      typeIds: itemKeysSchema,
    },
  },
  async ({ typeIds }) => runTool(async () => {
    const store = createRepoFileStore();
    const result = await generateCommodityConfig(store, COMMODITY_CONFIG_PATH);
    const localData = await store.readJson<any>(COMMODITY_CONFIG_PATH);
    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        target: COMMODITY_CONFIG_PATH,
      },
      summary: {
        notionDatabaseId: NOTION_DATABASE_COMMODITY,
        remoteCount: result.data.types.length,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: {
        details: commodityDiffDetails(localData, result.data, result.diff, typeIds),
      },
    };
  })
);

server.registerTool(
  'sync_commodity_config',
  {
    title: 'Sync commodity config',
    description: 'Generate commodity config and write commodity/commodity.json when dryRun is explicitly false.',
    inputSchema: {
      dryRun: dryRunSchema,
    },
  },
  async ({ dryRun }) => runTool(async () => {
    const store = createRepoFileStore();
    const result = await generateCommodityConfig(store, COMMODITY_CONFIG_PATH);
    if (!dryRun) {
      await store.writeJson(COMMODITY_CONFIG_PATH, result.data);
    }
    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        target: COMMODITY_CONFIG_PATH,
      },
      summary: {
        dryRun,
        wrote: !dryRun,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: dryRun ? previewData(result.data) : result.data,
    };
  })
);

server.registerTool(
  'generate_workshop_type_config',
  {
    title: 'Generate workshop type config',
    description: 'Generate commodity/types/{typeId}.json from Notion. Optionally compare with local file.',
    inputSchema: {
      typeId: typeIdSchema,
      compareLocal: compareLocalSchema,
    },
  },
  async ({ typeId, compareLocal }) => runTool(async () => {
    const relativePath = workshopTypeConfigPath(typeId);
    const store = compareLocal ? createRepoFileStore() : undefined;
    const result = await generateWorkshopTypeConfig(typeId, store, compareLocal ? relativePath : undefined);
    return {
      ok: true,
      paths: { target: relativePath },
      summary: {
        typeId,
        notionDatabaseId: NOTION_DATABASE_WORKSHOP,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: result.data,
    };
  })
);

server.registerTool(
  'compare_workshop_type_config',
  {
    title: 'Compare workshop type config',
    description: 'Compare generated commodity/types/{typeId}.json with EC_REPO_ROOT local file and return diff summary plus only the differing entries.',
    inputSchema: {
      typeId: typeIdSchema,
      selectedItemKeys: itemKeysSchema,
    },
  },
  async ({ typeId, selectedItemKeys }) => runTool(async () => {
    const store = createRepoFileStore();
    const relativePath = workshopTypeConfigPath(typeId);
    const result = await generateWorkshopTypeConfig(typeId, store, relativePath);
    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        target: relativePath,
        baseDir: WORKSHOP_TYPES_DIR,
      },
      summary: {
        typeId,
        notionDatabaseId: NOTION_DATABASE_WORKSHOP,
        remoteItemCount: Object.keys(result.data.items).length,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: {
        details: keyedDiffDetails(result.diff, selectedItemKeys),
      },
    };
  })
);

server.registerTool(
  'sync_workshop_type_config',
  {
    title: 'Sync workshop type config',
    description: 'Generate and write commodity/types/{typeId}.json. selectedItemKeys applies only those item diffs; omitted means full remote config.',
    inputSchema: {
      typeId: typeIdSchema,
      selectedItemKeys: z.array(z.string()).optional(),
      dryRun: dryRunSchema,
    },
  },
  async ({ typeId, selectedItemKeys, dryRun }) => runTool(async () => {
    const store = createRepoFileStore();
    const relativePath = workshopTypeConfigPath(typeId);
    const result = await generateWorkshopTypeConfig(typeId, store, relativePath);
    const local = await store.readJson<any>(relativePath);
    const dataToWrite = mergeWorkshopConfig(local, result.data, selectedItemKeys);
    if (!dryRun) {
      await store.writeJson(relativePath, dataToWrite);
    }
    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        target: relativePath,
        baseDir: WORKSHOP_TYPES_DIR,
      },
      summary: {
        typeId,
        dryRun,
        wrote: !dryRun,
        selectedItemKeyCount: selectedItemKeys?.length ?? 0,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: dryRun ? previewData(dataToWrite) : dataToWrite,
    };
  })
);

server.registerTool(
  'generate_lottery_configs',
  {
    title: 'Generate lottery configs',
    description: 'Generate lottery/notion config map from Notion. Optionally compare with local notion index and files.',
    inputSchema: {
      compareLocal: compareLocalSchema,
    },
  },
  async ({ compareLocal }) => runTool(async () => {
    const store = compareLocal ? createRepoFileStore() : undefined;
    const result = await generateLotteryConfigs(store, compareLocal ? LOTTERY_NOTION_DIR : undefined);
    return {
      ok: true,
      paths: { baseDir: LOTTERY_NOTION_DIR },
      summary: {
        notionDatabaseId: NOTION_DATABASE_LOTTERY,
        count: Object.keys(result.data).length,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: result.data,
    };
  })
);

server.registerTool(
  'compare_lottery_configs',
  {
    title: 'Compare lottery configs',
    description: 'Compare generated lottery/notion configs with EC_REPO_ROOT local files and return diff summary plus only the differing entries.',
    inputSchema: {
      keys: itemKeysSchema,
    },
  },
  async ({ keys }) => runTool(async () => {
    const store = createRepoFileStore();
    const result = await generateLotteryConfigs(store, LOTTERY_NOTION_DIR);
    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        baseDir: LOTTERY_NOTION_DIR,
      },
      summary: {
        notionDatabaseId: NOTION_DATABASE_LOTTERY,
        remoteCount: Object.keys(result.data).length,
        localExists: result.localExists,
        diff: diffSummary(result.diff),
      },
      data: {
        details: keyedDiffDetails(result.diff, keys),
      },
    };
  })
);

server.registerTool(
  'sync_lottery_configs',
  {
    title: 'Sync lottery configs',
    description: 'Generate lottery notion configs and write selected keys. dryRun defaults to true.',
    inputSchema: {
      keys: z.array(z.string()).optional(),
      dryRun: dryRunSchema,
    },
  },
  async ({ keys, dryRun }) => runTool(async () => {
    const store = createRepoFileStore();
    const result = await generateLotteryConfigs(store, LOTTERY_NOTION_DIR);
    const availableKeys = Object.keys(result.data);
    const keysToSync = keys?.length ? keys : availableKeys;
    const invalidKeys = keysToSync.filter((key) => !availableKeys.includes(key));
    if (invalidKeys.length) {
      throw new Error(`Unknown lottery keys: ${invalidKeys.join(', ')}`);
    }

    const existingIndex = await store.readJson<{ types: string[] }>(lotteryIndexPath());
    const existingTypes = existingIndex?.types ?? [];
    const nextTypes = Array.from(new Set([...existingTypes, ...keysToSync])).sort();
    const targetPaths = keysToSync.map(lotteryConfigPath);

    if (!dryRun) {
      for (const key of keysToSync) {
        await store.writeJson(lotteryConfigPath(key), result.data[key]);
      }
      if (nextTypes.length !== existingTypes.length || nextTypes.some((value, index) => value !== existingTypes[index])) {
        await store.writeJson(lotteryIndexPath(), { types: nextTypes });
      }
    }

    return {
      ok: true,
      paths: {
        repoRoot: store.getRoot(),
        baseDir: LOTTERY_NOTION_DIR,
        index: lotteryIndexPath(),
        targets: targetPaths,
      },
      summary: {
        dryRun,
        wrote: !dryRun,
        availableCount: availableKeys.length,
        syncedCount: keysToSync.length,
        addedIndexKeys: keysToSync.filter((key) => !existingTypes.includes(key)),
        diff: diffSummary(result.diff),
      },
      data: dryRun
        ? {
            index: { types: nextTypes },
            files: Object.fromEntries(keysToSync.map((key) => [key, previewData(result.data[key])])),
          }
        : Object.fromEntries(keysToSync.map((key) => [key, result.data[key]])),
    };
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
