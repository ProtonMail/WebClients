import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { UseAsyncModalHandle } from '@proton/pass/hooks/useAsyncModalHandles';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/generator';
import { passwordDelete, passwordHistoryClear, passwordSave } from '@proton/pass/store/actions';
import type { PasswordItem } from '@proton/pass/store/reducers';
import { selectPasswordOptions } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { PasswordGeneratorModal, type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';
import { PasswordHistoryModal } from './PasswordHistoryModal';

type ModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;

type PasswordContextValue = {
    /** Current password options in store */
    config: MaybeNull<GeneratePasswordConfig>;
    /** Generates a random password */
    generate: UseAsyncModalHandle<string, ModalState>;
    /** Password history handles */
    history: {
        /** Pushes a password to the history */
        add: (pw: PasswordItem) => void;
        /** Clears the whole password history */
        clear: () => void;
        /** Opens the password history modal */
        open: () => void;
        /** Removes a password history item by id */
        remove: (id: string) => void;
    };
};

const PasswordContext = createContext<PasswordContextValue>({
    config: null,
    generate: async () => {},
    history: {
        add: noop,
        clear: noop,
        open: noop,
        remove: noop,
    },
});

const getInitialModalState = (): ModalState => ({ actionLabel: '' });

export const PasswordProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const { resolver, state, handler, abort } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const [showHistory, setShowHistory] = useState(false);
    const config = useSelector(selectPasswordOptions);

    const contextValue = useMemo<PasswordContextValue>(
        () => ({
            config,
            generate: handler,
            history: {
                add: (pw) => dispatch(passwordSave({ ...pw, id: uniqueId(), createTime: getEpoch() })),
                clear: () => dispatch(passwordHistoryClear()),
                open: () => setShowHistory(true),
                remove: (id) => dispatch(passwordDelete({ id })),
            },
        }),
        [handler, config]
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
