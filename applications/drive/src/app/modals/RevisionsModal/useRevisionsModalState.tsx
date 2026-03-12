import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import type { NodeEntity, ProtonDriveClient, Revision } from '@proton/drive';
import { getDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { dateLocale } from '@proton/shared/lib/i18n';

import { DownloadManager } from '../../managers/download/DownloadManager';
import { sendErrorReport } from '../../utils/errorHandling';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeNameFallback } from '../../utils/sdk/getNodeName';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import { useDetailsModal } from '../DetailsModal';
import { Preview } from '../preview';
import type { CategorizedRevisions } from './revisions/getCategorizedRevisions';
import { getCategorizedRevisions } from './revisions/getCategorizedRevisions';

import './revisions/RevisionPreview.scss';

export interface RevisionsProviderState {
    hasPreviewAvailable: boolean;
    isLoading: boolean;
    isOwner: boolean;
    currentRevision?: Revision;
    categorizedRevisions: CategorizedRevisions;
    openRevisionPreview: (revision: Revision) => void;
    openRevisionDetails: (revision: Revision) => void;
    deleteRevision: (revision: Revision) => void;
    restoreRevision: (revision: Revision) => void;
    downloadRevision: (revision: Revision) => void;
}

export type UseRevisionsModalStateProps = {
    nodeUid: string;
    drive?: ProtonDriveClient;
} & ModalStateProps;

export type RevisionsModalContentViewProps = RevisionsProviderState & {
    portalPreview: ReactNode;
    confirmModal: ReactNode;
    detailsModal: ReactNode;
} & ModalStateProps;

export const useRevisionsModalState = ({
    nodeUid,
    drive = getDrive(),
    ...modalProps
}: UseRevisionsModalStateProps): RevisionsModalContentViewProps => {
    const { createNotification } = useNotifications();

    const [isLoading, withLoading] = useLoading(true);
    const [currentRevision, setCurrentRevision] = useState<Revision | undefined>(undefined);
    const [olderRevisions, setOlderRevisions] = useState<Revision[]>([]);
    const [node, setNode] = useState<NodeEntity>();
    const [isOwner, setIsOwner] = useState<boolean>(false);

    const loadRevisions = async () => {
        let currentRevision;
        const olderRevisions = [];
        const maybeNode = await drive.getNode(nodeUid);
        const { node } = getNodeEntity(maybeNode);

        setNode(node);
        for await (const revision of drive.iterateRevisions(nodeUid)) {
            if (!currentRevision) {
                currentRevision = revision;
                continue;
            }
            olderRevisions.push(revision);
        }

        setCurrentRevision(currentRevision);
        setOlderRevisions(olderRevisions);

        const rootNode = await getRootNode(node, drive);

        let isDeviceRoot = false;
        // Not sending an error, if this fails it will have failed in sidebar first
        for await (const device of drive.iterateDevices()) {
            if (device.rootFolderUid === rootNode.uid) {
                isDeviceRoot = true;
            }
        }
        const rootFolder = await drive.getMyFilesRootFolder();
        const { node: rootFolderNode } = getNodeEntity(rootFolder);
        setIsOwner(rootNode.uid === rootFolderNode.uid || isDeviceRoot);
    };

    useEffect(() => {
        try {
            void withLoading(loadRevisions());
        } catch (error) {
            createNotification({
                type: 'error',
                text: c('Error').t`We were not able to load the file history`,
            });
            sendErrorReport(error);
            modalProps.onClose();
        }
    }, [nodeUid]);

    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const hasPreviewAvailable =
        !!node?.mediaType && isPreviewAvailable(node.mediaType, node.activeRevision?.storageSize);
    const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

    const dm = DownloadManager.getInstance();
    const downloadRevision = (revision: Revision) => {
        return dm.downloadRevision(nodeUid, revision.uid);
    };

    const openRevisionDetails = (_revision: Revision) => {
        showDetailsModal({ nodeUid });
    };

    const handleRevisionDelete = (revision: Revision) => {
        const formattedRevisionDate = new Intl.DateTimeFormat(dateLocale.code, {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(revision.creationTime);
        void showConfirmModal({
            size: 'small',
            title: c('Action').t`Delete this version`,
            submitText: c('Action').t`Delete permanently`,
            message: (
                <>
                    {
                        // translator: complete sentence example: Are you sure you want to permanently delete Yearly reports.docx, February 6, 2023 at 12:00 from the version history?
                        c('Info').t`Are you sure you want to permanently delete`
                    }
                    &nbsp;
                    <span className="text-bold">
                        {node?.name || getNodeNameFallback()}, {formattedRevisionDate}
                    </span>
                    &nbsp;
                    {
                        // translator: complete sentence example: Are you sure you want to permanently delete Yearly reports.docx, February 6, 2023 at 12:00 from the version history?
                        c('Info').t`from the version history?`
                    }
                </>
            ),
            onSubmit: () =>
                drive.deleteRevision(revision.uid).then(() => {
                    createNotification({
                        text: c('Info').t`Version is deleted`,
                    });
                    setOlderRevisions((olderRevisions) =>
                        olderRevisions.filter((olderRevision) => olderRevision.uid !== revision.uid)
                    );
                }),
        });
    };

    const handleRevisionRestore = (revision: Revision) => {
        const formattedRevisionDate = new Intl.DateTimeFormat(dateLocale.code, {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(revision.creationTime);
        void showConfirmModal({
            size: 'small',
            title: c('Action').t`Restore this version`,
            submitText: c('Action').t`Restore`,
            actionType: 'norm',
            canUndo: true,
            message: (
                <>
                    <span className="text-bold">{node?.name || getNodeNameFallback()}</span>
                    &nbsp;
                    {
                        // translator: complete sentence example: Yearly reports.docx. will be restored to the version from February 6, 2023 at 12:00. All other versions will still be saved.
                        c('Info')
                            .t`will be restored to the version from ${formattedRevisionDate}. All other versions will still be saved.`
                    }
                </>
            ),
            onSubmit: () =>
                drive.restoreRevision(revision.uid).then(() => {
                    createNotification({
                        text: c('Info').t`Version is restored`,
                    });
                    // Revision might be restored asynchronously.
                    // Optimistically update the local state.
                    // In most cases it will be applied on the backend in few seconds.
                    // We are missing feedback from the backend when restoring fails - that will be handled later.
                    setOlderRevisions((olderRevisions) =>
                        currentRevision ? [currentRevision, ...olderRevisions] : olderRevisions
                    );
                    setCurrentRevision(revision);
                }),
        });
    };

    const openRevisionPreview = (revision: Revision) => {
        setSelectedRevision(revision);
    };

    const portalPreview = selectedRevision ? (
        <Portal>
            <div className="revision-preview">
                <Preview
                    nodeUid={nodeUid}
                    revisionUid={selectedRevision.uid}
                    date={selectedRevision.creationTime}
                    onClose={() => setSelectedRevision(null)}
                />
            </div>
        </Portal>
    ) : null;

    return {
        ...modalProps,
        hasPreviewAvailable,
        isLoading,
        isOwner,
        deleteRevision: handleRevisionDelete,
        restoreRevision: handleRevisionRestore,
        currentRevision,
        categorizedRevisions,
        openRevisionPreview,
        openRevisionDetails,
        downloadRevision,
        portalPreview,
        confirmModal,
        detailsModal,
    };
};
