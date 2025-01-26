import { WorkshopItem } from "../../types/workshop";
import { WORKSHOP_DEFAULTS } from "./workshopConstants";

/**
 * 根据category/parts等，返回商店图片URL
 */
export function getImageURL(
  item: WorkshopItem,
  category: string,
  parts: string
): string {
  const { idItem, shopImage, "suitIdItem": suitIditem } = item;

  // 如果“商店图片”有配置，优先使用
  if (shopImage) {
    return shopImage;
  }

  // 其他分类处理
  switch (category) {
    case "prefix":
      return "textures/items/name_tag";
    case "music":
      return "textures/blocks/jukebox_side";
    case "resourcepack":
      if (item.fullId?.startsWith("resourcepack.aim.")) {
        const splitted = item.fullId.split(".");
        const idAim = splitted[splitted.length - 1];
        return `http://oss.easecation.net/${category}/aim/${idAim}.png`;
      }
      return `http://oss.easecation.net/${category}/${idItem}.jpg`;
    case "ornament":
      if (parts === "套装") {
        return `http://oss.easecation.net/${category}/suit.${suitIditem}.png`;
      }
      return `http://oss.easecation.net/${category}/${idItem}.png`;
    default:
      // 兜底
      return `http://oss.easecation.net/${category}/${idItem}.png`;
  }
}

/**
 * 计算最终折扣
 */
export function getDiscount(
  item: WorkshopItem
): number {
  const { price, discountPrices } = item;
  const rowDiscount = item.discountRate;

  // 1. 优先看 rowDiscount
  if (rowDiscount) {
    return rowDiscount;
  }

  // 2. 如果没有 rowDiscount，就看“折后价格”是否大于0
  if (discountPrices && price && price > 0 && discountPrices > 0) {
    return discountPrices / price;
  }

  // 3. 否则返回默认值
  return WORKSHOP_DEFAULTS.discount;
}

/**
 * 生成“购买”所需的 exchange 节点
 */
export function generateExchange(
  item: WorkshopItem,
  idComplete: string,
  category: string
): Record<string, any> | undefined {
  const price = item["price"] ?? 0;
  const unit = item["priceUnit"] || "";
  const idItem = item["idItem"] || "";

  if (price <= 0) {
    return undefined;
  }

  const key = `workshop_${category}_${idItem}`;

  switch (unit) {
    case "点券":
      return {
        buyExchange: {
          key,
          price: {
            type: "wallet_balance",
            currency: "credits",
            amount: price,
          },
          gain: `${idComplete}:1`,
        }
      };
    case "钻石":
      return {
        buyExchange: {
          key,
          spend: {
            diamond: price
          },
          gain: `${idComplete}:1`
        }
      };
    case "EC币":
      return {
        buyExchange: {
          key,
          spend: {
            coin: price
          },
          gain: `${idComplete}:1`
        }
      };
    default:
      return undefined;
  }
}

/**
 * 根据是否设置了imageMask，生成“gainAnimation”
 */
export function generateGainAnimation(
  item: WorkshopItem,
  category: string,
  parts: string
): Record<string, any> | undefined {
  if (!item.imageMask) {
    return undefined;
  }

  // 有些情况要用套装id
  if (parts === "套装") {
    const suitId = item["suitIdItem"] || "";
    return {
      image: `http://oss.easecation.net/${category}/suit.${suitId}.full.png`,
      imageMask: `http://oss.easecation.net/${category}/suit.${suitId}.mask.png`,
    };
  }

  // 其他情况
  const idItem = item["idItem"];
  return {
    image: `http://oss.easecation.net/${category}/${idItem}.full.png`,
    imageMask: `http://oss.easecation.net/${category}/${idItem}.mask.png`,
  };
}