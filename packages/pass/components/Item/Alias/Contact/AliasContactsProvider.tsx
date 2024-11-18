import type { FC, PropsWithChildren } from 'react';
import { useMemo, useState } from 'react';

import { useRequest } from '@proton/pass/hooks/useRequest';
import { aliasGetContactsList } from '@proton/pass/store/actions';
import type { AliasContactWithStatsGetResponse, SelectedItem } from '@proton/pass/types';
import { partition } from '@proton/pass/utils/array/partition';
import { prop } from '@proton/pass/utils/fp/lens';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';
import { toMap } from '@proton/shared/lib/helpers/object';

import { AliasContactsContext, type AliasContactsContextValue } from './AliasContactsContext';

export const AliasContactsProvider: FC<PropsWithChildren<SelectedItem>> = ({ children, shareId, itemId }) => {
    const [contacts, setContacts] = useState<Record<number, AliasContactWithStatsGetResponse>>({});

    const sync = useRequest(aliasGetContactsList, {
        initial: { shareId, itemId },
        loading: true,
        onSuccess: (contacts) => setContacts(toMap(contacts, 'ID')),
    });

    const [blocked, active] = useMemo(() => {
        const sorted = Object.values(contacts).sort(sortOn('CreateTime', 'DESC'));
        return partition(sorted, prop('Blocked'));
    }, [contacts]);

    const context = useMemo<AliasContactsContextValue>(
        () => ({
            itemId,
            shareId,
            contacts: { active, blocked },
            loading: sync.loading,
            sync: () => sync.dispatch({ shareId, itemId }),
            onCreate: (contact) =>
                setContacts((contacts) =>
                    fullMerge(contacts, {
                        [contact.ID]: {
                            ...contact,
                            ForwardedEmails: 0,
                            RepliedEmails: 0,
                            BlockedEmails: 0,
                        },
                    })
                ),
            onDelete: (contactID) => setContacts((contacts) => objectDelete(contacts, contactID)),
            onUpdate: (contact) => setContacts((contacts) => partialMerge(contacts, { [contact.ID]: contact })),
        }),
        [itemId, shareId, blocked, active, sync.loading]
    );

    return <AliasContactsContext.Provider value={context}>{children}</AliasContactsContext.Provider>;
};
