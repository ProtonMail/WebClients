import { usePreventLeave } from 'react-components';
import { chunk } from 'proton-shared/lib/helpers/array';
import { queryTrashLinks, queryRestoreLinks, queryEmptyTrashOfShare, queryDeleteLinks } from '../../api/link';
import { LinkMeta, FolderLinkMeta } from '../../interfaces/link';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { FOLDER_PAGE_SIZE, BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST } from '../../constants';
import { RestoreFromTrashResult, RESTORE_STATUS_CODE, RestoreResponse } from '../../interfaces/restore';
import { queryTrashList } from '../../api/share';
import runInQueue from '../../utils/runInQueue';
import useDrive from './useDrive';
import useDebouncedRequest from '../util/useDebouncedRequest';

function useTrash() {
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const cache = useDriveCache();
    const { getLinkKeys, decryptLink, getShareKeys } = useDrive();
    const { events } = useDrive();

    const fetchTrash = async (shareId: string, Page: number, PageSize: number) => {
        const { Links, Parents } = await debouncedRequest<{
            Links: LinkMeta[];
            Parents: { [id: string]: FolderLinkMeta };
        }>(queryTrashList(shareId, { Page, PageSize }));

        const decryptedLinks = await Promise.all(
            Links.map(async (meta) => {
                const { privateKey } = meta.ParentLinkID
                    ? await getLinkKeys(shareId, meta.ParentLinkID, {
                          fetchLinkMeta: async (id) => Parents[id],
                          preventRerenders: true,
                      })
                    : await getShareKeys(shareId);

                return decryptLink(meta, privateKey);
            })
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

        const trashQueue = batches.map((batch, i) => () =>
            debouncedRequest(queryTrashLinks(shareId, parentLinkID, batch))
                .then(() => batch)
                .catch((error): string[] => {
                    console.error(`Failed to trash #${i} batch of links: `, error);
                    return [];
                })
        );

        try {
            const trashed = await preventLeave(runInQueue(trashQueue, MAX_THREADS_PER_REQUEST));
            await events.call(shareId);
            return ([] as string[]).concat(...trashed);
        } finally {
            cache.set.linksLocked(false, shareId, linkIds);
        }
    };

    const restoreLinks = async (shareId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const restoreQueue = batches.map((batch, i) => () =>
            debouncedRequest<RestoreFromTrashResult>(queryRestoreLinks(shareId, batch)).catch((error) => {
                console.error(`Failed to restore #${i} batch of links: `, error);
                return { Responses: [] };
            })
        );
        try {
            const responses = await preventLeave(runInQueue(restoreQueue, MAX_THREADS_PER_REQUEST));
            await events.call(shareId);
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

                    if (Response.Code === RESTORE_STATUS_CODE.ALREADY_EXISTS) {
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

    const deleteLinks = async (shareId: string, linkIds: string[]) => {
        cache.set.linksLocked(true, shareId, linkIds);
        const batches = chunk(linkIds, BATCH_REQUEST_SIZE);

        const deleteQueue = batches.map((batch, i) => () =>
            debouncedRequest(queryDeleteLinks(shareId, batch))
                .then(() => batch)
                .catch((error): string[] => {
                    console.error(`Failed to delete #${i} batch of links: `, error);
                    return [];
                })
        );

        const deletedBatches = await preventLeave(runInQueue(deleteQueue, MAX_THREADS_PER_REQUEST));
        await events.callAll(shareId).catch(console.error);
        return ([] as string[]).concat(...deletedBatches);
    };

    const emptyTrash = async (shareId: string) => {
        return debouncedRequest(queryEmptyTrashOfShare(shareId));
    };

    return {
        fetchNextPage,
        trashLinks,
        restoreLinks,
        deleteLinks,
        emptyTrash,
    };
}

export default useTrash;
