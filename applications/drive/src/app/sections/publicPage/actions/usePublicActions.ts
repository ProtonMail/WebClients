import { c, msgid } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { NodeType, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { type OpenInDocsType, isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { downloadManager } from '../../../managers/download/DownloadManager';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { type AbuseReportPrefill, useReportAbuseModal } from '../../../modals/ReportAbuseModal';
import { useDrivePublicPreviewModal } from '../../../modals/preview';
import {
    downloadPublicDocument,
    getOpenInDocsInfo,
    openPublicDocsOrSheetsDocument,
} from '../../../utils/docs/openInDocs';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { isPreviewOrFallbackAvailable } from '../../../utils/isPreviewOrFallbackAvailable';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getPublicLinkClient } from '../publicLinkClient';
import { usePublicAuthStore } from '../usePublicAuth.store';
import { usePublicFolderStore } from '../usePublicFolder.store';
import { usePublicPageNotifications } from '../usePublicPageNotifications';
import { getPublicTokenAndPassword } from '../utils/getPublicTokenAndPassword';

export const usePublicActions = () => {
    const [previewModal, showPreviewModal] = useDrivePublicPreviewModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { createDeleteNotification } = usePublicPageNotifications();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const handlePreview = (uid: string) => {
        const { getAllFolderItems } = usePublicFolderStore.getState();
        const isLoggedIn = usePublicAuthStore.getState().isLoggedIn;

        showPreviewModal({
            drive: getPublicLinkClient(),
            nodeUid: uid,
            verifySignatures: isLoggedIn,
            previewableNodeUids: getAllFolderItems()
                .filter((item) => item.mediaType && isPreviewOrFallbackAvailable(item.mediaType, item.size))
                .map((item) => item.uid),
            deprecatedContextShareId: '',
        });
    };

    const handleOpenDocsOrSheets = (uid: string, openInDocs: OpenInDocsType, customPassword: string | undefined) => {
        const { token, urlPassword } = getPublicTokenAndPassword(window.location.pathname);
        void openPublicDocsOrSheetsDocument({
            uid,
            type: openInDocs.type,
            isNative: openInDocs.isNative,
            openBehavior: 'tab',
            token,
            urlPassword,
            customPassword,
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
        const isLoggedIn = usePublicAuthStore.getState().isLoggedIn;
        showDetailsModal({
            drive: getPublicLinkClient(),
            volumeId,
            linkId: nodeId,
            verifySignatures: isLoggedIn,
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

                    void getBusDriver().emit({
                        type: BusDriverEventName.DELETED_NODES,
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

    const handleCreateDocsOrSheets = async (
        uid: string,
        documentType: OpenInDocsType['type'],
        customPassword: string | undefined
    ) => {
        try {
            const date = getPlatformFriendlyDateForFileName();
            // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
            const docName = c('Title').t`Untitled document ${date}`;
            // translator: Default title for a new Proton Spreadsheet (example: Untitled spreadsheet 2024-04-23)
            const sheetName = c('Title').t`Untitled spreadsheet ${date}`;
            const name = documentType === 'spreadsheet' ? sheetName : docName;
            const maybeNode = await getPublicLinkClient().experimental.createDocument(
                uid,
                name,
                documentType === 'document' ? 1 : 2
            );
            const { node } = getNodeEntity(maybeNode);
            await getBusDriver().emit({
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: node.uid, parentUid: node.parentUid }],
            });
            handleOpenDocsOrSheets(node.uid, { isNative: true, type: documentType }, customPassword);
        } catch (e) {
            handleError(e);
        }
    };

    const handleReportAbuse = (nodeUid: string, customPassword: string = '', prefilled?: AbuseReportPrefill) => {
        const { urlPassword } = getPublicTokenAndPassword(window.location.pathname);
        showReportAbuseModal({
            publicLinkPassword: urlPassword + customPassword,
            publicLinkUrl: window.location.href,
            nodeUid,
            drive: getPublicLinkClient(),
            prefilled,
        });
    };

    return {
        modals: {
            previewModal,
            detailsModal,
            renameModal,
            createFolderModal,
            confirmModal,
            reportAbuseModal,
        },
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleDelete,
        handleOpenDocsOrSheets,
        handleCopyLink,
        handleCreateFolder,
        handleCreateDocsOrSheets,
        handleReportAbuse,
    };
};
