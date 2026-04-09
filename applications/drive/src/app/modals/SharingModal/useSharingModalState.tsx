import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components';
import { useNotifications } from '@proton/components';
import type { DegradedNode, ProtonDriveClient } from '@proton/drive';
import {
    MemberRole,
    type NodeEntity,
    NodeType,
    type ShareNodeSettings,
    type ShareResult,
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
import { useFlagsDriveSharingAdminPermissions } from '../../flags/useFlagsDriveSharingAdminPermissions';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeName } from '../../utils/sdk/getNodeName';
import type { DriveWithSharing } from '../preview/interface';
import { getDisplayName } from './DirectSharing/helpers/userNames';
import type { SharingModalViewProps } from './SharingModalView';
import { type DirectMember, MemberType } from './interfaces';

export type SharingModalInnerProps = {
    nodeUid: string;
    drive: DriveWithSharing;
};

export type UseSharingModalProps = ModalStateProps & SharingModalInnerProps;

const defaultSharingInfo = {
    protonInvitations: [],
    nonProtonInvitations: [],
    publicLink: undefined,
    members: [],
    editorsCanShare: false,
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
    drive,
    onClose,
    open,
    onExit,
}: UseSharingModalProps): SharingModalViewProps => {
    const [contactEmails] = useContactEmails();

    const adminRoleEnabled = useFlagsDriveSharingAdminPermissions();

    const { createNotification } = useNotifications();

    const [user] = useUser();

    const [isLoading, withLoading] = useLoading();

    const [nodeInfo, setNodeInfo] = useState<NodeEntity | DegradedNode>();

    const [sharingInfo, setSharingInfo] = useState<ShareResult>(defaultSharingInfo);

    const ownerEmail = nodeInfo?.ownedBy.email;
    const ownerDisplayName = getDisplayName({ ownerEmail, contactEmails, user });

    const [fileName, setFileName] = useState('');

    const mediaType = getMediaType(nodeInfo);
    const isAlbum = nodeInfo?.type === NodeType.Album;
    const isPhoto = nodeInfo?.type === NodeType.Photo;
    const notPhotoOrAlbum = !(isPhoto || isAlbum);
    const [isResharing, setIsResharing] = useState(false);
    const isPublicLinkEnabled = usePublicLinkEnabled({ isResharing, mediaType, isAlbum });

    const [roleOnParentNode, setRoleOnParentNode] = useState<MemberRole>();
    const canChangePermissions = roleOnParentNode === MemberRole.Admin;

    const updateSharingState = async (updatedShareResult: ShareResult | undefined) => {
        const shareResult = updatedShareResult || defaultSharingInfo;
        await getBusDriver().emit(
            {
                type: BusDriverEventName.UPDATED_NODES,
                items: [
                    {
                        uid: nodeUid,
                        parentUid: nodeInfo?.parentUid,
                        isShared: getIsShared(shareResult),
                    },
                ],
            },
            drive
        );
        setSharingInfo(shareResult);
    };

    const unshareNode: SharingModalViewProps['actions']['unshareNode'] = async (
        email,
        { refreshSharedWithMe } = {}
    ) => {
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

            if (refreshSharedWithMe) {
                await getBusDriver().emit(
                    {
                        type: BusDriverEventName.REFRESH_SHARED_WITH_ME,
                    },
                    drive
                );
            }
        } catch (e) {
            handleSdkError(e, { fallbackMessage: c('Error').t`Failed to unshare node`, extra: { nodeUid } });
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
            handleSdkError(e, {
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
            handleSdkError(e, {
                fallbackMessage: c('Error').t`Failed to create public share node`,
                extra: { nodeUid },
            });
        }
    };

    const updateSharePublic = async (publicLinkSettings: {
        role?: MemberRole;
        customPassword?: string;
        expiration?: Date;
    }) => {
        try {
            // For safety if one of the value is not passed, we used the actual one
            // If it is passed but explicitly as "undefined" we assume that it's to disable it
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
            handleSdkError(e, {
                fallbackMessage: c('Error').t`Failed to update public share node`,
                extra: { nodeUid },
            });
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
                        text: c('Notification').t`"${fileName}" shared`,
                    }),
                2000
            );

            await updateSharingState(updatedShareResult);
        } catch (e) {
            handleSdkError(e, {
                fallbackMessage: c('Error').t`Failed to update direct share node`,
                extra: { nodeUid },
            });
        }
    };

    const stopSharing = async () => {
        try {
            const updatedShareResult = await drive.unshareNode(nodeUid);
            await updateSharingState(updatedShareResult);
            createNotification({ text: c('Notification').t`You stopped sharing this item` });
        } catch (e) {
            handleSdkError(e, {
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
            handleSdkError(e, {
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
                handleSdkError(e, { fallbackMessage: c('Error').t`Failed to fetch sharing info`, extra: { nodeUid } });
            }
        };
        const fetchNodeInfo = async () => {
            try {
                const node = await drive.getNode(nodeUid);
                const nodeInfo = node.ok ? node.value : node.error;

                setFileName(getNodeName(node));
                setNodeInfo(nodeInfo);

                if (nodeInfo.parentUid) {
                    const parent = await drive.getNode(nodeInfo.parentUid);
                    const parentNodeInfo = parent.ok ? parent.value : parent.error;
                    const effectiveRoleOnParent = await getNodeEffectiveRole(parentNodeInfo, drive);
                    setRoleOnParentNode(effectiveRoleOnParent);
                }

                if (nodeInfo?.type !== NodeType.Album && nodeInfo?.type !== NodeType.Photo) {
                    const isMyFile = await isShareInMyFiles(nodeUid, drive as ProtonDriveClient);
                    setIsResharing(!isMyFile);
                }
            } catch (e) {
                handleSdkError(e, { fallbackMessage: c('Error').t`Failed to fetch node`, extra: { nodeUid } });
            }
        };
        void withLoading(Promise.all([fetchSharingInfo(), fetchNodeInfo()]));
    }, [drive, nodeUid, withLoading]);

    const copyInvitationLink = (invitationUid: string, email: string) => {
        const { invitationId } = splitInvitationUid(invitationUid);
        const { volumeId, nodeId } = splitNodeUid(nodeUid);
        textToClipboard(
            getAppHref(`/${volumeId}/${nodeId}?invitation=${invitationId}&email=${email}`, APPS.PROTONDRIVE)
        );
        createNotification({ text: c('Info').t`Invite link copied` });
    };

    const directMembers = useMemo(
        () =>
            sharingInfo.members
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
                        type: MemberType.NonProtonInvitation,
                    }))
                )
                .filter((member) => member.inviteeEmail !== ownerEmail) as DirectMember[],
        [sharingInfo, ownerEmail]
    );

    const existingEmails = useMemo(() => {
        const directMembersMails = directMembers.map((member) => member.inviteeEmail);
        if (ownerEmail) {
            directMembersMails.push(ownerEmail);
        }
        return directMembersMails;
    }, [ownerEmail, directMembers]);

    return {
        open,
        onExit,
        onClose,
        sharingInfo,
        nodeUid,
        roleOnParentNode,
        fileName,
        mediaType,
        showPermissionsCheckbox: adminRoleEnabled && canChangePermissions && notPhotoOrAlbum,
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
        existingEmails,
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

function usePublicLinkEnabled({
    isResharing,
    mediaType,
    isAlbum,
}: {
    isResharing?: boolean;
    mediaType?: string;
    isAlbum: boolean;
}) {
    const { isDocsPublicSharingEnabled } = useFlagsDriveDocsPublicSharing();

    if (isResharing) {
        return false;
    }

    if (mediaType && isProtonDocsDocument(mediaType)) {
        return isDocsPublicSharingEnabled;
    }

    return !isAlbum;
}

function getMediaType(nodeInfo?: NodeEntity | DegradedNode): string | undefined {
    if (nodeInfo?.type) {
        if (nodeInfo.type === NodeType.Folder) {
            return 'Folder';
        }
        if (nodeInfo.type === NodeType.Album) {
            return 'Album';
        }
    }
    return nodeInfo?.mediaType;
}

async function isShareInMyFiles(nodeUid: string, drive: ProtonDriveClient): Promise<boolean> {
    const ancestors = await getNodeAncestry(nodeUid, drive);
    const firstAncestor = ancestors.ok && ancestors.value.at(0);
    if (!firstAncestor) {
        // Impossible, because getNodeAncestry will always at least return self
        return false;
    }
    // If node has "membership" it means it is a direct share
    const { node: shareTopmostParent } = getNodeEntity(firstAncestor);
    return !Boolean(shareTopmostParent.membership);
}
