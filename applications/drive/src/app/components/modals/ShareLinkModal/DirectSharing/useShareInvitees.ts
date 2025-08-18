import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import { canonicalizeInternalEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';

import type { ShareInvitee } from '../../../../store';
import { useDriveSharingFlags, useGetPublicKeysForEmail } from '../../../../store';
import { ShareInviteeValidationError, VALIDATION_ERROR_TYPES } from './helpers/ShareInviteeValidationError';

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
    const { getPrimaryPublicKeyForEmail } = useGetPublicKeysForEmail();
    const [inviteesMap, setInviteesMap] = useState<Map<string, ShareInvitee>>(new Map());
    const invitees = useMemo(
        () =>
            // Place error items always at the first place
            Array.from(inviteesMap.values()).sort((a, b) => {
                if (a.error) {
                    return -1;
                }
                if (b.error) {
                    return 1;
                }
                return 0;
            }),
        [inviteesMap]
    );
    const { isSharingExternalInviteDisabled } = useDriveSharingFlags();

    const { createNotification } = useNotifications();

    const abortController = useRef(new AbortController());

    const clean = () => {
        setInviteesMap(new Map());
        abortController.current.abort();
        abortController.current = new AbortController();
    };

    useEffect(() => {
        return () => {
            clean();
        };
    }, []);

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
                        error: new ShareInviteeValidationError(VALIDATION_ERROR_TYPES.INVALID_EMAIL),
                    });
                    return acc;
                }

                if (canonicalizeExistingEmails.includes(canonicalizedAddress)) {
                    acc.badInvitees.set(address, {
                        ...newRecipient,
                        error: new ShareInviteeValidationError(VALIDATION_ERROR_TYPES.EXISTING_MEMBER),
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
        for (const [email, filteredInvitee] of filteredInvitees) {
            // We consider a user as external if this one have no public keys
            const primaryPublicKey = await getPrimaryPublicKeyForEmail(email, abortController.current.signal, true);
            if (!primaryPublicKey) {
                setInviteesMap((map) => {
                    const copy = new Map(map);
                    copy.set(email, {
                        ...filteredInvitee,
                        error: isSharingExternalInviteDisabled
                            ? new ShareInviteeValidationError(
                                  isSharingExternalInviteDisabled
                                      ? VALIDATION_ERROR_TYPES.EXTERNAL_INVITE_DISABLED
                                      : VALIDATION_ERROR_TYPES.EXTERNAL_INVITE_NOT_AVAILABLE
                              )
                            : undefined,
                        isExternal: true,
                        isLoading: false,
                    });
                    return copy;
                });
            } else {
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

    return {
        invitees,
        add,
        remove,
        clean,
    };
};
