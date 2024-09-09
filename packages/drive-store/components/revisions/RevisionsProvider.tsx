import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useRef, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { dateLocale } from '@proton/shared/lib/i18n';
import { FileRevisionState } from '@proton/shared/lib/interfaces/drive/file';
import clsx from '@proton/utils/clsx';

import type { DecryptedLink, DriveFileRevision } from '../../store';
import { useDownload, useRevisionsView } from '../../store';
import PortalPreview from '../PortalPreview';
import { useRevisionDetailsModal } from '../modals/DetailsModal';
import type { CategorizedRevisions } from './getCategorizedRevisions';
import { getCategorizedRevisions } from './getCategorizedRevisions';

import './RevisionPreview.scss';

export interface RevisionsProviderState {
    hasPreviewAvailable: boolean;
    isLoading: boolean;
    permissions: SHARE_MEMBER_PERMISSIONS;
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
    const ref = useRef(null);

    const {
        isLoading,
        revisions: [currentRevision, ...olderRevisions],
        permissions,
        deleteRevision,
        restoreRevision,
    } = useRevisionsView(link.rootShareId, link.linkId);
    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [revisionDetailsModal, showRevisionDetailsModal] = useRevisionDetailsModal();
    const hasPreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);
    const [selectedRevision, setSelectedRevision] = useState<DriveFileRevision | null>(null);
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
        }).format(fromUnixTime(revision.createTime));
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
                deleteRevision(abortSignal, revision.id).then(() => {
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
        }).format(fromUnixTime(revision.createTime));
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
                restoreRevision(abortSignal, revision.id).then((Code) => {
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
        setSelectedRevision(revision);
    };

    return (
        <RevisionsContext.Provider
            value={{
                hasPreviewAvailable,
                isLoading,
                permissions,
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
            {selectedRevision && (
                <PortalPreview
                    key="portal-preview-revisions"
                    open={!!selectedRevision}
                    ref={ref}
                    revisionId={selectedRevision.id}
                    shareId={link.rootShareId}
                    linkId={link.linkId}
                    date={selectedRevision.createTime}
                    className={clsx(
                        'revision-preview',
                        (confirmModal?.props.open || revisionDetailsModal?.props.open) && 'revision-preview--behind'
                    )}
                    onDetails={() => openRevisionDetails(selectedRevision)}
                    onRestore={
                        selectedRevision.state !== FileRevisionState.Active
                            ? () => {
                                  handleRevisionRestore(new AbortController().signal, selectedRevision);
                              }
                            : undefined
                    }
                    onClose={() => setSelectedRevision(null)}
                    onExit={() => setSelectedRevision(null)}
                />
            )}

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
