import { queryAddShareMember, queryRemoveShareMember, queryShareMembers } from '@proton/shared/lib/api/drive/share';
import { SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants';
import { ShareMemberPayload } from '@proton/shared/lib/interfaces/drive/sharing';

import { shareMemberPayloadToShareMember, useDebouncedRequest } from '../_api';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { useVolumesState } from '../_volumes';
import { InviteShareMember } from './interface';
import useShare from './useShare';
import useShareActions from './useShareActions';

const useShareMember = () => {
    const debouncedRequest = useDebouncedRequest();
    const { createShare } = useShareActions();
    const { getShare, getShareSessionKey } = useShare();
    const { getLink } = useLink();
    const events = useDriveEventManager();
    const volumeState = useVolumesState();

    const getShareIdWithSessionkey = async (abortSignal: AbortSignal, rootShareId: string, linkId: string) => {
        const [share, link] = await Promise.all([
            getShare(abortSignal, rootShareId),
            getLink(abortSignal, rootShareId, linkId),
        ]);
        if (link.shareId) {
            return { shareId: link.shareId, sessionKey: await getShareSessionKey(abortSignal, link.shareId) };
        }

        const createShareResult = await createShare(abortSignal, rootShareId, share.volumeId, linkId);
        const volumeId = volumeState.findVolumeId(rootShareId);
        if (volumeId) {
            // TODO: Volume event is not properly handled for share creation
            await events.pollEvents.volumes(volumeId);
        }

        return createShareResult;
    };
    const getShareMembers = async (abortSignal: AbortSignal, shareId: string) => {
        return debouncedRequest<{ Members: ShareMemberPayload[] }>(queryShareMembers(shareId), abortSignal).then(
            ({ Members }) =>
                Members.filter((ShareMember) => ShareMember.State !== SHARE_MEMBER_STATE.REMOVED).map((ShareMember) =>
                    shareMemberPayloadToShareMember(ShareMember)
                )
        );
    };

    const removeShareMember = (abortSignal: AbortSignal, shareId: string, memberId: string) =>
        debouncedRequest(queryRemoveShareMember(shareId, memberId));

    const addShareMember = (
        abortSignal: AbortSignal,
        shareId: string,
        { email, keyPacket, permissions, inviter, keyPacketSignature }: InviteShareMember
    ) =>
        debouncedRequest<{ Code: number; ShareMember: ShareMemberPayload }>(
            queryAddShareMember(shareId, {
                Email: email,
                KeyPacket: keyPacket,
                Permissions: permissions,
                Inviter: inviter,
                KeyPacketSignature: keyPacketSignature,
            })
        ).then(({ ShareMember }) => shareMemberPayloadToShareMember(ShareMember));

    return {
        getShareMembers,
        getShareIdWithSessionkey,
        removeShareMember,
        addShareMember,
    };
};

export default useShareMember;
