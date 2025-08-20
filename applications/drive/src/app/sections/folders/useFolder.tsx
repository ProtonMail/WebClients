import { useCallback } from 'react';

import { MemberRole } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../store/_documents';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useDeviceStore } from '../devices/devices.store';
import { useFolderStore } from './useFolder.store';

export function useFolder() {
    const { setIsLoading, setError, reset, setItem, setFolder, setRole, setPermissions } = useFolderStore((state) => ({
        setIsLoading: state.setIsLoading,
        setError: state.setError,
        reset: state.reset,
        setItem: state.setItem,
        setFolder: state.setFolder,
        setRole: state.setRole,
        setPermissions: state.setPermissions,
    }));
    const { drive } = useDrive();
    const { handleError } = useSdkErrorHandler();
    const { activeFolder } = useActiveShare();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const { devices } = useDeviceStore();
    // const { navigateToRoot, navigateToLink } = useDriveNavigation();

    const handleNodeError = useCallback(
        (error?: Error) => {
            if (!error) {
                return;
            }

            const errorMessage = error
                ? ('message' in error ? error.message : error) || 'Unknown node error'
                : 'Unknown node error';

            const enrichedError = new EnrichedError(errorMessage, {
                tags: { component: 'drive-sdk' },
                extra: { originalError: error },
            });

            setError(enrichedError);

            if (error) {
                // TODO:WIP check if the error codes are the same
                // if (error.name === RESPONSE_CODE.INVALID_LINK_TYPE) {
                //     navigateToLink(activeFolder.shareId, activeFolder.linkId, true);
                // } else if (code === RESPONSE_CODE.NOT_FOUND || code === RESPONSE_CODE.INVALID_ID) {
                //     navigateToRoot();
                // } else {
                //     handleError(error);
                // }
            }
        },
        [setError]
    );
    const load = useCallback(
        async (folderNodeUid: string, folderShareId: string, ac: AbortController) => {
            reset();
            setIsLoading(true);

            try {
                const { node, errors } = getNodeEntity(await drive.getNode(folderNodeUid));
                const error = Array.from(errors.values()).at(0);
                handleNodeError(error as Error);
                const legacyNode = await mapNodeToLegacyItem(node, activeFolder.shareId, drive);
                const isDeviceRoot = !node.parentUid && devices.has(folderNodeUid);
                const isDeviceFolder = isDeviceRoot || (legacyNode.rootUid && devices.has(legacyNode.rootUid));
                const role = await getNodeEffectiveRole(node, drive);
                const canEdit = role !== MemberRole.Viewer && !isDeviceRoot;

                setFolder({
                    ...legacyNode,
                    isRoot: !node.parentUid,
                    shareId: activeFolder.shareId,
                });
                setRole(role);
                setPermissions({
                    canEdit: canEdit,
                    canShare: role === MemberRole.Admin,
                    canCreateNode: canEdit,
                    canCreateDocs: isDocsEnabled && canEdit && !isDeviceFolder,
                    canCreateSheets: isSheetsEnabled && canEdit && !isDeviceFolder,
                    canShareNode: role === MemberRole.Admin,
                    canMove: canEdit,
                    canRename: canEdit,
                });

                for await (const maybeNode of drive.iterateFolderChildren(folderNodeUid, ac.signal)) {
                    const { node } = getNodeEntity(maybeNode);
                    if (node) {
                        const legacyItem = await mapNodeToLegacyItem(maybeNode, folderShareId, drive);
                        setItem(legacyItem);
                    }
                    if (!maybeNode.ok) {
                        /**
                         * TODO:WIP
                         * are we interested in tracking every single node erroring?
                         */
                        handleError(maybeNode.error);
                    }
                }
            } catch (e) {
                handleError(e);
                handleNodeError(e as Error);
            }
            setIsLoading(false);
        },
        [
            drive,
            handleError,
            handleNodeError,
            isDocsEnabled,
            isSheetsEnabled,
            reset,
            setFolder,
            setIsLoading,
            setItem,
            setPermissions,
            setRole,
            activeFolder.shareId,
            devices,
        ]
    );

    return {
        load,
    };
}
