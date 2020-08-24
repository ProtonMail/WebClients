import React from 'react';
import { c } from 'ttag';
import { PrivateMainArea, useAppTitle } from 'react-components';
import TrashToolbar from '../../components/Drive/Trash/TrashToolbar';
import Trash from '../../components/Drive/Trash/Trash';
import TrashContentProvider from '../../components/Drive/Trash/TrashContentProvider';

interface Props {
    shareId: string;
}

const TrashContainerView = ({ shareId }: Props) => {
    useAppTitle(c('Title').t`Trash`);

    return (
        <TrashContentProvider shareId={shareId}>
            <TrashToolbar shareId={shareId} />
            <PrivateMainArea hasToolbar className="flex-noMinChildren flex-column flex-nowrap">
                <div className="p1 strong border-bottom">{c('Info').t`Trash`}</div>
                {shareId && <Trash shareId={shareId} />}
            </PrivateMainArea>
        </TrashContentProvider>
    );
};

export default TrashContainerView;
