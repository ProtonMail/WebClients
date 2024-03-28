import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { useDriveEventManager } from '..';
import { useLink } from '../_links';
import { ShareInvitation, ShareInvitee, ShareMember, useShare, useShareActions, useShareInvitation } from '../_shares';

const useShareMemberView = (rootShareId: string, linkId: string) => {
    const { inviteProtonUser } = useShareInvitation();
    const { getLink } = useLink();
    const [isLoading, withLoading] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getSharePrivateKey, getShareWithKey, getShareSessionKey } = useShare();
    const [members /*,setMembers */] = useState<ShareMember[]>([]);
    const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
    const { createShare } = useShareActions();
    const events = useDriveEventManager();
    const [volumeId, setVolumeId] = useState<string>();

    useEffect(() => {
        const abortController = new AbortController();
        if (volumeId) {
            return;
        }
        void withLoading(async () => {
            const link = await getLink(abortController.signal, rootShareId, linkId);
            if (!link.shareId) {
                return;
            }
            const share = await getShare(abortController.signal, link.shareId);
            setVolumeId(share.volumeId);
            // TODO: Uncomment this when listing Shared by me will be available
            // await getShareMembers(abortController.signal, {
            //     volumeId: share.volumeId,
            //     shareId: share.shareId,
            // }).then((members) => {
            //     if (members) {
            //         setMembers(members);
            //     }
            // });
        });

        return () => {
            abortController.abort();
        };
    }, [rootShareId, linkId, getLink]);

    const getShareIdWithSessionkey = async (abortSignal: AbortSignal, rootShareId: string, linkId: string) => {
        const [share, link] = await Promise.all([
            getShareWithKey(abortSignal, rootShareId),
            getLink(abortSignal, rootShareId, linkId),
        ]);
        if (link.shareId) {
            const sessionKey = await getShareSessionKey(abortSignal, rootShareId);
            return { shareId: link.shareId, sessionKey, passphrase: share.passphrase };
        }

        const createShareResult = await createShare(abortSignal, rootShareId, share.volumeId, linkId);
        // TODO: Volume event is not properly handled for share creation
        await events.pollEvents.volumes(share.volumeId);

        return createShareResult;
    };

    const addNewMember = async (invitee: ShareInvitee, permissions: SHARE_MEMBER_PERMISSIONS) => {
        const abortSignal = new AbortController().signal;

        const { shareId: linkShareId, sessionKey } = await getShareIdWithSessionkey(abortSignal, rootShareId, linkId);
        const primaryAddressKey = await getSharePrivateKey(abortSignal, linkShareId);

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
                addressKey: primaryAddressKey,
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

    return {
        volumeId,
        members,
        invitations,
        isLoading,
        isAdding,
        addNewMember,
        addNewMembers,
    };
};

export default useShareMemberView;
