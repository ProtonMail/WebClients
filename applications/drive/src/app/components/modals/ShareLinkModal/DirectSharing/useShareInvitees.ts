import { useState } from 'react';

import { c, msgid } from 'ttag';

import { useApi, useNotifications } from '@proton/components/hooks';
import { CryptoProxy } from '@proton/crypto';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';

import { ShareInvitee } from '../../../../store';
import { getPrimaryPublicKeyForEmail } from '../../../../utils/getPublicKeysForEmail';
import { ShareInviteeValdidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';
import { endsWithProtonInternalDomain } from './helpers/endsWithProtonInternalDomain';

/**
 * useShareInvitees hook is used to manage a list of user that we want to add to a drive share.
 * It will be responsible to prevent duplicate addition, checking email validity and also retrieve user publicKey,
 * to verify if it's a proton user or not
 * You can have two possible user:
 * - proton user: will have publicKey attached + isExternal to false
 * - external user: will have no publicKey attached + isExternal to true
 *
 */
export const useShareInvitees = (existingEmails: string[]) => {
    const api = useApi();
    const [inviteesMap, setInviteesMap] = useState<Map<string, ShareInvitee>>(new Map());
    const invitees = [...inviteesMap.values()];

    const { createNotification } = useNotifications();

    const canonicalizeCurrentEmails = invitees.map(({ email }) => canonicalizeInternalEmail(email));
    const canonicalizeExistingEmails = existingEmails.map(canonicalizeInternalEmail);
    const showDuplicateNotification = (duplicateInvitees: ShareInvitee[]) => {
        const joinedInvitee = duplicateInvitees.map((duplicateInvitee) => duplicateInvitee.email).join(', ');

        // translator: "joinedInvitee" is the invitee list joined by a comma, e.g. "John, Jane, Joe"
        const text = c('Error').ngettext(
            msgid`Removed duplicate invitee: ${joinedInvitee}`,
            `Removed duplicate invitees: ${joinedInvitee}`,
            invitees.length
        );

        createNotification({
            text,
            type: 'warning',
        });
    };
    const add = async (newInvitee: ShareInvitee[]) => {
        const { filteredInvitees, duplicateInvitees, badInvitees } = newInvitee.reduce<{
            filteredInvitees: Map<string, ShareInvitee>;
            addedCanonicalizedAddresses: string[];
            duplicateInvitees: ShareInvitee[];
            badInvitees: Map<string, ShareInvitee>;
        }>(
            (acc, newRecipient) => {
                const address = newRecipient.email;
                const canonicalizedAddress = canonicalizeInternalEmail(address);

                if (!validateEmailAddress(address)) {
                    acc.badInvitees.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.INVALID_EMAIL),
                    });
                    return acc;
                }

                if (!endsWithProtonInternalDomain(address)) {
                    acc.badInvitees.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.NOT_INTERNAL_ACCOUNT),
                    });
                    return acc;
                }

                if (canonicalizeExistingEmails.includes(canonicalizedAddress)) {
                    acc.badInvitees.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
                    });
                } else if (
                    [...canonicalizeCurrentEmails, ...acc.addedCanonicalizedAddresses].includes(canonicalizedAddress)
                ) {
                    acc.duplicateInvitees.push(newRecipient);
                } else {
                    acc.filteredInvitees.set(address, { ...newRecipient, isLoading: true });
                    acc.addedCanonicalizedAddresses.push(canonicalizedAddress);
                }

                return acc;
            },
            {
                filteredInvitees: new Map<string, ShareInvitee>(),
                addedCanonicalizedAddresses: [],
                duplicateInvitees: [],
                badInvitees: new Map<string, ShareInvitee>(),
            }
        );

        setInviteesMap((map) => new Map([...map, ...filteredInvitees, ...badInvitees]));
        for (let [email, filteredInvitee] of filteredInvitees) {
            // We consider a user as external if this one have no public keys
            const primaryPublicKey = await getPrimaryPublicKeyForEmail(api, email);
            if (!primaryPublicKey) {
                setInviteesMap((map) => {
                    const copy = new Map(map);
                    copy.set(email, {
                        ...filteredInvitee,
                        isExternal: true,
                        isLoading: false,
                    });
                    return copy;
                });
                return;
            }
            const publicKey = await CryptoProxy.importPublicKey({ armoredKey: primaryPublicKey });
            setInviteesMap((map) => {
                const copy = new Map(map);
                copy.set(email, {
                    ...filteredInvitee,
                    isLoading: false,
                    isExternal: false,
                    publicKey,
                });
                return copy;
            });
        }

        if (duplicateInvitees.length) {
            showDuplicateNotification(duplicateInvitees);
        }
    };

    const remove = (email: string) => {
        setInviteesMap((map) => {
            const copy = new Map(map);
            copy.delete(email);

            return copy;
        });
    };

    const clean = () => {
        setInviteesMap(new Map());
    };

    return {
        invitees,
        count: invitees.length,
        add,
        remove,
        clean,
    };
};
