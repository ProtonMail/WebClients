import { PropsWithChildren, createContext, useContext } from 'react';

import { Portal } from '@proton/components/components/portal';

import RevisionPreview from '../../components/revisions/RevisionPreview';
import { DecryptedLink } from '../index';
import { RevisionsProviderState } from './interface';
import useRevisions from './useRevisions';

const RevisionsContext = createContext<RevisionsProviderState | null>(null);

export const RevisionsProvider = ({
    link,
    havePreviewAvailable,
    children,
}: PropsWithChildren<{
    link: DecryptedLink;
    havePreviewAvailable: boolean;
}>) => {
    const { openRevisionPreview, downloadRevision, selectedRevision, closeRevisionPreview, previewOpen } =
        useRevisions(link);
    return (
        <RevisionsContext.Provider value={{ openRevisionPreview, downloadRevision, havePreviewAvailable }}>
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
