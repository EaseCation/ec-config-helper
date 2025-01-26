import { WorkshopCommodityConfigPreview, WorkshopItem } from "../../types/workshop";

/**
 * 根据category/parts以及部分字段，生成预览用的 preview 对象。
 */
export function generatePreview(
  item: WorkshopItem,
  idComplete: string,
  image: string
): WorkshopCommodityConfigPreview {
  const { category, idItem, "ornamentPart": parts, useFullPreview } = item;
  if (!idItem) {
    throw new Error("idItem is required");
  }

  // 如果勾选了“使用原图Preview”
  if (useFullPreview) {
    return {
      type: "image",
      image,
      size: [100, 100],
    };
  }

  // 以下是对 category 的分类处理
  switch (category) {
    case "pet":
      return {
        type: "pet",
        pet: idItem,
        offset: [item["offsetX"] || 0, item["offsetY"] || 0],
        scale: item.scale ?? 0.4
      };

    case "ornament":
      if (parts === "套装") {
        return {
          type: "ornament",
          ornaments: [idItem]
        };
      } else if (idItem?.startsWith("halo.")) {
        return {
          type: "image",
          image,
          size: [100, 100]
        };
      } else {
        return {
          type: "ornament",
          ornaments: [idItem]
        };
      }

    case "prefix":
      // prefix 显示文字
      return {
        type: "self_prefix",
        // 注意，这里 name 可能在外部进行赋值
        prefix: item.name || `shop.${idComplete}`
      };

    case "music":
      return {
        type: "music",
        music: idItem
      };

    case "weaponskin":
      return {
        type: "self",
        //item: item["weaponSkinItemId"] || ""
      };

    case "attack-eff":
      return {
        type: "attack_eff",
        image,
        size: [100, 100],
        attack_eff: idItem
      };

    case "deathshow":
      return {
        type: "deathshow",
        deathshow: idItem
      };

    default:
      // 如果是resourcepack.aim 或者其他都可以在这里做额外逻辑
      if (idComplete.startsWith("resourcepack.aim.")) {
        return {
          type: "image",
          image,
          size: [40, 40]
        };
      }
      // 兜底 - 默认展示图片
      return {
        type: "image",
        image,
        size: [100, 100]
      };
  }
}