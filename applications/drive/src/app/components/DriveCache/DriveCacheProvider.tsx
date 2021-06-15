import React, { createContext, useContext, useRef, useState } from 'react';
import { OpenPGPKey, SessionKey } from 'pmcrypto';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { FolderLinkMeta, FileLinkMeta, LinkMeta, isFolderLinkMeta, SortKeys, LinkType } from '../../interfaces/link';
import { ShareMeta, ShareMetaShort } from '../../interfaces/share';
import { ShareURL } from '../../interfaces/sharing';
import { DEFAULT_SORT_PARAMS } from '../../constants';
import { isPrimaryShare } from '../../utils/share';

interface FileLinkKeys {
    privateKey: OpenPGPKey;
    sessionKeys?: SessionKey;
    passphraseSessionKey: SessionKey;
}

interface FolderLinkKeys {
    privateKey: OpenPGPKey;
    hashKey: string;
    passphraseSessionKey: SessionKey;
}

export type LinkKeys = FileLinkKeys | FolderLinkKeys;

export interface ShareKeys {
    privateKey: OpenPGPKey;
    sessionKey: SessionKey;
}

interface SortedChildrenList {
    list: string[];
    complete: boolean;
    initialized: boolean;
}

type SortedChildren = {
    [sortKey in SortKeys]: {
        [direction in SORT_DIRECTION]: SortedChildrenList;
    };
};

interface CachedFolderLink {
    meta: FolderLinkMeta;
    children: {
        sorted: SortedChildren;
        unlisted: string[];
    };
    foldersOnly: {
        list: string[];
        unlisted: string[];
        complete: boolean;
    };
    keys?: FolderLinkKeys;
    locked?: boolean;
}

interface CachedFileLink {
    meta: FileLinkMeta;
    keys?: FileLinkKeys;
    locked?: boolean;
}

const isCachedFolderLink = (link: CachedFileLink | CachedFolderLink): link is CachedFolderLink => {
    return isFolderLinkMeta(link.meta);
};

interface DriveCacheState {
    [shareId: string]: {
        meta?: ShareMeta | ShareMetaShort;
        keys?: ShareKeys;
        shared?: {
            list: string[];
            unlisted: string[];
            complete: boolean;
        };
        trash?: {
            list: string[];
            unlisted: string[];
            complete: boolean;
            locked: boolean;
        };
        links: {
            [linkId: string]: CachedFolderLink | CachedFileLink;
        };
        shareURLs?: Map<string, ShareURL>;
    };
}

const useDriveCacheState = () => {
    const cacheRef = useRef<DriveCacheState>({});
    const [defaultShare, setDefaultShare] = useState<string>();
    const [lockedShares, setLockedShares] = useState<ShareMetaShort[]>([]);
    const [sharesReadyToRestore, setSharesReadyToRestore] = useState<
        {
            lockedShareMeta: ShareMeta;
            decryptedPassphrase: string;
        }[]
    >([]);
    const [, setRerender] = useState(0);

    const setLinkMeta = (
        metas: LinkMeta | LinkMeta[],
        shareId: string,
        { isNew = false, rerender = true }: { isNew?: boolean; rerender?: boolean } = {}
    ) => {
        const { links, shared } = cacheRef.current[shareId];
        const linkMetas = Array.isArray(metas) ? metas : [metas];

        linkMetas.forEach((meta) => {
            if (links[meta.LinkID]) {
                // Special case for active revision: children don't have active revision
                // So keep it if it's already loaded (until file edit at least)
                const revision = links[meta.LinkID].meta.FileProperties?.ActiveRevision;
                if (!isFolderLinkMeta(meta) && !meta.FileProperties.ActiveRevision && revision) {
                    meta.FileProperties.ActiveRevision = revision;
                }
                // CachedThumbnailURL is computed, so keep cached version if already set.
                if (links[meta.LinkID].meta.CachedThumbnailURL) {
                    meta.CachedThumbnailURL = links[meta.LinkID].meta.CachedThumbnailURL;
                }
                links[meta.LinkID].meta = meta;
            } else {
                links[meta.LinkID] = isFolderLinkMeta(meta)
                    ? {
                          meta,
                          children: {
                              sorted: ['MIMEType', 'ModifyTime', 'Size', 'Name'].reduce((sorted, sortKey) => {
                                  sorted[sortKey as SortKeys] = {
                                      ASC: { list: [], complete: isNew, initialized: isNew },
                                      DESC: { list: [], complete: isNew, initialized: isNew },
                                  };
                                  return sorted;
                              }, {} as SortedChildren),
                              unlisted: [],
                          },
                          foldersOnly: { complete: isNew, list: [], unlisted: [] },
                      }
                    : { meta };
            }

            if (!shared) {
                return;
            }

            if (
                meta.ShareUrls.length &&
                shared.list.every((id) => id !== meta.LinkID) &&
                shared.unlisted.every((id) => id !== meta.LinkID)
            ) {
                shared.unlisted = [...shared.unlisted, meta.LinkID];
            } else if (!meta.ShareUrls.length) {
                shared.list = shared.list.filter((id) => id !== meta.LinkID);
                shared.unlisted = shared.unlisted.filter((id) => id !== meta.LinkID);
            }
        });

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            shared: shared && { ...shared },
            links,
        };

        if (rerender) {
            setRerender((old) => ++old);
        }
    };

    const getChildLinks = (shareId: string, linkId: string, { sortField, sortOrder } = DEFAULT_SORT_PARAMS) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            const { list } = link.children.sorted[sortField][sortOrder];
            return [...list, ...link.children.unlisted.filter((item) => !list.includes(item))];
        }

        return undefined;
    };

    const getTrashLinks = (shareId: string) => {
        const { trash } = cacheRef.current[shareId];
        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }
        return [...trash.list, ...trash.unlisted];
    };

    const getSharedLinks = (shareId: string) => {
        const { shared } = cacheRef.current[shareId];
        if (!shared) {
            throw new Error('Trying to access shared links on non-primary share');
        }
        return [...shared.list, ...shared.unlisted];
    };

    const getListedChildLinks = (shareId: string, linkId: string, { sortField, sortOrder } = DEFAULT_SORT_PARAMS) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.sorted[sortField][sortOrder].list;
        }

        return undefined;
    };

    const getTrashChildLinks = (shareId: string) => {
        const { trash } = cacheRef.current[shareId];
        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }
        return trash.list;
    };

    const getFoldersOnlyLinks = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return [...link.foldersOnly.list, ...link.foldersOnly.unlisted];
        }

        return undefined;
    };

    const getListedFoldersOnlyLinks = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.foldersOnly.list;
        }

        return undefined;
    };

    const isTrashLocked = (shareId: string) => {
        const { trash } = cacheRef.current[shareId];
        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }
        return trash.locked;
    };

    const setLinksLocked = (locked: boolean, shareId: string, linkIds: string[]) => {
        const { links } = cacheRef.current[shareId];
        let changed = false;

        linkIds.forEach((linkId) => {
            if (!links[linkId]) {
                return;
            }

            changed = true;
            links[linkId].locked = locked;
            cacheRef.current[shareId] = {
                ...cacheRef.current[shareId],
                links,
            };
        });

        if (changed) {
            setRerender((old) => ++old);
        }
    };

    const setAllTrashedLocked = (locked: boolean, shareId: string) => {
        const { trash } = cacheRef.current[shareId];

        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }

        const { list, unlisted } = trash;
        trash.locked = true;
        setLinksLocked(locked, shareId, [...list, ...unlisted]);
    };

    const setTrashLinkMetas = (metas: LinkMeta[], shareId: string, method: 'unlisted' | 'complete' | 'incremental') => {
        const { links } = cacheRef.current[shareId];
        const { trash } = cacheRef.current[shareId];

        setLinkMeta(metas, shareId, { rerender: false });

        const linkIds = metas.map(({ LinkID }) => LinkID);

        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }

        if (method === 'unlisted') {
            const existing = getTrashLinks(shareId);
            trash.unlisted = [...trash.unlisted, ...linkIds.filter((id) => !existing.includes(id))];
        } else {
            trash.list = [...trash.list, ...linkIds.filter((id) => !trash.list.includes(id))];
            trash.unlisted = trash.unlisted.filter((id) => !linkIds.includes(id));
            trash.complete = method === 'complete' || trash.complete;

            // After emptying trash, new items will only come via unlisted
            // All other items are due to be deleted anyway, so they should be locked
            if (isTrashLocked(shareId)) {
                setLinksLocked(true, shareId, [...trash.list, ...trash.unlisted]);
            }
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            trash,
            links,
        };

        setRerender((old) => ++old);
    };

    const setSharedLinkMetas = (metas: LinkMeta[], shareId: string, method: 'complete' | 'incremental') => {
        const { links } = cacheRef.current[shareId];
        const { shared } = cacheRef.current[shareId];

        setLinkMeta(metas, shareId, { rerender: false });

        // Non primary shares can have shares, but we only show list for primary ones
        if (!shared) {
            throw new Error('Trying to set shared list on a non primary share');
        }

        shared.complete = method === 'complete' || shared.complete;

        // TODO: locking for individual lines when stopping sharing

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            shared,
            links,
        };

        setRerender((old) => ++old);
    };

    const setShareURLs = (newShareURLs: Map<string, ShareURL>, shareId: string) => {
        const { shareURLs } = cacheRef.current[shareId];

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            shareURLs: new Map([...(shareURLs || new Map()), ...newShareURLs]),
        };

        setRerender((old) => ++old);
    };

    const setFoldersOnlyLinkMetas = (
        metas: LinkMeta[],
        shareId: string,
        linkId: string,
        method: 'complete' | 'incremental' | 'unlisted' | 'unlisted_create'
    ) => {
        const { links } = cacheRef.current[shareId];
        const parent = links[linkId];
        const folderMetas = metas.filter(isFolderLinkMeta);

        setLinkMeta(folderMetas, shareId, { rerender: false, isNew: method === 'unlisted_create' });

        if (isCachedFolderLink(parent)) {
            const existing = getFoldersOnlyLinks(shareId, linkId) || [];
            const linkIds = folderMetas.map(({ LinkID }) => LinkID);

            if (['unlisted', 'unlisted_create'].includes(method)) {
                parent.foldersOnly.unlisted = [
                    ...parent.foldersOnly.unlisted,
                    ...linkIds.filter((id) => !existing.includes(id)),
                ];
            } else {
                parent.foldersOnly.list = [
                    ...parent.foldersOnly.list,
                    ...linkIds.filter((id) => !parent.foldersOnly.list.includes(id)),
                ];
                parent.foldersOnly.unlisted = parent.foldersOnly.unlisted.filter((id) => !linkIds.includes(id));
                parent.foldersOnly.complete = method === 'complete' || parent.foldersOnly.complete;
            }
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links,
        };

        setRerender((old) => ++old);
    };

    const setLinkKeys = (keys: FileLinkKeys | FolderLinkKeys, shareId: string, linkId: string) => {
        const { links } = cacheRef.current[shareId];
        links[linkId].keys = keys;
        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links,
        };
    };

    const getShareIds = () => Object.keys(cacheRef.current);
    const getShareMeta = (shareId: string) => cacheRef.current[shareId].meta;
    const getShareKeys = (shareId: string) => cacheRef.current[shareId].keys;
    const getDefaultShareMeta = () => {
        return defaultShare ? cacheRef.current[defaultShare].meta : undefined;
    };
    const getLinkMeta = (shareId: string, linkId: string): LinkMeta | undefined =>
        cacheRef.current[shareId].links[linkId]?.meta;
    const getLinkKeys = (shareId: string, linkId: string) => cacheRef.current[shareId].links[linkId]?.keys;
    const isLinkLocked = (shareId: string, linkId: string) => !!cacheRef.current[shareId].links[linkId]?.locked;
    const getTrashComplete = (shareId: string) => {
        const { trash } = cacheRef.current[shareId];
        if (!trash) {
            throw new Error('Trying to use trash on a file share');
        }
        return trash.complete;
    };
    const getSharedLinksComplete = (shareId: string): boolean => {
        const { shared } = cacheRef.current[shareId];
        if (!shared) {
            throw new Error('Trying to access shared links on non-primary share');
        }
        return shared.complete;
    };
    const getChildrenComplete = (shareId: string, linkId: string, { sortField, sortOrder } = DEFAULT_SORT_PARAMS) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.sorted[sortField][sortOrder].complete;
        }

        return undefined;
    };

    const getfoldersOnlyComplete = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.foldersOnly.complete;
        }

        return undefined;
    };

    const getChildLinkMetas = (shareId: string, linkId: string, sortParams = DEFAULT_SORT_PARAMS) => {
        const links = getChildLinks(shareId, linkId, sortParams);
        return links?.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const getTrashMetas = (shareId: string) => {
        const links = getTrashLinks(shareId);
        return links.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const areAncestorsTrashed = (shareId: string, meta?: LinkMeta): boolean => {
        if (!meta || !meta.ParentLinkID) {
            return false;
        }
        if (meta.Trashed) {
            return true;
        }

        const parent = getLinkMeta(shareId, meta.ParentLinkID);
        return areAncestorsTrashed(shareId, parent);
    };

    const getSharedLinkMetas = (shareId: string) => {
        const links = getSharedLinks(shareId);
        return links.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const getShareURL = (shareId: string, shareURLID: string): ShareURL | undefined => {
        const { shareURLs } = cacheRef.current[shareId];
        return shareURLs?.get(shareURLID);
    };

    const getChildrenInitialized = (
        shareId: string,
        linkId: string,
        { sortField, sortOrder } = DEFAULT_SORT_PARAMS
    ) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.sorted[sortField][sortOrder].initialized;
        }

        return undefined;
    };

    const getFoldersOnlyLinkMetas = (shareId: string, linkId: string) => {
        const links = getFoldersOnlyLinks(shareId, linkId);
        return links?.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const setShareKeys = (keys: ShareKeys, shareID: string) => {
        cacheRef.current[shareID] = {
            ...cacheRef.current[shareID],
            keys,
        };
    };

    const setShareMeta = (meta: ShareMeta) => {
        const shareID = meta.ShareID;
        cacheRef.current[shareID] = {
            ...cacheRef.current[shareID],
            meta,
        };
        setRerender((old) => ++old);
    };

    const setEmptyShares = (shares: ({ ShareID: string; LinkType: LinkType; Flags?: number } | ShareMetaShort)[]) => {
        shares.forEach((share) => {
            cacheRef.current[share.ShareID] = {
                links: {},
            };

            if ('VolumeID' in share) {
                cacheRef.current[share.ShareID].meta = share;
            }

            if (isPrimaryShare(share)) {
                cacheRef.current[share.ShareID].trash = {
                    complete: false,
                    locked: false,
                    list: [],
                    unlisted: [],
                };
                cacheRef.current[share.ShareID].shared = {
                    complete: false,
                    list: [],
                    unlisted: [],
                };
            }
        });
        setRerender((old) => ++old);
    };

    /**
     * Fills all sorted lists and folderOnly list with specified values, essentially copying them.
     */
    const fillAllLists = (shareId: string, parentLinkId: string, { list }: SortedChildrenList) => {
        const { links } = cacheRef.current[shareId];
        const parent = links[parentLinkId];

        if (!isCachedFolderLink(parent)) {
            return;
        }

        Object.keys(parent.children.sorted).forEach((key) => {
            const sortedLists = parent.children.sorted[key as SortKeys];
            const directions = Object.keys(sortedLists) as SORT_DIRECTION[];

            directions.forEach((direction) => {
                if (!sortedLists[direction].complete) {
                    sortedLists[direction] = {
                        complete: true,
                        list: [...list],
                        initialized: true,
                    };
                }
            });
        });

        const foldersOnlyList =
            list.filter((linkId) => {
                const meta = getLinkMeta(shareId, linkId);
                return meta && isFolderLinkMeta(meta);
            }) ?? [];

        parent.foldersOnly = {
            complete: true,
            list: foldersOnlyList,
            unlisted: parent.foldersOnly.unlisted.filter((id) => !foldersOnlyList.includes(id)),
        };
    };

    const setChildLinkMetas = (
        metas: LinkMeta[],
        shareId: string,
        linkId: string,
        method: 'complete' | 'incremental' | 'unlisted' | 'unlisted_create',
        sortParams = DEFAULT_SORT_PARAMS
    ) => {
        const { links } = cacheRef.current[shareId];
        const parent = links[linkId];

        setLinkMeta(metas, shareId, { rerender: false, isNew: method === 'unlisted_create' });

        if (isCachedFolderLink(parent)) {
            const existing = getChildLinks(shareId, linkId, sortParams) || [];
            const linkIds = metas.map(({ LinkID }) => LinkID);

            if (['unlisted', 'unlisted_create'].includes(method)) {
                parent.children.unlisted = [
                    ...parent.children.unlisted,
                    ...linkIds.filter((id) => !existing.includes(id)),
                ];
            } else {
                const { sortField, sortOrder } = sortParams;
                const folder = parent.children.sorted[sortField][sortOrder];
                const complete = method === 'complete' || folder.complete;
                parent.children.sorted[sortField][sortOrder] = {
                    list: [...folder.list.filter((id) => !linkIds.includes(id)), ...linkIds],
                    complete,
                    initialized: true,
                };

                // If we got a complete list from somewhere, it will be the same for other orders too
                if (complete) {
                    fillAllLists(shareId, linkId, parent.children.sorted[sortField][sortOrder]);
                }

                // Name doesn't have it's own BE sorting, so we reuse default
                if (sortParams === DEFAULT_SORT_PARAMS) {
                    const nameSort = parent.children.sorted.Name;
                    const defaultSortContents = parent.children.sorted[sortField][sortOrder];
                    // If default sort contents are incomplete, contents for Name sort will need to be fetched
                    parent.children.sorted.Name.ASC = { ...defaultSortContents, initialized: nameSort.ASC.complete };
                    parent.children.sorted.Name.DESC = { ...defaultSortContents, initialized: nameSort.DESC.complete };
                }
            }
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links,
        };

        setRerender((old) => ++old);
    };

    /**
     * @param softDelete should remove reference in parent link when location changes (move, trash, restore)
     * @param rerender false when called recursively (should not rerender after every delete) otherwise true
     */
    const deleteLinks = (shareId: string, linkIds: string[], softDelete = false, rerender = true) => {
        linkIds.forEach((id) => {
            const meta = getLinkMeta(shareId, id);

            if (meta) {
                const parentLinkId = meta.ParentLinkID;
                const parent = cacheRef.current[shareId].links[parentLinkId];
                const { trash } = cacheRef.current[shareId];

                if (parent && isCachedFolderLink(parent)) {
                    Object.entries(parent.children.sorted).forEach(([sortKey, listsByDirection]) => {
                        Object.entries(listsByDirection).forEach(([direction, { list }]) => {
                            parent.children.sorted[sortKey as SortKeys][direction as SORT_DIRECTION].list = list.filter(
                                (id) => meta.LinkID !== id
                            );
                        });
                    });
                    parent.children.unlisted = parent.children.unlisted.filter((id) => meta.LinkID !== id);
                    parent.foldersOnly.list = parent.foldersOnly.list.filter((id) => meta.LinkID !== id);
                    parent.foldersOnly.unlisted = parent.foldersOnly.unlisted.filter((id) => meta.LinkID !== id);
                }

                if (trash) {
                    trash.list = trash.list.filter((id) => meta.LinkID !== id);
                    trash.unlisted = trash.unlisted.filter((id) => meta.LinkID !== id);
                }

                if (!softDelete) {
                    const { links, shared } = cacheRef.current[shareId];

                    if (shared) {
                        shared.list = shared.list.filter((sharedLinkID) => sharedLinkID !== id);
                        shared.unlisted = shared.unlisted.filter((sharedLinkID) => sharedLinkID !== id);
                    }

                    const childrenIds = Object.keys(links).filter(
                        (key) => links[key].meta.ParentLinkID === meta.LinkID
                    );
                    deleteLinks(shareId, childrenIds, false, false);

                    delete cacheRef.current[shareId].links[meta.LinkID];
                }
            }
        });

        if (rerender) {
            setRerender((old) => ++old);
        }
    };

    return {
        set: {
            trashLinkMetas: setTrashLinkMetas,
            childLinkMetas: setChildLinkMetas,
            foldersOnlyLinkMetas: setFoldersOnlyLinkMetas,
            linkMeta: setLinkMeta,
            linkKeys: setLinkKeys,
            shareMeta: setShareMeta,
            shareKeys: setShareKeys,
            emptyShares: setEmptyShares,
            linksLocked: setLinksLocked,
            allTrashedLocked: setAllTrashedLocked,
            sharedLinkMetas: setSharedLinkMetas,
            shareURLs: setShareURLs,
        },
        get: {
            sharedLinkMetas: getSharedLinkMetas,
            shareURL: getShareURL,
            trashMetas: getTrashMetas,
            trashComplete: getTrashComplete,
            trashChildLinks: getTrashChildLinks,
            defaultShareMeta: getDefaultShareMeta,
            childrenComplete: getChildrenComplete,
            sharedLinksComplete: getSharedLinksComplete,
            childrenInitialized: getChildrenInitialized,
            childLinkMetas: getChildLinkMetas,
            childLinks: getChildLinks,
            sharedLinks: getSharedLinks,
            listedChildLinks: getListedChildLinks,
            foldersOnlyLinkMetas: getFoldersOnlyLinkMetas,
            listedFoldersOnlyLinks: getListedFoldersOnlyLinks,
            foldersOnlyComplete: getfoldersOnlyComplete,
            linkMeta: getLinkMeta,
            linkKeys: getLinkKeys,
            shareMeta: getShareMeta,
            shareKeys: getShareKeys,
            shareIds: getShareIds,
            isTrashLocked,
            isLinkLocked,
            areAncestorsTrashed,
        },
        delete: {
            links: deleteLinks,
        },
        setDefaultShare,
        setLockedShares,
        setSharesReadyToRestore,
        defaultShare,
        lockedShares,
        sharesReadyToRestore,
    };
};

const DriveCacheContext = createContext<ReturnType<typeof useDriveCacheState> | null>(null);

const DriveCacheProvider = ({ children }: { children: React.ReactNode }) => {
    const value = useDriveCacheState();

    return <DriveCacheContext.Provider value={value}>{children}</DriveCacheContext.Provider>;
};

export const useDriveCache = () => {
    const state = useContext(DriveCacheContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveCacheProvider');
    }
    return state;
};

export type DriveCache = ReturnType<typeof useDriveCacheState>;

export default DriveCacheProvider;
