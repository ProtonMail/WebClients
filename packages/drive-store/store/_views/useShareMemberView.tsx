import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

import { useDriveEventManager } from '..';
import { useInvitationsStore } from '../../zustand/share/invitations.store';
import { useMembersStore } from '../../zustand/share/members.store';
import { useInvitations } from '../_invitations';
import { useLink } from '../_links';
import type {
    ShareExternalInvitation,
    ShareInvitation,
    ShareInvitationEmailDetails,
    ShareInvitee,
    ShareMember,
} from '../_shares';
import { useShare, useShareActions, useShareMember } from '../_shares';

const getExistingEmails = (
    members: ShareMember[],
    invitations: ShareInvitation[],
    externalInvitations: ShareExternalInvitation[]
) => {
    const membersEmail = members.map((member) => member.email);
    const invitationsEmail = invitations.map((invitation) => invitation.inviteeEmail);
    const externalInvitationsEmail = externalInvitations.map((externalInvitation) => externalInvitation.inviteeEmail);
    return [...membersEmail, ...invitationsEmail, ...externalInvitationsEmail];
};

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
    } = useInvitations();

    const { updateShareMemberPermissions, getShareMembers, removeShareMember } = useShareMember();
    const { getLink, getLinkPrivateKey, loadFreshLink } = useLink();
    const { createNotification } = useNotifications();
    const [isLoading, withLoading] = useLoading();
    const [isAdding, withAdding] = useLoading();
    const { getShare, getShareWithKey, getShareSessionKey, getShareCreatorKeys } = useShare();
    const { createShare, deleteShare } = useShareActions();
    const events = useDriveEventManager();
    const [volumeId, setVolumeId] = useState<string>();
    const [sharingShareId, setSharingShareId] = useState<string | undefined>();

    // Zustand store hooks - key difference with useShareMemberView.tsx
    const { members, setShareMembers, getShareMembersState } = useMembersStore((state) => ({
        members: sharingShareId ? state.getShareMembers(sharingShareId) : [],
        setShareMembers: state.setShareMembers,
        getShareMembersState: state.getShareMembers,
    }));

    const {
        invitations,
        externalInvitations,
        setShareInvitations,
        setShareExternalInvitations,
        removeShareInvitations,
        updateShareInvitationsPermissions,
        removeShareExternalInvitations,
        updateShareExternalInvitations,
        addMultipleShareInvitations,
        getShareInvitationsState,
        getShareExternalInvitationsState,
    } = useInvitationsStore((state) => ({
        invitations: sharingShareId ? state.getShareInvitations(sharingShareId) : [],
        externalInvitations: sharingShareId ? state.getShareExternalInvitations(sharingShareId) : [],
        setShareInvitations: state.setShareInvitations,
        setShareExternalInvitations: state.setShareExternalInvitations,
        removeShareInvitations: state.removeShareInvitations,
        updateShareInvitationsPermissions: state.updateShareInvitationsPermissions,
        removeShareExternalInvitations: state.removeShareExternalInvitations,
        updateShareExternalInvitations: state.updateShareExternalInvitations,
        addMultipleShareInvitations: state.addMultipleShareInvitations,
        getShareInvitationsState: state.getShareInvitations,
        getShareExternalInvitationsState: state.getShareExternalInvitations,
    }));

    const existingEmails = getExistingEmails(members, invitations, externalInvitations);

    useEffect(() => {
        const abortController = new AbortController();
        if (volumeId || isLoading || !linkId) {
            return;
        }
        void withLoading(async () => {
            const link = await getLink(abortController.signal, rootShareId, linkId);
            if (!link.sharingDetails?.shareId) {
                return;
            }
            setSharingShareId(link.sharingDetails.shareId);
            const share = await getShare(abortController.signal, link.sharingDetails.shareId);

            const [fetchedInvitations, fetchedExternalInvitations, fetchedMembers] = await Promise.all([
                listInvitations(abortController.signal, share.shareId),
                listExternalInvitations(abortController.signal, share.shareId),
                getShareMembers(abortController.signal, { shareId: share.shareId }),
            ]);

            if (fetchedInvitations) {
                setShareInvitations(link.sharingDetails.shareId, fetchedInvitations);
            }
            if (fetchedExternalInvitations) {
                setShareExternalInvitations(link.sharingDetails.shareId, fetchedExternalInvitations);
            }
            if (fetchedMembers) {
                setShareMembers(link.sharingDetails.shareId, fetchedMembers);
            }

            setVolumeId(share.volumeId);
        });

        return () => {
            abortController.abort();
        };
    }, [rootShareId, linkId, volumeId]);

    const updateIsSharedStatus = async (abortSignal: AbortSignal) => {
        const updatedLink = await getLink(abortSignal, rootShareId, linkId);
        setSharingShareId(updatedLink.sharingDetails?.shareId);
        return updatedLink.sharingDetails?.shareId;
    };

    const deleteShareIfEmpty = useCallback(async () => {
        if (!sharingShareId) {
            return;
        }
        if (
            getShareMembersState(sharingShareId).length ||
            getShareInvitationsState(sharingShareId).length ||
            getShareExternalInvitationsState(sharingShareId).length
        ) {
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
    }, [getShareMembersState, getShareInvitationsState, getShareExternalInvitationsState, rootShareId, sharingShareId]);

    const updateStoredMembers = async (member: ShareMember, remove: boolean = false) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const updatedMembers = members.reduce<ShareMember[]>((acc, item) => {
            if (item.memberId === member.memberId) {
                if (remove) {
                    return acc;
                }
                return [...acc, member];
            }
            return [...acc, item];
        }, []);
        setShareMembers(sharingShareId, updatedMembers);
        if (updatedMembers.length === 0) {
            await deleteShareIfEmpty();
        }
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
    }) => {
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
                rootShareId,
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
            const newInvitations = [];
            const newExternalInvitations = [];

            for (const invitee of invitees) {
                const member = await addNewMember({
                    invitee,
                    permissions,
                    emailDetails,
                });

                if ('invitation' in member) {
                    newInvitations.push(member.invitation);
                } else if ('externalInvitation' in member) {
                    newExternalInvitations.push(member.externalInvitation);
                }
            }
            // If the sharingShareId is already present we use it, if not we retrieve it by creating a share
            const newSharingShareId = sharingShareId || (await updateIsSharedStatus(abortController.signal));
            if (!newSharingShareId) {
                throw new Error('No details for sharing link');
            }

            addMultipleShareInvitations(
                newSharingShareId,
                [...invitations, ...newInvitations],
                [...externalInvitations, ...newExternalInvitations]
            );
            createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
        });
    };

    const updateMemberPermissions = async (member: ShareMember) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;
        await updateShareMemberPermissions(abortSignal, { shareId: sharingShareId, member });
        await updateStoredMembers(member);
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    const removeMember = async (member: ShareMember) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await removeShareMember(abortSignal, { shareId: sharingShareId, memberId: member.memberId });
        await updateStoredMembers(member, true);
        createNotification({ type: 'info', text: c('Notification').t`Access for the member removed` });
    };

    const removeInvitation = async (invitationId: string) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await deleteInvitation(abortSignal, { shareId: sharingShareId, invitationId });
        const updatedInvitations = invitations.filter((item) => item.invitationId !== invitationId);
        removeShareInvitations(sharingShareId, updatedInvitations);
        if (updatedInvitations.length === 0) {
            await deleteShareIfEmpty();
        }
        createNotification({ type: 'info', text: c('Notification').t`Access updated` });
    };

    const resendInvitation = async (invitationId: string) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await resendInvitationEmail(abortSignal, { shareId: sharingShareId, invitationId });
        createNotification({ type: 'info', text: c('Notification').t`Invitation's email was sent again` });
    };

    const resendExternalInvitation = async (externalInvitationId: string) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await resendExternalInvitationEmail(abortSignal, { shareId: sharingShareId, externalInvitationId });
        createNotification({ type: 'info', text: c('Notification').t`External invitation's email was sent again` });
    };

    const removeExternalInvitation = async (externalInvitationId: string) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await deleteExternalInvitation(abortSignal, { shareId: sharingShareId, externalInvitationId });
        const updatedExternalInvitations = externalInvitations.filter(
            (item) => item.externalInvitationId !== externalInvitationId
        );
        removeShareExternalInvitations(sharingShareId, updatedExternalInvitations);
        createNotification({ type: 'info', text: c('Notification').t`External invitation removed from the share` });
    };

    const updateInvitePermissions = async (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await updateInvitationPermissions(abortSignal, { shareId: sharingShareId, invitationId, permissions });
        const updatedInvitations = invitations.map((item) =>
            item.invitationId === invitationId ? { ...item, permissions } : item
        );
        updateShareInvitationsPermissions(sharingShareId, updatedInvitations);
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    const updateExternalInvitePermissions = async (
        externalInvitationId: string,
        permissions: SHARE_MEMBER_PERMISSIONS
    ) => {
        if (!sharingShareId) {
            throw new Error('No details for sharing link');
        }
        const abortSignal = new AbortController().signal;

        await updateExternalInvitationPermissions(abortSignal, {
            shareId: sharingShareId,
            externalInvitationId,
            permissions,
        });
        const updatedExternalInvitations = externalInvitations.map((item) =>
            item.externalInvitationId === externalInvitationId ? { ...item, permissions } : item
        );
        updateShareExternalInvitations(sharingShareId, updatedExternalInvitations);
        createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
    };

    return {
        volumeId,
        members,
        invitations,
        externalInvitations,
        existingEmails,
        isShared: !!sharingShareId,
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
