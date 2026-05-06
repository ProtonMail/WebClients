import { createSelector } from '@reduxjs/toolkit';

import { selectAddresses } from '@proton/account/addresses';
import { getIsOutgoingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { maxOutgoingEmergencyContacts, maxOutgoingRecoveryContacts } from '@proton/account/delegatedAccess/constants';
import { selectProtonDomains } from '@proton/account/protonDomains';
import { selectUser } from '@proton/account/user';
import { selectContactEmails } from '@proton/mail/store/contactEmails';
import { selectContactEmailsMap } from '@proton/mail/store/contactEmails/selector';
import { getContactEmailKey } from '@proton/shared/lib/contacts/getContactEmailsMap';
import type { Address } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { getLikelyHasKeysToReactivate } from '@proton/shared/lib/keys/getInactiveKeys';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

import { selectOutgoingDelegatedAccess } from '../../index';
import { getEnrichedOutgoingDelegatedAccess } from './helper';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export interface EnrichedOutgoingDelegatedAccessReturnValue {
    isAvailable: boolean;
    totalOutgoingDelegatedAccess: number;
    hasKeysToReactivate: boolean;
    emergencyContacts: {
        hasAccess: boolean;
        hasUpsell: boolean;
        items: EnrichedOutgoingDelegatedAccess[];
        hasReachedLimit: boolean;
        limit: number;
    };
    recoveryContacts: {
        hasAccess: boolean;
        items: EnrichedOutgoingDelegatedAccess[];
        hasReachedLimit: boolean;
        limit: number;
    };
    loading: boolean;
}

export const selectEnrichedOutgoingDelegatedAccess = createSelector(
    [selectUser, selectOutgoingDelegatedAccess, selectContactEmailsMap],
    ({ value: user }, delegatedAccess, contactEmailsMap): EnrichedOutgoingDelegatedAccessReturnValue => {
        const items = delegatedAccess.value ?? [];
        const ephemeral = delegatedAccess.ephemeral ?? {};

        const hasEmergencyContactsAccess = !!user && (user.isPaid || hasPaidPass(user));
        const hasEmergencyContactsUpsell = !!user && user.canPay && !hasEmergencyContactsAccess;

        const isAvailable = getIsOutgoingDelegatedAccessAvailable(user);

        const hasKeysToReactivate = Boolean(getLikelyHasKeysToReactivate(user));

        const { emergencyContacts, recoveryContacts } = items.reduce<{
            emergencyContacts: EnrichedOutgoingDelegatedAccess[];
            recoveryContacts: EnrichedOutgoingDelegatedAccess[];
        }>(
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
        );

        const totalOutgoingDelegatedAccess = emergencyContacts.length + recoveryContacts.length;

        return {
            hasKeysToReactivate,
            isAvailable,
            totalOutgoingDelegatedAccess,
            emergencyContacts: {
                hasAccess: hasEmergencyContactsAccess,
                hasUpsell: hasEmergencyContactsUpsell,
                items: emergencyContacts,
                hasReachedLimit: emergencyContacts.length === maxOutgoingEmergencyContacts,
                limit: maxOutgoingEmergencyContacts,
            },
            recoveryContacts: {
                hasAccess: true,
                items: recoveryContacts,
                hasReachedLimit: recoveryContacts.length === maxOutgoingRecoveryContacts,
                limit: maxOutgoingRecoveryContacts,
            },
            loading: delegatedAccess.value === undefined,
        };
    }
);

export interface CreateOutgoingDelegatedAccessReturnValue {
    addresses: Address[];
    email: string;
    domains: Set<string>;
    emergencyContacts: Set<string>;
    recoveryContacts: Set<string>;
    contactEmails: ContactEmail[];
}
export const selectCreateOutgoingDelegatedAccessData = createSelector(
    [selectUser, selectAddresses, selectEnrichedOutgoingDelegatedAccess, selectContactEmails, selectProtonDomains],
    (
        { value: user },
        { value: addresses },
        delegatedAccess,
        { value: contactEmails },
        { value: domains }
    ): CreateOutgoingDelegatedAccessReturnValue => {
        const domainsSet = new Set(domains ? [...domains.protonDomains, ...domains.premiumDomains] : []);
        const emergencyContacts = new Set(
            delegatedAccess.emergencyContacts.items.map((value) => value.outgoingDelegatedAccess.TargetEmail)
        );
        const recoveryContacts = new Set(
            delegatedAccess.recoveryContacts.items.map((value) => value.outgoingDelegatedAccess.TargetEmail)
        );

        return {
            email: user?.Email ?? '',
            addresses: addresses ?? [],
            domains: domainsSet,
            recoveryContacts,
            emergencyContacts,
            contactEmails: contactEmails ?? [],
        };
    }
);
