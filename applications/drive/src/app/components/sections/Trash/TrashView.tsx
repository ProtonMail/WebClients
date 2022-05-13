import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useTrashView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import TrashToolbar from './TrashToolbar';
import Trash from './Trash';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashView(activeShareId);

    return (
        <>
            <TrashToolbar shareId={activeShareId} selectedLinks={trashView.selectionControls.selectedItems} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} trashView={trashView} />
            </PrivateMainArea>
        </>
    );
};
export default TrashView;
