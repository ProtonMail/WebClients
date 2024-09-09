import type { DecryptedLink, EncryptedLink } from '../interface';
import type { FetchMeta } from './useLinksListingHelpers';

type LoadLinksMetaOptions = {
    /**
     * Whether or not to request thumbnail tokens from the API
     */
    loadThumbnails?: boolean;
    // It is importing inteface from inside the module which is ugly, but this is for quick fix.
    // No problem with cyclic imports. If there is problem in the future, please refactor.
    fetchMeta?: FetchMeta;
    // TODO: This a hack to make shared with me section work when we receive parentLinkId on links.
    // This should be removed with this ticket: DRVWEB-4195
    removeParentLinkId?: boolean;
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
        removeParentLinkId?: boolean;
    }
) => Promise<{
    [shareId: string]: {
        links: EncryptedLink[];
        parents: EncryptedLink[];
    };
}>;
