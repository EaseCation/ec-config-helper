import { useState, useEffect, useCallback } from 'react';
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

  // 重新获取数据的函数
  const fetchData = useCallback(async () => {
    if (!databaseId) {
      console.error('请先输入 Lottery 数据库 ID');
      return {};
    }

    const token = getNotionToken();
    if (!token) {
      console.error('尚未设置 Notion Token');
      return {};
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

      setFileArray(newFileArray);
    } catch (err) {
      console.error('生成失败: ', err);
    } finally {
      setLoading(false);
    }

    return newFileArray;
  }, [databaseId]);

  // 初次加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 返回 `refetch` 让外部调用
  return { loading, fileArray, refetch: fetchData };
};
