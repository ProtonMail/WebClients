import { useCallback } from 'react';
import { useApi } from 'react-components';
import { FOLDER_PAGE_SIZE } from '../constants';
import { queryTrashList } from '../api/share';
import { queryTrashLink } from '../api/link';
import { LinkMeta, FolderLinkMeta } from '../interfaces/link';
import useShare, { folderChildrenCacheKey, FolderLinkMetaResult } from './useShare';
import useCachedResponse from './useCachedResponse';

const trashCacheKey = (shareId: string, Page: number, PageSize: number) =>
    `drive/shares/${shareId}/trash?${Page}&${PageSize}`;

function useTrash(shareId: string) {
    const api = useApi();
    const { cache, getCachedResponse, updateCachedResponse } = useCachedResponse();
    const { decryptLinkMeta, decryptChildLink } = useShare(shareId);

    const clearTrashCache = useCallback(
        (Page: number, PageSize: number) => {
            cache.delete(trashCacheKey(shareId, Page, PageSize));
        },
        [cache, shareId]
    );

    const fetchTrash = useCallback(
        (Page: number, PageSize: number) =>
            getCachedResponse(trashCacheKey(shareId, Page, PageSize), async () => {
                const { Links, Parents } = await api<{ Links: LinkMeta[]; Parents: { [id: string]: FolderLinkMeta } }>(
                    queryTrashList(shareId, { Page, PageSize })
                );

                const getParentLink = (parentLinkId: string) =>
                    decryptLinkMeta(Parents[parentLinkId], getParentLink) as Promise<FolderLinkMetaResult>;

                return Promise.all(Links.map((link) => decryptChildLink(link, getParentLink)));
            }),
        [shareId]
    );

    const trashLink = async (linkId: string, parentLinkId: string) => {
        await api(queryTrashLink(shareId, linkId));

        // TODO: clear actual pages the file is in
        clearTrashCache(0, FOLDER_PAGE_SIZE);

        // TODO: clear actual pages the file is in (and handle edge cases) or just wait for events
        updateCachedResponse(
            folderChildrenCacheKey(shareId, parentLinkId, 0, FOLDER_PAGE_SIZE),
            (value: LinkMeta[]) => {
                return value.filter((link) => link.LinkID !== linkId);
            }
        );
    };

    return {
        fetchTrash,
        trashLink
    };
}

export default useTrash;
