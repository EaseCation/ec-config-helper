import { NotionPage } from '../notion/notionTypes';

/** 生成 Lottery 所需 JSON */
export function formatLottery(pages: NotionPage[]): Record<string, any> {
  // 这里演示：对 pages 做简单遍历，调用与 PHP 类似的逻辑
  // 你可以把你 PHP 里 formatLottery 的各段移植并翻译为 TS

  if (pages.length === 0) {
    return { error: 'No lottery data' };
  }

  /*// 假设每个 Page -> row
  // 先简单拿第一个page获取 exchange_id, 具体按实际逻辑
  const first = pageToRecord(pages[0]);
  const exchangeid = first.exchange_id || 'unknown';

  const result: any = {
    name: `exc_lottery_${exchangeid.replace(/\./g, '_')}`,
    gain: []
  };*/

  /*for (const page of pages) {
    const row = pageToRecord(page);
    // 类似 PHP 里的 itemWeight, itemExchangeID ...
    const itemWeight = Number(row['权重'] ?? 1);
    const itemMerchandise = `${row['商品全称']}:${row['数量'] ?? 1}`;

    result.gain.push({
      weight: itemWeight,
      merchandises: [itemMerchandise]
    });
  }*/

  return {};
}