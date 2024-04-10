import { type FC, type PropsWithChildren, createContext, useCallback, useContext } from 'react';

import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import type { MaybeNull } from '@proton/pass/types';

import { PasswordUnlockProvider } from './PasswordUnlockProvider';
import { PinUnlockProvider } from './PinUnlockProvider';

type UnlockContextValue = { unlock: (dto: UnlockDTO) => Promise<void> };

const UnlockContext = createContext<MaybeNull<UnlockContextValue>>(null);

export const UnlockProvider: FC<PropsWithChildren<UnlockContextValue>> = ({ unlock, children }) => (
    <UnlockContext.Provider value={{ unlock }}>
        <PasswordUnlockProvider>
            <PinUnlockProvider>{children}</PinUnlockProvider>
        </PasswordUnlockProvider>
    </UnlockContext.Provider>
);

export const useUnlock = (onError?: (error: Error) => void) => {
    const ctx = useContext(UnlockContext);
    if (!ctx) throw new Error('Unlock context not initialized');

    return useCallback(
        async (dto: UnlockDTO) => {
            try {
                await ctx.unlock(dto);
            } catch (err) {
                if (err instanceof Error) onError?.(err);
                throw err;
            }
        },
        [ctx.unlock, onError]
    );
};
