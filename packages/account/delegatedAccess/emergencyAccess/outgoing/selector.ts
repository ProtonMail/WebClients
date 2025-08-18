import { createSelector } from '@reduxjs/toolkit';

import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectOutgoingDelegatedAccess } from '../../index';
import { getEnrichedOutgoingDelegatedAccess } from './helper';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export interface EnrichedOutgoingDelegatedAccessReturnValue {
    items: EnrichedOutgoingDelegatedAccess[];
    loading: boolean;
}

export const selectEnrichedOutgoingDelegatedAccess = createSelector(
    [selectOutgoingDelegatedAccess, selectContactEmailsMap],
    (delegatedAccess, contactEmailsMap): EnrichedOutgoingDelegatedAccessReturnValue => {
        const items = delegatedAccess.value ?? [];

        return {
            items: items.map((outgoingDelegatedAccess) => {
                const contactEmail = contactEmailsMap[getContactEmailKey(outgoingDelegatedAccess.TargetEmail)]?.[0];
                return getEnrichedOutgoingDelegatedAccess(outgoingDelegatedAccess, contactEmail);
            }),
            loading: delegatedAccess.value === undefined,
        };
    }
);
