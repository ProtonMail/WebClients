import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import TrashContentProvider from './TrashContentProvider';
import TrashToolbar from './TrashToolbar';
import Trash from './Trash';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    return (
        <TrashContentProvider shareId={activeShareId}>
            <TrashToolbar shareId={activeShareId} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} />
            </PrivateMainArea>
        </TrashContentProvider>
    );
};

export default TrashView;
