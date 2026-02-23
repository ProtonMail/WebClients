import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import type { MaybeNode, NodeEntity, ProtonDriveClient } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import { shouldTrackError, useSdkErrorHandler } from '../../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEffectiveRole } from '../../../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../../../utils/sdk/getSignatureIssues';
import { isMissingNode } from '../../../../utils/sdk/node';
import { useSearchViewStore } from '../../searchView/store';

// Nodes don't inherit trashTime when their parent folder is trashed,
// so we must check ancestors.
const isNodeOrAncestorTrashed = async (node: NodeEntity, drive: ProtonDriveClient): Promise<boolean> => {
    if (node.trashTime) {
        return Promise.resolve(true);
    }

    let currentNodeToCheckForTrash: NodeEntity = node;
    while (currentNodeToCheckForTrash.parentUid) {
        const parentUid = currentNodeToCheckForTrash.parentUid;
        const parentMaybeNode = await drive.getNode(parentUid);
        const { node: parentNodeEntity } = getNodeEntity(parentMaybeNode);
        if (parentNodeEntity.trashTime) {
            return true;
        }
        currentNodeToCheckForTrash = parentNodeEntity;
    }
    return false;
};

const addNodeToStore = async (maybeNode: MaybeNode, drive: ProtonDriveClient): Promise<boolean> => {
    const { node } = getNodeEntity(maybeNode);

    // The legacy search library indexes trashed items.
    // We need to filter them out after loading since trash information
    // is only available after fetching the metadata.
    const isNodeOrAncestorInTrash = await isNodeOrAncestorTrashed(node, drive);
    if (isNodeOrAncestorInTrash) {
        return false;
    }

    const locationPromise = getFormattedNodeLocation(drive, maybeNode);
    const nodeRolePromise = getNodeEffectiveRole(node, drive);
    const [location, role] = await Promise.all([locationPromise, nodeRolePromise]);

    const signatureResult = getSignatureIssues(maybeNode);

    // Add item to the store.
    useSearchViewStore.getState().addSearchResultItem({
        nodeUid: node.uid,
        parentUid: node.parentUid,
        name: node.name,
        type: node.type,
        role,
        mediaType: node.mediaType,
        thumbnailId: node.activeRevision?.uid || node.uid,
        size: node.totalStorageSize,
        modificationTime: node.modificationTime || node.creationTime,
        location,
        haveSignatureIssues: !signatureResult.ok,
    });

    return true;
};

// Load nodes by UID from the SDK, convert them to UI presentation objects and store them in the store.
export const useSearchViewNodesLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const loadNodes = useCallback(
        async (nodeUids: string[], abortSignal: AbortSignal) => {
            useSearchViewStore.getState().setLoading(true);
            const loadedUids = new Set<string>();
            try {
                let showErrorNotification = false;

                for await (const maybeMissingNode of drive.iterateNodes(nodeUids, abortSignal)) {
                    try {
                        if (isMissingNode(maybeMissingNode)) {
                            // The search index engine does not do a good job at tracking deleted nodes.
                            // We silence these errors for now but when integrating the new search index,
                            // we should
                            continue;
                        }
                        const maybeNode = maybeMissingNode satisfies MaybeNode;
                        const addedToStore = await addNodeToStore(maybeNode, drive);
                        if (addedToStore) {
                            const { node } = getNodeEntity(maybeNode);
                            loadedUids.add(node.uid);
                        }
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
                        text: c('Error').t`We were not able to load some search results`,
                    });
                }
            } catch (e) {
                if (e instanceof Error && shouldTrackError(e)) {
                    return;
                }
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load some search results` });
            } finally {
                // Remove previously loaded node uids from previous search queries.
                useSearchViewStore.getState().cleanupStaleItems(loadedUids);
                useSearchViewStore.getState().setLoading(false);
                useSearchViewStore.getState().markStoreAsDirty(false);
            }
        },

        [drive, handleError, createNotification]
    );

    return {
        loadNodes,
    };
};
