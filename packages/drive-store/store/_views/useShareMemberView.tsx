import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { useDriveEventManager } from '..';
import { useLink } from '../_links';
import type {
    ShareExternalInvitation,
    ShareInvitation,
    ShareInvitationEmailDetails,
    ShareInvitee,
    ShareMember,
} from '../_shares';
import { useShare, useShareActions, useShareInvitation, useShareMember } from '../_shares';

const useShareMemberView = (rootShareId: string, linkId: string) => {
    const {
        inviteProtonUser,
        inviteExternalUser,
        resendInvitationEmail,
        resendExternalInvitationEmail,
        listInvitations,
        listExternalInvitations,
        deleteInvitation,
        deleteExternalInvitation,
        updateInvitationPermissions,
        updateExternalInvitationPermissions,
    } = useShareInvitation();
    const { updateShareMemberPermissions, getShareMembers, removeShareMember } = useShareMember();
    const { getLink, getLinkPrivateKey, loadFreshLink } = useLink();
    const { createNotification } = useNotifications();
    const [isLoading, withLoading] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getShareWithKey, getShareSessionKey, getShareCreatorKeys } = useShare();
    const [members, setMembers] = useState<ShareMember[]>([]);
    const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
    const [externalInvitations, setExternalInvitations] = useState<ShareExternalInvitation[]>([]);
    const { createShare, deleteShare } = useShareActions();
    const events = useDriveEventManager();
    const [volumeId, setVolumeId] = useState<string>();
    const [isShared, setIsShared] = useState<boolean>(false);

    const existingEmails = useMemo(() => {
        const membersEmail = members.map((member) => member.email);
        const invitationsEmail = invitations.map((invitation) => invitation.inviteeEmail);
        const externalInvitationsEmail = externalInvitations.map(
            (externalInvitation) => externalInvitation.inviteeEmail
        );
        return [...membersEmail, ...invitationsEmail, ...externalInvitationsEmail];
    }, [members, invitations, externalInvitations]);

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
            setIsShared(link.isShared);
            const share = await getShare(abortController.signal, link.shareId);

            await listInvitations(abortController.signal, share.shareId).then((invites: ShareInvitation[]) => {
                if (invites) {
                    setInvitations(invites);
                }
            });

            await listExternalInvitations(abortController.signal, share.shareId).then(
                (externalInvites: ShareExternalInvitation[]) => {
                    if (externalInvites) {
                        setExternalInvitations(externalInvites);
                    }
                }
            );

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

    const updateIsSharedStatus = async (abortSignal: AbortSignal) => {
        const updatedLink = await getLink(abortSignal, rootShareId, linkId);
        setIsShared(updatedLink.isShared);
    };

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
                await deleteShare(link.shareId, { silence: true });
                await updateIsSharedStatus(abortController.signal);
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

    const updateStoredMembers = async (memberId: string, member?: ShareMember | undefined) => {
        const updatedMembers = members.reduce<ShareMember[]>((acc, item) => {
            if (item.memberId === memberId) {
                if (!member) {
                    return acc;
                }
                return [...acc, member];
            }
            return [...acc, item];
        }, []);
        if (updatedMembers) {
            await deleteShareIfEmpty({ updatedMembers });
        }
        setMembers(updatedMembers);
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
            return { shareId: link.shareId, sessionKey, addressId: share.addressId };
        }

        const createShareResult = await createShare(abortSignal, rootShareId, share.volumeId, linkId);
        // TODO: Volume event is not properly handled for share creation, we load fresh link for now
        await events.pollEvents.volumes(share.volumeId);
        await loadFreshLink(abortSignal, rootShareId, linkId);

        return createShareResult;
    };

    const addNewMember = async ({
        invitee,
        permissions,
        emailDetails,
    }: {
        invitee: ShareInvitee;
        permissions: SHARE_MEMBER_PERMISSIONS;
        emailDetails?: ShareInvitationEmailDetails;
    }): Promise<{
        externalInvitation?: ShareExternalInvitation;
        invitation?: ShareInvitation;
        code: number;
    }> => {
        const abortSignal = new AbortController().signal;

        const {
            shareId: linkShareId,
            sessionKey,
            addressId,
        } = await getShareIdWithSessionkey(abortSignal, rootShareId, linkId);
        const primaryAddressKey = await getShareCreatorKeys(abortSignal, rootShareId);

        if (!primaryAddressKey) {
            throw new Error('Could not find primary address key for share owner');
        }

        if (!invitee.publicKey) {
            return inviteExternalUser(abortSignal, {
                shareId: linkShareId,
                linkId,
                inviteeEmail: invitee.email,
                inviter: {
                    inviterEmail: primaryAddressKey.address.Email,
                    addressKey: primaryAddressKey.privateKey,
                    addressId,
                },
                permissions,
                emailDetails,
            });
        }

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
                inviterEmail: primaryAddressKey.address.Email,
                addressKey: primaryAddressKey.privateKey,
            },
            emailDetails,
            permissions,
        });
    };

    const addNewMembers = async ({
        invitees,
        permissions,
        emailDetails,
    }: {
        invitees: ShareInvitee[];
        permissions: SHARE_MEMBER_PERMISSIONS;
        emailDetails?: ShareInvitationEmailDetails;
    }) => {
        await withAdding(async () => {
            const abortController = new AbortController();
            const newInvitations: ShareInvitation[] = [];
            const newExternalInvitations: ShareExternalInvitation[] = [];
            for (let invitee of invitees) {
                await addNewMember({ invitee, permissions, emailDetails }).then(
                    ({ invitation, externalInvitation }) => {
                        if (invitation) {
                            newInvitations.push(invitation);
                        } else if (externalInvitation) {
                            newExternalInvitations.push(externalInvitation);
                        }
                    }
                );
            }
            await updateIsSharedStatus(abortController.signal);
            setInvitations((oldInvitations: ShareInvitation[]) => [...oldInvitations, ...newInvitations]);
            setExternalInvitations((oldExternalInvitations: ShareExternalInvitation[]) => [
                ...oldExternalInvitations,
                ...newExternalInvitations,
            ]);
            createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
        });
    };

    const updateMemberPermissions = async (member: ShareMember) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await updateShareMemberPermissions(abortSignal, { shareId, member });
        await updateStoredMembers(member.memberId, member);
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    const removeMember = async (member: ShareMember) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await removeShareMember(abortSignal, { shareId, memberId: member.memberId });
        await updateStoredMembers(member.memberId);
        createNotification({ type: 'info', text: c('Notification').t`Access for the member removed` });
    };

    const removeInvitation = async (invitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await deleteInvitation(abortSignal, { shareId, invitationId });
        const updatedInvitations = invitations.filter((item) => item.invitationId !== invitationId);
        if (updatedInvitations.length === 0) {
            await deleteShareIfEmpty({ updatedInvitations });
        }
        setInvitations(updatedInvitations);
        createNotification({ type: 'info', text: c('Notification').t`Access updated` });
    };

    const resendInvitation = async (invitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await resendInvitationEmail(abortSignal, { shareId, invitationId });
        createNotification({ type: 'info', text: c('Notification').t`Invitation's email was sent again` });
    };

    const resendExternalInvitation = async (externalInvitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await resendExternalInvitationEmail(abortSignal, { shareId, externalInvitationId });
        createNotification({ type: 'info', text: c('Notification').t`External invitation's email was sent again` });
    };

    const removeExternalInvitation = async (externalInvitationId: string) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await deleteExternalInvitation(abortSignal, { shareId, externalInvitationId });
        setExternalInvitations((current) =>
            current.filter((item) => item.externalInvitationId !== externalInvitationId)
        );
        createNotification({ type: 'info', text: c('Notification').t`External invitation removed from the share` });
    };

    const updateInvitePermissions = async (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await updateInvitationPermissions(abortSignal, { shareId, invitationId, permissions });
        setInvitations((current) =>
            current.map((item) => (item.invitationId === invitationId ? { ...item, permissions } : item))
        );
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    const updateExternalInvitePermissions = async (
        externalInvitationId: string,
        permissions: SHARE_MEMBER_PERMISSIONS
    ) => {
        const abortSignal = new AbortController().signal;
        const shareId = await getShareId(abortSignal);

        await updateExternalInvitationPermissions(abortSignal, { shareId, externalInvitationId, permissions });
        setExternalInvitations((current) =>
            current.map((item) =>
                item.externalInvitationId === externalInvitationId ? { ...item, permissions } : item
            )
        );
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    return {
        volumeId,
        members,
        invitations,
        externalInvitations,
        existingEmails,
        isShared,
        isLoading,
        isAdding,
        removeInvitation,
        removeExternalInvitation,
        removeMember,
        addNewMember,
        addNewMembers,
        resendInvitation,
        resendExternalInvitation,
        updateMemberPermissions,
        updateInvitePermissions,
        updateExternalInvitePermissions,
        deleteShareIfEmpty,
    };
};

export default useShareMemberView;
