import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { generateNodeUid, useDrive } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { type SortField, useSortingWithDefault } from '../../hooks/util/useSorting';
import { useDefaultShare, useDriveEventManager } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useLegacyTrashNodes } from './useLegacyTrashNodes';
import { useTrashStore } from './useTrash.store';
import { useTrashNotifications } from './useTrashNotifications';

export type SimpleTrashNode = {
    uid: string;
    name: string;
};

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

export const useTrashNodes = () => {
    const { handleError } = useSdkErrorHandler();
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { getDefaultShare } = useDefaultShare();
    const { createTrashRestoreNotification, createTrashDeleteNotification, createEmptyTrashNotificationSuccess } =
        useTrashNotifications();
    const { items: legacyNodes, isLoading: isLegacyLoading } = useLegacyTrashNodes();
    const { trashNodes, isLoading, setLoading, setNodes, removeNodes, clearAllNodes } = useTrashStore((state) => ({
        setLoading: state.setLoading,
        setNodes: state.setNodes,
        trashNodes: state.trashNodes,
        removeNodes: state.removeNodes,
        clearAllNodes: state.clearAllNodes,
        isLoading: state.isLoading,
    }));
    const { sortedList, sortParams, setSorting } = useSortingWithDefault(Object.values(trashNodes), DEFAULT_SORT);

    const populateNodesFromSDK = useCallback(
        async (abortSignal: AbortSignal) => {
            setLoading(true);
            const defaultShare = await getDefaultShare();
            let shownErrorNotification = false;
            for await (const trashNode of drive.iterateTrashedNodes(abortSignal)) {
                try {
                    const mappedNode = await mapNodeToLegacyItem(trashNode, defaultShare.shareId, drive);
                    setNodes({
                        [mappedNode.uid]: mappedNode,
                    });
                } catch (e) {
                    handleError(e, { showNotification: !shownErrorNotification });
                    shownErrorNotification = true;
                }
            }
            setLoading(false);
        },
        // getDefaultShare will cause infinite rerenders
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [drive, handleError, setLoading, setNodes]
    );

    /**
     * TODO:SDK
     * @todo this is only needed while the sdk doesn't return photos
     */
    const populateNodesFromLegacy = useCallback(async () => {
        setLoading(true);
        const missingNodes = legacyNodes.reduce((acc, node) => {
            const uid = generateNodeUid(node.volumeId, node.linkId);
            return {
                ...acc,
                [uid]: {
                    ...node,
                    uid: generateNodeUid(node.volumeId, node.linkId),
                    id: uid,
                    isLegacy: true,
                    thumbnailId: node.activeRevision?.id || uid,
                },
            };
        }, {});

        setNodes(missingNodes);
        setLoading(false);
    }, [legacyNodes, setLoading, setNodes]);

    const restoreNodes = async (selectedNodes: { uid: string; name: string }[]) => {
        setLoading(true);
        const uids = selectedNodes.map((t) => t.uid);
        const itemMap = new Map(selectedNodes.map((t) => [t.uid, t]));
        const allNodes = selectedNodes.map(({ uid }) => trashNodes[uid]);

        const restored = await Array.fromAsync(drive.restoreNodes(uids)).catch((e) => {
            handleError(e);
        });

        const successIds = restored?.filter((t) => t.ok).map((t) => t.uid) ?? [];
        const successItems = successIds.map((uid) => itemMap.get(uid)).filter(isTruthy);
        const failureItems = restored?.filter((t) => !t.ok) ?? [];
        const undoRestore = async () => {
            await Array.fromAsync(drive.trashNodes(successIds));
            allNodes.forEach((mappedNode) =>
                setNodes({
                    ...trashNodes,
                    [mappedNode.uid]: mappedNode,
                })
            );
        };
        createTrashRestoreNotification(successItems, failureItems, undoRestore);

        /**
         * TODO:SDK
         * @todo remove once folders are ported to sdk
         */
        void events.pollEvents.volumes(allNodes[0].volumeId);

        removeNodes(successIds);
        setLoading(false);
    };

    const deleteNodes = async (selectedNodes: { uid: string; name: string }[]) => {
        const uids = selectedNodes.map((t) => t.uid);
        const itemMap = new Map(selectedNodes.map((t) => [t.uid, t]));

        const deleted = await Array.fromAsync(drive.deleteNodes(uids)).catch((e) => {
            handleError(e);
        });

        const successIds = deleted?.filter((t) => t.ok).map((t) => t.uid) ?? [];
        const successItems = successIds.map((uid) => itemMap.get(uid)) as [];
        const failureItems = deleted?.filter((t) => !t.ok) ?? [];
        removeNodes(successIds);
        createTrashDeleteNotification(successItems, failureItems);
    };

    const emptyTrash = async () => {
        try {
            await drive.emptyTrash();
            clearAllNodes();
            createEmptyTrashNotificationSuccess();
        } catch (e) {
            handleError(e, { fallbackMessage: c('Notification').t`Trash failed to be emptied` });
        }
    };

    useEffect(() => {
        void populateNodesFromLegacy().catch(handleError);
    }, [populateNodesFromLegacy, handleError]);

    useEffect(() => {
        const abortController = new AbortController();
        void populateNodesFromSDK(abortController.signal).catch(handleError);
        return () => {
            abortController.abort();
        };
    }, [populateNodesFromSDK, handleError]);

    return {
        trashNodes: sortedList,
        isLoading: isLoading || isLegacyLoading,
        restoreNodes,
        deleteNodes,
        sortParams,
        setSorting,
        emptyTrash,
    };
};
