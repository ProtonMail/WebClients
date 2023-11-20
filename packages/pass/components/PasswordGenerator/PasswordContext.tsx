import { type FC, createContext, useContext, useMemo, useState } from 'react';

import type { UseAsyncModalHandle } from '@proton/pass/hooks/useAsyncModalHandles';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { PasswordGeneratorModal, type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';
import { PasswordHistoryModal } from './PasswordHistoryModal';

type ModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;

type PasswordContextValue = {
    options: MaybeNull<GeneratePasswordOptions>;
    generatePassword: UseAsyncModalHandle<string, ModalState>;
    openPasswordHistory: () => void;
};

const PasswordContext = createContext<PasswordContextValue>({
    options: null,
    generatePassword: async () => {},
    openPasswordHistory: noop,
});

const getInitialModalState = (): ModalState => ({ actionLabel: '' });

export const PasswordContextProvider: FC<{ initial: MaybeNull<GeneratePasswordOptions> }> = ({ children, initial }) => {
    const { resolver, state, handler, abort } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const [showHistory, setShowHistory] = useState(false);

    const contextValue = useMemo<PasswordContextValue>(
        () => ({ options: initial, generatePassword: handler, openPasswordHistory: () => setShowHistory(true) }),
        [handler, initial]
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
