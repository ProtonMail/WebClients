import type { PropsWithChildren } from 'react';
import { type FC, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { passwordDelete, passwordHistoryClear, passwordSave } from '../../store/actions';
import { uniqueId } from '../../utils/string/unique-id';
import { getEpoch } from '../../utils/time/epoch';
import {
    PasswordHistoryActionsContext,
    type PasswordHistoryActionsContextValue,
} from './PasswordHistoryActionsContext';
import { PasswordHistoryModal } from './PasswordHistoryModal';

export { usePasswordHistoryActions } from './PasswordHistoryActionsContext';

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
