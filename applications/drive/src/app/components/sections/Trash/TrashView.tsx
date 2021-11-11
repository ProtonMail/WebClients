import { useEffect } from 'react';
import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import TrashContentProvider from './TrashContentProvider';
import TrashToolbar from './TrashToolbar';
import Trash from './Trash';
import useDrive from '../../../hooks/drive/useDrive';
import useDriveEvents from '../../../hooks/drive/useDriveEvents';

const TrashView = () => {
    useAppTitle(c('Title').t`Trash`);
    const { activeShareId, setDefaultRoot } = useActiveShare();
    const { handleDriveEvents } = useDrive();
    const driveEvents = useDriveEvents();
    useEffect(setDefaultRoot, []);

    useEffect(() => {
        /*
         * XXX: Having only one main share for now, it is acceptable to have one active subscrition
         * to default main share. Later on, when we might multiple shared sections this part
         * needs reconcideration for subsctiption target and and multiple event managers handling
         */
        void driveEvents.listenForShareEvents(activeShareId, handleDriveEvents(activeShareId));
    }, [activeShareId]);

    return (
        <TrashContentProvider shareId={activeShareId}>
            <TrashToolbar shareId={activeShareId} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Trash`}</div>
                <Trash shareId={activeShareId} />
            </PrivateMainArea>
        </TrashContentProvider>
    );
};

export default TrashView;
