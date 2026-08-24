import { prop } from '../../../utils/fp/lens';
import { not } from '../../../utils/fp/predicates';
import type { ImportFileReader } from '../types';
import { wasmURI } from './zip.reader.wasm';

export const readZIP = async (file: File): Promise<ImportFileReader> => {
    const zip = await import(/* webpackChunkName: "zip.reader" */ '@zip.js/zip.js');
    zip.configure({ useWebWorkers: false, useCompressionStream: false, wasmURI });
    const reader = new zip.ZipReader(new zip.BlobReader(file));

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
