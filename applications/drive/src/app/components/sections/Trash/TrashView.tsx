import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useTrashView } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { mapDecryptedLinksToChildren } from '../helpers';
import TrashToolbar from './TrashToolbar';
import Trash from './Trash';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const trashView = useTrashView(activeShareId);
    const selectedItems = mapDecryptedLinksToChildren(trashView.selectionControls.selectedItems);

    return (
        <>
            <TrashToolbar shareId={activeShareId} selectedItems={selectedItems} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} trashView={trashView} />
            </PrivateMainArea>
        </>
    );
};
export default TrashView;
