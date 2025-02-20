export interface GenericInfo {
  translateKey: string;
}

export interface ExchangeInfo {
  fallbackExchange: {
    key: string;
    gain: string;
  };
}

export interface CommodityType {
  typeId: string;
  generic: GenericInfo;
  exchange: ExchangeInfo;
}

export interface CommodityData {
  _comment: string;
  types: CommodityType[];
}


export interface DifferentParts {
    isEqual: boolean;
    addedItems: CommodityType[];
    deletedItems: CommodityType[];
    modifiedItems: CommodityType[];
    commonItems: CommodityType[];
  }
  
export const areCommodityTypesEqual = (item1: CommodityType, item2: CommodityType): boolean => {
    return (
        item1.typeId === item2.typeId &&
        item1.generic.translateKey === item2.generic.translateKey &&
        item1.exchange?.fallbackExchange?.key === item2.exchange?.fallbackExchange?.key &&
        item1.exchange?.fallbackExchange?.gain === item2.exchange?.fallbackExchange?.gain
    );
};

export const compareCommodityData = (
    localData: CommodityData,
    remoteData: CommodityData
  ): DifferentParts => {
    let addedItems: CommodityType[] = [];
    let deletedItems: CommodityType[] = [];
    let modifiedItems: CommodityType[] = [];
    let commonItems: CommodityType[] = [];
  
    const localTypes = localData.types;
    const remoteTypes = remoteData.types;
  
    const remainingRemote = [...remoteTypes];
  
    localTypes.forEach((localItem) => {
      const foundIndex = remainingRemote.findIndex(
        (remoteItem) => remoteItem.typeId === localItem.typeId
      );
  
      if (foundIndex !== -1) {
        const remoteItem = remainingRemote[foundIndex];
  
        // If the items are equal, push to commonItems
        if (areCommodityTypesEqual(localItem, remoteItem)) {
          commonItems.push(localItem);
        } else {
          modifiedItems.push(remoteItem);
        }
  
        remainingRemote.splice(foundIndex, 1);
      } else {
        deletedItems.push(localItem);
      }
    });
  
    // The remaining remote items are the added ones
    addedItems = remainingRemote;
  
    console.log(JSON.stringify(remainingRemote));
  
    return {
      isEqual:
        addedItems.length === 0 && deletedItems.length === 0 && modifiedItems.length === 0,
      addedItems,
      deletedItems,
      modifiedItems,
      commonItems, // Include commonItems in the return object
    };
  };
  
  
  