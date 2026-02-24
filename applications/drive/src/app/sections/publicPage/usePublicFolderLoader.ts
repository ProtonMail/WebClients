import { useCallback } from 'react';

import { c } from 'ttag';

import { useAuthentication, useNotifications } from '@proton/components';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getPublicLinkClient } from './publicLinkClient';
import { usePublicFolderStore } from './usePublicFolder.store';

export const usePublicFolderLoader = () => {
    const { createNotification } = useNotifications();
    const auth = useAuthentication();

    const loadPublicFolderChildren = useCallback(
        async (nodeUid: string, abortSignal: AbortSignal) => {
            const { isLoading, setLoading, setItem, clearAll } = usePublicFolderStore.getState();
            if (isLoading) {
                return;
            }

            clearAll();
            setLoading(true);

            try {
                const driveClient = getPublicLinkClient();
                const maybeFolderNode = await driveClient.getNode(nodeUid);
                const { node: folderNode } = getNodeEntity(maybeFolderNode);
                usePublicFolderStore.getState().setFolder({
                    uid: folderNode.uid,
                    parentUid: folderNode.parentUid,
                    name: folderNode.name,
                });

                let showErrorNotification = false;

                for await (const maybeNode of driveClient.iterateFolderChildren(nodeUid, undefined, abortSignal)) {
                    try {
                        const { node } = getNodeEntity(maybeNode);
                        const signatureResult = getSignatureIssues(maybeNode);
                        const modificationTime = node.activeRevision?.claimedModificationTime
                            ? node.activeRevision.claimedModificationTime
                            : node.creationTime;
                        const size = getNodeDisplaySize(maybeNode);
                        setItem({
                            uid: node.uid,
                            name: node.name,
                            type: node.type,
                            mediaType: node.mediaType,
                            thumbnailId: node.activeRevision?.uid || node.uid,
                            size,
                            parentUid: node.parentUid,
                            creationTime: node.creationTime,
                            modificationTime,
                            haveSignatureIssues: !!auth.getUID() ? !signatureResult.ok : false,
                            uploadedBy:
                                (node.keyAuthor.ok ? node.keyAuthor.value : node.keyAuthor.error.claimedAuthor) ||
                                undefined,
                        });
                    } catch (e) {
                        handleSdkError(e, {
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
                handleSdkError(e, { fallbackMessage: c('Error').t`We were not able to load the folder contents` });
            } finally {
                setLoading(false);
            }
        },
        [auth, createNotification]
    );

    return {
        loadPublicFolderChildren,
    };
};
