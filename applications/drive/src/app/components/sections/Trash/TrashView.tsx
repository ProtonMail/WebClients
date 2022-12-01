import { useEffect } from 'react';

import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useTrashView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import Trash from './Trash';
import TrashToolbar from './TrashToolbar';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashView();

    return (
        <FileBrowserStateProvider itemIds={trashView.items.map(({ linkId }) => linkId)}>
            <TrashToolbar items={trashView.items} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} trashView={trashView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
};
export default TrashView;
