export const COMMODITY_CONFIG_PATH = 'CodeFunCore/src/main/resources/net/easecation/codefuncore/commodity/commodity.json';
export const WORKSHOP_TYPES_DIR = 'CodeFunCore/src/main/resources/net/easecation/codefuncore/commodity/types';
export const LOTTERY_NOTION_DIR = 'CodeFunCore/src/main/resources/net/easecation/codefuncore/lottery/notion';

export const workshopTypeConfigPath = (typeId: string) => `${WORKSHOP_TYPES_DIR}/${typeId}.json`;
export const lotteryConfigPath = (key: string) => `${LOTTERY_NOTION_DIR}/${key}.json`;
export const lotteryIndexPath = () => `${LOTTERY_NOTION_DIR}/notion.json`;
