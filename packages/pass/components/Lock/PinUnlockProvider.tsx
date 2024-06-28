import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';

import { PinUnlockModal } from './PinUnlockModal';

type LockConfirmState = { title: string; assistiveText: string };
type PinUnlockContextValue = UseAsyncModalHandle<string, LockConfirmState>;

const PinUnlockContext = createContext<PinUnlockContextValue>(async () => {});

export const PinUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const { handler, abort, resolver, state, key } = useAsyncModalHandles<string, LockConfirmState>({
        getInitialModalState: () => ({
            title: c('Title').t`Enter your PIN`,
            assistiveText: c('Info').t`Please enter your current PIN code to continue`,
        }),
    });

    return (
        <PinUnlockContext.Provider value={handler}>
            {children}
            <PinUnlockModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PinUnlockContext.Provider>
    );
};

export const usePinUnlock = () => useContext(PinUnlockContext);
