import { AVERAGE_BYTES_PER_LOG_LINE, MAX_LOG_STORAGE_LINES, MAX_LOG_STORAGE_RATIO } from '@proton/pass/constants';
import type { AnyStorage } from '@proton/pass/types';
import { getLocalStorageQuota } from '@proton/pass/utils/dom/storage';
import debounce from '@proton/utils/debounce';

export type LogStorageData = { logs: string };
const LOG_STORAGE_KEY = 'logs';

export const createLogStore = <T extends LogStorageData>(storage: AnyStorage<T>) => {
    const buffer: string[] = [];

    const clear = async () => {
        buffer.length = 0;
        void storage.removeItem(LOG_STORAGE_KEY);
    };

    /** Reads the logs from storage. If parsing the
     * logs fails, clears the log storage key */
    const read = async (): Promise<string[]> => {
        try {
            const logs = await storage.getItem(LOG_STORAGE_KEY);
            return typeof logs === 'string' ? [...buffer, ...JSON.parse(logs)] : buffer;
        } catch {
            void storage.removeItem(LOG_STORAGE_KEY);
            return buffer;
        }
    };

    /** Debounces the write operation to occur once every 5 seconds
     * to prevent excessive concurrent writes to the storage */
    const write = debounce(async () => {
        const maxLogSize = MAX_LOG_STORAGE_RATIO * (await getLocalStorageQuota());
        const maxLogLinesLength = maxLogSize / AVERAGE_BYTES_PER_LOG_LINE;
        const max = Math.min(maxLogLinesLength, MAX_LOG_STORAGE_LINES);

        const logs = (await read()).slice(0, max);
        void storage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
        buffer.length = 0;
    }, 5_000);

    const push = (...logs: string[]) => {
        buffer.unshift(`${new Date().toLocaleString()} ${logs.join(' ')}`);
        void write();
        return true;
    };

    return { push, read, flush: write.flush, clear };
};

export type LogStore = ReturnType<typeof createLogStore>;
