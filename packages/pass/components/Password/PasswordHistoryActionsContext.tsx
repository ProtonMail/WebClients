import { createContext } from 'react';

import { createUseContext } from '../../hooks/useContextFactory';
import type { PasswordItem } from '../../store/reducers/pw-history';
import type { MaybeNull } from '../../types';

export type PasswordHistoryActionsContextValue = {
    /** Pushes a password to the history */
    add: (pw: PasswordItem) => void;
    /** Clears the whole password history */
    clear: () => void;
    /** Opens the password history modal */
    open: () => void;
    /** Removes a password history item by id */
    remove: (id: string) => void;
};

export const PasswordHistoryActionsContext = createContext<MaybeNull<PasswordHistoryActionsContextValue>>(null);

export const usePasswordHistoryActions = createUseContext(PasswordHistoryActionsContext);
