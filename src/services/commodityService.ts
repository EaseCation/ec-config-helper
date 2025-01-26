import { NotionPage } from '../notion/notionTypes';

/**
 * 生成 Commodity JSON
 */
export function formatCommodity(pages: NotionPage[]): Record<string, any> {
  const result = {
    _comment: 'Commodity total categories, auto-generated.',
    data: [] as any[]
  };

/*  for (const page of pages) {
    const row = pageToRecord(page);
    // 这里的逻辑随你定义
    result.data.push({
      name: row['商品名称'] || row['title'],
      category: row['分类'] || '',
      price: row['价格'] || 0
      // ... etc
    });
  }*/

  return result;
}