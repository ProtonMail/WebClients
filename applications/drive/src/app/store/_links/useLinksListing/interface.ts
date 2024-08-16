import type { DecryptedLink } from '../interface';
import type { FetchMeta } from './useLinksListingHelpers';

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
    volumeId: string,
    linkIds: string[],
    options?: LoadLinksMetaOptions
) => Promise<{
    links: DecryptedLink[];
    parents: DecryptedLink[];
    errors: any[];
}>;

export type FetchLoadLinksMetaByVolume = (
    abortSignal: AbortSignal,
    volumeId: string,
    linkWithShareIds: { linkId: string; shareId: string }[],
    options: Omit<LoadLinksMetaOptions, 'fetchMeta'> & {
        fetchMeta: FetchMeta;
    }
) => Promise<{
    links: DecryptedLink[];
    parents: DecryptedLink[];
    errors: any[];
}>;
