import { DEFAULT_TIMEOUT } from '@proton/shared/lib/constants';

/** Tracks items with ongoing file attachment operations */
export const PendingFileLinkTracker = (() => {
    const pending = new Set<string>();

    return {
        isPending: (key: string): boolean => pending.has(key),
        track: (key: string, ms = DEFAULT_TIMEOUT * 1.5): (() => void) => {
            pending.add(key);
            const timeoutId = setTimeout(() => pending.delete(key), ms);

            return () => {
                clearTimeout(timeoutId);
                pending.delete(key);
            };
        },
    };
})();
