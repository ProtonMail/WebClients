import { useConfirmActionModal } from '@proton/components';
import { NodeType, getDrivePerNodeType } from '@proton/drive';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { useSharingActions } from '../../../hooks/drive/useSharingActions';
import { downloadManager } from '../../../managers/download/DownloadManager';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useRenameModal } from '../../../modals/RenameModal';
import { useDrivePreviewModal } from '../../../modals/preview';
import { openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { useSharedByMeStore } from '../useSharedByMe.store';

export const useSharedByMeActions = () => {
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { stopSharing } = useSharingActions();

    const handlePreview = (uid: string) => {
        const item = useSharedByMeStore.getState().getSharedByMeItem(uid);
        if (!item) {
            return;
        }
        showPreviewModal({
            drive: getDrivePerNodeType(item.type),
            deprecatedContextShareId: '',
            nodeUid: item.nodeUid,
        });
    };

    const handleDownload = (uids: string[]) => {
        const photosUids = [];
        const standardUids = [];
        for (const uid of uids) {
            const item = useSharedByMeStore.getState().getSharedByMeItem(uid);
            if (!item) {
                continue;
            }
            if ([NodeType.Photo, NodeType.Album].includes(item.type)) {
                photosUids.push(uid);
            } else {
                standardUids.push(uid);
            }
        }
        // TODO: We need to be able to pass client per download
        void downloadManager.download(standardUids);
        void downloadManager.downloadPhotos(photosUids);
    };

    const handleDetails = (uid: string) => {
        showDetailsModal({ nodeUid: uid });
    };

    const handleRename = (uid: string) => {
        showRenameModal({ nodeUid: uid });
    };

    const handleShare = (uid: string) => {
        const item = useSharedByMeStore.getState().getSharedByMeItem(uid);
        if (!item) {
            return;
        }
        showSharingModal({ nodeUid: uid, drive: getDrivePerNodeType(item.type) });
    };

    const handleStopSharing = (uid: string) => {
        const item = useSharedByMeStore.getState().getSharedByMeItem(uid);
        if (!item) {
            return;
        }
        stopSharing(showConfirmModal, getDrivePerNodeType(item.type), item.nodeUid, item.parentUid);
    };

    const handleOpenDocsOrSheets = (uid: string, openInDocs: OpenInDocsType) => {
        void openDocsOrSheetsDocument({
            uid,
            type: openInDocs.type,
            isNative: openInDocs.isNative,
            openBehavior: 'tab',
        });
    };

    return {
        modals: {
            previewModal,
            renameModal,
            detailsModal,
            sharingModal,
            confirmModal,
        },
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleShare,
        handleStopSharing,
        handleOpenDocsOrSheets,
    };
};
