import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useTrashView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import TrashToolbar from './TrashToolbar';
import Trash from './Trash';
import { FileBrowserStateProvider } from '../../FileBrowser';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashView(activeShareId);

    return (
        <FileBrowserStateProvider itemIds={trashView.items.map(({ linkId }) => linkId)}>
            <TrashToolbar shareId={activeShareId} items={trashView.items} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} trashView={trashView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
};
export default TrashView;
