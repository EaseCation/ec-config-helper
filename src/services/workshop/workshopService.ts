import { NotionPage } from '../../notion/notionTypes';
import { pageToWorkshopItem } from '../notionMapping';
import { WORKSHOP_DEFAULTS, RARITY_MAP } from './workshopConstants';
import { generatePreview } from './workshopPreview';
import {
  getImageURL,
  getDiscount,
  generateExchange,
  generateGainAnimation,
} from './workshopHelpers';

export function formatWorkshop(
  typeId: string,
  pages: NotionPage[]
): Record<string, any> {

  // 当 pages 为空时返回空
  if (pages.length === 0) {
    return {
      _comment: `No data for typeId = ${typeId}`,
      typeId,
      items: {},
    };
  }

  // 1. 先解析出第一条记录，获取通用的category和parts
  const firstRow = pageToWorkshopItem(pages[0]);
  const category = firstRow.category!;
  const parts = firstRow["ornamentPart"] || "";

  // 2. 初始化返回结果
  const result: Record<string, any> = {
    _comment: 'This file is generated by notion-config-tool. Do NOT edit manually!',
    typeId,
    items: {},
  };

  // 3. 遍历 NotionPage，组装每个 item
  for (const page of pages) {
    const row = pageToWorkshopItem(page);
    console.log(row);

    // 仅当“上线状态”是“正式服”或“测试服”才处理，否则跳过
    if (row["onlineState"] !== "正式服" && row["onlineState"] !== "测试服") {
      continue;
    }

    // 如果是“套装”，则 idComplete = "ornament.suit.xxx"
    // 否则直接使用 “商品完整ID”
    let idComplete = "";
    if (parts === "套装") {
      idComplete = "ornament.suit." + (row["suitIdItem"] || "");
    } else {
      idComplete = row["fullId"] || "";
    }

    // 这里的 “shop.” + idComplete 用于 workshop.name，如果 prefix 则会被覆盖
    let name = "shop." + idComplete;
    const idItem = row["idItem"] || "";

    // 4. 如果是“套装”并且 result.items 里已经存在这个 idComplete
    //    则只需要追加 ornaments
    if (parts === "套装" && result.items[idComplete]?.id) {
      // 向 workshop.preview.ornaments 追加
      const ornaments = result.items[idComplete].workshop.preview?.ornaments;
      if (Array.isArray(ornaments)) {
        ornaments.push(idItem);
      }
      continue;
    }

    // 5. 准备组装新的 itemObj
    const image = getImageURL(row, category, parts);
    // const price = row["price"] ?? 0;

    // 稀有度，如果找不到映射，就默认为 'COMMON'
    const rarityText = row["rarity"] || "普通";
    const mappedRarity = RARITY_MAP[rarityText] || "COMMON";

    // 计算折扣
    const discount = getDiscount(row);

    // 生成 preview
    const preview = generatePreview(row, idComplete, image);

    // 组装最终的数据
    const itemObj: Record<string, any> = {
      id: idComplete,
      workshop: {
        name: (category === "prefix" && row["name"]) ? row["name"] : name,
        introduce: row["confirmIntroduce"] || "",
        rarity: mappedRarity,
        discount,
        image,
        imageSize: [
          row["imageSizeX"] ?? WORKSHOP_DEFAULTS.imageSize,
          row["imageSizeY"] ?? WORKSHOP_DEFAULTS.imageSize,
        ],
        preview,
      },
    };

    // 对未拥有玩家隐藏
    if (row["hideToNotOwned"]) {
      itemObj.workshop.hide = true;
    }

    // 获取方式
    if (row["access"]) {
      itemObj.workshop.howMsg = row["access"];
    }
    if (row["accessToDo"]) {
      itemObj.workshop.howAction = row["accessToDo"];
    }

    // 价格/购买结构
    const exchange = generateExchange(row, idComplete, category);
    if (exchange) {
      itemObj.exchange = exchange;
    }

    // gainAnimation
    const gainAnimation = generateGainAnimation(row, category, parts);
    if (gainAnimation) {
      itemObj.workshop.gainAnimation = gainAnimation;
    }

    // 如果是武器皮肤
    if (category === "weaponskin") {
      itemObj.weapon_skin = {
        itemFullName: row["weaponSkinItemId"] || "",
      };
    }

    // 6. 放入 result.items
    result.items[idComplete] = itemObj;
  }

  return result;
}