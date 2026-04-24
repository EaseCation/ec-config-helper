import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileStore } from '../services/config/mcpConfigService.js';

export class RepoFileStore implements FileStore {
  constructor(private readonly root: string) {}

  getRoot(): string {
    return this.root;
  }

  resolve(relativePath: string): string {
    if (!relativePath || path.isAbsolute(relativePath)) {
      throw new Error('Path must be a non-empty relative path');
    }

    const normalized = path.normalize(relativePath);
    if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) {
      throw new Error(`Path escapes EC_REPO_ROOT: ${relativePath}`);
    }

    const resolved = path.resolve(this.root, normalized);
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : `${this.root}${path.sep}`;
    if (resolved !== this.root && !resolved.startsWith(rootWithSep)) {
      throw new Error(`Path escapes EC_REPO_ROOT: ${relativePath}`);
    }
    return resolved;
  }

  async readJson<T>(relativePath: string): Promise<T | null> {
    try {
      const text = await fs.readFile(this.resolve(relativePath), 'utf8');
      return JSON.parse(text) as T;
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  }

  async writeJson(relativePath: string, value: unknown): Promise<void> {
    const absolutePath = this.resolve(relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `${JSON.stringify(value, null, 4)}\n`, 'utf8');
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch (error: any) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }
  }
}

export function createRepoFileStore(repoRoot = process.env.EC_REPO_ROOT): RepoFileStore {
  if (!repoRoot) {
    throw new Error('Missing EC_REPO_ROOT environment variable');
  }
  return new RepoFileStore(path.resolve(repoRoot));
}
