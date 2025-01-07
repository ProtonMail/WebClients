import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';

import type { PinUnlockModalState } from './PinUnlockModal';
import { PinUnlockModal } from './PinUnlockModal';

type PinUnlockContextValue = UseAsyncModalHandle<string, PinUnlockModalState>;

const PinUnlockContext = createContext<PinUnlockContextValue>(async () => {});

const getInitialModalState = (): PinUnlockModalState => ({
    title: c('Title').t`Enter your PIN`,
    assistiveText: c('Info').t`Please enter your current PIN code to continue`,
});

export const PinUnlockProvider: FC<PropsWithChildren> = ({ children }) => {
    const modal = useAsyncModalHandles<string, PinUnlockModalState>({ getInitialModalState });
    const { handler, abort, resolver, state, key } = modal;

    return (
        <PinUnlockContext.Provider value={handler}>
            {children}
            <PinUnlockModal onSubmit={resolver} onClose={abort} {...state} key={key} />
        </PinUnlockContext.Provider>
    );
};

export const usePinUnlock = () => useContext(PinUnlockContext);
