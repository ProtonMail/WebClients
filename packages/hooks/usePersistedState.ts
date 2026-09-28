import { useCallback, useState } from 'react';

interface PersistedStateOptions<T extends {}> {
    /** Value used while nothing valid is stored. In-memory only: it is never written to storage. */
    initialValue?: T;
    /** Entry lifetime in ms. An older entry is removed on read and treated as absent. Omitted means "never expires"; 0 means "always expired". */
    maxAge?: number;
}

type Stored<T> = { value: T; at: number };

/**
 * useState backed by localStorage. The value is read once on mount and every
 * setValue/clear writes through to storage, so it survives reloads. Values are
 * JSON encoded, so anything JSON-serialisable round-trips with its type intact.
 *
 * Unlike useState: returns `null` (not undefined) when there is no value, takes
 * an options object instead of a bare initial value, and accepts `null` only as
 * its own absence marker — persisting null/undefined is rejected by `T extends {}`.
 *
 * Storage failures (private mode, quota exceeded) are swallowed: the hook keeps
 * working as plain in-memory state.
 *
 * Not synced across tabs: another tab writing the same key will not re-render
 * this component. `key` and `maxAge` are only honoured on mount — changing them
 * later does not re-read storage.
 *
 * @param key - localStorage key. Own it per feature (e.g. 'mail-thread-density') to avoid collisions.
 * @param options.initialValue - fallback while no valid entry exists.
 * @param options.maxAge - entry lifetime in ms, see PersistedStateOptions.
 * @returns tuple of the current value, a setter, and a clear function.
 * @example
 * const [density, setDensity] = usePersistedState('mail-thread-density', { initialValue: 'comfortable' })
 * @example
 * // expires after a day, no initial value
 * const [bannerDismissed, dismissBanner] = usePersistedState<boolean>('promo-banner-dismissed', { maxAge: UNIX_DAY })
 */
export const usePersistedState = <T extends {}>(
    key: string,
    { initialValue, maxAge }: PersistedStateOptions<T> = {}
): [value: T | null, setValue: (next: T) => void, clear: () => void] => {
    const [value, setValue] = useState<T | null>(() => {
        const fallback = initialValue ?? null;

        try {
            const raw = localStorage.getItem(key);

            if (raw === null) {
                return fallback;
            }

            const { value, at } = JSON.parse(raw) as Stored<T>;

            if (maxAge !== undefined && Date.now() - at >= maxAge) {
                localStorage.removeItem(key);

                return fallback;
            }

            return value;
        } catch {
            try {
                localStorage.removeItem(key);
            } catch {}

            return fallback;
        }
    });

    const setPersistedValue = useCallback(
        (next: T) => {
            try {
                localStorage.setItem(key, JSON.stringify({ value: next, at: Date.now() } satisfies Stored<T>));
            } catch {}

            setValue(next);
        },
        [key]
    );

    const clear = useCallback(() => {
        try {
            localStorage.removeItem(key);
        } catch {}

        setValue(initialValue ?? null);
    }, [key, initialValue]);

    return [value, setPersistedValue, clear];
};
