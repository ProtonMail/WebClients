import type { PropsWithChildren } from 'react';
import { type FC, createContext, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { passwordDelete, passwordHistoryClear, passwordSave } from '@proton/pass/store/actions';
import type { PasswordItem } from '@proton/pass/store/reducers/pw-history';
import type { MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { PasswordHistoryModal } from './PasswordHistoryModal';

type PasswordHistoryActionsContextValue = {
    /** Pushes a password to the history */
    add: (pw: PasswordItem) => void;
    /** Clears the whole password history */
    clear: () => void;
    /** Opens the password history modal */
    open: () => void;
    /** Removes a password history item by id */
    remove: (id: string) => void;
};

const PasswordHistoryActionsContext = createContext<MaybeNull<PasswordHistoryActionsContextValue>>(null);

export const PasswordHistoryActions: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const [showHistory, setShowHistory] = useState(false);

    const history = useMemo<PasswordHistoryActionsContextValue>(
        () => ({
            add: (pw) => dispatch(passwordSave({ ...pw, id: uniqueId(), createTime: getEpoch() })),
            clear: () => dispatch(passwordHistoryClear()),
            open: () => setShowHistory(true),
            close: () => setShowHistory(false),
            remove: (id) => dispatch(passwordDelete({ id })),
        }),
        []
    );

    return (
        <PasswordHistoryActionsContext.Provider value={history}>
            {children}
            {showHistory && <PasswordHistoryModal open onClose={() => setShowHistory(false)} className="ui-red" />}
        </PasswordHistoryActionsContext.Provider>
    );
};

export const usePasswordHistoryActions = createUseContext(PasswordHistoryActionsContext);
