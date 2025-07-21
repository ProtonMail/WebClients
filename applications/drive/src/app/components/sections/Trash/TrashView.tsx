import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useTrashView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import EmptyTrashNotification from './EmptyTrashNotification';
import Trash from './Trash';
import TrashToolbar from './TrashToolbar';

export const TrashViewDepecated = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashView();

    return (
        <FileBrowserStateProvider itemIds={trashView.items.map(({ linkId }) => linkId)}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`Trash`}</span>}
                toolbar={<TrashToolbar items={trashView.items} />}
            />
            <EmptyTrashNotification className="border-bottom border-weak" disabled={trashView.items.length === 0} />
            <Trash shareId={activeShareId} trashView={trashView} />
        </FileBrowserStateProvider>
    );
};
