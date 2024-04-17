import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { useDriveEventManager } from '..';
import { useLink } from '../_links';
import {
    ShareInvitation,
    ShareInvitee,
    ShareMember,
    useShare,
    useShareActions,
    useShareInvitation,
    useShareMember,
} from '../_shares';

const useShareMemberView = (rootShareId: string, linkId: string) => {
    const { inviteProtonUser, listInvitations } = useShareInvitation();
    const { updateShareMemberPermissions, getShareMembers } = useShareMember();
    const { getLink, getLinkPrivateKey, loadFreshLink } = useLink();
    const [isLoading, withLoading] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getShareWithKey, getShareSessionKey, getShareCreatorKeys } = useShare();
    const [members, setMembers] = useState<ShareMember[]>([]);
    const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
    const { createShare } = useShareActions();
    const events = useDriveEventManager();
    const [volumeId, setVolumeId] = useState<string>();

    useEffect(() => {
        const abortController = new AbortController();
        if (volumeId || isLoading) {
            return;
        }
        void withLoading(async () => {
            const link = await getLink(abortController.signal, rootShareId, linkId);
            if (!link.shareId) {
                return;
            }
            const share = await getShare(abortController.signal, link.shareId);

            await listInvitations(abortController.signal, share.shareId).then((invites: ShareInvitation[]) => {
                if (invites) {
                    setInvitations(invites);
                }
            });

            await getShareMembers(abortController.signal, { shareId: share.shareId }).then((members) => {
                if (members) {
                    setMembers(members);
                }
            });
            setVolumeId(share.volumeId);
        });

        return () => {
            abortController.abort();
        };
    }, [rootShareId, linkId, volumeId]);

    const updateStoredMembers = (memberId: string, member: ShareMember | undefined) => {
        setMembers((current) =>
            current.reduce<ShareMember[]>((acc, item) => {
                if (item.memberId === memberId) {
                    if (!member) {
                        return acc;
                    }
                    return [...acc, member];
                }
                return [...acc, item];
            }, [])
        );
    };

    const getShareIdWithSessionkey = async (abortSignal: AbortSignal, rootShareId: string, linkId: string) => {
        const [share, link] = await Promise.all([
            getShareWithKey(abortSignal, rootShareId),
            getLink(abortSignal, rootShareId, linkId),
        ]);
        setVolumeId(share.volumeId);
        if (link.shareId) {
            const linkPrivateKey = await getLinkPrivateKey(abortSignal, rootShareId, linkId);

            const sessionKey = await getShareSessionKey(abortSignal, link.shareId, linkPrivateKey);
            return { shareId: link.shareId, sessionKey };
        }

        const createShareResult = await createShare(abortSignal, rootShareId, share.volumeId, linkId);
        // TODO: Volume event is not properly handled for share creation, we load fresh link for now
        await events.pollEvents.volumes(share.volumeId);
        await loadFreshLink(abortSignal, rootShareId, linkId);

        return createShareResult;
    };

    const addNewMember = async (invitee: ShareInvitee, permissions: SHARE_MEMBER_PERMISSIONS) => {
        const abortSignal = new AbortController().signal;

        const { shareId: linkShareId, sessionKey } = await getShareIdWithSessionkey(abortSignal, rootShareId, linkId);
        const primaryAddressKey = await getShareCreatorKeys(abortSignal, rootShareId);

        if (!primaryAddressKey) {
            throw new Error('Could not find primary address key for share owner');
        }

        if (!invitee.publicKey) {
            // TODO: Do logic for external user
            throw new Error('User is not a proton user');
        }

        const share = await getShare(abortSignal, linkShareId);
        return inviteProtonUser(abortSignal, {
            share: {
                shareId: linkShareId,
                sessionKey,
            },
            invitee: {
                inviteeEmail: invitee.email,
                publicKey: invitee.publicKey,
            },
            inviter: {
                inviterEmail: share.creator,
                addressKey: primaryAddressKey.privateKey,
            },
            permissions,
        });
    };

    const addNewMembers = async (invitees: ShareInvitee[], permissions: SHARE_MEMBER_PERMISSIONS) => {
        await withAdding(async () => {
            const newInvitations: ShareInvitation[] = [];
            for (let invitee of invitees) {
                await addNewMember(invitee, permissions).then((invitation) => newInvitations.push(invitation));
            }
            setInvitations((oldInvitations: ShareInvitation[]) => [...oldInvitations, ...newInvitations]);
        });
    };

    const updateMemberPermissions = async (member: ShareMember) => {
        const abortSignal = new AbortController().signal;
        const link = await getLink(abortSignal, rootShareId, linkId);
        if (!link.sharingDetails) {
            return;
        }
        const shareId = link.sharingDetails.shareId;

        await updateShareMemberPermissions(abortSignal, { shareId, member });
        updateStoredMembers(member.memberId, member);
    };

    return {
        volumeId,
        members,
        invitations,
        isLoading,
        isAdding,
        addNewMember,
        addNewMembers,
        updateMemberPermissions,
    };
};

export default useShareMemberView;
