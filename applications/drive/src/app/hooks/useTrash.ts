import { queryTrashList } from '../api/share';
import { queryTrashLink } from '../api/link';
import { LinkMeta, FolderLinkMeta } from '../interfaces/link';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import useDrive from './useDrive';
import useDebouncedPromise from './useDebouncedPromise';

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

    const trashLink = async (shareId: string, linkId: string) => {
        return debouncedRequest(queryTrashLink(shareId, linkId));
    };

    return {
        fetchTrash,
        trashLink
    };
}

export default useTrash;
