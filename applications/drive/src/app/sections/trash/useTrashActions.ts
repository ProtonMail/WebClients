import { c } from 'ttag';

import type { ProtonDriveClient, ProtonDrivePhotosClient } from '@proton/drive/index';
import { NodeType, useDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import isTruthy from '@proton/utils/isTruthy';

import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useTrashStore } from './useTrash.store';
import { useTrashNotifications } from './useTrashNotifications';

type SelectedNode = {
    uid: string;
    name: string;
    type: NodeType;
    parentUid?: string;
};

export const useTrashActions = () => {
    const {
        drive,
        internal: { photos },
    } = useDrive();
    const {
        createTrashRestoreNotification,
        createTrashDeleteNotification,
        createEmptyTrashNotificationSuccess,
        createDeleteConfirmModal,
        createEmptyTrashConfirmModal,
        confirmModal,
    } = useTrashNotifications();

    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    const undoFactory = ({
        successDriveUids,
        successPhotoUids,
    }: {
        successDriveUids: string[];
        successPhotoUids: string[];
    }) => {
        return async () => {
            void getBusDriver().emit({
                type: BusDriverEventName.TRASHED_NODES,
                uids: [...successDriveUids, ...successPhotoUids],
            });
            if (successDriveUids.length) {
                await Array.fromAsync(drive.trashNodes(successDriveUids));
            }
            if (successPhotoUids.length && photos) {
                await Array.fromAsync(photos.trashNodes(successPhotoUids));
            }
        };
    };

    const handleRestore = async (selectedNodes: SelectedNode[]) => {
        const { setLoading } = useTrashStore.getState();
        const nodesMap = new Map(selectedNodes.map((item) => [item.uid, item]));
        const driveUids = selectedNodes.filter((node) => node.type !== NodeType.Photo).map((n) => n.uid);
        const photoUids = selectedNodes.filter((node) => node.type === NodeType.Photo).map((n) => n.uid);

        const successDriveUids: string[] = [];
        const successPhotoUids: string[] = [];
        const failureItems: { uid: string; error: string }[] = [];

        try {
            setLoading('restore', true);
            for await (const result of drive.restoreNodes(driveUids)) {
                if (result.ok) {
                    successDriveUids.push(result.uid);
                } else {
                    failureItems.push({ uid: result.uid, error: result.error });
                }
            }
            for await (const result of photos.restoreNodes(photoUids)) {
                if (result.ok) {
                    successPhotoUids.push(result.uid);
                } else {
                    failureItems.push({ uid: result.uid, error: result.error });
                }
            }
        } catch (e) {
            handleSdkError(e);
        } finally {
            setLoading('restore', false);
        }

        const successItems = [...successDriveUids, ...successPhotoUids]
            .map((uid) => nodesMap.get(uid))
            .filter(isTruthy);

        // Cannot do optimistic updates in this case because it's common for the restore to fail
        // The most common failure is the parent folder being deleted
        // Additionally the optimistic update breaks e2e which expect a straight failure
        void getBusDriver().emit({
            type: BusDriverEventName.RESTORED_NODES,
            items: successItems.map((t) => ({ ...t, parentUid: t.parentUid || undefined })),
        });

        const undoRestore = undoFactory({ successDriveUids, successPhotoUids });
        createTrashRestoreNotification(successItems, failureItems, undoRestore);
    };

    const deletePermanently = async (uids: string[], sdk: ProtonDriveClient | ProtonDrivePhotosClient) => {
        if (!uids.length) {
            return [];
        }
        return (await Array.fromAsync(sdk.deleteNodes(uids)).catch(handleSdkError)) ?? [];
    };

    const deleteNodes = async (selectedNodes: SelectedNode[]) => {
        const nodesMap = new Map(selectedNodes.map((item) => [item.uid, item]));
        const driveUids = selectedNodes.filter((node) => node.type !== NodeType.Photo).map((n) => n.uid);
        const photoUids = selectedNodes.filter((node) => node.type === NodeType.Photo).map((n) => n.uid);
        void getBusDriver().emit({ type: BusDriverEventName.DELETED_NODES, uids: [...driveUids, ...photoUids] });

        const filesDeleted = await deletePermanently(driveUids, drive);
        const photoDeleted = await deletePermanently(photoUids, photos);

        const deleted = [...filesDeleted, ...photoDeleted];
        const successUids = deleted.filter((t) => t.ok).map((t) => t.uid);
        const successItems = successUids.map((uid) => nodesMap.get(uid)).filter(isTruthy);
        const failureItems = deleted.filter((t) => !t.ok);

        createTrashDeleteNotification(successItems, failureItems);
    };

    const handleDelete = (selectedNodes: SelectedNode[]) => {
        createDeleteConfirmModal(selectedNodes, () => deleteNodes(selectedNodes));
    };

    const handleEmptyTrash = () => {
        createEmptyTrashConfirmModal(async () => {
            try {
                const allItems = useTrashStore.getState().items;

                await Promise.all([drive.emptyTrash(), photos.emptyTrash()]);

                void getBusDriver().emit({
                    type: BusDriverEventName.DELETED_NODES,
                    uids: Array.from(allItems.keys()),
                });
                createEmptyTrashNotificationSuccess();
            } catch (e) {
                handleSdkError(e, { fallbackMessage: c('Notification').t`Trash failed to be emptied` });
            }
        });
    };

    const handlePreview = (props: Parameters<typeof showPreviewModal>[0]) => {
        showPreviewModal(props);
    };

    return {
        modals: {
            confirmModal,
            detailsModal,
            filesDetailsModal,
            previewModal,
        },
        handleRestore,
        handleDelete,
        handleEmptyTrash,
        handlePreview,
        handleShowDetails: showDetailsModal,
        handleShowFilesDetails: showFilesDetailsModal,
    };
};
