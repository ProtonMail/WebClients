import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
import isTruthy from '@proton/utils/isTruthy';

import { downloadManager } from '../../../managers/download/DownloadManager';
import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useRenameModal } from '../../../modals/RenameModal';
import type { usePreviewModal } from '../../../modals/preview';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { getPublicLinkClient } from '../publicLinkClient';
import { usePublicFolderStore } from '../usePublicFolder.store';
import { usePublicPageNotifications } from '../usePublicPageNotifications';

interface UsePublicActionsProps {
    showPreviewModal: ReturnType<typeof usePreviewModal>[1];
    showDetailsModal: ReturnType<typeof useDetailsModal>[1];
    showRenameModal?: ReturnType<typeof useRenameModal>[1];
    showConfirmModal?: ReturnType<typeof useConfirmActionModal>[1];
}

export const usePublicActions = ({
    showPreviewModal,
    showDetailsModal,
    showRenameModal,
    showConfirmModal,
}: UsePublicActionsProps) => {
    const { createDeleteNotification } = usePublicPageNotifications();

    const handlePreview = (uid: string) => {
        const { getFolderItem, getItemUids } = usePublicFolderStore.getState();
        const item = getFolderItem(uid);

        if (!item) {
            return;
        }
        showPreviewModal({
            drive: getPublicLinkClient(),
            nodeUid: item.uid,
            verifySignatures: false,
            previewableNodeUids: getItemUids(),
            deprecatedContextShareId: '',
        });
    };

    const handleDownload = (uids: string[]) => {
        void downloadManager.download(uids);
    };

    const handleDetails = (uid: string) => {
        const { getFolderItem } = usePublicFolderStore.getState();
        const item = getFolderItem(uid);

        if (!item) {
            return;
        }

        const { volumeId, nodeId } = splitNodeUid(uid);
        showDetailsModal({
            drive: getPublicLinkClient(),
            volumeId,
            linkId: nodeId,
            verifySignatures: false,
            shareId: '',
        });
    };

    const handleRename = (uid: string) => {
        if (!showRenameModal) {
            return;
        }

        const { getFolderItem } = usePublicFolderStore.getState();
        const item = getFolderItem(uid);

        if (!item) {
            return;
        }
        showRenameModal({
            nodeUid: uid,
            drive: getPublicLinkClient(),
        });
    };

    const handleDelete = (uids: string[]) => {
        if (!showConfirmModal) {
            return;
        }

        const items = uids.map((uid) => usePublicFolderStore.getState().getFolderItem(uid)).filter(isTruthy);

        if (items.length === 0) {
            return;
        }

        const isSingleItem = items.length === 1;
        const singleItem = items.at(0);
        let title;
        let message;
        if (isSingleItem && singleItem) {
            const name = singleItem.name;
            title = c('Title').t`Delete ${name}?`;
            message =
                singleItem.type === NodeType.File || singleItem.type === NodeType.Photo
                    ? c('Info').t`This will permanently delete the file you uploaded.`
                    : c('Info').t`This will permanently delete the folder you uploaded.`;
        } else {
            const total = items.length;
            title = c('Title').ngettext(msgid`Delete ${total} item?`, `Delete ${total} items?`, total);
            message = c('Info').t`This will permanently delete the selected items you uploaded.`;
        }

        void showConfirmModal({
            title,
            submitText: c('Title').t`Delete`,
            message,
            onSubmit: () =>
                Array.fromAsync(getPublicLinkClient().deleteNodes(items.map(({ uid }) => uid))).then(
                    async (deleted) => {
                        const successItems: { name: string; uid: string }[] = [];
                        const failureItems: { uid: string; error: string }[] = [];

                        deleted.forEach((result) => {
                            const item = items.find((i) => i.uid === result.uid);
                            if (result.ok && item) {
                                successItems.push({ name: item.name, uid: result.uid });
                            } else if (!result.ok && item) {
                                failureItems.push({
                                    uid: result.uid,
                                    error: result.error || c('Error').t`Unknown error`,
                                });
                            }
                        });

                        createDeleteNotification(successItems, failureItems);

                        await getActionEventManager().emit({
                            type: ActionEventName.DELETED_NODES,
                            uids: successItems.map((item) => item.uid),
                        });
                    }
                ),
        });
    };

    return {
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleDelete,
    };
};
