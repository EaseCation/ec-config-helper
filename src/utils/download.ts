export function downloadJson(jsonData: any, fileName: string) {
  // 使用 JSON.stringify 将 jsonData 转换为格式化的 JSON 字符串
  const dataStr = JSON.stringify(jsonData, null, 2); 


  // 创建 Blob 对象，确保文件类型是 JSON 文件
  const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
  console.log(blob)
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
