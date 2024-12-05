import { useCallback, useEffect, useRef, useState } from 'react';

import type { SessionKey } from '@proton/crypto';
import { querySharedURLMetadata, querySharedURLPath } from '@proton/shared/lib/api/drive/sharing';
import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import type { LinkMetaBatchPayload } from '@proton/shared/lib/interfaces/drive/link';

import { linkMetaToEncryptedLink, usePublicSession } from '../../store/_api';
import { type DecryptedLink, useLink, usePublicLinksListing } from '../../store/_links';
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

export const usePublicNode = ({ isDocsTokenReady, linkId }: { isDocsTokenReady: boolean; linkId: string }) => {
    const abortSignal = useAbortSignal([]);

    const cache = useRef(new Map<string, DecryptedLink>());
    const [rootLink, setRootLink] = useState<DecryptedLink>();
    const [token, setToken] = useState<string>('');
    const [permissions, setPermissions] = useState<SHARE_URL_PERMISSIONS>();

    const { loadPublicShare } = usePublicShare();
    const { request } = usePublicSession();
    const { cacheLoadedLinks } = useLinksListingHelpers();
    const { getLinkSessionKey } = useLink();
    const { loadChildren: publicLinksLoadChildren } = usePublicLinksListing();
    const [didLoadChildren, setDidLoadChildren] = useState(false);
    const [didPreloadNode, setDidPreloadNode] = useState(false);

    const loadChildren = useCallback(
        async (rootLink: DecryptedLink) => {
            try {
                void publicLinksLoadChildren(abortSignal, token, rootLink.linkId, false);
            } catch (error) {
                console.error('Error during initial setup', error);
            }
        },
        [publicLinksLoadChildren, abortSignal, token]
    );

    const preloadNode = useCallback(async (nodeMeta: PublicNodeMeta, rootLink: DecryptedLink) => {
        const cached = cache.current.get(getCacheKey(nodeMeta));
        if (cached) {
            return decryptedLinkToNode(cached);
        }

        try {
            if (nodeMeta.linkId === rootLink.linkId) {
                return decryptedLinkToNode(rootLink);
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
    }, []);

    useEffect(() => {
        if (linkId && rootLink) {
            void preloadNode({ linkId, token }, rootLink).then(() => {
                setDidPreloadNode(true);
            });
        }
    }, [linkId, rootLink, preloadNode, token]);

    useEffect(() => {
        if (rootLink || !isDocsTokenReady) {
            return;
        }

        loadPublicShare(abortSignal)
            .then(({ link, token, permissions }) => {
                cache.current.set(getCacheKey(link), link);
                setRootLink(link);
                setToken(token);
                setPermissions(permissions);
            })
            .catch(console.error);
    }, [loadPublicShare, rootLink, isDocsTokenReady]);

    useEffect(() => {
        if (didLoadChildren || !rootLink) {
            return;
        }

        if (rootLink.isFile) {
            setDidLoadChildren(true);
            return;
        }

        if (rootLink && token) {
            void loadChildren(rootLink)
                .then(() => {
                    setDidLoadChildren(true);
                })
                .catch(console.error);
        }
    }, [didLoadChildren, loadChildren, rootLink, token]);

    const getNode = async (nodeMeta: PublicNodeMeta): Promise<DecryptedNode> => {
        if (!didLoadChildren || !rootLink || !token) {
            throw new Error('Attempting to get node before children have loaded');
        }

        try {
            const { ParentLinkIDs } = await request<{ ParentLinkIDs: string[] }>(
                querySharedURLPath(token, nodeMeta.linkId)
            );

            const { Links } = await request<LinkMetaBatchPayload>(
                querySharedURLMetadata(token, [nodeMeta.linkId, ...ParentLinkIDs])
            );

            const encryptedLinks = Links.map((linkMeta) => {
                const encryptedLink = linkMetaToEncryptedLink(linkMeta, token);

                // Backend should not return signature address,
                // as it is not supported in a public context
                delete encryptedLink.nameSignatureAddress;
                delete encryptedLink.signatureAddress;

                return encryptedLink;
            });

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

    const getNodeContentKey = async (nodeMeta: PublicNodeMeta): Promise<SessionKey> => {
        const cached = cache.current.get(getCacheKey(nodeMeta));

        if (!cached) {
            await getNode(nodeMeta);
        }

        const contentKey = await getLinkSessionKey(abortSignal, nodeMeta.token, nodeMeta.linkId);

        if (!contentKey) {
            throw new EnrichedError('Could not find node content key', {
                tags: { ...nodeMeta },
            });
        }

        return contentKey;
    };

    return {
        getNode,
        getNodeContentKey,
        permissions,
        performInitialSetup: loadChildren,
        didCompleteInitialSetup: didLoadChildren && didPreloadNode,
    };
};
