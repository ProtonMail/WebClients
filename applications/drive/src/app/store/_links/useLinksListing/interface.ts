import { DecryptedLink } from '../interface';
import { FetchMeta } from './useLinksListingHelpers';

type LoadLinksMetaOptions = {
    /**
     * Whether or not to request thumbnail tokens from the API
     */
    loadThumbnails?: boolean;
    // It is importing inteface from inside the module which is ugly, but this is for quick fix.
    // No problem with cyclic imports. If there is problem in the future, please refactor.
    fetchMeta?: FetchMeta;
};

export type FetchLoadLinksMeta = (
    abortSignal: AbortSignal,
    query: string,
    shareId: string,
    linkIds: string[],
    options?: LoadLinksMetaOptions
) => Promise<{
    links: DecryptedLink[];
    parents: DecryptedLink[];
    errors: any[];
}>;
