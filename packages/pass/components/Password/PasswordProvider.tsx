import type { PropsWithChildren } from 'react';
import { type FC, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { passwordDelete, passwordHistoryClear, passwordSave } from '@proton/pass/store/actions';
import { selectPasswordOptions } from '@proton/pass/store/selectors';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import type { PasswordContextValue } from './PasswordContext';
import { PasswordContext, type PasswordGeneratorModalState } from './PasswordContext';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { PasswordHistoryModal } from './PasswordHistoryModal';

const getInitialModalState = (): PasswordGeneratorModalState => ({ actionLabel: '' });

export const PasswordProvider: FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useDispatch();
    const [showHistory, setShowHistory] = useState(false);
    const config = useSelector(selectPasswordOptions);

    const { resolver, state, handler, abort } = useAsyncModalHandles<string, PasswordGeneratorModalState>({
        getInitialModalState,
    });

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
            {state.open && <PasswordGeneratorModal onClose={abort} onSubmit={resolver} {...state} />}
            {showHistory && <PasswordHistoryModal open onClose={() => setShowHistory(false)} className="ui-red" />}
        </PasswordContext.Provider>
    );
};
