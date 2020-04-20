import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';

import Page, { PageMainArea } from '../components/Page';
import TrashToolbar from '../components/Drive/Trash/TrashToolbar';
import StickyHeader from '../components/StickyHeader';
import Trash from '../components/Drive/Trash/Trash';
import { useDriveResource } from '../components/Drive/DriveResourceProvider';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import TrashContentProvider from '../components/Drive/Trash/TrashContentProvider';

const TrashContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const { setResource } = useDriveResource();
    const cache = useDriveCache();
    const [shareId, setShareId] = useState(() => match.params.shareId);

    useEffect(() => {
        setResource(undefined);

        let shareId = match.params.shareId;

        if (!shareId) {
            const meta = cache.get.defaultShareMeta();
            if (!meta) {
                throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
            }
            shareId = meta.ShareID;
        }

        setShareId(shareId);
    }, [match.params.shareId]);

    return (
        <Page title={c('Title').t`Trash`}>
            <TrashContentProvider shareId={shareId}>
                <TrashToolbar shareId={shareId} />
                <PageMainArea hasToolbar className="flex flex-column">
                    <StickyHeader>
                        <div className="pt0-5 pb0-5 pl0-25 pr0-25 strong">{c('Info').t`Trash`}</div>
                    </StickyHeader>
                    {shareId && <Trash shareId={shareId} />}
                </PageMainArea>
            </TrashContentProvider>
        </Page>
    );
};

export default TrashContainer;
