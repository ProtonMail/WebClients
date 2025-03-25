import type { ItemImportIntent } from '@proton/pass/types';

export const attachFilesToItem = (item: ItemImportIntent, files: string[]) => ({ ...item, files });
