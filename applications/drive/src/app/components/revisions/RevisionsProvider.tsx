import { PropsWithChildren, cloneElement, createContext, useContext, useMemo } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { dateLocale } from '@proton/shared/lib/i18n';
import { DriveFileRevision, FileRevisionState } from '@proton/shared/lib/interfaces/drive/file';
import clsx from '@proton/utils/clsx';

import { DecryptedLink, useDownload, useRevisionsView } from '../../store';
import { usePortalPreview } from '../PortalPreview/PortalPreview';
import { useRevisionDetailsModal } from '../modals/DetailsModal';
import { CategorizedRevisions, getCategorizedRevisions } from './getCategorizedRevisions';

import './RevisionPreview.scss';

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
    const [portalPreview, showPortalPreview] = usePortalPreview();
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
                deleteRevision(abortSignal, revision.ID).then(() => {
                    createNotification({
                        text: c('Info').t`Version is deleted`,
                    });
                }),
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
                restoreRevision(abortSignal, revision.ID).then((Code) => {
                    if (Code === 1000) {
                        createNotification({
                            text: c('Info').t`Version is restored`,
                        });
                    } else {
                        createNotification({
                            text: c('Info').t`Restore is in progress. This can take a few seconds.`,
                        });
                    }
                }),
        });
    };

    const openRevisionPreview = (revision: DriveFileRevision) => {
        void showPortalPreview({
            revisionId: revision.ID,
            shareId: link.rootShareId,
            linkId: link.linkId,
            date: revision.CreateTime,
            className: 'revision-preview',
            onDetails: () => openRevisionDetails(revision),
            onRestore: () =>
                revision.State !== FileRevisionState.Active
                    ? () => handleRevisionRestore(new AbortController().signal, revision)
                    : undefined,
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
            {/* We need to update portal preview props after it was opened to have the backdrop working*/}
            {portalPreview && (confirmModal?.props.open || revisionDetailsModal?.props.open)
                ? cloneElement(portalPreview, {
                      className: clsx(portalPreview.props.className, 'revision-preview--behind'),
                  })
                : portalPreview}
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
