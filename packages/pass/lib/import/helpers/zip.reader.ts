import type { ImportFileReader } from '@proton/pass/lib/import/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';

export const readZIP = async (file: File): Promise<ImportFileReader> => {
    const zip = await import(/* webpackChunkName: "zip.reader" */ '@zip.js/zip.js');
    const reader = new zip.ZipReader(new zip.BlobReader(file), {
        useWebWorkers: !EXTENSION_BUILD,
        useCompressionStream: false,
    });

    const entries = await reader.getEntries();
    const files = new Set(entries.filter(not(prop('directory'))).map(prop('filename')));
    const dirs = new Set(entries.filter(prop('directory')).map(prop('filename')));

    return {
        files,
        dirs,
        getFile: async (filename: string) => {
            try {
                const match = entries.find((entry) => entry.filename === filename);
                return match && !match.directory ? ((await match.getData?.(new zip.BlobWriter())) ?? null) : null;
            } catch (err) {
                return null;
            }
        },
        close: () => {
            try {
                void reader.close();
                void zip.terminateWorkers();
            } catch {}
        },
    };
};
