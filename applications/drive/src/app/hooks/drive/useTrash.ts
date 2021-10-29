import { usePreventLeave } from '@proton/components';
import { chunk } from '@proton/shared/lib/helpers/array';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import {
    queryTrashLinks,
    queryRestoreLinks,
    queryEmptyTrashOfShare,
    queryDeleteTrashedLinks,
} from '@proton/shared/lib/api/drive/link';
import { LinkMeta, FolderLinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import {
    FOLDER_PAGE_SIZE,
    BATCH_REQUEST_SIZE,
    RESPONSE_CODE,
    MAX_THREADS_PER_REQUEST,
} from '@proton/shared/lib/drive/constants';
import { RestoreFromTrashResult, RestoreResponse } from '@proton/shared/lib/interfaces/drive/restore';
import { queryTrashList } from '@proton/shared/lib/api/drive/share';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import useDrive from './useDrive';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useDriveEvents from './useDriveEvents';

function useTrash() {
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const cache = useDriveCache();
    const { getLinkMeta } = useDrive();
    const driveEvents = useDriveEvents();

    const fetchTrash = async (shareId: string, Page: number, PageSize: number) => {
        const { Links, Parents } = await debouncedRequest<{
            Links: LinkMeta[];
            Parents: { [id: string]: FolderLinkMeta };
        }>(queryTrashList(shareId, { Page, PageSize }));

        const decryptedLinks = await Promise.all(
            Links.map((meta) =>
                getLinkMeta(shareId, meta.LinkID, {
                    fetchLinkMeta: async (id) => (id === meta.LinkID ? meta : Parents[id]),
                    preventRerenders: true,
                })
            )
        );

        cache.set.trashLinkMetas(decryptedLinks, shareId, Links.length < PageSize ? 'complete' : 'incremental');

        return decryptedLinks;
    };

    const fetchNextPage = async (shareId: string) => {
        const loadedItems = cache.get.trashChildLinks(shareId) || [];
        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(loadedItems.length / PageSize);

        await fetchTrash(shareId, Page, PageSize);
    };

    const trashLinks = async (shareId: string, parentLinkID: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const trashQueue = batches.map(
            (batch, i) => () =>
                debouncedRequest(queryTrashLinks(shareId, parentLinkID, batch))
                    .then(() => batch)
                    .catch((error): string[] => {
                        console.error(`Failed to trash #${i} batch of links: `, error);
                        return [];
                    })
        );

        try {
            const trashed = await preventLeave(runInQueue(trashQueue, MAX_THREADS_PER_REQUEST));
            await driveEvents.call(shareId);
            return ([] as string[]).concat(...trashed);
        } finally {
            cache.set.linksLocked(false, shareId, linkIds);
        }
    };

    const restoreLinks = async (shareId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const restoreQueue = batches.map(
            (batch, i) => () =>
                debouncedRequest<RestoreFromTrashResult>(queryRestoreLinks(shareId, batch)).catch((error) => {
                    console.error(`Failed to restore #${i} batch of links: `, error);
                    return { Responses: [] };
                })
        );
        try {
            const responses = await preventLeave(runInQueue(restoreQueue, MAX_THREADS_PER_REQUEST));
            await driveEvents.call(shareId);
            const results = responses.reduce(
                (acc, { Responses }) => acc.concat(...Responses),
                [] as {
                    Response: RestoreResponse;
                }[]
            );

            return results.reduce(
                (results, { Response }, index) => {
                    if (!Response.Error) {
                        results.restored.push(linkIds[index]);
                        return results;
                    }

                    if (Response.Code === RESPONSE_CODE.ALREADY_EXISTS) {
                        results.alreadyExisting.push(linkIds[index]);
                    } else {
                        results.otherErrors.push(Response.Error);
                    }

                    return results;
                },
                { restored: [] as string[], alreadyExisting: [] as string[], otherErrors: [] as string[] }
            );
        } finally {
            cache.set.linksLocked(false, shareId, linkIds);
        }
    };

    const deleteTrashedLinks = async (shareId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const deleteQueue = batches.map(
            (batch, i) => () =>
                debouncedRequest(queryDeleteTrashedLinks(shareId, batch))
                    .then(() => batch)
                    .catch((error): string[] => {
                        console.error(`Failed to delete #${i} batch of links: `, error);
                        return [];
                    })
        );

        const deletedBatches = await preventLeave(runInQueue(deleteQueue, MAX_THREADS_PER_REQUEST));
        await driveEvents.callAll(shareId).catch(console.error);
        return ([] as string[]).concat(...deletedBatches);
    };

    const emptyTrash = async (shareId: string) => {
        cache.set.allTrashedLocked(true, shareId);
        return debouncedRequest(queryEmptyTrashOfShare(shareId));
    };

    return {
        fetchNextPage,
        trashLinks,
        restoreLinks,
        deleteTrashedLinks,
        emptyTrash,
    };
}

export default useTrash;
