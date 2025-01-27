import React from 'react';
import { diffLines } from 'diff';

export function highlightLineDiff(oldStr: string, newStr: string): JSX.Element {
  // 生成行级别的差异信息
  const diff = diffLines(oldStr, newStr);

  return (
    <pre style={{ margin: 0, fontSize: 12 }}>
      {diff.map((part, index) => {
        let backgroundColor: string | undefined;

        if (part.added) {
          // 新增的行 -> 绿色背景
          backgroundColor = 'rgba(0, 255, 0, 0.15)';
        } else if (part.removed) {
          // 删除的行 -> 红色背景
          backgroundColor = 'rgba(255, 0, 0, 0.3)';
        } else {
          // 未变化的行 -> 无底色或保持原样
          backgroundColor = 'transparent';
        }

        return (
          <div
            key={index}
            style={{
              backgroundColor,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {part.value}
          </div>
        );
      })}
    </pre>
  );
}