import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../../components/FileBrowser';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { TrashToolbar } from '../menus/TrashToolbar';
import { EmptyTrashBar } from '../statelessComponents/EmptyTrashBar';
import { useJointTrashNodes } from '../useJointTrashNodes';
import { useTrashActions } from '../useTrashActions';
import { useTrashNodes } from '../useTrashNodes';
import { Trash } from './Trash';

export const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, [setDefaultRoot]);

    const { loadTrashNodes, loadTrashPhotoNodes } = useTrashNodes();
    const jointView = useJointTrashNodes();

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
        <FileBrowserStateProvider
            itemIds={jointView.trashNodes.map((item) => generateNodeUid(item.volumeId, item.linkId))}
        >
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Trash`}</span>}
                toolbar={
                    <TrashToolbar trashNodes={jointView.trashNodes} onRestore={handleRestore} onDelete={handleDelete} />
                }
            />
            <EmptyTrashBar
                className="border-bottom border-weak"
                disabled={jointView.trashNodes.length === 0}
                onEmptyTrash={handleEmptyTrash}
            />

            <Trash
                shareId={activeShareId}
                trashView={jointView}
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
        </FileBrowserStateProvider>
    );
};
