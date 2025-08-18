import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { queryInvitationDetails, queryListPendingInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation';
import {
    type ListDrivePendingInvitationsPayload,
    type ShareTargetType,
} from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareInvitationDetailsPayloadToShareInvitationDetails, useDebouncedRequest } from '../_api';
import { getOwnAddressKeysWithEmailAsync } from '../_crypto/driveCrypto';
import {
    DEFAULT_SORTING,
    type FetchMeta,
    type SortParams,
    useLinksListingHelpers,
} from '../_links/useLinksListing/useLinksListingHelpers';
import { useInvitations } from './useInvitations';
import { useInvitationsState } from './useInvitationsState';

interface FetchInvitationsMeta extends FetchMeta {
    lastPage: number;
    lastSorting: SortParams;
    obseleteInvitationsIds: Set<string>;
}

/**
 * Custom hook for managing and fetching shared with me links.
 */
export function useInvitationsListing() {
    const debouncedRequest = useDebouncedRequest();
    const { loadFullListingWithAnchor } = useLinksListingHelpers();
    const { decryptInvitationLinkName } = useInvitations();
    const { setInvitations, getAllInvitations, getAlbumsInvitations, getInvitation, removeInvitations } =
        useInvitationsState();
    const getAddresses = useGetAddresses();
    const getAddressKeys = useGetAddressKeys();
    const invitationsIdsState = useRef<Set<string>>(new Set());

    const setInvitationsIdsState = (invitationIds: Set<string> | string[]) => {
        invitationsIdsState.current = new Set([...invitationsIdsState.current, ...invitationIds]);
    };

    const removeInvitationIdsFromState = (invitationIds: Set<string>) => {
        invitationsIdsState.current = new Set([...invitationsIdsState.current].filter((id) => !invitationIds.has(id)));
    };

    /**
     * Finds invitation IDs that are no longer present in the current state.
     */
    const findObseleteInvitationIds = (invitationIds: Set<string>) => {
        const currentInvitationIdsSet = invitationsIdsState.current;
        if (invitationIds.size === 0) {
            return currentInvitationIdsSet;
        }
        const obseleteInvitationIds = currentInvitationIdsSet.difference(invitationIds);
        return obseleteInvitationIds;
    };

    const fetchMeta = useRef<FetchInvitationsMeta>({
        lastPage: 0,
        lastSorting: DEFAULT_SORTING,
        obseleteInvitationsIds: new Set(),
    });

    const loadInvitationsDetails = async (invitations: ListDrivePendingInvitationsPayload['Invitations']) => {
        for (const invitation of invitations) {
            const cachedInvitation = getInvitation(invitation.InvitationID);

            const invitationDetailsWithName =
                cachedInvitation ||
                (await debouncedRequest<ShareInvitationDetailsPayload>(queryInvitationDetails(invitation.InvitationID))
                    .then(shareInvitationDetailsPayloadToShareInvitationDetails)
                    .then(async (invitationDetails) => {
                        const keys = await getOwnAddressKeysWithEmailAsync(
                            invitationDetails.invitation.inviteeEmail,
                            getAddresses,
                            getAddressKeys
                        );
                        if (!keys) {
                            throw new EnrichedError('Address key to list invitation is not available', {
                                tags: {
                                    invitationId: invitationDetails.invitation.invitationId,
                                    shareId: invitationDetails.share.shareId,
                                    linkId: invitationDetails.link.linkId,
                                    volumeId: invitationDetails.share.volumeId,
                                },
                            });
                        }
                        return {
                            ...invitationDetails,
                            decryptedLinkName: await decryptInvitationLinkName(invitationDetails, keys?.privateKeys),
                        };
                    })
                    .catch((error) => {
                        // Invitation does not exist
                        if (error.data?.Code === 2501) {
                            return;
                        }

                        const errorToReport = new EnrichedError(
                            c('Notification').t`Failed to load invitation details`,
                            {
                                tags: {
                                    volumeId: invitation.VolumeID,
                                    shareId: invitation.ShareID,
                                    invitationId: invitation.InvitationID,
                                },
                                extra: {
                                    e: error,
                                },
                            },
                            'Failed to load invitation details'
                        );
                        sendErrorReport(errorToReport);
                        // We do not want to stop invitation listing in case there is an issue with one invitation
                        return;
                    }));
            if (invitationDetailsWithName) {
                setInvitations([invitationDetailsWithName]);
            }
        }
    };

    const fetchInvitationsNextPage = async (
        signal: AbortSignal,
        AnchorID?: string,
        shareTargetType?: ShareTargetType
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
        ).then(({ Invitations, AnchorID, More }) => {
            if (!shareTargetType) {
                return { Invitations, AnchorID, More };
            }

            const filteredInvitations = Invitations.filter(
                (Invitation) => Invitation.ShareTargetType === shareTargetType
            );

            return {
                Invitations: filteredInvitations,
                AnchorID,
                More,
            };
        });

        const invitationsIds = response.Invitations.map((invitation) => invitation.InvitationID);
        setInvitationsIdsState(invitationsIds);

        fetchMeta.current.obseleteInvitationsIds = findObseleteInvitationIds(new Set(invitationsIds));

        await loadInvitationsDetails(response.Invitations);
        fetchMeta.current.isEverythingFetched = !response.More;

        // Clean up obsolete invitations when all invitations are fetched
        if (fetchMeta.current.isEverythingFetched) {
            removeInvitations(Array.from(fetchMeta.current.obseleteInvitationsIds));
            removeInvitationIdsFromState(fetchMeta.current.obseleteInvitationsIds);
            fetchMeta.current.obseleteInvitationsIds = new Set();
        }

        return {
            AnchorID: response.AnchorID,
            More: response.More,
        };
    };

    /**
     * Loads shared with me links.
     */
    const loadInvitations = async (
        signal: AbortSignal,
        shareTargetType?: ShareTargetType
    ): Promise<{ Count?: number } | void> => {
        // This function (loadSharedWithMeLinks) will be called only once (in useEffect of useSharedWithMeView).
        // We reset the state of fetchMeta to allow fetching new items in case of tab change for exemple
        fetchMeta.current.isEverythingFetched = false;
        const callback = (AnchorID?: string) => fetchInvitationsNextPage(signal, AnchorID, shareTargetType);
        return loadFullListingWithAnchor(callback);
    };

    const getCachedInvitations = useCallback(() => getAllInvitations(), [getAllInvitations]);

    const getCachedAlbumsInvitations = useCallback(() => getAlbumsInvitations(), [getAlbumsInvitations]);

    return {
        loadInvitations,
        getCachedInvitations,
        getCachedAlbumsInvitations,
    };
}
