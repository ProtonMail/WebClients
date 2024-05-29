import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
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
    const {
        inviteProtonUser,
        resendInvitationEmail,
        listInvitations,
        deleteInvitation,
        updateShareInvitationPermissions,
    } = useShareInvitation();
    const { updateShareMemberPermissions, getShareMembers, removeShareMember } = useShareMember();
    const { getLink, getLinkPrivateKey, loadFreshLink } = useLink();
    const { createNotification } = useNotifications();
    const [isLoading, withLoading] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getShareWithKey, getShareSessionKey, getShareCreatorKeys } = useShare();
    const [members, setMembers] = useState<ShareMember[]>([]);
    const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
    const { createShare, deleteShare } = useShareActions();
    const events = useDriveEventManager();
    const [volumeId, setVolumeId] = useState<string>();

    const existingEmails = useMemo(() => {
        const membersEmail = members.map((member) => member.email);
        const invitationsEmail = invitations.map((invitation) => invitation.inviteeEmail);
        return [...membersEmail, ...invitationsEmail];
    }, [members, invitations]);

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

    const deleteShareIfEmpty = useCallback(
        async ({
            updatedMembers,
            updatedInvitations,
        }: {
            updatedMembers?: ShareMember[];
            updatedInvitations?: ShareInvitation[];
        } = {}) => {
            const membersCompare = updatedMembers || members;
            const invitationCompare = updatedInvitations || invitations;
            if (membersCompare.length || invitationCompare.length) {
                return;
            }

            const abortController = new AbortController();
            const link = await getLink(abortController.signal, rootShareId, linkId);
            if (!link.shareId || link.shareUrl) {
                return;
            }
            try {
                deleteShare(link.shareId, { silence: true });
            } catch (e) {
                return;
            }
        },
        [members, invitations, rootShareId]
    );

    const getShareId = async (abortSignal: AbortSignal): Promise<string> => {
        const link = await getLink(abortSignal, rootShareId, linkId);
        // This should not happen - TS gymnastics
        if (!link.sharingDetails) {
            throw new Error('No details for sharing link');
        }
        return link.sharingDetails.shareId;
    };

    const updateStoredMembers = (memberId: string, member?: ShareMember | undefined) => {
        setMembers((current) => {
            const updatedMembers = current.reduce<ShareMember[]>((acc, item) => {
                if (item.memberId === memberId) {
                    if (!member) {
                        return acc;
                    }
                    return [...acc, member];
                }
                return [...acc, item];
            }, []);
            if (updatedMembers) {
                deleteShareIfEmpty({ updatedMembers });
            }
            return updatedMembers;
        });
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
            createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
        });
    };

    const updateMemberPermissions = async (member: ShareMember) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await updateShareMemberPermissions(abortSignal, { shareId, member });
        updateStoredMembers(member.memberId, member);
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    const removeMember = async (member: ShareMember) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await removeShareMember(abortSignal, { shareId, memberId: member.memberId });
        updateStoredMembers(member.memberId);
        createNotification({ type: 'info', text: c('Notification').t`Access for the member removed` });
    };

    const removeInvitation = async (invitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await deleteInvitation(abortSignal, { shareId, invitationId });
        setInvitations((current) => {
            const updatedInvitations = current.filter((item) => item.invitationId !== invitationId);
            if (updatedInvitations.length === 0) {
                deleteShareIfEmpty({ updatedInvitations });
            }
            return updatedInvitations;
        });
        createNotification({ type: 'info', text: c('Notification').t`Access updated` });
    };

    const resendInvitation = async (invitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await resendInvitationEmail(abortSignal, { shareId, invitationId });
        createNotification({ type: 'info', text: c('Notification').t`Invitation email was sent again` });
    };

    const updateInvitePermissions = async (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await updateShareInvitationPermissions(abortSignal, { shareId, invitationId, permissions });
        setInvitations((current) =>
            current.map((item) => (item.invitationId === invitationId ? { ...item, permissions } : item))
        );
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    return {
        volumeId,
        members,
        invitations,
        existingEmails,
        isLoading,
        isAdding,
        removeInvitation,
        removeMember,
        addNewMember,
        addNewMembers,
        resendInvitation,
        updateMemberPermissions,
        updateInvitePermissions,
        deleteShareIfEmpty,
    };
};

export default useShareMemberView;
