export function formatDuration(seconds: number): string {
  if (seconds === 0 || seconds === 1) return '永久';
  const units = [
    { value: 31104000, label: '年' },
    { value: 2592000, label: '月' },
    { value: 86400, label: '天' },
    { value: 3600, label: '小时' },
    { value: 60, label: '分钟' },
    { value: 1, label: '秒' }
  ];
  for (const unit of units) {
    if (seconds >= unit.value) {
      const count = Math.floor(seconds / unit.value);
      return `${count}${unit.label}`;
    }
  }
  return `${seconds}秒`;
}
