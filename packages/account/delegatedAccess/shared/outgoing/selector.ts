import { createSelector } from '@reduxjs/toolkit';

import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectOutgoingDelegatedAccess } from '../../index';
import { getEnrichedOutgoingDelegatedAccess } from './helper';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export interface EnrichedOutgoingDelegatedAccessReturnValue {
    items: {
        emergencyContacts: EnrichedOutgoingDelegatedAccess[];
        recoveryContacts: EnrichedOutgoingDelegatedAccess[];
    };
    loading: boolean;
}

export const selectEnrichedOutgoingDelegatedAccess = createSelector(
    [selectOutgoingDelegatedAccess, selectContactEmailsMap],
    (delegatedAccess, contactEmailsMap): EnrichedOutgoingDelegatedAccessReturnValue => {
        const items = delegatedAccess.value ?? [];
        const ephemeral = delegatedAccess.ephemeral ?? {};

        return {
            items: items.reduce<EnrichedOutgoingDelegatedAccessReturnValue['items']>(
                (acc, item) => {
                    const contactEmail = contactEmailsMap[getContactEmailKey(item.TargetEmail)]?.[0];
                    const value = getEnrichedOutgoingDelegatedAccess(item, contactEmail, ephemeral);
                    // Can be both emergency contact and recovery contact
                    if (value.parsedOutgoingDelegatedAccess.isEmergencyContact) {
                        acc.emergencyContacts.push(value);
                    }
                    if (value.parsedOutgoingDelegatedAccess.isRecoveryContact) {
                        acc.recoveryContacts.push(value);
                    }
                    return acc;
                },
                { emergencyContacts: [], recoveryContacts: [] }
            ),
            loading: delegatedAccess.value === undefined,
        };
    }
);
