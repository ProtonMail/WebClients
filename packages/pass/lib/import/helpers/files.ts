import { getFileParts } from '@proton/pass/lib/file-attachments/helpers';
import { ImportProvider } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import lastItem from '@proton/utils/lastItem';

export const attachFilesToItem = (item: ItemImportIntent, files: string[]) => ({ ...item, files });

export const getImportFilename = (path: string, provider: ImportProvider) => {
    const filename = lastItem(path.split('/'))!;

    switch (provider) {
        case ImportProvider.PROTONPASS: {
            /** `{filename}.{uuid}.{ext}` */
            const parts = getFileParts(filename);
            if (!parts) return filename;
            if (parts.ext.length <= 4) {
                const subParts = parts.name.split('.');
                if (subParts.length === 1) return filename;
                return `${subParts.slice(0, -1).join('.')}${parts.ext}`;
            } else return filename;
        }
        case ImportProvider.ONEPASSWORD: {
            /** `{documentId}__{filename}.{ext}` */
            const parts = filename.split('__');
            if (parts.length === 1) return filename;
            return parts.slice(1).join('__');
        }
        default:
            return filename;
    }
};
