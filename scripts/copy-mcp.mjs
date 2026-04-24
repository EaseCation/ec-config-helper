import { promises as fs } from 'node:fs';
import path from 'node:path';

const distRoot = path.resolve('dist-mcp');
const tempRoot = path.resolve('dist-mcp-ts');

const importPattern = /(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g;

function withJsExtensions(source) {
  return source.replace(importPattern, (_match, prefix, spec, suffix) => {
    if (spec.endsWith('.js') || spec.endsWith('.json') || spec.endsWith('.css')) {
      return `${prefix}${spec}${suffix}`;
    }
    return `${prefix}${spec}.js${suffix}`;
  });
}

async function rewriteJsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteJsFiles(filePath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      await fs.writeFile(filePath, withJsExtensions(await fs.readFile(filePath, 'utf8')), 'utf8');
    }
  }
}

await fs.rm(distRoot, { recursive: true, force: true });
await fs.rename(tempRoot, distRoot);
await rewriteJsFiles(distRoot);
