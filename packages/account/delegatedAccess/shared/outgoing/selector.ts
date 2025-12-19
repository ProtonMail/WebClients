import { createSelector } from '@reduxjs/toolkit';

import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';

import { selectOutgoingDelegatedAccess } from '../../index';
import { DelegatedAccessTypeEnum } from '../../interface';
import { getDelegatedAccessType, getEnrichedOutgoingDelegatedAccess } from './helper';
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

        return {
            items: items.reduce<EnrichedOutgoingDelegatedAccessReturnValue['items']>(
                (acc, item) => {
                    const contactEmail = contactEmailsMap[getContactEmailKey(item.TargetEmail)]?.[0];
                    const value = getEnrichedOutgoingDelegatedAccess(item, contactEmail);
                    const type = getDelegatedAccessType(item);
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
