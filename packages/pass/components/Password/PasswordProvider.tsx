import { type FC, createContext, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { UseAsyncModalHandle } from '@proton/pass/hooks/useAsyncModalHandles';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
import { passwordDelete, passwordHistoryClear, passwordSave } from '@proton/pass/store/actions/creators/password';
import type { PasswordItem } from '@proton/pass/store/reducers';
import { selectPasswordOptions } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import noop from '@proton/utils/noop';

import { PasswordGeneratorModal, type BaseProps as PasswordGeneratorModalProps } from './PasswordGeneratorModal';
import { PasswordHistoryModal } from './PasswordHistoryModal';

type ModalState = Omit<PasswordGeneratorModalProps, 'onSubmit'>;

type PasswordContextValue = {
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
    /** Current password options in store */
    options: MaybeNull<GeneratePasswordOptions>;
};

const PasswordContext = createContext<PasswordContextValue>({
    options: null,
    generate: async () => {},
    history: {
        add: noop,
        clear: noop,
        open: noop,
        remove: noop,
    },
});

const getInitialModalState = (): ModalState => ({ actionLabel: '' });

export const PasswordProvider: FC = ({ children }) => {
    const dispatch = useDispatch();
    const { resolver, state, handler, abort } = useAsyncModalHandles<string, ModalState>({ getInitialModalState });
    const [showHistory, setShowHistory] = useState(false);
    const options = useSelector(selectPasswordOptions);

    const contextValue = useMemo<PasswordContextValue>(
        () => ({
            options,
            generate: handler,
            history: {
                add: (pw) => dispatch(passwordSave({ ...pw, id: uniqueId(), createTime: getEpoch() })),
                clear: () => dispatch(passwordHistoryClear()),
                open: () => setShowHistory(true),
                remove: (id) => dispatch(passwordDelete({ id })),
            },
        }),
        [handler, options]
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
