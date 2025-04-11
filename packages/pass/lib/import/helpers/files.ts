import { getFileParts } from '@proton/pass/lib/file-attachments/helpers';
import { ImportProvider } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import lastItem from '@proton/utils/lastItem';

export const attachFilesToItem = (item: ItemImportIntent, files: string[]) => ({ ...item, files });

export const getImportFilename = (path: string, provider: ImportProvider) => {
    const filename = lastItem(path.split('/'))!;

    switch (provider) {
        case ImportProvider.PROTONPASS: {
            /** `{base}.{uuid}.{ext}` */
            const parts = getFileParts(filename);

            /** If extension is greater than 16 : we're likely
             * dealing with an extension-less file for which we
             * appended a uniqueId during export */
            if (parts.ext.length >= 16) return parts.base;

            const subParts = parts.base.split('.');
            if (subParts.length === 1) return filename;
            return `${subParts.slice(0, -1).join('.')}${parts.ext}`;
        }
        case ImportProvider.ONEPASSWORD: {
            /** `{documentId}__{base}.{ext}` */
            const parts = filename.split('__');

            if (parts.length === 1) return filename;
            return parts.slice(1).join('__');
        }
        default:
            return filename;
    }
};
