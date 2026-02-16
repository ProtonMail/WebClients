import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components';
import { useNotifications } from '@proton/components';
import type { ProtonDriveClient } from '@proton/drive';
import {
    type DegradedNode,
    MemberRole,
    type NodeEntity,
    NodeType,
    type ShareNodeSettings,
    type ShareResult,
    getDrive,
    splitInvitationUid,
    splitNodeUid,
} from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveDocsPublicSharing } from '../../flags/useFlagsDriveDocsPublicSharing';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeName } from '../../utils/sdk/getNodeName';
import { getContactNameAndEmail } from './DirectSharing/helpers/getContactNameAndEmail';
import type { SharingModalViewProps } from './SharingModalView';
import { type DirectMember, MemberType } from './interfaces';

export type SharingModalInnerProps = {
    nodeUid: string;
    drive?: ProtonDriveClient;
};

export type UseSharingModalProps = ModalStateProps & SharingModalInnerProps;

const defaultSharingInfo = {
    protonInvitations: [],
    nonProtonInvitations: [],
    publicLink: undefined,
    members: [],
};

const getIsShared = (shareResult: ShareResult) => {
    const isDirectShared =
        shareResult.protonInvitations.length > 0 ||
        shareResult.nonProtonInvitations.length > 0 ||
        shareResult.members.length > 0;
    const isPublicShared = !!shareResult.publicLink;
    return isDirectShared || isPublicShared;
};

export const useSharingModalState = ({
    nodeUid,
    drive = getDrive(),
    onClose,
    open,
    onExit,
}: UseSharingModalProps): SharingModalViewProps => {
    const [contactEmails] = useContactEmails();

    const { isDocsPublicSharingEnabled } = useFlagsDriveDocsPublicSharing();

    const { handleError } = useSdkErrorHandler();

    const { createNotification } = useNotifications();

    const [user] = useUser();

    const [isLoading, withLoading] = useLoading();

    const [sharingInfo, setSharingInfo] = useState<ShareResult>(defaultSharingInfo);

    const [ownerEmail, setOwnerEmail] = useState<string | undefined>();
    const [ownerDisplayName, setOwnerDisplayName] = useState<string | undefined>();

    const [name, setName] = useState('');

    const [parentUid, setParentUid] = useState<string | undefined>(undefined);

    const [mediaType, setMediaType] = useState<string | undefined>();
    const [isAlbum, setIsAlbum] = useState<boolean | undefined>();

    const getIsPublicLinkEnabled = () => {
        if (mediaType && isProtonDocsDocument(mediaType)) {
            return isDocsPublicSharingEnabled;
        }
        return !isAlbum;
    };
    const isPublicLinkEnabled = getIsPublicLinkEnabled();

    const updateSharingState = async (updatedShareResult: ShareResult | undefined) => {
        const shareResult = updatedShareResult || defaultSharingInfo;
        await getBusDriver().emit({
            type: BusDriverEventName.UPDATED_NODES,
            items: [
                {
                    uid: nodeUid,
                    parentUid,
                    isShared: getIsShared(shareResult),
                },
            ],
        });
        setSharingInfo(shareResult);
    };

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
            await updateSharingState(updatedShareResult);
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
            await updateSharingState(updatedShareResult);
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

            await updateSharingState(updatedShareResult);
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

            await updateSharingState(updatedShareResult);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to update public share node`, extra: { nodeUid } });
        }
    };

    const updateShareDirect = async (directShareSettings: Omit<ShareNodeSettings, 'publicLink'>) => {
        try {
            const updatedShareResult = await drive.shareNode(nodeUid, directShareSettings);
            // First the button changes appearance, then comes the notification
            setTimeout(
                () =>
                    createNotification({
                        // translator: for example '"image.jpg" shared'
                        text: c('Notification').t`"${name}" shared`,
                    }),
                2000
            );

            await updateSharingState(updatedShareResult);
        } catch (e) {
            handleError(e, { fallbackMessage: c('Error').t`Failed to update direct share node`, extra: { nodeUid } });
        }
    };

    const stopSharing = async () => {
        try {
            const updatedShareResult = await drive.unshareNode(nodeUid);
            await updateSharingState(updatedShareResult);
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
                const node = await drive.getNode(nodeUid);
                const nodeInfo = node.ok ? node.value : node.error;

                setName(getNodeName(node));
                setParentUid(nodeInfo.parentUid);
                setMediaType(nodeInfo.type === NodeType.Folder ? 'Folder' : nodeInfo.mediaType);
                setIsAlbum(nodeInfo.type === NodeType.Album);

                const ownerEmail = getOwnerEmail(nodeInfo);
                if (ownerEmail) {
                    setOwnerEmail(ownerEmail);
                }
                // Use current user's name or find it in the contacts
                if (ownerEmail === user.Email) {
                    setOwnerDisplayName(user.DisplayName);
                } else if (ownerEmail) {
                    const { contactName } = getContactNameAndEmail(ownerEmail, contactEmails);
                    if (contactName.length) {
                        setOwnerDisplayName(contactName);
                    }
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`Failed to fetch node`, extra: { nodeUid } });
            }
        };
        void withLoading(Promise.all([fetchSharingInfo(), fetchNodeInfo()]));
    }, [drive, handleError, nodeUid, user.DisplayName, withLoading]);

    const copyInvitationLink = (invitationUid: string, email: string) => {
        const { invitationId } = splitInvitationUid(invitationUid);
        const { volumeId, nodeId } = splitNodeUid(nodeUid);
        textToClipboard(
            getAppHref(`/${volumeId}/${nodeId}?invitation=${invitationId}&email=${email}`, APPS.PROTONDRIVE)
        );
        createNotification({ text: c('Info').t`Invite link copied` });
    };

    const directMembers = sharingInfo.members
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
        ) as DirectMember[]; // FIXME "Feel free to just throw if that happens on client side with comment it is not expected and that SDK will improve typing and then it can be deleted."
    // TODO ^^ (up)

    return {
        open,
        onExit,
        onClose,
        name,
        mediaType,
        ownerDisplayName,
        ownerEmail,
        isLoading,
        isShared: getIsShared(sharingInfo),
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
            stopSharing,
        },
    };
};

function getOwnerEmail(nodeInfo: NodeEntity | DegradedNode) {
    if (nodeInfo.keyAuthor.ok) {
        return nodeInfo.keyAuthor.value;
    } else if (!nodeInfo.keyAuthor.ok) {
        return nodeInfo.keyAuthor.error.claimedAuthor;
    }
}
