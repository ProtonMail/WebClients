import { queryTrashList } from '../api/share';
import { queryTrashLink, queryRestoreLink, queryDeleteLink, queryEmptyTrashOfShare } from '../api/link';
import { LinkMeta, FolderLinkMeta } from '../interfaces/link';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useDrive from './useDrive';
import useDebouncedPromise from './useDebouncedPromise';
import { FOLDER_PAGE_SIZE } from '../constants';

function useTrash() {
    const debouncedRequest = useDebouncedPromise();
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
                    ? await getLinkKeys(shareId, meta.ParentLinkID, async (id) => Parents[id])
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

    const trashLink = async (shareId: string, linkId: string) => {
        return debouncedRequest(queryTrashLink(shareId, linkId));
    };

    const restoreLink = async (shareId: string, linkId: string) => {
        return debouncedRequest(queryRestoreLink(shareId, linkId));
    };

    const deleteLink = async (shareId: string, linkId: string) => {
        return debouncedRequest(queryDeleteLink(shareId, linkId));
    };

    const emptyTrash = async (shareId: string) => {
        return debouncedRequest(queryEmptyTrashOfShare(shareId));
    };

    return {
        fetchNextPage,
        trashLink,
        restoreLink,
        deleteLink,
        emptyTrash
    };
}

export default useTrash;
