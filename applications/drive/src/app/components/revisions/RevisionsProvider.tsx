import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useConfirmActionModal, useNotifications } from '@proton/components';
import type { Revision } from '@proton/drive';
import { RevisionState, generateNodeUid, splitNodeRevisionUid, useDrive } from '@proton/drive';
import { useLoading } from '@proton/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { useDownload } from '../../store';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
import PortalPreview from '../PortalPreview';
import { useRevisionDetailsModal } from '../modals/DetailsModal';
import type { CategorizedRevisions } from './getCategorizedRevisions';
import { getCategorizedRevisions } from './getCategorizedRevisions';

import './RevisionPreview.scss';

export type RevisionItem = {
    mimeType: string;
    size: number;
    volumeId: string;
    linkId: string;
    rootShareId: string;
    name: string;
    isFile: boolean;
};

export interface RevisionsProviderState {
    hasPreviewAvailable: boolean;
    isLoading: boolean;
    permissions: SHARE_MEMBER_PERMISSIONS;
    currentRevision?: Revision;
    categorizedRevisions: CategorizedRevisions;
    openRevisionPreview: (revision: Revision) => void;
    openRevisionDetails: (revision: Revision) => void;
    deleteRevision: (revision: Revision) => void;
    restoreRevision: (revision: Revision) => void;
    downloadRevision: (revision: Revision) => void;
}

const RevisionsContext = createContext<RevisionsProviderState | null>(null);

export const RevisionsProvider = ({
    link,
    children,
}: PropsWithChildren<{
    link: RevisionItem;
}>) => {
    const { createNotification } = useNotifications();
    const ref = useRef(null);
    const { getSharePermissions } = useDirectSharingInfo();
    const { drive } = useDrive();

    const [isLoading, withLoading] = useLoading(true);
    const [currentRevision, setCurrentRevision] = useState<Revision | undefined>(undefined);
    const [olderRevisions, setOlderRevisions] = useState<Revision[]>([]);
    const [permissions, setPermissions] = useState<SHARE_MEMBER_PERMISSIONS>(SHARE_MEMBER_PERMISSIONS.EDITOR);

    const loadRevisions = async () => {
        const nodeUid = generateNodeUid(link.volumeId, link.linkId);
        let currentRevision;
        const olderRevisions = [];
        for await (const revision of drive.iterateRevisions(nodeUid)) {
            if (!currentRevision) {
                currentRevision = revision;
                continue;
            }
            olderRevisions.push(revision);
        }

        setCurrentRevision(currentRevision);
        setOlderRevisions(olderRevisions);
    };

    useEffect(() => {
        void withLoading(loadRevisions());
    }, [link.linkId]);

    useEffect(() => {
        void getSharePermissions(new AbortController().signal, link.rootShareId).then(setPermissions);
    }, [link.rootShareId]);

    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [revisionDetailsModal, showRevisionDetailsModal] = useRevisionDetailsModal();
    const hasPreviewAvailable = !!link.mimeType && isPreviewAvailable(link.mimeType, link.size);
    const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
    const { download } = useDownload();

    const downloadRevision = (revision: Revision) => {
        const { revisionId } = splitNodeRevisionUid(revision.uid);
        void download([{ ...link, shareId: link.rootShareId, revisionId }]);
    };

    const openRevisionDetails = (revision: Revision) => {
        void showRevisionDetailsModal({
            revision,
            shareId: link.rootShareId,
            linkId: link.linkId,
            name: link.name,
        });
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
                drive.restoreRevision(revision.uid).then(() => {
                    createNotification({
                        text: c('Info').t`Version is restored`,
                    });
                    // Revision might be restored asynchronously.
                    // Optimistically update the local state.
                    // In most cases it will be applied on the backend in few seconds.
                    // We are missing feedback from the backend when restoring fails - that will be handled later.
                    setOlderRevisions((olderRevisions) => [currentRevision!, ...olderRevisions]);
                    setCurrentRevision(revision);
                }),
        });
    };

    const openRevisionPreview = (revision: Revision) => {
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
                    revisionId={splitNodeRevisionUid(selectedRevision.uid).revisionId}
                    shareId={link.rootShareId}
                    linkId={link.linkId}
                    date={selectedRevision.creationTime}
                    className={clsx(
                        'revision-preview',
                        (confirmModal?.props.open || revisionDetailsModal?.props.open) && 'revision-preview--behind'
                    )}
                    onDetails={() => openRevisionDetails(selectedRevision)}
                    onRestore={
                        selectedRevision.state !== RevisionState.Active
                            ? () => {
                                  handleRevisionRestore(selectedRevision);
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
