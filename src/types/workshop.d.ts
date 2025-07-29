export interface WorkshopItem {
    "onlineState": string | null;
    "fullId": string | null;
    "name": string | null;
    "shopImage": string | null;
    "price": number | null;
    "rarity": string | null;
    "discountRate": number | null;
    "discountPrices": number | null;
    "imageSizeX": number | null;
    "imageSizeY": number | null;
    "scale": number | null;
    "offsetX": number | null;
    "offsetY": number | null;
    "useFullPreview": boolean;
    "hideToNotOwned": boolean;
    "access": string | null;
    "accessToDo": string | null;
    "priceUnit": string | null;
    "imageMask": boolean;
    "weaponSkinItemId": string | null;
    "suitIdItem": string | null;
    "confirmIntroduce": string | null;
    "ornamentPart": string | null;
    "category": string | null;
    "idItem": string | null;
    "fallbackExchange": string | null;
}

export interface WorkshopCommodityConfig {
    _comment: string;
    typeId: string;
    items: {
        [key: string]: WorkshopCommodityConfigItem;
    };
}

export interface WorkshopCommodityConfigItem {
    id: string;
    workshop: {
        name: string;
        introduce: string;
        rarity: string;
        discount: number;
        image: string;
        imageSize: [number, number];
        preview?: WorkshopCommodityConfigPreview;
        howMsg?: string;
        howAction?: string;
        gainAnimation?: WorkshopCommodityGainAnimation;
        hide?: boolean;
    };
    exchange?: WorkshopCommodityExchange;

}

export type WorkshopCommodityConfigPreview =
  | { type: 'creature'; creature: string; scale?: number; offset?: [number, number]; extraButton?: ExtraButton }
  | { type: 'pet'; pet: string; scale?: number; offset?: [number, number]; extraButton?: ExtraButton }
  | { type: 'ornament'; ornaments: string[]; scale?: number; offset?: [number, number]; extraButton?: ExtraButton }
  | { type: 'self'; scale?: number; offset?: [number, number]; rotation?: boolean; animations?: Record<string, string>; extraButton?: ExtraButton }
  | { type: 'self_prefix'; prefix: string; scale?: number; offset?: [number, number]; extraButton?: ExtraButton }
  | { type: 'image'; image: string; size?: [number, number]; extraButton?: ExtraButton }
  | { type: 'music'; music: string; extraButton?: ExtraButton }
  | { type: 'attack_eff'; image: string; size?: [number, number]; attack_eff: string; extraButton?: ExtraButton }
  | { type: 'deathshow'; deathshow: string; extraButton?: ExtraButton };

export interface ExtraButton {
    text: string;
    action: Record<string, any>;
}

export type ExchangeConfig = {
    key: string;
    spend?: {
        diamond?: number;
        coin?: number;
        exp?: number;
    }
    price?: {
        type: string;
        currency: string;
        amount: number;
    };
    gain?: string | string[];
}

export type WorkshopCommodityExchange = {
    buyExchange?: string | ExchangeConfig;
    fallbackExchange?: string | ExchangeConfig;
}

export type WorkshopCommodityGainAnimation = {
    image: string;
    imageMask: string;
}