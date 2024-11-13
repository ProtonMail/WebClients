import { createContext } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types';

export interface AliasContactsContextValue {
    shareId: string;
    itemId: string;
}

export const AliasContactsContext = createContext<MaybeNull<AliasContactsContextValue>>(null);

export const useAliasContacts = createUseContext(AliasContactsContext);
