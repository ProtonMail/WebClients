import { useRef, useState } from 'react';

import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import { queryInvitationDetails, queryListPendingInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation';
import type { ListDrivePendingInvitationsPayload } from '@proton/shared/lib/interfaces/drive/sharing';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

import { shareInvitationDetailsPayloadToShareInvitationDetails, useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import type { ShareInvitationDetails } from '../../_shares';
import { useDefaultShare } from '../../_shares';
import type { FetchMeta, SortParams } from './useLinksListingHelpers';
import { DEFAULT_SORTING, useLinksListingHelpers } from './useLinksListingHelpers';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

export interface ExtendedInvitationDetails extends ShareInvitationDetails {
    isLocked?: boolean;
}
/**
 * Custom hook for managing and fetching shared with me links.
 */
export function usePendingInvitationsListing() {
    const debouncedRequest = useDebouncedRequest();
    const { getDefaultShare } = useDefaultShare();
    const [pendingInvitations, setPendingInvitations] = useState<Map<string, ExtendedInvitationDetails>>(new Map([]));
    const { getPrivateAddressKeys } = useDriveCrypto();
    const { loadFullListingWithAnchor } = useLinksListingHelpers();
    const fetchMeta = useRef<FetchSharedLinksMeta>({
        lastPage: 0,
        lastSorting: DEFAULT_SORTING,
    });

    const loadPendingInvitationsDetails = async (
        invitations: ListDrivePendingInvitationsPayload['Invitations'],
        privateKeys: PrivateKeyReference[]
    ) => {
        return Promise.all(
            invitations.map((invitation) => {
                return debouncedRequest<ShareInvitationDetailsPayload>(queryInvitationDetails(invitation.InvitationID))
                    .then(shareInvitationDetailsPayloadToShareInvitationDetails)
                    .then(async (invitation) => {
                        const passphrase = await decryptUnsigned({
                            armoredMessage: invitation.share.passphrase,
                            privateKey: privateKeys,
                        });

                        const sharePrivateKey = await CryptoProxy.importPrivateKey({
                            passphrase: passphrase,
                            armoredKey: invitation.share.shareKey,
                        });

                        const name = await decryptUnsigned({
                            armoredMessage: invitation.link.name,
                            privateKey: sharePrivateKey,
                        });

                        setPendingInvitations((prevPendingInvitations) => {
                            const newMap = new Map(prevPendingInvitations);
                            newMap.set(invitation.invitation.invitationId, {
                                ...invitation,
                                link: {
                                    ...invitation.link,
                                    name,
                                },
                            });
                            return newMap;
                        });
                    })
                    .catch((error) => {
                        if (error.data?.Code === 2501) {
                            return undefined;
                        }
                        throw error;
                    });
            })
        );
    };

    const fetchPendingInvitationsNextPage = async (
        signal: AbortSignal,
        privateKeys: PrivateKeyReference[],
        AnchorID?: string
    ): Promise<{ AnchorID: string; More: boolean }> => {
        if (fetchMeta.current.isEverythingFetched) {
            return {
                AnchorID: '',
                More: false,
            };
        }

        const response = await debouncedRequest<ListDrivePendingInvitationsPayload>(
            queryListPendingInvitations({ AnchorID }),
            signal
        );

        await loadPendingInvitationsDetails(response.Invitations, privateKeys);

        fetchMeta.current.isEverythingFetched = !response.More;

        return {
            AnchorID: response.AnchorID,
            More: response.More,
        };
    };

    /**
     * Loads shared with me links.
     */
    const loadPendingInvitations = async (signal: AbortSignal): Promise<{ Count?: number } | void> => {
        const { addressId } = await getDefaultShare();
        const privateKeys = await getPrivateAddressKeys(addressId);

        const callback = (AnchorID?: string) => fetchPendingInvitationsNextPage(signal, privateKeys, AnchorID);
        return loadFullListingWithAnchor(callback);
    };

    const removePendingInvitation = (invitationId: string) => {
        setPendingInvitations((prevPendingInvitations) => {
            const newMap = new Map(prevPendingInvitations);
            newMap.delete(invitationId);
            return newMap;
        });
    };

    const updatePendingInvitation = (invitationDetails: ExtendedInvitationDetails) => {
        setPendingInvitations((prevPendingInvitations) => {
            const newMap = new Map(prevPendingInvitations);
            newMap.set(invitationDetails.invitation.invitationId, invitationDetails);
            return newMap;
        });
    };

    const getPendingInvitation = (invitationId: string) => {
        const invitationDetails = pendingInvitations.get(invitationId);
        if (!invitationDetails) {
            // This should never happend
            throw new Error('Pending invitation not found');
        }
        return invitationDetails;
    };

    return {
        loadPendingInvitations,
        pendingInvitations,
        removePendingInvitation,
        updatePendingInvitation,
        getPendingInvitation,
    };
}
