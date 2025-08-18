import { createSelector } from '@reduxjs/toolkit';

import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectIncomingDelegatedAccess } from '../../index';
import { getEnrichedIncomingDelegatedAccess } from './helper';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export interface EnrichedIncomingDelegatedAccessReturnValue {
    items: EnrichedIncomingDelegatedAccess[];
    loading: boolean;
}

export const selectEnrichedIncomingDelegatedAccess = createSelector(
    [selectIncomingDelegatedAccess, selectContactEmailsMap],
    (delegatedAccess, contactEmailsMap): EnrichedIncomingDelegatedAccessReturnValue => {
        const items = delegatedAccess.value ?? [];
        const ephemeral = delegatedAccess.ephemeral ?? {};

        return {
            items: items.map((incomingDelegatedAccess) => {
                const contactEmail = contactEmailsMap[getContactEmailKey(incomingDelegatedAccess.SourceEmail)]?.[0];
                return getEnrichedIncomingDelegatedAccess(incomingDelegatedAccess, contactEmail, ephemeral);
            }),
            loading: delegatedAccess.value === undefined,
        };
    }
);
