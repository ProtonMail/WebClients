import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../../components/FileBrowser';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { EmptyTrashBar } from '../menus/EmptyTrashBar';
import { TrashToolbar } from '../menus/TrashToolbar';
import { useJointTrashNodes } from '../useJointTrashNodes';
import { useTrashNodes } from '../useTrashNodes';
import { useTrashPhototsNodes } from '../useTrashPhototsNodes';
import { Trash } from './Trash';

export const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, [setDefaultRoot]);

    const trashView = useTrashNodes();
    const trashPhotosView = useTrashPhototsNodes();
    const jointView = useJointTrashNodes();

    const loadTrashNodes = trashView.loadTrashNodes;
    const loadTrashPhotosNodes = trashPhotosView.loadTrashPhotoNodes;

    useEffect(() => {
        const abortController = new AbortController();
        void loadTrashNodes(abortController.signal);
        void loadTrashPhotosNodes(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadTrashNodes, loadTrashPhotosNodes]);

    return (
        <FileBrowserStateProvider
            itemIds={jointView.trashNodes.map((item) => generateNodeUid(item.volumeId, item.linkId))}
        >
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Trash`}</span>}
                toolbar={<TrashToolbar trashView={jointView} />}
            />
            <EmptyTrashBar className="border-bottom border-weak" disabled={jointView.trashNodes.length === 0} />

            <Trash shareId={activeShareId} trashView={jointView} />
        </FileBrowserStateProvider>
    );
};
