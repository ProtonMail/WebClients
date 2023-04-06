import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { Portal } from '@proton/components/components/portal';
import { DriveFileRevision } from '@proton/shared/lib/interfaces/drive/file';

import { DecryptedLink, useRevisionsView } from '../../store';
import RevisionPreview from './RevisionPreview';
import { CategorizedRevisions, getCategorizedRevisions } from './getCategorizedRevisions';

export interface RevisionsProviderState {
    currentRevision: DriveFileRevision;
    categorizedRevisions: CategorizedRevisions;
    openRevisionPreview: (revision: DriveFileRevision) => void;
    closeRevisionPreview: () => void;

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
    const {
        revisions: [currentRevision, ...olderRevisions],
        ...revisionsViewUtils
    } = useRevisionsView(link);
    const [selectedRevision, setSelectedRevision] = useState<DriveFileRevision>();
    const [previewOpen, setPreviewOpen] = useState(false);
    const categorizedRevisions = useMemo(() => getCategorizedRevisions(olderRevisions), [olderRevisions]);

    const openRevisionPreview = (revision: DriveFileRevision) => {
        setPreviewOpen(true);
        setSelectedRevision(revision);
    };
    const closeRevisionPreview = () => {
        setPreviewOpen(false);
    };
    return (
        <RevisionsContext.Provider
            value={{
                ...revisionsViewUtils,
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
