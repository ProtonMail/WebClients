import { type FC, createContext, useContext, useMemo } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '../../hooks/useAsyncModalHandles';
import { LockPinModal } from './LockPinModal';

type ModalState = { title: string; assistiveText: string };
type LockConfirmContextValue = { confirmPin: UseAsyncModalHandle<string, ModalState> };

const LockConfirmContext = createContext<LockConfirmContextValue>({ confirmPin: async () => {} });
const getInitialModalState = (): ModalState => ({
    title: c('Title').t`Enter your PIN`,
    assistiveText: c('Info').t`Please enter your current PIN code to continue`,
});

export const LockConfirmContextProvider: FC = ({ children }) => {
    const { handler, abort, resolver, state } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const contextValue = useMemo<LockConfirmContextValue>(() => ({ confirmPin: handler }), [handler]);

    return (
        <LockConfirmContext.Provider value={contextValue}>
            {children}
            <LockPinModal onSubmit={resolver} onClose={abort} {...state} />
        </LockConfirmContext.Provider>
    );
};

export const useSessionLockConfirmContext = () => useContext(LockConfirmContext);
