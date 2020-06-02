import { queryTrashList } from '../api/share';
import { queryTrashLinks, queryRestoreLinks, queryEmptyTrashOfShare, queryDeleteLinks } from '../api/link';
import { LinkMeta, FolderLinkMeta } from '../interfaces/link';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useDrive from './useDrive';
import useDebouncedRequest from './useDebouncedRequest';
import { FOLDER_PAGE_SIZE } from '../constants';
import { RestoreFromTrashResult } from '../interfaces/restore';

function useTrash() {
    const debouncedRequest = useDebouncedRequest();
    const cache = useDriveCache();
    const { getLinkKeys, decryptLink, getShareKeys } = useDrive();

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
                          preventRerenders: true
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
        return debouncedRequest(queryTrashLinks(shareId, parentLinkID, linkIds));
    };

    const restoreLinks = async (shareId: string, linkIds: string[]): Promise<RestoreFromTrashResult> => {
        return debouncedRequest(queryRestoreLinks(shareId, linkIds));
    };

    const deleteLinks = async (shareId: string, linkIds: string[]) => {
        return debouncedRequest(queryDeleteLinks(shareId, linkIds));
    };

    const emptyTrash = async (shareId: string) => {
        return debouncedRequest(queryEmptyTrashOfShare(shareId));
    };

    return {
        fetchNextPage,
        trashLinks,
        restoreLinks,
        deleteLinks,
        emptyTrash
    };
}

export default useTrash;
