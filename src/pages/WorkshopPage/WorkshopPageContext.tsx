import React, { createContext, ReactNode, useCallback, useEffect, useState, } from "react";
import localforage from "localforage";
import type { MessageInstance } from "antd/es/message/interface";

export interface WorkshopPageContextType {
  dirHandle?: FileSystemDirectoryHandle;
  chooseDirectory: (mode?: FileSystemPermissionMode) => Promise<void>;
  ensurePermission: (mode?: FileSystemPermissionMode) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (fileName: string, content: string) => Promise<void>;
  messageApi: MessageInstance;
}

export const WorkshopPageContext = createContext<WorkshopPageContextType>({
  chooseDirectory: async () => {},
  ensurePermission: async () => false,
  readFile: async () => '',
  writeFile: async () => {},
  messageApi: {} as MessageInstance,
});

interface WorkshopPageContextProviderProps {
  children: ReactNode;
  messageApi: MessageInstance;
}

export const WorkshopPageContextProvider: React.FC<WorkshopPageContextProviderProps> = ({
                                                                                          children,
                                                                                          messageApi,
                                                                                        }) => {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle>();

  // 1. 从 localforage 获取已存的句柄
  useEffect(() => {
    (async () => {
      try {
        const storedHandle = await localforage.getItem<FileSystemDirectoryHandle>("dirHandle");
        if (storedHandle) {
          setDirHandle(storedHandle);
        }
      } catch (error) {
        console.error("Failed to load dirHandle from localforage:", error);
      }
    })();
  }, []);

  // 2. 将句柄写入 localforage
  useEffect(() => {
    if (!dirHandle) return;
    (async () => {
      try {
        await localforage.setItem("dirHandle", dirHandle);
      } catch (error) {
        console.error("Failed to save dirHandle to localforage:", error);
      }
    })();
  }, [dirHandle]);

  /**
   * 3. 封装一个检查或请求权限的函数
   *
   * @param mode 可选 "read" | "readwrite"，默认 "read"
   * @returns 是否拥有了权限（true/false）
   */
  const ensurePermission = useCallback(
    async (mode: FileSystemPermissionMode = "read") => {
      if (!dirHandle) {
        messageApi.info("尚未选择任何目录");
        return false;
      }
      // 先检查当前权限状态
      const currentPerm = await dirHandle.queryPermission({ mode });
      if (currentPerm === "granted") {
        return true;
      }
      // 如果不是 granted，则请求权限
      const requestResult = await dirHandle.requestPermission({ mode });
      if (requestResult === "granted") {
        return true;
      } else {
        messageApi.error("权限被拒绝，无法访问目录");
        return false;
      }
    },
    [dirHandle, messageApi]
  );

  /**
   * 4. 选取目录，并自动请求权限
   */
  const chooseDirectory = useCallback(
    async (mode: FileSystemPermissionMode = "read") => {
      try {
        const handle = await window.showDirectoryPicker();
        setDirHandle(handle);

        // 选好后可直接请求权限
        const perm = await handle.requestPermission({ mode });
        if (perm === "granted") {
          messageApi.success(`成功选择目录：${handle.name}`);
        } else {
          messageApi.warning(`选择了目录：${handle.name}，但未授予权限`);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          messageApi.info("用户取消选择目录");
        } else {
          messageApi.error("选择目录失败，该功能仅支持 Chrome");
          console.error("chooseDirectory error:", error);
        }
      }
    },
    [messageApi]
  );

  const readFile = useCallback(
    async (filePath: string): Promise<string> => {
      if (!dirHandle) {
        throw new Error("尚未选择任何目录");
      }

      try {
        // 确保拥有读取权限
        const hasPermission = await ensurePermission("read");
        if (!hasPermission) throw new Error("权限被拒绝，无法访问目录")

        // 解析路径，支持子文件夹
        const pathSegments = filePath.split("/"); // 将路径拆分为子文件夹和文件名
        const fileName = pathSegments.pop()!; // 提取文件名（路径最后一部分）

        let currentDirHandle = dirHandle;
        for (const segment of pathSegments) {
          // 遍历路径，依次进入子文件夹
          currentDirHandle = await currentDirHandle.getDirectoryHandle(segment, { create: false });
        }

        // 获取文件句柄
        const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: false });

        // 读取文件内容
        const file = await fileHandle.getFile();
        return await file.text();
      } catch (error: any) {
        if (error?.name === "NotFoundError") {
          throw new Error("NotFoundError");
        } else {
          console.error("readFile error:", error);
          throw new Error("读取文件出错");
        }
      }
    },
    [dirHandle, ensurePermission, messageApi]
  );

  /**
   * 5. 写入文件到当前目录
   *
   * @param fileName 文件名（包含扩展名，例如 "example.json"）
   * @param content 文件内容（字符串）
   */
  const writeFile = useCallback(
    async (filePath: string, content: string) => {
      if (!dirHandle) {
        messageApi.info("尚未选择任何目录");
        return;
      }

      try {
        // 确保拥有写入权限
        const hasPermission = await ensurePermission("readwrite");
        if (!hasPermission) return;

        // 解析路径，支持子文件夹
        const pathSegments = filePath.split("/"); // 将路径拆分为子文件夹和文件名
        const fileName = pathSegments.pop()!; // 提取文件名（路径最后一部分）

        let currentDirHandle = dirHandle;
        for (const segment of pathSegments) {
          // 遍历路径，依次进入子文件夹，必要时创建
          currentDirHandle = await currentDirHandle.getDirectoryHandle(segment, { create: true });
        }

        // 获取文件句柄，若不存在则创建
        const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });

        // 创建文件流写入内容
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        messageApi.success(`文件 ${filePath} 写入成功`);
      } catch (error) {
        messageApi.error(`写入文件 ${filePath} 失败`);
        console.error("writeFile error:", error);
      }
    },
    [dirHandle, ensurePermission, messageApi]
  );

  return (
    <WorkshopPageContext.Provider
      value={{
        dirHandle,
        chooseDirectory,
        ensurePermission,
        readFile,
        writeFile,
        messageApi,
      }}
    >
      {children}
    </WorkshopPageContext.Provider>
  );
};