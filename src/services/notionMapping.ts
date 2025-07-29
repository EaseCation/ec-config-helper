import { NotionPage } from '../notion/notionTypes';
import { WorkshopItem } from "../types/workshop";
import * as fm from "./commonFormat";

/**
 * 将单个 NotionPage 解析为基础的 WorkshopItem 数据结构。
 */
export function pageToWorkshopItem(page: NotionPage): WorkshopItem {
  return {
    category: fm.parseRollup(page.properties['category']),
    idItem: fm.parseRichText(page.properties['idItem']),
    ornamentPart: fm.parseSelect(page.properties['4D装扮部位']),
    imageSizeX: fm.parseNumber(page.properties['imageSize-x']),
    imageSizeY: fm.parseNumber(page.properties['imageSize-y']),
    offsetX: fm.parseNumber(page.properties['offset-x']),
    offsetY: fm.parseNumber(page.properties['offset-y']),
    suitIdItem: fm.parseRichText(page.properties['suit iditem']),
    discountRate: fm.parseNumber(page.properties['折扣率 - 默认1 - 优先采用']),
    rarity: fm.parseSelect(page.properties['稀有度（新）']),
    imageMask: fm.parseCheckbox(page.properties['imageMask']),
    scale: fm.parseNumber(page.properties['scale']),
    onlineState: fm.parseSelect(page.properties['上线状态']),
    price: fm.parseNumber(page.properties['价格']),
    priceUnit: fm.parseSelect(page.properties['价格单位']),
    useFullPreview: fm.parseCheckbox(page.properties['使用原图Preview']),
    name: fm.parseTitle(page.properties['名称']),
    fullId: fm.parseFormula(page.properties['商品完整ID']) as string,
    shopImage: fm.parseRichText(page.properties['商店图片']),
    hideToNotOwned: fm.parseCheckbox(page.properties['对未拥有玩家隐藏']),
    discountPrices: fm.parseNumber(page.properties['折后价格']),
    weaponSkinItemId: fm.parseRichText(page.properties['武器皮肤自定义物品ID']),
    access: fm.parseRichText(page.properties['获取方式']),
    accessToDo: fm.parseRichText(page.properties['获取方式配置']),
    confirmIntroduce: fm.parseRichText(page.properties['购买确认页简介']),
    fallbackExchange: fm.parseRichText(page.properties['fallbackExchange']),
  };
}