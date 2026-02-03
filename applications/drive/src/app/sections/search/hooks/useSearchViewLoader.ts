import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import type { MaybeMissingNode, MaybeNode, MissingNode } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import { shouldTrackError, useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { useSearchViewStore } from '../../../zustand/search/searchView.store';

const isMissingNode = (result: MaybeMissingNode): result is { ok: false; error: MissingNode } => {
    return result.ok === false && result.error && 'missingUid' in result.error;
};

const isMaybeNode = (result: MaybeMissingNode): result is MaybeNode => {
    return !isMissingNode(result);
};

// Load nodes by UID from the SDK, convert them to UI presentation objects and store them in the store.
export const useSearchViewNodesLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const { addSearchResultItem, setLoading, cleanupStaleItems } = useSearchViewStore(
        useShallow((state) => ({
            addSearchResultItem: state.addSearchResultItem,
            setLoading: state.setLoading,
            cleanupStaleItems: state.cleanupStaleItems,
        }))
    );

    const loadNodes = useCallback(
        async (nodeUids: string[], abortSignal: AbortSignal) => {
            setLoading(true);
            const loadedUids = new Set<string>();
            try {
                let showErrorNotification = false;

                for await (const maybeMissingNode of drive.iterateNodes(nodeUids, abortSignal)) {
                    try {
                        if (!isMaybeNode(maybeMissingNode)) {
                            handleError(maybeMissingNode.error, {
                                showNotification: false,
                            });
                            showErrorNotification = true;
                            continue;
                        }

                        const maybeNode = maybeMissingNode satisfies MaybeNode;
                        const { node } = getNodeEntity(maybeNode);
                        // The legacy search library indexes trashed items.
                        // We need to filter them out after loading since trash information
                        // is only available after fetching the metadata.
                        if (node.trashTime) {
                            continue;
                        }

                        const location = await getFormattedNodeLocation(drive, maybeNode);
                        const signatureResult = getSignatureIssues(maybeNode);

                        // Add item to the store.
                        addSearchResultItem({
                            nodeUid: node.uid,
                            name: node.name,
                            type: node.type,
                            mediaType: node.mediaType,
                            thumbnailId: node.activeRevision?.uid || node.uid,
                            size: node.totalStorageSize,
                            modificationTime: node.modificationTime || node.creationTime,
                            location,
                            haveSignatureIssues: !signatureResult.ok,
                        });

                        loadedUids.add(node.uid);
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
                cleanupStaleItems(loadedUids);
                setLoading(false);
            }
        },

        [setLoading, cleanupStaleItems, drive, addSearchResultItem, handleError, createNotification]
    );

    return {
        loadNodes,
    };
};
