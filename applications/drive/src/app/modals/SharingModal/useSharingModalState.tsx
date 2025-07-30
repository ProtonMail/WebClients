import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components';
import { useNotifications } from '@proton/components';
import {
    MemberRole,
    type ShareNodeSettings,
    type ShareResult,
    generateNodeUid,
    splitInvitationUid,
    useDrive,
} from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveDocsPublicSharing } from '../../flags/useFlagsDriveDocsPublicSharing';
// TODO: Remove this when events will be managed by sdk
import { useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { type SharingModalViewProps } from './SharingModalView';
import { type DirectMember, MemberType } from './interfaces';

export type UseSharingModalProps = ModalStateProps & {
    volumeId: string;
    shareId: string;
    linkId: string;
    onPublicLinkToggle?: (enabled: boolean) => void;
    isAlbum?: boolean;
};

const defaultSharingInfo = {
    protonInvitations: [],
    nonProtonInvitations: [],
    publicLink: undefined,
    members: [],
};

export const useSharingModalState = ({
    volumeId,
    linkId,
    onClose,
    onPublicLinkToggle,
    isAlbum,
    open,
    onExit,
}: UseSharingModalProps): SharingModalViewProps => {
    const events = useDriveEventManager();

    const { isDocsPublicSharingEnabled } = useFlagsDriveDocsPublicSharing();

    const { handleError } = useSdkErrorHandler();

    const { createNotification } = useNotifications();

    const [user] = useUser();

    const { drive } = useDrive();

    const nodeUid = useMemo(() => generateNodeUid(volumeId, linkId), [volumeId, linkId]);

    const [isLoading, withLoading] = useLoading();

    const [sharingInfo, setSharingInfo] = useState<ShareResult>(defaultSharingInfo);

    const [ownerEmail, setOwnerEmail] = useState<string | undefined>();

    const [name, setName] = useState('');

    const [isPublicLinkEnabled, setIsPublicLinkEnabled] = useState(!isAlbum);

    const isDirectShared =
        sharingInfo.protonInvitations.length > 0 ||
        sharingInfo.nonProtonInvitations.length > 0 ||
        sharingInfo.members.length > 0;
    const isPublicShared = !!sharingInfo.publicLink;
    const isShared = isDirectShared || isPublicShared;

    const unshareNode = async (email: string) => {
        try {
            const updatedShareResult = await drive.unshareNode(nodeUid, {
                users: [email],
            });
            // Check if it's a member or an invitation
            if (sharingInfo.members.find((member) => member.inviteeEmail === email)) {
                createNotification({ type: 'info', text: c('Notification').t`Access for the member removed` });
            } else {
                createNotification({ type: 'info', text: c('Notification').t`Access updated` });
            }
            setSharingInfo(updatedShareResult || defaultSharingInfo);

            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to unshare node`, extra: { nodeUid } });
        }
    };

    const unsharePublic = async () => {
        try {
            const updatedShareResult = await drive.unshareNode(nodeUid, {
                publicLink: 'remove',
            });
            createNotification({ text: c('Notification').t`The link to your item was deleted` });
            setSharingInfo(updatedShareResult || defaultSharingInfo);
            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, {
                fallbackMessage: c('Error').t`The link to your item failed to be deleted`,
                extra: { nodeUid },
            });
        }
    };

    const createSharePublic = async () => {
        try {
            const updatedShareResult = await drive.shareNode(nodeUid, {
                publicLink: {
                    role: MemberRole.Viewer,
                },
            });
            setSharingInfo(updatedShareResult);
            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to create public share node`, extra: { nodeUid } });
        }
    };

    const updateSharePublic = async (publicLinkSettings: {
        role?: MemberRole;
        customPassword?: string;
        expiration?: Date;
    }) => {
        try {
            // For safety if one of the value is not passed, we used the actual one
            // If it is passed but explicitely as "undefined" we assume that it's to disable it
            const updatedRole = 'role' in publicLinkSettings ? publicLinkSettings.role : sharingInfo.publicLink?.role;
            const updatedExpiration =
                'expiration' in publicLinkSettings
                    ? publicLinkSettings.expiration
                    : sharingInfo.publicLink?.expirationTime;
            const updatedCustomPassword =
                'customPassword' in publicLinkSettings
                    ? publicLinkSettings.customPassword
                    : sharingInfo.publicLink?.customPassword;
            const updatedShareResult = await drive.shareNode(nodeUid, {
                publicLink: {
                    role: updatedRole || MemberRole.Viewer,
                    expiration: updatedExpiration,
                    customPassword: updatedCustomPassword,
                },
            });

            if (publicLinkSettings.role) {
                createNotification({ text: c('Notification').t`Public link access updated` });
            } else {
                createNotification({ text: c('Notification').t`Your settings have been changed successfully` });
            }

            setSharingInfo(updatedShareResult);
            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to update public share node`, extra: { nodeUid } });
        }
    };

    const updateShareDirect = async (directShareSettings: Omit<ShareNodeSettings, 'publicLink'>) => {
        try {
            const updatedShareResult = await drive.shareNode(nodeUid, directShareSettings);
            createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });

            setSharingInfo(updatedShareResult);
            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to update direct share node`, extra: { nodeUid } });
        }
    };

    const stopSharingWithPollEvents = async () => {
        try {
            const updatedShareResult = await drive.unshareNode(nodeUid);
            setSharingInfo(updatedShareResult || defaultSharingInfo);
            // TODO: Remove when implemented in SDK
            await events.pollEvents.volumes(volumeId);
            createNotification({ text: c('Notification').t`You stopped sharing this item` });
        } catch (e) {
            handleError(e, {
                fallbackMessage: c('Error').t`Stopping the sharing of this item has failed`,
                extra: { nodeUid },
            });
        }
    };

    const resendInvitation = async (invitationUid: string) => {
        try {
            await drive.resendInvitation(nodeUid, invitationUid);
            createNotification({ type: 'info', text: c('Notification').t`Invitation's email was sent again` });
        } catch (e) {
            handleError(e, {
                fallbackMessage: c('Error').t`Failed to resend invitation`,
                extra: { nodeUid, invitationUid },
            });
        }
    };

    useEffect(() => {
        const fetchSharingInfo = async () => {
            try {
                const sharingResult = await drive.getSharingInfo(nodeUid);
                if (sharingResult) {
                    setSharingInfo(sharingResult);
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`Failed to fetch sharing info`, extra: { nodeUid } });
            }
        };
        const fetchNodeInfo = async () => {
            try {
                const nodeInfo = await drive.getNode(nodeUid);
                if (nodeInfo.ok && nodeInfo.value.keyAuthor.ok && nodeInfo.value.keyAuthor.value) {
                    setOwnerEmail(nodeInfo.value.keyAuthor.value);
                }
                if (nodeInfo.ok) {
                    setName(nodeInfo.value.name);
                    if (nodeInfo.value.mediaType && isProtonDocsDocument(nodeInfo.value.mediaType)) {
                        setIsPublicLinkEnabled(isDocsPublicSharingEnabled);
                    }
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`Failed to fetch node`, extra: { nodeUid } });
            }
        };
        void withLoading(Promise.all([fetchSharingInfo(), fetchNodeInfo()]));
    }, [drive, handleError, isDocsPublicSharingEnabled, nodeUid, withLoading]);

    const copyInvitationLink = (invitationUid: string, email: string) => {
        const { invitationId } = splitInvitationUid(invitationUid);
        textToClipboard(
            getAppHref(`/${volumeId}/${linkId}?invitation=${invitationId}&email=${email}`, APPS.PROTONDRIVE)
        );
        createNotification({ text: c('Info').t`Invite link copied` });
    };
    // TODO: Update with logic when we will be able to retrieve real DisplayName of any user
    const ownerDisplayName = user.Email === ownerEmail && user.DisplayName ? user.DisplayName : undefined;

    const directMembers: DirectMember[] = sharingInfo.members
        .map((member) => ({
            uid: member.uid,
            inviteeEmail: member.inviteeEmail,
            role: member.role,
            type: MemberType.Member,
        }))
        .concat(
            sharingInfo.protonInvitations.map((protonInvitation) => ({
                uid: protonInvitation.uid,
                inviteeEmail: protonInvitation.inviteeEmail,
                role: protonInvitation.role,
                type: MemberType.ProtonInvitation,
            }))
        )
        .concat(
            sharingInfo.nonProtonInvitations.map((nonProtonInvitation) => ({
                uid: nonProtonInvitation.uid,
                inviteeEmail: nonProtonInvitation.inviteeEmail,
                role: nonProtonInvitation.role,
                state: nonProtonInvitation.state,
                type: MemberType.ProtonInvitation,
            }))
        );

    return {
        open,
        onExit,
        onClose,
        linkId,
        name,
        ownerDisplayName,
        ownerEmail,
        isLoading,
        isShared,
        isPublicLinkEnabled,
        publicLink: sharingInfo.publicLink
            ? {
                  role: sharingInfo.publicLink.role,
                  url: sharingInfo.publicLink.url,
                  customPassword: sharingInfo.publicLink.customPassword,
                  expirationTime: sharingInfo.publicLink.expirationTime,
              }
            : undefined,
        directMembers,
        actions: {
            unshareNode,
            unsharePublic,
            createSharePublic,
            updateShareDirect,
            updateSharePublic,
            resendInvitation,
            copyInvitationLink,
            onPublicLinkToggle,
            stopSharing: stopSharingWithPollEvents,
        },
    };
};
