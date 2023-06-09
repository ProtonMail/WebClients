import { type FC, createContext, useContext, useMemo } from 'react';

import { type UseAsyncModalHandle, useAsyncModalHandles } from '../../../shared/hooks/useAsyncModalHandles';
import { PasswordGeneratorModal, type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';

type ModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;
type PasswordGeneratorContextValue = { generatePassword: UseAsyncModalHandle<string, ModalState> };

const PasswordGeneratorContext = createContext<PasswordGeneratorContextValue>({ generatePassword: async () => {} });
const getInitialModalState = (): ModalState => ({ actionLabel: '' });

export const PasswordGeneratorContextProvider: FC = ({ children }) => {
    const { resolver, state, handler, abort } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const contextValue = useMemo<PasswordGeneratorContextValue>(() => ({ generatePassword: handler }), [handler]);

    return (
        <PasswordGeneratorContext.Provider value={contextValue}>
            {children}
            <PasswordGeneratorModal onClose={abort} onSubmit={resolver} {...state} />
        </PasswordGeneratorContext.Provider>
    );
};

export const usePasswordGeneratorContext = () => useContext(PasswordGeneratorContext);
