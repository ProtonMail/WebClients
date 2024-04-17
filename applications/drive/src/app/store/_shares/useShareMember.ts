import {
    queryRemoveShareMember,
    queryShareMemberListing,
    queryUpdateShareMemberPermissions,
} from '@proton/shared/lib/api/drive/member';
import { ShareMemberPayload } from '@proton/shared/lib/interfaces/drive/member';

import { shareMemberPayloadToShareMember, useDebouncedRequest } from '../_api';
import { ShareMember } from './interface';

export const useShareMember = () => {
    const debouncedRequest = useDebouncedRequest();
    const getShareMembers = async (abortSignal: AbortSignal, { shareId }: { shareId: string }) => {
        return debouncedRequest<{ Members: ShareMemberPayload[] }>(queryShareMemberListing(shareId), abortSignal).then(
            ({ Members }) => Members.map(shareMemberPayloadToShareMember)
        );
    };

    const removeShareMember = (
        abortSignal: AbortSignal,
        { shareId, memberId }: { shareId: string; memberId: string }
    ) => debouncedRequest(queryRemoveShareMember(shareId, memberId), abortSignal);

    const updateShareMemberPermissions = (
        abortSignal: AbortSignal,
        { shareId, member }: { shareId: string; member: ShareMember }
    ) => debouncedRequest(queryUpdateShareMemberPermissions(shareId, member.memberId, member.permissions), abortSignal);

    return {
        getShareMembers,
        removeShareMember,
        updateShareMemberPermissions,
    };
};
