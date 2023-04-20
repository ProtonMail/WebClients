import { type FC, createContext, useContext, useMemo } from 'react';

import { c } from 'ttag';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '../../hooks/useAsyncModalHandles';
import { SessionLockPinModal } from './SessionLockPinModal';

type ModalState = { title: string; assistiveText: string };
type SessionLockConfirmContextValue = { confirmPin: UseAsyncModalHandle<string, ModalState> };

const SessionLockConfirmContext = createContext<SessionLockConfirmContextValue>({ confirmPin: async () => {} });
const getInitialModalState = (): ModalState => ({
    title: c('Title').t`Enter your Pin`,
    assistiveText: c('Info').t`Please enter your current pin code to continue`,
});

export const SessionLockConfirmContextProvider: FC = ({ children }) => {
    const { handler, abort, resolver, state } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const contextValue = useMemo<SessionLockConfirmContextValue>(() => ({ confirmPin: handler }), [handler]);

    return (
        <SessionLockConfirmContext.Provider value={contextValue}>
            {children}
            <SessionLockPinModal onSubmit={resolver} onClose={abort} {...state} />
        </SessionLockConfirmContext.Provider>
    );
};

export const useSessionLockConfirmContext = () => useContext(SessionLockConfirmContext);
