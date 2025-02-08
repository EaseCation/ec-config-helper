import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function downloadJson(jsonData: any, fileName: string) {
  // 使用 JSON.stringify 将 jsonData 转换为格式化的 JSON 字符串
  const dataStr = JSON.stringify(jsonData, null, 2);  // 这里的 `null, 2` 表示格式化 JSON 数据，2 表示每级缩进两个空格

  // 创建 Blob 对象，确保文件类型是 JSON 文件
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
  
  // 创建一个 URL 对象，以便生成下载链接
  const url = URL.createObjectURL(blob);

  // 创建一个锚点元素，用于触发下载
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;

  // 触发点击事件以启动下载
  document.body.appendChild(a);
  a.click();

  // 清理，移除锚点元素
  document.body.removeChild(a);

  // 释放 Blob URL
  URL.revokeObjectURL(url);
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