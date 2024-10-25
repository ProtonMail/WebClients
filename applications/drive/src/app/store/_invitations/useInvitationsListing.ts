import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import type { PrivateKeyReference } from '@proton/crypto/lib';
import { queryInvitationDetails, queryListPendingInvitations } from '@proton/shared/lib/api/drive/invitation';
import type { ShareInvitationDetailsPayload } from '@proton/shared/lib/interfaces/drive/invitation';
import type { ListDrivePendingInvitationsPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareInvitationDetailsPayloadToShareInvitationDetails, useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import {
    DEFAULT_SORTING,
    type FetchMeta,
    type SortParams,
    useLinksListingHelpers,
} from '../_links/useLinksListing/useLinksListingHelpers';
import { useDefaultShare } from '../_shares';
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
    const { getDefaultShare } = useDefaultShare();
    const { getPrivateAddressKeys } = useDriveCrypto();
    const { loadFullListingWithAnchor } = useLinksListingHelpers();
    const { decryptInvitationLinkName } = useInvitations();
    const { setInvitations, getAllInvitations, getInvitation, removeInvitations } = useInvitationsState();
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

    const loadInvitationsDetails = async (
        invitations: ListDrivePendingInvitationsPayload['Invitations'],
        privateKeys: PrivateKeyReference[]
    ) => {
        for (let invitation of invitations) {
            const cachedInvitation = getInvitation(invitation.InvitationID);

            const invitationDetailsWithName =
                cachedInvitation ||
                (await debouncedRequest<ShareInvitationDetailsPayload>(queryInvitationDetails(invitation.InvitationID))
                    .then(shareInvitationDetailsPayloadToShareInvitationDetails)
                    .then(async (invitationDetails) => ({
                        ...invitationDetails,
                        decryptedLinkName: await decryptInvitationLinkName(invitationDetails, privateKeys),
                    }))
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

        const invitationsIds = response.Invitations.map((invitation) => invitation.InvitationID);
        setInvitationsIdsState(invitationsIds);

        fetchMeta.current.obseleteInvitationsIds = findObseleteInvitationIds(new Set(invitationsIds));

        await loadInvitationsDetails(response.Invitations, privateKeys);
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
    const loadInvitations = async (signal: AbortSignal): Promise<{ Count?: number } | void> => {
        const { addressId } = await getDefaultShare();
        const privateKeys = await getPrivateAddressKeys(addressId);
        // This function (loadSharedWithMeLinks) will be called only once (in useEffect of useSharedWithMeView).
        // We reset the state of fetchMeta to allow fetching new items in case of tab change for exemple
        fetchMeta.current.isEverythingFetched = false;
        const callback = (AnchorID?: string) => fetchInvitationsNextPage(signal, privateKeys, AnchorID);
        return loadFullListingWithAnchor(callback);
    };

    const getCachedInvitations = useCallback(() => getAllInvitations(), [getAllInvitations]);

    return {
        loadInvitations,
        getCachedInvitations,
    };
}
