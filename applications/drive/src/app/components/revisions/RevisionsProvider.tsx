import { PropsWithChildren, createContext, useContext, useMemo } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { DecryptedLink, useDownload, useRevisionsView } from '../../store';
import { useRevisionDetailsModal } from '../modals/DetailsModal';
import { useRevisionPreview } from './RevisionPreview';
import { CategorizedRevisions, getCategorizedRevisions } from './getCategorizedRevisions';

export interface RevisionsProviderState {
    hasPreviewAvailable: boolean;
    isLoading: boolean;
    currentRevision: DriveFileRevision;
    categorizedRevisions: CategorizedRevisions;
    openRevisionPreview: (revision: DriveFileRevision) => void;
    openRevisionDetails: (revision: DriveFileRevision) => void;
    deleteRevision: (abortSignal: AbortSignal, revision: DriveFileRevision) => void;
    restoreRevision: (abortSignal: AbortSignal, revision: DriveFileRevision) => void;
    downloadRevision: (revisionId: string) => void;
}

const RevisionsContext = createContext<RevisionsProviderState | null>(null);

export const RevisionsProvider = ({
    link,
    children,
}: PropsWithChildren<{
    link: DecryptedLink;
}>) => {
    const { createNotification } = useNotifications();

    const {
        isLoading,
        revisions: [currentRevision, ...olderRevisions],
        deleteRevision,
        restoreRevision,
    } = useRevisionsView(link.rootShareId, link.linkId);
    const [revisionPreview, showRevisionPreview] = useRevisionPreview();
    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [revisionDetailsModal, showRevisionDetailsModal] = useRevisionDetailsModal();
    const hasPreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);
    const { download } = useDownload();

    const downloadRevision = (revisionId: string) => {
        void download([{ ...link, shareId: link.rootShareId, revisionId: revisionId }]);
    };

    const openRevisionDetails = (revision: DriveFileRevision) => {
        void showRevisionDetailsModal({
            revision,
            shareId: link.rootShareId,
            linkId: link.linkId,
            name: link.name,
        });
    };
    const openRevisionPreview = (revision: DriveFileRevision) => {
        void showRevisionPreview({
            revision,
            shareId: link.rootShareId,
            linkId: link.linkId,
        });
    };

    const handleRevisionDelete = (abortSignal: AbortSignal, revision: DriveFileRevision) => {
        const formattedRevisionDate = new Intl.DateTimeFormat(dateLocale.code, {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(fromUnixTime(revision.CreateTime));
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
                        {link.name}, {formattedRevisionDate}
                    </span>
                    &nbsp;
                    {
                        // translator: complete sentence example: Are you sure you want to permanently delete Yearly reports.docx, February 6, 2023 at 12:00 from the version history?
                        c('Info').t`from the version history?`
                    }
                </>
            ),
            onSubmit: () =>
                deleteRevision(abortSignal, revision.ID)
                    .then(() => {
                        createNotification({
                            text: c('Info').t`Version is deleted`,
                        });
                    })
        });
    };

    const handleRevisionRestore = (abortSignal: AbortSignal, revision: DriveFileRevision) => {
        const formattedRevisionDate = new Intl.DateTimeFormat(dateLocale.code, {
            dateStyle: 'long',
            timeStyle: 'short',
        }).format(fromUnixTime(revision.CreateTime));
        void showConfirmModal({
            size: 'small',
            title: c('Action').t`Restore this version`,
            submitText: c('Action').t`Restore`,
            actionType: 'norm',
            canUndo: true,
            message: (
                <>
                    <span className="text-bold">{link.name}</span>
                    &nbsp;
                    {
                        // translator: complete sentence example: Yearly reports.docx. will be restored to the version from February 6, 2023 at 12:00. All other versions will still be saved.
                        c('Info')
                            .t`will be restored to the version from ${formattedRevisionDate}. All other versions will still be saved.`
                    }
                </>
            ),
            onSubmit: () =>
                restoreRevision(abortSignal, revision.ID)
                    .then((Code) => {
                        if (Code === 1000) {
                            createNotification({
                                text: c('Info').t`Version is restored`,
                            });
                        } else {
                            createNotification({
                                text: c('Info').t`Version is queue for restore`,
                            });
                        }
                    })
        });
    };

    return (
        <RevisionsContext.Provider
            value={{
                hasPreviewAvailable,
                isLoading,
                deleteRevision: handleRevisionDelete,
                restoreRevision: handleRevisionRestore,
                currentRevision,
                categorizedRevisions,
                openRevisionPreview,
                openRevisionDetails,
                downloadRevision,
            }}
        >
            {children}
            {revisionPreview}
            {revisionDetailsModal}
            {confirmModal}
        </RevisionsContext.Provider>
    );
};

export const useRevisionsProvider = () => {
    const state = useContext(RevisionsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized RevisionsProvider');
    }
    return state;
};
