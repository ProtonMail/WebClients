import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { c } from 'ttag';

import { useLoading, useSortedList } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

import Page, { PageMainArea } from '../components/Page';
import { mapLinksToChildren } from '../components/Drive/DriveContentProvider';
import TrashToolbar from '../components/Drive/Trash/TrashToolbar';
import StickyHeader from '../components/StickyHeader';
import Trash from '../components/Drive/Trash/Trash';
import { useDriveResource } from '../components/Drive/DriveResourceProvider';
import useFileBrowser from '../components/FileBrowser/useFileBrowser';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useTrash from '../hooks/useTrash';
import useDrive from '../hooks/useDrive';
import { FOLDER_PAGE_SIZE } from '../constants';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import { LinkMeta } from '../interfaces/link';

const TrashContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const { getLinkMeta } = useDrive();
    const { setResource } = useDriveResource();
    const cache = useDriveCache();
    const { fetchTrash } = useTrash();
    const [shareId, setShareId] = useState(() => match.params.shareId);
    const trashLinks = shareId ? cache.get.trashMetas(shareId) : [];
    const [contents, setContents] = useState<FileBrowserItem[]>([]);
    const { sortedList } = useSortedList(contents, { key: 'Modified', direction: SORT_DIRECTION.ASC });
    const fileBrowserControls = useFileBrowser(sortedList);
    const [loading, withLoading] = useLoading();
    const [, setError] = useState();

    // TODO: Investigate cache, why trashLinks mutates a lot to array with same values.
    useEffect(() => {
        const getLocationItems = async (shareId: string, linkId: string): Promise<string[]> => {
            const { ParentLinkID, Name } = await getLinkMeta(shareId, linkId);
            if (!ParentLinkID) {
                return [c('Title').t`My files`];
            }

            const previous = await getLocationItems(shareId, ParentLinkID);
            return [...previous, Name];
        };

        const handleLocations = (shareId: string, links: LinkMeta[]) => {
            // Todo: Consider dependin on contents, after fixing strange trashLinks mutations.
            const contents = mapLinksToChildren(links);
            const promiseList = contents.map((link: FileBrowserItem) =>
                getLocationItems(shareId, link.ParentLinkID).then((items: string[]) => {
                    const Location = `\\${items.join('\\')}`;
                    return { ...link, Location };
                })
            );
            Promise.all(promiseList).then(setContents);
        };

        let canceled = false;

        if (shareId && !canceled) {
            handleLocations(shareId, trashLinks);
        }

        return () => {
            canceled = true;
        };
    }, [trashLinks.length]);

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

        const loadedItems = cache.get.trashChildLinks(shareId);

        // TODO: request more than one page of links with pagination and infinite scroll
        if (!loadedItems.length) {
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
        <Page title={c('Title').t`Trash`}>
            <TrashToolbar shareId={shareId} fileBrowserControls={fileBrowserControls} />
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
        </Page>
    );
};

export default TrashContainer;
