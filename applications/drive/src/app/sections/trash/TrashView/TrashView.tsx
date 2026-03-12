import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { TrashToolbar } from '../menus/TrashToolbar';
import { EmptyTrashBar } from '../statelessComponents/EmptyTrashBar';
import { useTrashStore } from '../useTrash.store';
import { useTrashActions } from '../useTrashActions';
import { useTrashNodes } from '../useTrashNodes';
import { Trash } from './Trash';

export const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, [setDefaultRoot]);

    const { loadTrashNodes, loadTrashPhotoNodes } = useTrashNodes();
    const hasItems = useTrashStore((state) => state.items.size > 0);

    const {
        modals,
        handleRestore,
        handleDelete,
        handleEmptyTrash,
        handlePreview,
        handleShowDetails,
        handleShowFilesDetails,
    } = useTrashActions();

    useEffect(() => {
        const abortController = new AbortController();
        void loadTrashNodes(abortController.signal);
        void loadTrashPhotoNodes(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadTrashNodes, loadTrashPhotoNodes]);

    return (
        <>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Trash`}</span>}
                toolbar={
                    <TrashToolbar
                        onRestore={handleRestore}
                        onDelete={handleDelete}
                        onPreview={handlePreview}
                        showDetailsModal={handleShowDetails}
                        showFilesDetailsModal={handleShowFilesDetails}
                    />
                }
            />
            <EmptyTrashBar className="border-bottom border-weak" disabled={!hasItems} onEmptyTrash={handleEmptyTrash} />

            <Trash
                onPreview={handlePreview}
                handleShowDetails={handleShowDetails}
                handleShowFilesDetails={handleShowFilesDetails}
                onRestore={handleRestore}
                onDelete={handleDelete}
            />

            {modals.confirmModal}
            {modals.detailsModal}
            {modals.filesDetailsModal}
            {modals.previewModal}
        </>
    );
};
