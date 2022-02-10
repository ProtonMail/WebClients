import { c } from 'ttag';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DecryptedLink, LinkType, useLink, useLinksListing } from '../links';
import { useShare } from '../shares';
import { useErrorHandler } from '../utils';
import { useAbortSignal } from './utils';

export interface TreeItem {
    link: DecryptedLink;
    isExpanded: boolean;
    isLoaded: boolean;
    children: TreeItem[];
}

interface FolderTreeOptions {
    rootLinkId?: string;
    rootExpanded?: boolean;
}

interface TreeOptions extends FolderTreeOptions {
    foldersOnly?: boolean;
}

/**
 * useFolderTree provides data for folder tree view of the provided share.
 */
export function useFolderTree(shareId: string, options?: FolderTreeOptions) {
    return useTree(shareId, { ...options, foldersOnly: true });
}

/**
 * useTree provides data for complete tree view of the provided share.
 */
export function useTree(shareId: string, { rootLinkId, rootExpanded, foldersOnly }: TreeOptions) {
    const { showErrorNotification } = useErrorHandler();
    const { getShare } = useShare();
    const { getLink } = useLink();
    const { loadChildren, getCachedChildren } = useLinksListing();

    const abortSignal = useAbortSignal([shareId, rootLinkId]);
    const [rootFolder, setFolderTree] = useState<TreeItem>();

    const getShareRootLinkId = async (abortSignal: AbortSignal, shareId: string) => {
        const share = await getShare(abortSignal, shareId);
        return share.rootLinkId;
    };

    // Reset the whole tree when share info changed.
    useEffect(() => {
        const abortController = new AbortController();
        (rootLinkId ? Promise.resolve(rootLinkId) : getShareRootLinkId(abortController.signal, shareId))
            .then((rootLinkId) => getLink(abortController.signal, shareId, rootLinkId))
            .then((link) => {
                setFolderTree({
                    link,
                    isExpanded: rootExpanded || false,
                    isLoaded: false,
                    children: [],
                });
            })
            .catch((err) => {
                showErrorNotification(err, c('Notification').t`Root folder failed to be loaded`);
                console.error(err);
            });
    }, [shareId, rootLinkId, rootExpanded]);

    const syncTreeWithCache = useCallback(
        (item: TreeItem): TreeItem => {
            const [allChildren] = getCachedChildren(abortSignal, shareId, item.link.linkId);
            const children = allChildren.filter((link) => !foldersOnly || link.type === LinkType.FOLDER);
            if (!children) {
                item.children = [];
            } else {
                const newIds = children.map(({ linkId }) => linkId);
                const prevItems = item.isLoaded
                    ? item.children
                          .filter(({ link }) => newIds.includes(link.linkId))
                          .map((child): TreeItem => {
                              const item = children.find((item) => item.linkId === child.link.linkId);
                              if (item && item.name !== child.link.name) {
                                  return { ...child, link: item };
                              }
                              return child;
                          })
                    : item.children;

                const currentIds = item.children.map(({ link }) => link.linkId);
                const newItems = children
                    .filter((item) => !currentIds.includes(item.linkId) && !item.trashed)
                    .map(
                        (item): TreeItem => ({
                            link: item,
                            isExpanded: false,
                            isLoaded: false,
                            children: [],
                        })
                    );

                item.children = [...prevItems, ...newItems].map(syncTreeWithCache);
                item.children.sort((a, b) => {
                    const nameA = a.link.name.toUpperCase();
                    const nameB = b.link.name.toUpperCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    return nameA > nameB ? 1 : 0;
                });
            }
            return { ...item };
        },
        [shareId, foldersOnly, getCachedChildren]
    );

    const setLoadedFlag = (item: TreeItem, linkId: string) => {
        if (item.link.linkId === linkId) {
            item.isLoaded = true;
            return { ...item };
        }
        item.children = item.children.map((child) => setLoadedFlag(child, linkId));
        return item;
    };

    const loadSubfolders = useCallback(
        (abortSignal: AbortSignal, linkId: string) => {
            loadChildren(abortSignal, shareId, linkId, foldersOnly)
                .then(() => {
                    setFolderTree((state) => {
                        if (!state) {
                            return;
                        }
                        state = setLoadedFlag(state, linkId);
                        return syncTreeWithCache(state);
                    });
                })
                .catch((err) => showErrorNotification(err, c('Notification').t`Subfolder failed to be loaded`));
        },
        [shareId, foldersOnly, loadChildren]
    );

    // Update local folder tree when cache has updated.
    useEffect(() => {
        setFolderTree((state) => (state ? syncTreeWithCache(state) : undefined));
    }, [syncTreeWithCache]);

    // Load root childs automatically so we have anything to show right away.
    useEffect(() => {
        if (!rootFolder || rootFolder.isLoaded) {
            return;
        }

        const abortController = new AbortController();
        loadSubfolders(abortController.signal, rootFolder.link.linkId);
        return () => {
            abortController.abort();
        };
    }, [!rootFolder || rootFolder.isLoaded, rootFolder?.link?.linkId]);

    const setExpand = useCallback(
        (linkId: string, getNewExpanded: (item: TreeItem) => boolean) => {
            const updateExpand = (item: TreeItem) => {
                if (item.link.linkId === linkId) {
                    if (!item.isExpanded && !item.isLoaded) {
                        loadSubfolders(new AbortController().signal, item.link.linkId);
                    }
                    item.isExpanded = getNewExpanded(item);
                }
                item.children = item.children.map(updateExpand);
                return { ...item };
            };
            setFolderTree((state) => (state ? updateExpand(state) : undefined));
        },
        [loadSubfolders]
    );

    const expand = useCallback((linkId: string) => setExpand(linkId, () => true), [setExpand]);

    const toggleExpand = useCallback(
        (linkId: string) => setExpand(linkId, ({ isExpanded }) => !isExpanded),
        [setExpand]
    );

    const deepestOpenedLevel = useMemo(() => getDeepestOpenedLevel(rootFolder), [rootFolder]);

    return {
        deepestOpenedLevel,
        rootFolder,
        expand,
        toggleExpand,
    };
}

function getDeepestOpenedLevel(item?: TreeItem, level = 0): number {
    if (!item || !item.isExpanded || !item.children.length) {
        return level;
    }
    const levels = item.children.map((child) => getDeepestOpenedLevel(child, level + 1));
    return Math.max(...levels);
}
