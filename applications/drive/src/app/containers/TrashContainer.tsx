import React, { useEffect, useState } from 'react';
import Page, { PageMainArea } from '../components/Page';
import DriveContentProvider, { mapLinksToChildren } from '../components/Drive/DriveContentProvider';
import { c } from 'ttag';
import TrashToolbar from '../components/Drive/Trash/TrashToolbar';
import StickyHeader from '../components/StickyHeader';
import Trash from '../components/Drive/Trash/Trash';
import { RouteComponentProps } from 'react-router-dom';
import { useDriveResource } from '../components/Drive/DriveResourceProvider';
import useFileBrowser from '../components/FileBrowser/useFileBrowser';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useTrash from '../hooks/useTrash';
import { useLoading, useSortedList } from 'react-components';
import { FOLDER_PAGE_SIZE } from '../constants';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

const TrashContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const { setResource } = useDriveResource();
    const cache = useDriveCache();
    const { fetchTrash } = useTrash();
    const [shareId, setShareId] = useState(() => match.params.shareId);
    const trashLinks = shareId ? cache.get.shareTrashMetas(shareId) : [];
    const contents = mapLinksToChildren(trashLinks);
    const { sortedList } = useSortedList(contents, { key: 'Modified', direction: SORT_DIRECTION.ASC });
    const fileBrowserControls = useFileBrowser(sortedList);
    const [loading, withLoading] = useLoading();
    const [, setError] = useState();

    // TODO: request more than one page of links with pagination and infinite scroll
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

        const complete = cache.get.trashComplete(shareId);

        if (!complete) {
            withLoading(fetchTrash(shareId, 0, FOLDER_PAGE_SIZE)).catch((e) =>
                setError(() => {
                    throw e;
                })
            );
        }

        setShareId(shareId);
    }, [match.params.shareId]);

    const completed = !!shareId && cache.get.trashComplete(shareId);

    return (
        <Page title={c('Title').t`My files`}>
            <DriveContentProvider>
                <TrashToolbar />
                <PageMainArea hasToolbar className="flex flex-column">
                    <StickyHeader>
                        <div className="pt0-5 pb0-5 pl0-25 pr0-25 strong">{c('Info').t`Trash`}</div>
                    </StickyHeader>
                    <Trash
                        loading={loading}
                        complete={completed}
                        fileBrowserControls={fileBrowserControls}
                        contents={sortedList}
                    />
                </PageMainArea>
            </DriveContentProvider>
        </Page>
    );
};

export default TrashContainer;
