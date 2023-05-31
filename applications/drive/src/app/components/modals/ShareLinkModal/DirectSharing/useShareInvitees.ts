import { useState } from 'react';

import { c, msgid } from 'ttag';

import { useApi, useNotifications } from '@proton/components/hooks';
import { CryptoProxy } from '@proton/crypto';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';

import { ShareInvitee } from '../../../../store';
import { ShareInviteeValdidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';
import { getPrimaryPublicKeyForEmail } from './helpers/getPublicKeysForEmail';

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
    const [inviteesMap, setInviteeMap] = useState<Map<string, ShareInvitee>>(new Map());
    const invitees = [...inviteesMap.values()];

    const { createNotification } = useNotifications();

    const canonicalizeCurrentEmails = invitees.map(({ email }) => canonicalizeInternalEmail(email));
    const canonicalizeExistingEmails = existingEmails.map(canonicalizeInternalEmail);
    const showDuplicateNotification = (duplicateInvitee: ShareInvitee[]) => {
        const joinedInvitee = duplicateInvitee.map((shareMember) => shareMember.email).join(', ');

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
    const add = (newInvitee: ShareInvitee[]) => {
        const { filteredInvitee, duplicateInvitee, badInvitee } = newInvitee.reduce<{
            filteredInvitee: Map<string, ShareInvitee>;
            addedCanonicalizedAddresses: string[];
            duplicateInvitee: ShareInvitee[];
            badInvitee: Map<string, ShareInvitee>;
        }>(
            (acc, newRecipient) => {
                const address = newRecipient.email;
                const canonicalizedAddress = canonicalizeInternalEmail(address);

                if (!validateEmailAddress(address)) {
                    acc.badInvitee.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.INVALID_EMAIL),
                    });
                    return acc;
                }

                if (canonicalizeExistingEmails.includes(canonicalizedAddress)) {
                    acc.badInvitee.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValdidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
                    });
                } else if (
                    [...canonicalizeCurrentEmails, ...acc.addedCanonicalizedAddresses].includes(canonicalizedAddress)
                ) {
                    acc.duplicateInvitee.push(newRecipient);
                } else {
                    acc.filteredInvitee.set(address, { ...newRecipient, isLoading: true });
                    acc.addedCanonicalizedAddresses.push(canonicalizedAddress);
                }

                return acc;
            },
            {
                filteredInvitee: new Map<string, ShareInvitee>(),
                addedCanonicalizedAddresses: [],
                duplicateInvitee: [],
                badInvitee: new Map<string, ShareInvitee>(),
            }
        );

        setInviteeMap((map) => new Map([...map, ...filteredInvitee, ...badInvitee]));
        filteredInvitee.forEach(async (filteredInvitee, email) => {
            // We consider a user as external if this one have no public keys
            const primaryPublicKey = await getPrimaryPublicKeyForEmail(api, email);
            if (!primaryPublicKey) {
                setInviteeMap((map) => {
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
            setInviteeMap((map) => {
                const copy = new Map(map);
                copy.set(email, {
                    ...filteredInvitee,
                    isLoading: false,
                    isExternal: false,
                    publicKey,
                });
                return copy;
            });
        });

        if (duplicateInvitee.length) {
            showDuplicateNotification(duplicateInvitee);
        }
    };

    const remove = (email: string) => {
        setInviteeMap((map) => {
            const copy = new Map(map);
            copy.delete(email);

            return copy;
        });
    };

    const clean = () => {
        setInviteeMap(new Map());
    };

    return {
        invitees,
        count: invitees.length,
        add,
        remove,
        clean,
    };
};
