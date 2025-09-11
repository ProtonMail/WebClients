import { useCallback } from 'react';

import { MemberRole, useDrive } from '@proton/drive/index';

import useDriveNavigation from '../../hooks/drive/useNavigate';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../store/_documents';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useDeviceStore } from '../devices/devices.store';
import { useFolderStore } from './useFolder.store';

export function useFolder() {
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const { navigateToRoot } = useDriveNavigation();

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

        handleError(error);
        setError(enrichedError);
        navigateToRoot();
    }, []);

    const load = useCallback(
        async (folderNodeUid: string, folderShareId: string, ac: AbortController) => {
            const { setIsLoading, reset, setItem, setFolder, setRole, setPermissions } = useFolderStore.getState();
            const { getByRootFolderUid } = useDeviceStore.getState();
            reset();
            setIsLoading(true);

            try {
                const { node, errors } = getNodeEntity(await drive.getNode(folderNodeUid));
                const error = Array.from(errors.values()).at(0);
                handleFolderError(error as Error);
                const legacyNode = await mapNodeToLegacyItem(node, folderShareId, drive);
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
                    canRename: canEdit,
                    canTrash,
                });

                for await (const maybeNode of drive.iterateFolderChildren(folderNodeUid, ac.signal)) {
                    const { node } = getNodeEntity(maybeNode);
                    if (node) {
                        const legacyItem = await mapNodeToLegacyItem(maybeNode, folderShareId, drive);
                        setItem(legacyItem);
                    }
                    if (!maybeNode.ok) {
                        // error on loading a single node inside the folder should not show notification
                        handleError(maybeNode.error, { showNotification: false });
                    }
                }
            } catch (e) {
                handleFolderError(e as Error);
            }
            setIsLoading(false);
        },
        [drive, handleError, handleFolderError, isDocsEnabled, isSheetsEnabled]
    );

    return {
        load,
    };
}
