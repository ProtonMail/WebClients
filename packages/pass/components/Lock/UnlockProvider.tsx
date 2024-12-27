import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';

import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import type { MaybeNull } from '@proton/pass/types';

type UnlockContextValue = (dto: UnlockDTO) => Promise<void>;

const UnlockContext = createContext<MaybeNull<UnlockContextValue>>(null);

/** Ideally we could move this to `PassCoreProvider` but as
 * the `unlock` implementation can depend on other context
 * objects, we resort to a custom context provider */
export const UnlockProvider: FC<PropsWithChildren<{ unlock: UnlockContextValue }>> = ({ unlock, children }) => (
    <UnlockContext.Provider value={unlock}>{children}</UnlockContext.Provider>
);

export const useUnlock = (onError?: (error: Error) => void) => {
    const unlock = useContext(UnlockContext);
    if (!unlock) throw new Error('Unlock context not initialized');

    return useCallback(
        async (dto: UnlockDTO) => {
            try {
                await unlock(dto);
            } catch (err) {
                if (err instanceof Error) onError?.(err);
                throw err;
            }
        },
        [unlock, onError]
    );
};
