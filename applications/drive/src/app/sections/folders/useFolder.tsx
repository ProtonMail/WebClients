import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { MemberRole, useDrive } from '@proton/drive';
import { useFlag } from '@proton/unleash/useFlag';

import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import { driveMetrics } from '../../modules/metrics';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useDevicesStore } from '../devices/useDevices.store';
import { mapNodeToFolderViewItem } from './mapNodeToFolderViewItem';
import { type FolderViewItem, useFolderStore } from './useFolder.store';

export function useFolder() {
    const { drive } = useDrive();
    const isDriveDocsDisabled = useFlag('DriveDocsDisabled');
    const isSheetsEnabled = useFlagsDriveSheet();
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
            const { onItemsLoadedToState, onFinished } = driveMetrics.drivePerformance.startDataLoad('folder');

            const { setIsLoading, reset, setItems, setFolder, setRole, setPermissions } = useFolderStore.getState();
            const { getByRootFolderUid } = useDevicesStore.getState();
            reset();
            setIsLoading(true);

            try {
                const maybeNode = await drive.getNode(folderNodeUid);
                const { node } = getNodeEntity(maybeNode);
                const folderItem = await mapNodeToFolderViewItem(maybeNode, folderShareId, drive);
                const isDeviceRoot = !node.parentUid && !!getByRootFolderUid(folderNodeUid);
                const isDeviceFolder = isDeviceRoot || (folderItem.rootUid && !!getByRootFolderUid(folderItem.rootUid));
                const role = await getNodeEffectiveRole(node, drive);
                const canEdit = role !== MemberRole.Viewer && !isDeviceRoot;
                const canTrash = role !== MemberRole.Viewer;
                const isRoot = !node.parentUid;
                const isAdmin = role === MemberRole.Admin;

                setFolder({
                    uid: node.uid,
                    name: node.name,
                    parentUid: node.parentUid,
                    isRoot: !node.parentUid,
                    shareId: folderShareId,
                });
                setRole(role);
                setPermissions({
                    canEdit,
                    canShare: isAdmin && (isDeviceRoot || isRoot),
                    canCreateNode: canEdit,
                    canCreateDocs: !isDriveDocsDisabled && canEdit && !isDeviceFolder,
                    canCreateSheets: isSheetsEnabled && canEdit && !isDeviceFolder,
                    canOpenInDocs: canEdit,
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
                        onItemsLoadedToState(itemsBatch.length);
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
                            const item = await mapNodeToFolderViewItem(maybeNode, folderShareId, drive, node);
                            itemsBatch.push(item);
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
                onFinished();
            } catch (e) {
                const error =
                    e instanceof Error ? e : new Error(c('Error').t`Something went wrong during folder listing`);
                handleFolderError(error);
            } finally {
                setIsLoading(false);
            }
        },
        [copyFeatureEnabled, createNotification, drive, handleFolderError, isDriveDocsDisabled, isSheetsEnabled]
    );

    return {
        load,
    };
}
