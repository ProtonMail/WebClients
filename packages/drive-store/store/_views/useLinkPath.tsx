import { useCallback } from 'react';

import { useDevicesListing } from '../_devices';
import type { DecryptedLink } from '../_links';
import { useLink } from '../_links';
import useLinksState from '../_links/useLinksState';
import { ShareType, useShare } from '../_shares';
import { isLinkReadOnly } from './utils/useIsActiveLinkReadOnly';

type PathItem = {
    linkId: string;
    name: string;
    isRoot: boolean;
    link: DecryptedLink;
    isReadOnly?: boolean;
};

const generateLinkPath = async (
    abortSignal: AbortSignal,
    shareId: string,
    linkId: string,
    getLink: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<DecryptedLink>
) => {
    const currentLinkMeta = await getLink(abortSignal, shareId, linkId);
    const path = [currentLinkMeta];

    let nextLinkId = currentLinkMeta.parentLinkId;
    while (nextLinkId) {
        const linkMeta = await getLink(abortSignal, shareId, nextLinkId);
        path.unshift(linkMeta);
        nextLinkId = linkMeta.parentLinkId;
    }

    return path;
};

/**
 * useLinkPath provides paths to links.
 * Ideally, this should not be used directly, but be part of useFolderView
 * (for breadcrumb), for example.
 */
export default function useLinkPath() {
    const { getLink } = useLink();
    const { getShare } = useShare();
    const { getDeviceByShareId } = useDevicesListing();

    // This is hack. Do not keep it around when moved properly to the state.
    // When name of some parent changes, we need to update the location as
    // well, but thats not part of the child link. Therefore, this function
    // needs to be called any time the state changes. To not do too much
    // work when its not needed, we cache the callbacks, for which we need
    // the state. Once the location is part of the state, this whole hook
    // will not be needed. The problem might be, that updating location for
    // every link in the store might not be good as well, so that needs more
    // thoughts.
    const { getLink: getCachedLink } = useLinksState();

    const traverseLinksToRoot = useCallback(
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<PathItem[]> => {
            const path = await generateLinkPath(abortSignal, shareId, linkId, getLink);
            const rootShare = await getShare(abortSignal, shareId);

            const rootLinkName = rootShare.type === ShareType.device && getDeviceByShareId(shareId)?.name;

            return path.map((link) => ({
                linkId: link.linkId,
                name: !link.parentLinkId && rootLinkName ? rootLinkName : link.name,
                isRoot: !link.parentLinkId,
                isReadOnly: isLinkReadOnly(link, rootShare.type),
                link,
            }));
        },
        [getCachedLink]
    );

    const getPath = useCallback(
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<string> => {
            return traverseLinksToRoot(abortSignal, shareId, linkId)
                .then((path) => {
                    return `/${path.map(({ name }) => name).join('/')}`;
                })
                .catch((err) => {
                    return err.message || '';
                });
        },
        [traverseLinksToRoot]
    );

    return {
        traverseLinksToRoot,
        getPath,
    };
}

export function useLinkPathPublic() {
    const { getLink } = useLink();
    // This is hack. Do not keep it around when moved properly to the state.
    // When name of some parent changes, we need to update the location as
    // well, but thats not part of the child link. Therefore, this function
    // needs to be called any time the state changes. To not do too much
    // work when its not needed, we cache the callbacks, for which we need
    // the state. Once the location is part of the state, this whole hook
    // will not be needed. The problem might be, that updating location for
    // every link in the store might not be good as well, so that needs more
    // thoughts.
    const { getLink: getCachedLink } = useLinksState();

    const traverseLinksToRoot = useCallback(
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<PathItem[]> => {
            const path = await generateLinkPath(abortSignal, shareId, linkId, getLink);

            return path.map((link) => ({
                linkId: link.linkId,
                name: link.name,
                isRoot: !!link.parentLinkId,
                link,
            }));
        },
        [getCachedLink]
    );

    return {
        traverseLinksToRoot,
    };
}
