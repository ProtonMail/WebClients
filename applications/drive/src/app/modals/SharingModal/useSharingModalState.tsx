import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components';
import { useNotifications } from '@proton/components';
import { type ShareNodeSettings, type ShareResult, useDrive } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { useDriveEventManager, useShareURLView } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/sdkErrorHandler';

export type UseSharingModalProps = ModalStateProps & {
    volumeId: string;
    shareId: string;
    linkId: string;
    onPublicLinkToggle?: (enabled: boolean) => void;
    /**
     * Escape hatch that is necessary for Docs. Please do not use unless you know what you are doing.
     *
     * The reason behind this workaround is stale cache issues. See MR for more details.
     */
    registerOverriddenNameListener?: (listener: (name: string) => void) => void;
};

const defaultSharingInfo = {
    protonInvitations: [],
    nonProtonInvitations: [],
    publicLink: undefined,
    members: [],
};

export const useSharingModalState = ({
    volumeId,
    shareId: rootShareId,
    linkId,
    onClose,
    onPublicLinkToggle,
    registerOverriddenNameListener,
    open,
    onExit,
}: UseSharingModalProps) => {
    const {
        customPassword,
        initialExpiration,
        name: originalName,
        deleteLink,
        stopSharing,
        sharedLink,
        permissions,
        updatePermissions,
        hasSharedLink,
        errorMessage,
        loadingMessage,
        confirmationMessage,
        hasGeneratedPasswordIncluded,
        createSharedLink,
        saveSharedLink,
        isSaving,
        isDeleting,
        isCreating,
        isShareUrlLoading,
        isShareUrlEnabled,
    } = useShareURLView(rootShareId, linkId);

    const events = useDriveEventManager();

    const { handleError } = useSdkErrorHandler();

    const { createNotification } = useNotifications();

    const [user] = useUser();

    const [overriddenName, setOverriddenName] = useState<string>();
    useEffect(() => {
        registerOverriddenNameListener?.(setOverriddenName);
    }, [registerOverriddenNameListener]);

    const name = overriddenName ?? originalName;

    const { drive, internal } = useDrive();

    const nodeUid = useMemo(() => internal.generateNodeUid(volumeId, linkId), [volumeId, linkId, internal]);

    const [isLoading, withLoading] = useLoading();

    const [sharingInfo, setSharingInfo] = useState<ShareResult>(defaultSharingInfo);

    const [ownerEmail, setOwnerEmail] = useState<string | undefined>();

    const isDirectShared =
        sharingInfo.protonInvitations.length > 0 ||
        sharingInfo.nonProtonInvitations.length > 0 ||
        sharingInfo.members.length > 0;
    const isPublicShared =
        !!sharingInfo.publicLink ||
        // TODO: Remove that when implementing public link with sdk
        hasSharedLink;
    const isShared = isDirectShared && isPublicShared;

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
            handleError(e, c('Error').t`Failed to unshare node`, { nodeUid });
        }
    };

    const updateShareNode = async (shareNodeSettings: ShareNodeSettings) => {
        try {
            const updatedShareResult = await drive.shareNode(nodeUid, shareNodeSettings);
            createNotification({ type: 'info', text: c('Notification').t`Access updated and shared` });
            setSharingInfo(updatedShareResult);
            // TODO: Remove when implemented in SDK
            void events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, c('Error').t`Failed to update share node`, { nodeUid });
        }
    };

    // TODO: Remove that when publicLink will be working on sdk
    const stopSharingWithPollEvents = async () => {
        await stopSharing();
        await events.pollEvents.volumes(volumeId);
    };

    const resendInvitation = async (invitationUid: string) => {
        try {
            await drive.resendInvitation(nodeUid, invitationUid);
            createNotification({ type: 'info', text: c('Notification').t`Invitation's email was sent again` });
        } catch (e) {
            handleError(e, c('Error').t`Failed to resend invitation`, { nodeUid, invitationUid });
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
                handleError(e, c('Error').t`Failed to fetch sharing info`, { nodeUid });
            }
        };
        const fetchNodeInfo = async () => {
            try {
                const nodeInfo = await drive.getNode(nodeUid);
                if (nodeInfo.ok && nodeInfo.value.keyAuthor.ok && nodeInfo.value.keyAuthor.value) {
                    setOwnerEmail(nodeInfo.value.keyAuthor.value);
                }
            } catch (e) {
                handleError(e, c('Error').t`Failed to fetch node`, { nodeUid });
            }
        };
        void withLoading(Promise.all([fetchSharingInfo(), fetchNodeInfo()]));
    }, [drive, handleError, nodeUid, withLoading]);

    const copyInvitationLink = (invitationUid: string, email: string) => {
        const { invitationId } = internal.splitInvitationUid(invitationUid);
        textToClipboard(
            getAppHref(`/${volumeId}/${linkId}?invitation=${invitationId}&email=${email}`, APPS.PROTONDRIVE)
        );
        createNotification({ text: c('Info').t`Invite link copied` });
    };
    // TODO: Update with logic when we will be able to retrieve real DisplayName of any user
    const ownerDisplayName = user.Email === ownerEmail && user.DisplayName ? user.DisplayName : undefined;

    // TODO: Update that when we will have sdk public link
    const handleDeleteLink = async () => {
        await deleteLink(!isDirectShared ? () => stopSharing(false) : undefined);
    };

    return {
        open,
        onExit,
        onClose,
        isLoading,
        isSaving,
        isDeleting,
        isCreating,
        isShareUrlLoading,
        name,
        ownerDisplayName,
        ownerEmail,
        volumeId,
        linkId,
        sharedLink,
        permissions,
        members: sharingInfo.members,
        protonInvitations: sharingInfo.protonInvitations,
        nonProtonInvitations: sharingInfo.nonProtonInvitations,
        customPassword,
        initialExpiration,
        hasGeneratedPasswordIncluded,
        confirmationMessage,
        isShareUrlEnabled,
        errorMessage,
        loadingMessage,
        isShared,
        hasSharedLink,
        unshareNode,
        updateShareNode,
        resendInvitation,
        copyInvitationLink,
        deleteLink: handleDeleteLink,
        onPublicLinkToggle,
        createSharedLink,
        saveSharedLink,
        updatePermissions,
        stopSharing: stopSharingWithPollEvents,
    };
};
