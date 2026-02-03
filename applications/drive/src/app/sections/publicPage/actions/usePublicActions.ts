import { c, msgid } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { type OpenInDocsType, isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { downloadManager } from '../../../managers/download/DownloadManager';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { usePreviewModal } from '../../../modals/preview';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import {
    downloadPublicDocument,
    getOpenInDocsInfo,
    openPublicDocsOrSheetsDocument,
} from '../../../utils/docs/openInDocs';
import { isPreviewOrFallbackAvailable } from '../../../utils/isPreviewOrFallbackAvailable';
import { getPublicLinkClient } from '../publicLinkClient';
import { usePublicFolderStore } from '../usePublicFolder.store';
import { usePublicPageNotifications } from '../usePublicPageNotifications';
import { getPublicTokenAndPassword } from '../utils/getPublicTokenAndPassword';

export const usePublicActions = () => {
    const [previewModal, showPreviewModal] = usePreviewModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { createDeleteNotification } = usePublicPageNotifications();
    const { createNotification } = useNotifications();

    const handlePreview = (uid: string) => {
        const { getAllFolderItems } = usePublicFolderStore.getState();

        showPreviewModal({
            drive: getPublicLinkClient(),
            nodeUid: uid,
            verifySignatures: false,
            previewableNodeUids: getAllFolderItems()
                .filter((item) => item.mediaType && isPreviewOrFallbackAvailable(item.mediaType, item.size))
                .map((item) => item.uid),
            deprecatedContextShareId: '',
        });
    };

    const handleOpenDocsOrSheets = (uid: string, openInDocs: OpenInDocsType) => {
        const { token, urlPassword } = getPublicTokenAndPassword(window.location.pathname);

        void openPublicDocsOrSheetsDocument({
            uid,
            type: openInDocs.type,
            isNative: openInDocs.isNative,
            openBehavior: 'tab',
            token,
            urlPassword,
        });
    };

    const handleDownload = async (uids: string[], shouldScan?: boolean) => {
        const { getFolderItem } = usePublicFolderStore.getState();
        const items = uids.map(getFolderItem).filter(isTruthy);

        if (items.length === 0) {
            return;
        }

        const isSingleItem = items.length === 1;
        const singleItem = items.at(0);

        if (isSingleItem && singleItem?.mediaType && isNativeProtonDocsAppFile(singleItem.mediaType)) {
            const { token, urlPassword } = getPublicTokenAndPassword(window.location.pathname);
            const openInDocsInfo = getOpenInDocsInfo(singleItem.mediaType);
            if (openInDocsInfo) {
                await downloadPublicDocument({ uid: singleItem.uid, type: openInDocsInfo.type, token, urlPassword });
            }
        }
        if (shouldScan) {
            await downloadManager.downloadAndScan(uids, { skipSignatureCheck: true });
        } else {
            await downloadManager.download(uids, { skipSignatureCheck: true });
        }
    };

    const handleDetails = (uid: string) => {
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
        showRenameModal({
            nodeUid: uid,
            drive: getPublicLinkClient(),
        });
    };

    const handleDelete = (uids: string[]) => {
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
                Array.fromAsync(getPublicLinkClient().deleteNodes(items.map(({ uid }) => uid))).then((deleted) => {
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

                    void getActionEventManager().emit({
                        type: ActionEventName.DELETED_NODES,
                        uids: successItems.map((item) => item.uid),
                    });
                }),
        });
    };

    const handleCopyLink = () => {
        textToClipboard(window.location.href);
        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    };

    const handleCreateFolder = (parentUid: string) => {
        return showCreateFolderModal({
            drive: getPublicLinkClient(),
            parentFolderUid: parentUid,
        });
    };

    return {
        modals: {
            previewModal,
            detailsModal,
            renameModal,
            createFolderModal,
            confirmModal,
        },
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleDelete,
        handleOpenDocsOrSheets,
        handleCopyLink,
        handleCreateFolder,
    };
};
