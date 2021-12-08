import { c } from 'ttag';

import { useLink } from '../links';

type PathItem = {
    linkId: string;
    name: string;
    isRoot: boolean;
};

/**
 * useLinkPath provides paths to links.
 * Ideally, this should not be used directly, but be part of useFolderView
 * (for breadcrumb), for example.
 */
export default function useLinkPath() {
    const { getLink } = useLink();

    const rootDefaultName = c('Title').t`My files`;

    const traverseLinksToRoot = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string
    ): Promise<PathItem[]> => {
        const currentLinkMeta = await getLink(abortSignal, shareId, linkId);
        const path = [currentLinkMeta];

        let nextLinkId = currentLinkMeta.parentLinkId;
        while (nextLinkId) {
            const linkMeta = await getLink(abortSignal, shareId, nextLinkId);
            path.unshift(linkMeta);
            nextLinkId = linkMeta.parentLinkId;
        }

        return path.map((link) => ({
            linkId: link.linkId,
            name: link.parentLinkId ? link.name : rootDefaultName,
            isRoot: !!link.parentLinkId,
        }));
    };

    const getPath = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<string> => {
        return traverseLinksToRoot(abortSignal, shareId, linkId).then((path) => {
            return `/${path.map(({ name }) => name).join('/')}`;
        });
    };

    return {
        traverseLinksToRoot,
        getPath,
    };
}
