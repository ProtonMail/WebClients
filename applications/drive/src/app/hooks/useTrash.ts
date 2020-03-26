import { useApi } from 'react-components';
import { FOLDER_PAGE_SIZE } from '../constants';
import { queryTrashLink } from '../api/link';
import useCachedResponse from './useCachedResponse';
import { folderChildrenCacheKey } from './useShare';
import { LinkMeta } from '../interfaces/link';

function useTrash(shareId: string) {
    const api = useApi();
    const { updateCachedResponse } = useCachedResponse();

    const trashLink = async (linkId: string, parentLinkId: string) => {
        await api(queryTrashLink(shareId, linkId));

        // TODO: clear actual pages the file is in (and handle edge cases) or just wait for events
        updateCachedResponse(
            folderChildrenCacheKey(shareId, parentLinkId, 0, FOLDER_PAGE_SIZE),
            (value: LinkMeta[]) => {
                return value.filter((link) => link.LinkID !== linkId);
            }
        );
    };

    return {
        trashLink
    };
}

export default useTrash;
