import { createContext } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type {
    AliasContactGetResponse,
    AliasContactWithStatsGetResponse,
    MaybeNull,
    SelectedItem,
} from '@proton/pass/types';

export interface AliasContactsContextValue extends SelectedItem {
    contacts: { active: AliasContactWithStatsGetResponse[]; blocked: AliasContactWithStatsGetResponse[] };
    loading: boolean;
    onCreate: (contact: AliasContactGetResponse) => void;
    onUpdate: (contact: AliasContactGetResponse) => void;
    onDelete: (contactID: number) => void;
    sync: () => void;
}

export const AliasContactsContext = createContext<MaybeNull<AliasContactsContextValue>>(null);

export const useAliasContacts = createUseContext(AliasContactsContext);
