import { WorkshopCommodityExchange, WorkshopCommodityGainAnimation, WorkshopItem } from "../../types/workshop";
import { WORKSHOP_DEFAULTS } from "./workshopConstants";

/**
 * 根据category/parts等，返回商店图片URL
 */
export function getImageURL(
  item: WorkshopItem,
  category: string,
  parts: string
): string {
  const { idItem, shopImage, suitIdItem } = item;

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
        return `http://oss.easecation.net/${category}/suit.${suitIdItem}.png`;
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
): WorkshopCommodityExchange | undefined {
  const price = item["price"] ?? 0;
  const unit = item["priceUnit"] || "";
  const idItem = item["idItem"] || "";
  const freeCreditsMaxPercent = item["freeCreditsMaxPercent"];

  if (price <= 0) {
    validateNoFreeCreditsMaxPercentForFreeItem(item, idComplete);
    return undefined;
  }

  const key = `workshop_${category}_${idItem}`;

  switch (unit) {
    case "点券":
      validateFreeCreditsMaxPercent(item, idComplete);
      return {
        buyExchange: {
          key,
          price: {
            type: "wallet_balance",
            currency: "credits",
            amount: price,
            ...(freeCreditsMaxPercent !== null ? { freeCreditsMaxPercent } : {}),
          },
          gain: `${idComplete}:1`,
        }
      };
    case "钻石":
      validateNoFreeCreditsMaxPercentForNonCredits(item, idComplete, unit);
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
      validateNoFreeCreditsMaxPercentForNonCredits(item, idComplete, unit);
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
      validateNoFreeCreditsMaxPercentForNonCredits(item, idComplete, unit);
      return undefined;
  }
}

function validateFreeCreditsMaxPercent(item: WorkshopItem, idComplete: string): void {
  const value = item["freeCreditsMaxPercent"];
  if (value === null) {
    return;
  }
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`商品 ${idComplete} 的“奖励点券最高抵扣比例”必须是 0 到 100 之间的整数`);
  }
}

function validateNoFreeCreditsMaxPercentForNonCredits(item: WorkshopItem, idComplete: string, unit: string): void {
  if (item["freeCreditsMaxPercent"] !== null) {
    throw new Error(`商品 ${idComplete} 的“奖励点券最高抵扣比例”只能用于点券价格，当前价格单位为 ${unit || "空"}`);
  }
}

function validateNoFreeCreditsMaxPercentForFreeItem(item: WorkshopItem, idComplete: string): void {
  if (item["freeCreditsMaxPercent"] !== null) {
    throw new Error(`商品 ${idComplete} 配置了“奖励点券最高抵扣比例”，但没有有效价格`);
  }
}

/**
 * 根据是否设置了imageMask，生成“gainAnimation”
 */
export function generateGainAnimation(
  item: WorkshopItem,
  category: string,
  parts: string
): WorkshopCommodityGainAnimation | undefined {
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
