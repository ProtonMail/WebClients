import { DecryptedLink } from '../interface';

type LoadLinksMetaOptions = {
    /**
     * Whether or not to request thumbnail tokens from the API
     */
    loadThumbnails?: boolean;
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
