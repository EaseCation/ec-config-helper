import { useState, useEffect, useCallback } from "react";
import { getNotionToken, fetchNotionAllPages } from "../../notion/notionClient";
import { formatLottery } from "../../services/lottery/lotteryService";
import { parseCheckbox, parseRollup, parseRelation } from "../../services/commonFormat";
import { message } from "antd"; // Ant Design 的消息组件

const splitString = (input: string): string[] => {
  return input.split(", ").filter((item) => item !== "");
};

// 自定义 Hook 获取 Lottery 数据
export const useLotteryData = (databaseId: string) => {
  const [loading, setLoading] = useState(false);
  const [fileArray, setFileArray] = useState<{ [key: string]: any }>({});

  // 重新获取数据的函数
  const fetchData = useCallback(async () => {
    if (!databaseId) {
      message.error("请先输入 Lottery 数据库 ID");
      return {};
    }

    const token = getNotionToken();
    if (!token) {
      message.error("尚未设置 Notion Token");
      return {};
    }

    let newFileArray: { [key: string]: any } = {};
    setLoading(true);

    try {
      const pages = await fetchNotionAllPages(databaseId, {});
      let result: { [key: string]: any } = {};
      let exchangeIdBoxId: { [key: string]: string } = {};

      for (const item of pages) {
        if (parseCheckbox(item.properties["禁用"])) continue;

        const boxId = parseRelation(item.properties["所在抽奖箱"]);
        const id = parseRollup(item.properties["exchange_id"]);
        if (typeof id !== "string" || id === "") continue;

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
          if (formattedData.name && formattedData.name !== "") {
            newFileArray[exchangeIdBoxId[key]] = {
              [formattedData.name]: formattedData.result,
            };
          }
        }
      }

      // ✅ 按 exchangeIdBoxId 的 key 进行字母顺序排序
      const sortedKeys = Object.keys(newFileArray).sort();
      let sortedFileArray: { [key: string]: any } = {};
      for (const key of sortedKeys) {
        sortedFileArray[key] = newFileArray[key];
      }

      setFileArray(sortedFileArray);
    } catch (err) {
      message.error("获取 Lottery 数据失败");
      console.error("获取 Lottery 数据失败:", err);
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
