import { useRef, useState } from 'react';

import { querySharedURLMetadata, querySharedURLPath } from '@proton/shared/lib/api/drive/sharing';
import type { LinkMetaBatchPayload } from '@proton/shared/lib/interfaces/drive/link';

import { linkMetaToEncryptedLink, usePublicSession } from '../../store/_api';
import type { DecryptedLink } from '../../store/_links';
import { useLinksListingHelpers } from '../../store/_links/useLinksListing/useLinksListingHelpers';
import { usePublicShare } from '../../store/_shares';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import type { PublicNodeMeta } from '../interface';
import type { DecryptedNode } from './interface';
import { decryptedLinkToNode } from './utils';

/**
 * Gets the cache key for a `PublicNodeMeta` pair.
 */
const getCacheKey = ({ linkId }: { linkId: string }) => linkId;

export const usePublicNode = () => {
    const abortSignal = useAbortSignal([]);

    const cache = useRef(new Map<string, DecryptedLink>());
    const [rootLink, setRootLink] = useState<DecryptedLink>();
    const [token, setToken] = useState<string>('');

    const { loadPublicShare } = usePublicShare();
    const { request } = usePublicSession();
    const { cacheLoadedLinks } = useLinksListingHelpers();

    const getNode = async (nodeMeta: PublicNodeMeta, force?: boolean): Promise<DecryptedNode> => {
        const cached = cache.current.get(getCacheKey(nodeMeta));
        if (cached && !force) {
            return decryptedLinkToNode(cached);
        }

        if (!rootLink || !token || force) {
            try {
                const { link, token } = await loadPublicShare(abortSignal);

                cache.current.set(getCacheKey(link), link);
                setRootLink(link);
                setToken(token);

                if (nodeMeta.linkId === link.linkId) {
                    return decryptedLinkToNode(link);
                }
            } catch (e) {
                throw new EnrichedError('Unable to load public share', {
                    tags: {
                        token: nodeMeta.token,
                        linkId: nodeMeta.linkId,
                    },
                    extra: { e },
                });
            }
        }

        try {
            const { ParentLinkIDs } = await request<{ ParentLinkIDs: string[] }>(
                querySharedURLPath(token, nodeMeta.linkId)
            );

            const { Links } = await request<LinkMetaBatchPayload>(
                querySharedURLMetadata(token, [nodeMeta.linkId, ...ParentLinkIDs])
            );

            const encryptedLinks = Links.map((linkMeta) => linkMetaToEncryptedLink(linkMeta, token));
            const { links, errors } = await cacheLoadedLinks(abortSignal, token, encryptedLinks, []);

            if (errors && errors.length > 0) {
                throw new Error(`Error while caching links: ${errors}`);
            }

            const decryptedLinks = links.map((link) => link.decrypted);
            decryptedLinks.forEach((link) => cache.current.set(getCacheKey(link), link));

            const requestedLink = decryptedLinks.find((link) => link.linkId === nodeMeta.linkId);
            if (!requestedLink) {
                throw new Error('Could not find requested link in resulting array');
            }

            return decryptedLinkToNode(requestedLink);
        } catch (e) {
            throw new EnrichedError('Unable to load public link', {
                tags: {
                    token: nodeMeta.token,
                    linkId: nodeMeta.linkId,
                },
                extra: { e },
            });
        }
    };

    return { getNode };
};
