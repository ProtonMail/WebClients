import { getDrive } from '@proton/drive';
import isTruthy from '@proton/utils/isTruthy';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { downloadManager } from '../../../managers/download/DownloadManager';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { usePreviewModal } from '../../../modals/preview';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { isPreviewOrFallbackAvailable } from '../../../utils/isPreviewOrFallbackAvailable';
import { useTrashActions } from '../../commonActions/useTrashActions';
import { useSearchViewStore } from '../store';

export const useSearchActions = () => {
    const [previewModal, showPreviewModal] = usePreviewModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const drive = getDrive();
    const { navigateToNodeUid } = useDriveNavigation();
    const { trashItems } = useTrashActions();

    const handlePreview = (uid: string) => {
        const { getAllSearchResultItems } = useSearchViewStore.getState();

        showPreviewModal({
            drive,
            nodeUid: uid,
            verifySignatures: false,
            previewableNodeUids: getAllSearchResultItems()
                .filter((item) => item.mediaType && isPreviewOrFallbackAvailable(item.mediaType, item.size))
                .map((item) => item.nodeUid),
            deprecatedContextShareId: '',
        });
    };

    const handleOpenDocsOrSheets = (uid: string) => {
        const { getSearchResultItem } = useSearchViewStore.getState();
        const item = getSearchResultItem(uid);
        if (!item || !item.mediaType) {
            return;
        }

        const openInDocInfo = getOpenInDocsInfo(item.mediaType);
        if (openInDocInfo) {
            void openDocsOrSheetsDocument({
                uid: item.nodeUid,
                ...openInDocInfo,
            });
            return;
        }
    };

    const handleDownload = async (uids: string[], shouldScan?: boolean) => {
        const { getSearchResultItem } = useSearchViewStore.getState();
        const items = uids.map(getSearchResultItem).filter(isTruthy);

        if (items.length === 0) {
            return;
        }

        if (shouldScan) {
            await downloadManager.downloadAndScan(uids, { skipSignatureCheck: true });
        } else {
            await downloadManager.download(uids, { skipSignatureCheck: true });
        }
    };

    const handleDetails = (uid: string) => {
        showDetailsModal({ nodeUid: uid, verifySignatures: false });
    };

    const handleRename = (uid: string) => {
        showRenameModal({ nodeUid: uid });
    };

    const handleTrash = async (uids: string[]) => {
        const { getSearchResultItem } = useSearchViewStore.getState();
        const items = uids
            .map(getSearchResultItem)
            .filter(isTruthy)
            .map((item) => ({ uid: item.nodeUid, parentUid: item.parentUid }));

        await trashItems(items);
    };

    const handleGoToParent = async (parentNodeUid: string) => {
        await navigateToNodeUid(parentNodeUid);
    };

    return {
        modals: {
            previewModal,
            detailsModal,
            renameModal,
        },
        handlePreview,
        handleDetails,
        handleRename,
        handleOpenDocsOrSheets,
        handleDownload,
        handleTrash,
        handleGoToParent,
        // TODO: Add show revision modal
        // TODO: Add move modal after converting it away from shareid,
        // TODO: Add share modal after converting it away from shareid,
    };
};
