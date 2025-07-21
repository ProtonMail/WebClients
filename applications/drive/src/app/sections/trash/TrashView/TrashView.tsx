import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';

import { FileBrowserStateProvider } from '../../../components/FileBrowser';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { EmptyTrashBar } from '../menus/EmptyTrashBar';
import { TrashToolbar } from '../menus/TrashToolbar';
import { useTrashNodes } from '../useTrashNodes';
import { Trash } from './Trash';

export const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashNodes();

    return (
        <FileBrowserStateProvider
            itemIds={trashView.trashNodes.map((item) => generateNodeUid(item.volumeId, item.linkId))}
        >
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Trash`}</span>}
                toolbar={<TrashToolbar trashView={trashView} />}
            />
            <EmptyTrashBar className="border-bottom border-weak" disabled={trashView.trashNodes.length === 0} />

            <Trash shareId={activeShareId} trashView={trashView} />
        </FileBrowserStateProvider>
    );
};
