import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(jsonData: any, fileName: string) {
  // 使用 JSON.stringify 将 jsonData 转换为格式化的 JSON 字符串
  const dataStr = JSON.stringify(jsonData, null, 2);  // 这里的 `null, 2` 表示格式化 JSON 数据，2 表示每级缩进两个空格

  // 创建 Blob 对象，确保文件类型是 JSON 文件
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });

  triggerDownload(blob, fileName);
}

export function downloadCSV(csvData: string, fileName: string) {
  const BOM = '\uFEFF'; // UTF-8 BOM 让 Excel 识别为 UTF-8
  const normalized = csvData.replace(/\r?\n/g, '\r\n'); // 统一为 CRLF
  const blob = new Blob([BOM, normalized], { type: 'text/csv;charset=utf-8;' });

  const resolvedName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  triggerDownload(blob, resolvedName);
}

export function downloadMarkdown(mdData: string, fileName: string) {
  const blob = new Blob([mdData], { type: 'text/markdown;charset=utf-8' });
  const resolvedName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
  triggerDownload(blob, resolvedName);
}

export function downloadCSVAsZip(fileArray: Record<string, string>, zipFileName: string) {
  const zip = new JSZip();

  Object.entries(fileArray).forEach(([fileName, csvData]) => {
    const BOM = '\uFEFF';
    const normalized = csvData.replace(/\r?\n/g, '\r\n');
    zip.file(`${fileName}.csv`, BOM + normalized);
  });

  zip
    .generateAsync({ type: 'blob' })
    .then((blob) => {
      saveAs(blob, zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`);
    })
    .catch((error) => {
      console.error('Error generating ZIP file:', error);
    });
}

export function downloadJsonAsZip(fileArray: { [key: string]: any }, zipFileName: string) {
  // 创建一个 JSZip 实例
  const zip = new JSZip();

  // 遍历 fileArray，将每个 JSON 文件添加到 ZIP 包中
  Object.keys(fileArray).forEach((fileName) => {
    const jsonData = fileArray[fileName];
    const dataStr = JSON.stringify(jsonData, null, 2); // 格式化 JSON 数据
    zip.file(`${fileName}.json`, dataStr); // 将 JSON 文件添加到 ZIP 包中
  });

  // 生成 ZIP 文件
  zip.generateAsync({ type: 'blob' })
    .then((blob) => {
      // 使用 FileSaver.js 提供下载
      saveAs(blob, `${zipFileName}.zip`);
    })
    .catch((error) => {
      console.error('Error generating ZIP file:', error);
    });
}
