import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { MemberRole, useDrive } from '@proton/drive';
import useFlag from '@proton/unleash/useFlag';

import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../store/_documents';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useDeviceStore } from '../devices/devices.store';
import { type FolderViewItem, useFolderStore } from './useFolder.store';

export function useFolder() {
    const { drive } = useDrive();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const copyFeatureEnabled = useFlag('DriveWebSDKCopy');
    const { createNotification } = useNotifications();
    const handleFolderError = useCallback((error?: Error) => {
        if (!error) {
            return;
        }
        const { setError } = useFolderStore.getState();

        const errorMessage = error
            ? ('message' in error ? error.message : error) || 'Unknown node error'
            : 'Unknown node error';

        const enrichedError = new EnrichedError(errorMessage, {
            tags: { component: 'drive-sdk' },
            extra: { originalError: error },
        });

        handleSdkError(error);
        setError(enrichedError);
        //TODO: Implement better way of handling error (Retry capability for ex)
    }, []);

    const load = useCallback(
        // TODO: after FileBrowser migration, this params can be passed in the hook main function
        // and immediately added to the store in order to listen for events right away
        async (folderNodeUid: string, folderShareId: string, ac: AbortController) => {
            const { setIsLoading, reset, setItems, setFolder, setRole, setPermissions } = useFolderStore.getState();
            const { getByRootFolderUid } = useDeviceStore.getState();
            reset();
            setIsLoading(true);

            try {
                const maybeNode = await drive.getNode(folderNodeUid);
                const legacyNode = await mapNodeToLegacyItem(maybeNode, folderShareId, drive);
                const { node } = getNodeEntity(maybeNode);
                const isDeviceRoot = !node.parentUid && !!getByRootFolderUid(folderNodeUid);
                const isDeviceFolder = isDeviceRoot || (legacyNode.rootUid && !!getByRootFolderUid(legacyNode.rootUid));
                const role = await getNodeEffectiveRole(node, drive);
                const canEdit = role !== MemberRole.Viewer && !isDeviceRoot;
                const canTrash = role !== MemberRole.Viewer;
                const isRoot = !node.parentUid;
                const isAdmin = role === MemberRole.Admin;

                setFolder({
                    ...legacyNode,
                    isRoot: !node.parentUid,
                    shareId: folderShareId,
                });
                setRole(role);
                setPermissions({
                    canEdit,
                    canShare: isAdmin && (isDeviceRoot || isRoot),
                    canCreateNode: canEdit,
                    canCreateDocs: isDocsEnabled && canEdit && !isDeviceFolder,
                    canCreateSheets: isSheetsEnabled && canEdit && !isDeviceFolder,
                    canShareNode: isAdmin && !isDeviceRoot && !isRoot,
                    canMove: canEdit,
                    canCopy: copyFeatureEnabled,
                    canRename: canEdit,
                    canTrash,
                });
                let showErrorNotification = false;

                /**
                 * In case SDK already cached (some are all) folder's children,
                 * it will loop fast and update the store fast as well.
                 * This will cause React to re-render a lot in a short amount of time causing freeze of the app
                 * We solve that by adding a batching + flush system
                 * Every 30ms we update the store no matter the number of loaded items
                 * This doesn't not prevent the iteration to continue
                 * We need to find a better way to handle those cases in the future with new DriveExplorer
                 */
                const itemsBatch: FolderViewItem[] = [];

                const flushBatch = () => {
                    if (itemsBatch.length > 0) {
                        setItems([...itemsBatch]);
                        itemsBatch.length = 0;
                    }
                };

                const intervalId = setInterval(flushBatch, 30);

                try {
                    for await (const maybeNode of drive.iterateFolderChildren(folderNodeUid, undefined, ac.signal)) {
                        try {
                            if (ac.signal.aborted) {
                                clearInterval(intervalId);
                                return;
                            }
                            const legacyItem = await mapNodeToLegacyItem(maybeNode, folderShareId, drive, node);
                            itemsBatch.push(legacyItem);
                        } catch (e) {
                            handleSdkError(e, {
                                showNotification: false,
                            });
                            showErrorNotification = true;
                        }
                    }
                } finally {
                    clearInterval(intervalId);
                    flushBatch();
                }
                if (showErrorNotification) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`We were not able to load some items`,
                    });
                }
            } catch (e) {
                const error =
                    e instanceof Error ? e : new Error(c('Error').t`Something went wrong during folder listing`);
                handleFolderError(error);
            } finally {
                setIsLoading(false);
            }
        },
        [copyFeatureEnabled, createNotification, drive, handleFolderError, isDocsEnabled, isSheetsEnabled]
    );

    return {
        load,
    };
}
