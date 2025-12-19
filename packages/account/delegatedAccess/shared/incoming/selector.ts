import { createSelector } from '@reduxjs/toolkit';

import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectIncomingDelegatedAccess } from '../../index';
import { DelegatedAccessTypeEnum } from '../../interface';
import { getDelegatedAccessType, getEnrichedIncomingDelegatedAccess } from './helper';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export interface EnrichedIncomingDelegatedAccessReturnValue {
    items: {
        emergencyContacts: EnrichedIncomingDelegatedAccess[];
        recoveryContacts: EnrichedIncomingDelegatedAccess[];
    };
    loading: boolean;
}

export const selectEnrichedIncomingDelegatedAccess = createSelector(
    [selectIncomingDelegatedAccess, selectContactEmailsMap],
    (delegatedAccess, contactEmailsMap): EnrichedIncomingDelegatedAccessReturnValue => {
        const items = delegatedAccess.value ?? [];
        const ephemeral = delegatedAccess.ephemeral ?? {};

        return {
            items: items.reduce<EnrichedIncomingDelegatedAccessReturnValue['items']>(
                (acc, incomingDelegatedAccess) => {
                    const contactEmail = contactEmailsMap[getContactEmailKey(incomingDelegatedAccess.SourceEmail)]?.[0];
                    const value = getEnrichedIncomingDelegatedAccess(incomingDelegatedAccess, contactEmail, ephemeral);
                    const type = getDelegatedAccessType(incomingDelegatedAccess);
                    if (type === DelegatedAccessTypeEnum.EmergencyAccess) {
                        acc.emergencyContacts.push(value);
                    } else if (type === DelegatedAccessTypeEnum.SocialRecovery) {
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
