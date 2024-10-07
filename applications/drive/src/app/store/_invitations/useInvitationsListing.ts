import { useCallback, useRef } from 'react';

import type { PrivateKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import { queryInvitationDetails, queryListPendingInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation';
import type { ListDrivePendingInvitationsPayload } from '@proton/shared/lib/interfaces/drive/sharing';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

import { shareInvitationDetailsPayloadToShareInvitationDetails, useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import {
    DEFAULT_SORTING,
    type FetchMeta,
    type SortParams,
    useLinksListingHelpers,
} from '../_links/useLinksListing/useLinksListingHelpers';
import { useDefaultShare } from '../_shares';
import { useInvitationsState } from './useInvitationsState';

interface FetchSharedLinksMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
}

/**
 * Custom hook for managing and fetching shared with me links.
 */
export function useInvitationsListing() {
    const debouncedRequest = useDebouncedRequest();
    const { getDefaultShare } = useDefaultShare();
    const { getPrivateAddressKeys } = useDriveCrypto();
    const { loadFullListingWithAnchor } = useLinksListingHelpers();
    const { setInvitations, getAllInvitations, getInvitation } = useInvitationsState();
    const fetchMeta = useRef<FetchSharedLinksMeta>({
        lastPage: 0,
        lastSorting: DEFAULT_SORTING,
    });

    const loadInvitationsDetails = async (
        invitations: ListDrivePendingInvitationsPayload['Invitations'],
        privateKeys: PrivateKeyReference[]
    ) => {
        return Promise.all(
            invitations.map((invitation) => {
                const cachedInvitation = getInvitation(invitation.InvitationID);
                if (cachedInvitation) {
                    return cachedInvitation;
                }
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
                        setInvitations([
                            {
                                ...invitation,
                                link: {
                                    ...invitation.link,
                                    name,
                                },
                            },
                        ]);
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

    const fetchInvitationsNextPage = async (
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

        await loadInvitationsDetails(response.Invitations, privateKeys);

        fetchMeta.current.isEverythingFetched = !response.More;

        return {
            AnchorID: response.AnchorID,
            More: response.More,
        };
    };

    /**
     * Loads shared with me links.
     */
    const loadInvitations = async (signal: AbortSignal): Promise<{ Count?: number } | void> => {
        const { addressId } = await getDefaultShare();
        const privateKeys = await getPrivateAddressKeys(addressId);

        const callback = (AnchorID?: string) => fetchInvitationsNextPage(signal, privateKeys, AnchorID);
        return loadFullListingWithAnchor(callback);
    };

    const getCachedInvitations = useCallback(() => getAllInvitations(), [getAllInvitations]);

    return {
        loadInvitations,
        getCachedInvitations,
    };
}
