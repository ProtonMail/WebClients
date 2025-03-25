import type { ImportFileReader } from '@proton/pass/lib/import/types';
import { prop } from '@proton/pass/utils/fp/lens';

export const readZIP = async (file: File): Promise<ImportFileReader> => {
    const zip = await import('@zip.js/zip.js');
    const reader = new zip.ZipReader(new zip.BlobReader(file));
    const entries = await reader.getEntries();
    const files = new Set(entries.map(prop('filename')));

    return {
        files,
        getFile: async (filename: string) => {
            try {
                const match = entries.find((entry) => entry.filename === filename);
                return match ? ((await match.getData?.(new zip.BlobWriter())) ?? null) : null;
            } catch (err) {
                return null;
            }
        },
    };
};
