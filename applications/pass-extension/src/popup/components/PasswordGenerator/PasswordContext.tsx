import type { Dispatch, SetStateAction } from 'react';
import { type FC, createContext, useContext, useMemo, useState } from 'react';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '../../../shared/hooks/useAsyncModalHandles';
import { PasswordGeneratorModal, type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';
import { PasswordHistoryModal } from './PasswordHistoryModal';

type ModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;
type PasswordContextValue = {
    generatePassword: UseAsyncModalHandle<string, ModalState>;
    openPasswordHistory: Dispatch<SetStateAction<boolean>>;
};

const PasswordContext = createContext<PasswordContextValue>({
    generatePassword: async () => {},
    openPasswordHistory: () => {},
});
const getInitialModalState = (): ModalState => ({ actionLabel: '' });

export const PasswordContextProvider: FC = ({ children }) => {
    const { resolver, state, handler, abort } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const [showHistory, setShowHistory] = useState(false);
    const contextValue = useMemo<PasswordContextValue>(
        () => ({ generatePassword: handler, openPasswordHistory: () => setShowHistory(true) }),
        [handler]
    );

    return (
        <PasswordContext.Provider value={contextValue}>
            {children}
            <PasswordGeneratorModal onClose={abort} onSubmit={resolver} {...state} />
            <PasswordHistoryModal open={showHistory} onClose={() => setShowHistory(false)} className="ui-red" />
        </PasswordContext.Provider>
    );
};

export const usePasswordContext = () => useContext(PasswordContext);
