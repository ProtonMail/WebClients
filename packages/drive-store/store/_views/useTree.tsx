import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import type { DecryptedLink } from '../_links';
import { useLink, useLinksListing } from '../_links';
import { ShareType, useShare } from '../_shares';
import { useErrorHandler } from '../_utils';
import { useAbortSignal } from './utils';
import { useShareType } from './utils/useShareType';

export interface TreeItem {
    link: DecryptedLink;
    isExpanded: boolean;
    isLoaded: boolean;
    children: TreeItem[];
}

interface TreeOptions {
    rootLinkId?: string;
    rootExpanded?: boolean;
    foldersOnly?: boolean;
}

export function useTreeForModals(shareId: string, options?: Omit<TreeOptions, 'rootLinkId'>) {
    const shareType = useShareType(shareId);
    const getRootItems = (tree: ReturnType<typeof useTree>): TreeItem[] => {
        if (shareType === ShareType.device) {
            return tree.rootFolder?.children ? tree.rootFolder?.children : [];
        }

        const isLoaded = tree.rootFolder?.isLoaded;

        if (isLoaded && tree.rootFolder?.children.length === 0) {
            // Avoid displaying root folder for empty My Files section not
            // to have only one non-interactable tree element in the UI
            return [];
        }

        return tree.rootFolder ? [tree.rootFolder] : [];
    };

    const tree = useTree(shareId, { ...options });
    const isLoaded = tree.rootFolder?.isLoaded || false;

    let items = getRootItems(tree);

    return {
        ...tree,
        rootItems: items,
        isLoaded,
    };
}

/**
 * useFolderTree provides data for folder tree view of the provided share.
 *
 * @deprecated – if possible, reuse logic from useTreeForModals, if there's a need to
 * exlude root link from the output. The reason this function exists is that Sidebar
 * component has it's own implementation of formatting the tree. This function and
 * `useTreeForModals` is an object of possible refactor – the goal of it is to create
 * a unified mechanism to get tree data ready for presentation.
 */
export function useFolderTree(shareId: string, options?: TreeOptions) {
    return useTree(shareId, { ...options, foldersOnly: true });
}

/**
 * useTree provides data for complete tree view of the provided share.
 */
export function useTree(shareId: string, { rootLinkId, rootExpanded, foldersOnly = false }: TreeOptions) {
    const { createNotification } = useNotifications();
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
            });
    }, [shareId, rootLinkId, rootExpanded]);

    const syncTreeWithCache = useCallback(
        (item: TreeItem): TreeItem => {
            // Sync with cache only expanded part of the tree so we don't have
            // to keep in sync everything in the cache as that would need to
            // make sure have everyting up to date and decrypted. If user don't
            // need it, lets not waste valuable CPU time on it. But do it only
            // for children - lets keep root folder always up to date, as we
            // preload root everytime and the main expand button depends on it.
            if (!item.isExpanded && item.link.parentLinkId) {
                return item;
            }

            const { links: children } = getCachedChildren(abortSignal, shareId, item.link.linkId, foldersOnly);
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
                    if (a.link.isFile !== b.link.isFile) {
                        return a.link.isFile < b.link.isFile ? -1 : 1;
                    }
                    return a.link.name.localeCompare(b.link.name, undefined, { numeric: true });
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

    useEffect(() => {
        if (deepestOpenedLevel === 42) {
            createNotification({
                type: 'info',
                text: 'Achievement unlocked: folder tree master 1',
            });
        }
    }, [deepestOpenedLevel]);

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
