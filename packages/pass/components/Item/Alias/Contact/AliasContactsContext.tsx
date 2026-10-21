import { createContext } from 'react';

import { createUseContext } from '../../../../hooks/useContextFactory';
import type { AliasContactGetResponse, AliasContactWithStatsGetResponse } from '../../../../types/api/pass';
import type { SelectedItem } from '../../../../types/data/items';
import type { MaybeNull } from '../../../../types/utils';

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
