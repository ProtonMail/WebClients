import { useCallback, useEffect, useRef, useState } from 'react';

import type { SessionKey } from '@proton/crypto';
import { querySharedURLMetadata, querySharedURLPath } from '@proton/shared/lib/api/drive/sharing';
import type { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import type { LinkMetaBatchPayload } from '@proton/shared/lib/interfaces/drive/link';

import { linkMetaToEncryptedLink, usePublicSession } from '../../store/_api';
import { type DecryptedLink, useLink } from '../../store/_links';
import { useLinksListingHelpers } from '../../store/_links/useLinksListing/useLinksListingHelpers';
import type { SharedUrlInfo } from '../../store/_shares';
import { usePublicShare } from '../../store/_shares';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import type { PublicNodeMeta } from '../NodeMeta';
import type { DecryptedNode } from './interface';
import { decryptedLinkToNode } from './utils';

/**
 * Gets the cache key for a `PublicNodeMeta` pair.
 */
const getCacheKey = ({ linkId }: { linkId: string }) => linkId;

export const usePublicNode = ({
    isDocsTokenReady,
    linkId,
}: {
    isDocsTokenReady: boolean;
    /**
     * If linkId is not passed we can use the linkId of the root link if the root link is a file.
     * If the root link is not a file and the linkId is not passed, the preloadNode function will
     * not run. However it is not an issue since an error will have been shown to the user by that point.
     */
    linkId: string | undefined;
}) => {
    const abortSignal = useAbortSignal([]);

    const cache = useRef(new Map<string, DecryptedLink>());
    const [rootLink, setRootLink] = useState<DecryptedLink>();
    const [sharedUrlInfo, setSharedUrlInfo] = useState<SharedUrlInfo>();
    const [token, setToken] = useState<string>('');
    const [permissions, setPermissions] = useState<SHARE_URL_PERMISSIONS>();
    const didQueueLoadPublicShare = useRef(false);

    const { loadPublicShare } = usePublicShare();
    const { request, getAddressKeyInfo } = usePublicSession();
    const { cacheLoadedLinks } = useLinksListingHelpers();
    const { getLinkSessionKey } = useLink();
    const [didPreloadNode, setDidPreloadNode] = useState(false);

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
        if (!rootLink) {
            return;
        }
        /**
         * If the root link is a file, it will be a document and we can just use
         * the linkId from the root link itself.
         */
        const resolvedLinkId = rootLink.isFile ? rootLink.linkId : linkId;
        if (resolvedLinkId) {
            void preloadNode({ linkId: resolvedLinkId, token }, rootLink).then(() => {
                setDidPreloadNode(true);
            });
        }
    }, [rootLink, preloadNode, token, linkId]);

    useEffect(() => {
        if (rootLink || !isDocsTokenReady) {
            return;
        }

        if (didQueueLoadPublicShare.current) {
            return;
        }

        didQueueLoadPublicShare.current = true;

        loadPublicShare(abortSignal)
            .then(({ link, sharedUrlInfo }) => {
                cache.current.set(getCacheKey(link), link);
                setRootLink(link);
                setToken(sharedUrlInfo.token);
                setPermissions(sharedUrlInfo.permissions);
                setSharedUrlInfo(sharedUrlInfo);
            })
            .catch(console.error);
    }, [loadPublicShare, rootLink, isDocsTokenReady, abortSignal]);

    const getNode = async (nodeMeta: PublicNodeMeta): Promise<DecryptedNode> => {
        if (!rootLink || !token) {
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
                delete encryptedLink.nameSignatureEmail;
                delete encryptedLink.signatureEmail;

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
        rootLinkId: rootLink?.linkId,
        sharedUrlInfo,
        getNode,
        getNodeContentKey,
        permissions,
        getAddressKeyInfo,
        didCompleteInitialSetup: didPreloadNode,
    };
};
