import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useContext, useState } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';

import { PinUnlockModal } from './PinUnlockModal';

type LockConfirmState = { title: string; assistiveText: string };
type PinUnlockContextValue = UseAsyncModalHandle<string, LockConfirmState>;

const PinUnlockContext = createContext<PinUnlockContextValue>(async () => {});

export const PinUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const [key, setKey] = useState<number>(0);

    const { handler, abort, resolver, state } = useAsyncModalHandles<string, LockConfirmState>({
        getInitialModalState: () => ({
            title: c('Title').t`Enter your PIN`,
            assistiveText: c('Info').t`Please enter your current PIN code to continue`,
        }),
    });

    const value = useCallback<PinUnlockContextValue>(
        (props) => {
            setKey((id) => id + 1);
            return handler(props);
        },
        [handler]
    );

    return (
        <PinUnlockContext.Provider value={value}>
            {children}
            <PinUnlockModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PinUnlockContext.Provider>
    );
};

export const usePinUnlock = () => useContext(PinUnlockContext);
