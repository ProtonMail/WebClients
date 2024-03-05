import {
    queryRemoveShareMember,
    queryShareMemberDetails,
    queryShareMemberListing,
    queryUpdateShareMemberPermissions,
} from '@proton/shared/lib/api/drive/member';
import { ShareMemberListingPayload, ShareMemberPayload } from '@proton/shared/lib/interfaces/drive/member';

import { shareMemberPayloadToShareMember, useDebouncedRequest } from '../_api';
import { ShareMember } from './interface';

export const useShareMember = () => {
    const debouncedRequest = useDebouncedRequest();
    const getShareMembers = async (
        abortSignal: AbortSignal,
        { volumeId, shareId }: { volumeId: string; shareId: string }
    ) => {
        return debouncedRequest<ShareMemberListingPayload>(queryShareMemberListing(volumeId, shareId), abortSignal)
            .then(({ MemberIDs }) =>
                debouncedRequest<{ Members: ShareMemberPayload[] }>(
                    queryShareMemberDetails(volumeId, shareId, {
                        MemberIDs,
                    }),
                    abortSignal
                )
            )
            .then(({ Members }) => Members.map(shareMemberPayloadToShareMember));
    };

    const removeShareMember = (
        abortSignal: AbortSignal,
        { volumeId, shareId, memberId }: { volumeId: string; shareId: string; memberId: string }
    ) => debouncedRequest(queryRemoveShareMember(volumeId, shareId, { MemberId: memberId }), abortSignal);

    const updateShareMemberPermissions = (
        abortSignal: AbortSignal,
        { volumeId, shareId, members }: { volumeId: string; shareId: string; members: ShareMember[] }
    ) =>
        debouncedRequest(
            queryUpdateShareMemberPermissions(volumeId, shareId, {
                Members: members.map(({ memberId, permissions }) => ({ MemberID: memberId, Permissions: permissions })),
            }),
            abortSignal
        );

    return {
        getShareMembers,
        removeShareMember,
        updateShareMemberPermissions,
    };
};
