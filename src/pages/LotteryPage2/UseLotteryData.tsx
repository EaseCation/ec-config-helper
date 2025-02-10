import { useState, useEffect } from 'react';
import { getNotionToken, fetchNotionAllPages } from '../../notion/notionClient';
import { formatLottery } from '../../services/lottery/lotteryService';
import { parseCheckbox, parseRollup, parseRelation } from '../../services/commonFormat';

const splitString = (input: string): string[] => {
  return input.split(', ').filter(item => item !== '');
};

// 自定义 Hook 获取 Lottery 数据
export const useLotteryData = (databaseId: string) => {
  const [loading, setLoading] = useState(false);
  const [fileArray, setFileArray] = useState<{ [key: string]: any }>({});

  const handleGenerate = async () => {
    if (!databaseId) {
      throw new Error('请先输入 Lottery 数据库 ID');
    }
    const token = getNotionToken();
    if (!token) {
      throw new Error('尚未设置 Notion Token');
    }

    let newFileArray: { [key: string]: any } = {};
    setLoading(true);
    try {
      const pages = await fetchNotionAllPages(databaseId, {});
      let result: { [key: string]: any } = {};
      let exchangeIdBoxId: { [key: string]: string } = {};

      for (const item of pages) {
        if (parseCheckbox(item.properties['禁用'])) continue;
        const boxId = parseRelation(item.properties['所在抽奖箱']);
        const id = parseRollup(item.properties['exchange_id']);
        if (id === '') continue;

        for (const box of splitString(boxId)) {
          if (!result[box]) {
            result[box] = [];
          }
          result[box].push(item);

          if (splitString(boxId).length <= 1) {
            exchangeIdBoxId[box] = id;
          }
        }
      }

      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          const formattedData = formatLottery(result[key]);
          if (formattedData.name && formattedData.name !== '') {
            newFileArray[exchangeIdBoxId[key]] = {
              [formattedData.name]: formattedData.result,
            };
          }
        }
      }
    } catch (err) {
      console.error('生成失败: ', err);
    } finally {
      setLoading(false);
    }
    return newFileArray;
  };

  useEffect(() => {
    handleGenerate().then(setFileArray).catch(console.error);
  }, [databaseId]);

  return { loading, fileArray };
};
