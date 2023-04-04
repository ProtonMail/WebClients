import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { Portal } from '@proton/components/components/portal';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { DecryptedLink, useRevisionsView } from '../../store';
import RevisionPreview from './RevisionPreview';
import { CategorizedRevisions, getCategorizedRevisions } from './getCategorizedRevisions';

export interface RevisionsProviderState {
    currentRevision: DriveFileRevision;
    categorizedRevisions: CategorizedRevisions;
    openRevisionPreview: (revision: DriveFileRevision) => void;
    closeRevisionPreview: () => void;
    deleteRevision: (abortSignal: AbortSignal, revision: DriveFileRevision) => void;

    // Utils from useRevisionsView
    isLoading: boolean;
    hasPreviewAvailable: boolean;
    downloadRevision: (revision: DriveFileRevision) => void;
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
        revisions: [currentRevision, ...olderRevisions],
        deleteRevision,
        ...revisionsViewUtils
    } = useRevisionsView(link);
    const [selectedRevision, setSelectedRevision] = useState<DriveFileRevision>();
    const [previewOpen, setPreviewOpen] = useState(false);
    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    const openRevisionPreview = (revision: DriveFileRevision) => {
        setPreviewOpen(true);
        setSelectedRevision(revision);
    };
    const closeRevisionPreview = () => {
        setPreviewOpen(false);
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
                            text: c('Info').t`Revision is deleted`,
                        });
                    })
                    .catch(() => {
                        createNotification({
                            type: 'error',
                            text: c('Notification').t`Revision failed to be deleted`,
                        });
                    }),
        });
    };
    return (
        <RevisionsContext.Provider
            value={{
                ...revisionsViewUtils,
                deleteRevision: handleRevisionDelete,
                currentRevision,
                categorizedRevisions,
                openRevisionPreview,
                closeRevisionPreview,
            }}
        >
            {children}
            {selectedRevision && previewOpen ? (
                <Portal>
                    <RevisionPreview
                        shareId={link.rootShareId}
                        linkId={link.linkId}
                        revision={selectedRevision}
                        onClose={closeRevisionPreview}
                    />
                </Portal>
            ) : null}
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
