import { useCallback } from 'react';

import { c } from 'ttag';

import { useAuthentication, useNotifications } from '@proton/components';
import { MemberRole } from '@proton/drive';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getPublicLinkClient } from './publicLinkClient';
import type { PublicFolderPermissions } from './usePublicFolder.store';
import { usePublicFolderStore } from './usePublicFolder.store';

export const usePublicFolderLoader = () => {
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const auth = useAuthentication();

    const loadPublicFolderChildren = useCallback(
        async (nodeUid: string, abortSignal: AbortSignal) => {
            const { isLoading, setLoading, setFolderItem, clearAll, setPermissions } = usePublicFolderStore.getState();
            if (isLoading) {
                return;
            }

            clearAll();
            setLoading(true);

            try {
                const driveClient = getPublicLinkClient();
                const maybeRootNode = await driveClient.getRootNode();
                const { node: rootNode } = getNodeEntity(maybeRootNode);
                // TODO: Add that back once API is fixed, which means owner of the share will have admin permissions
                // const role = await getNodeEffectiveRole(rootNode, driveClient);
                const viewOnly = rootNode.directRole === MemberRole.Viewer;
                const permissions: PublicFolderPermissions = {
                    canEdit: !viewOnly,
                    canDownload: true,
                    canUpload: !viewOnly,
                    canDelete: !viewOnly,
                    canRename: !viewOnly,
                    canShowPreview: true,
                    canOpenInDocs: true,
                };

                setPermissions(permissions);
                let showErrorNotification = false;

                for await (const maybeNode of driveClient.iterateFolderChildren(nodeUid, undefined, abortSignal)) {
                    try {
                        const { node } = getNodeEntity(maybeNode);
                        const signatureResult = getSignatureIssues(maybeNode);
                        const modificationTime = node.activeRevision?.claimedModificationTime
                            ? node.activeRevision.claimedModificationTime
                            : node.creationTime;
                        setFolderItem({
                            uid: node.uid,
                            name: node.name,
                            type: node.type,
                            mediaType: node.mediaType,
                            thumbnailId: node.activeRevision?.uid || node.uid,
                            size: node.activeRevision?.storageSize || node.totalStorageSize,
                            parentUid: node.parentUid,
                            creationTime: node.creationTime,
                            modificationTime,
                            haveSignatureIssues: !!auth.getUID() ? !signatureResult.ok : false,
                            uploadedBy:
                                (node.keyAuthor.ok ? node.keyAuthor.value : node.keyAuthor.error.claimedAuthor) ||
                                undefined,
                        });
                    } catch (e) {
                        handleError(e, {
                            showNotification: false,
                        });
                        showErrorNotification = true;
                    }
                }

                if (showErrorNotification) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`We were not able to load some items`,
                    });
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load the folder contents` });
            } finally {
                setLoading(false);
            }
        },
        [auth, createNotification, handleError]
    );

    return {
        loadPublicFolderChildren,
    };
};
