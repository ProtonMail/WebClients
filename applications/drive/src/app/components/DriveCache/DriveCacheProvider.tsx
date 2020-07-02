import React, { createContext, useContext, useRef, useState } from 'react';
import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { FolderLinkMeta, FileLinkMeta, LinkMeta, isFolderLinkMeta, SortKeys } from '../../interfaces/link';
import { ShareMeta } from '../../interfaces/share';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { DEFAULT_SORT_PARAMS } from '../../constants';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

interface FileLinkKeys {
    privateKey: OpenPGPKey;
    sessionKeys?: SessionKey;
}

interface FolderLinkKeys {
    privateKey: OpenPGPKey;
    hashKey: string;
}

export type LinkKeys = FileLinkKeys | FolderLinkKeys;

interface ShareKeys {
    privateKey: OpenPGPKey;
}

type SortedChildren = {
    [sortKey in SortKeys]: {
        [direction in SORT_DIRECTION]: { list: string[]; complete: boolean };
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
}

interface CachedFileLink {
    meta: FileLinkMeta;
    keys?: FileLinkKeys;
}

const isCachedFolderLink = (link: CachedFileLink | CachedFolderLink): link is CachedFolderLink => {
    return isFolderLinkMeta(link.meta);
};

interface DriveCacheState {
    [shareId: string]: {
        meta?: ShareMeta;
        keys?: ShareKeys;
        trash: {
            list: string[];
            unlisted: string[];
            complete: boolean;
        };
        links: {
            [linkId: string]: CachedFolderLink | CachedFileLink;
        };
    };
}

const useDriveCacheState = () => {
    const cacheRef = useRef<DriveCacheState>({});
    const [, setRerender] = useState(0);

    const setLinkMeta = (
        metas: LinkMeta | LinkMeta[],
        shareId: string,
        { isNew = false, rerender = true }: { isNew?: boolean; rerender?: boolean } = {}
    ) => {
        const links = cacheRef.current[shareId].links;
        const linkMetas = Array.isArray(metas) ? metas : [metas];

        linkMetas.forEach((meta) => {
            if (links[meta.LinkID]) {
                // Special case for active revision: children don't have active revision
                // So keep it if it's already loaded (until file edit at least)
                const revision = links[meta.LinkID].meta.FileProperties?.ActiveRevision;
                if (!isFolderLinkMeta(meta) && !meta.FileProperties.ActiveRevision && revision) {
                    meta.FileProperties.ActiveRevision = revision;
                }
                links[meta.LinkID].meta = meta;
            } else {
                links[meta.LinkID] = isFolderLinkMeta(meta)
                    ? {
                          meta,
                          children: {
                              sorted: ['Type', 'ModifyTime', 'Size'].reduce((sorted, sortKey) => {
                                  sorted[sortKey as SortKeys] = {
                                      ASC: { list: [], complete: isNew },
                                      DESC: { list: [], complete: isNew }
                                  };
                                  return sorted;
                              }, {} as SortedChildren),
                              unlisted: []
                          },
                          foldersOnly: { complete: isNew, list: [], unlisted: [] }
                      }
                    : { meta };
            }
        });

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links
        };

        if (rerender) {
            setRerender((old) => ++old);
        }
    };

    const getChildLinks = (shareId: string, linkId: string, { sortField, sortOrder } = DEFAULT_SORT_PARAMS) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            const list = link.children.sorted[sortField][sortOrder].list;
            return [...list, ...link.children.unlisted.filter((item) => !list.includes(item))];
        }

        return undefined;
    };

    const getTrashLinks = (shareId: string) => {
        const trash = cacheRef.current[shareId].trash;
        return [...trash.list, ...trash.unlisted];
    };

    const getListedChildLinks = (shareId: string, linkId: string, { sortField, sortOrder } = DEFAULT_SORT_PARAMS) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.sorted[sortField][sortOrder].list;
        }

        return undefined;
    };

    const getTrashChildLinks = (shareId: string) => {
        return cacheRef.current[shareId].trash.list;
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

    const setChildLinkMetas = (
        metas: LinkMeta[],
        shareId: string,
        linkId: string,
        method: 'complete' | 'incremental' | 'unlisted' | 'unlisted_create',
        sortParams = DEFAULT_SORT_PARAMS
    ) => {
        const links = cacheRef.current[shareId].links;
        const parent = links[linkId];

        setLinkMeta(metas, shareId, { rerender: false, isNew: method === 'unlisted_create' });

        if (isCachedFolderLink(parent)) {
            const existing = getChildLinks(shareId, linkId, sortParams) || [];
            const linkIds = metas.map(({ LinkID }) => LinkID);

            if (['unlisted', 'unlisted_create'].includes(method)) {
                parent.children.unlisted = [
                    ...parent.children.unlisted,
                    ...linkIds.filter((id) => !existing.includes(id))
                ];
            } else {
                const { sortField, sortOrder } = sortParams;
                const folder = parent.children.sorted[sortField][sortOrder];
                parent.children.sorted[sortField][sortOrder] = {
                    list: [...folder.list.filter((id) => !linkIds.includes(id)), ...linkIds],
                    complete: method === 'complete' || folder.complete
                };
            }
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links
        };

        setRerender((old) => ++old);
    };

    const setTrashLinkMetas = (metas: LinkMeta[], shareId: string, method: 'unlisted' | 'complete' | 'incremental') => {
        const links = cacheRef.current[shareId].links;
        const trash = cacheRef.current[shareId].trash;

        setLinkMeta(metas, shareId, { rerender: false });

        const existing = getTrashLinks(shareId);
        const linkIds = metas.map(({ LinkID }) => LinkID);

        if (method === 'unlisted') {
            trash.unlisted = [...trash.unlisted, ...linkIds.filter((id) => !existing.includes(id))];
        } else {
            trash.list = [...trash.list, ...linkIds.filter((id) => !trash.list.includes(id))];
            trash.unlisted = trash.unlisted.filter((id) => !linkIds.includes(id));
            trash.complete = method === 'complete' || trash.complete;
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            trash,
            links
        };

        setRerender((old) => ++old);
    };

    const setFoldersOnlyLinkMetas = (
        metas: LinkMeta[],
        shareId: string,
        linkId: string,
        method: 'complete' | 'incremental' | 'unlisted' | 'unlisted_create'
    ) => {
        const links = cacheRef.current[shareId].links;
        const parent = links[linkId];
        const folderMetas = metas.filter(isFolderLinkMeta);

        setLinkMeta(folderMetas, shareId, { rerender: false, isNew: method === 'unlisted_create' });

        if (isCachedFolderLink(parent)) {
            const existing = getFoldersOnlyLinks(shareId, linkId) || [];
            const linkIds = folderMetas.map(({ LinkID }) => LinkID);

            if (['unlisted', 'unlisted_create'].includes(method)) {
                parent.foldersOnly.unlisted = [
                    ...parent.foldersOnly.unlisted,
                    ...linkIds.filter((id) => !existing.includes(id))
                ];
            } else {
                parent.foldersOnly.list = [
                    ...parent.foldersOnly.list,
                    ...linkIds.filter((id) => !parent.foldersOnly.list.includes(id))
                ];
                parent.foldersOnly.unlisted = parent.foldersOnly.unlisted.filter((id) => !linkIds.includes(id));
                parent.foldersOnly.complete = method === 'complete' || parent.foldersOnly.complete;
            }
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links
        };

        setRerender((old) => ++old);
    };

    const setLinkKeys = (keys: FileLinkKeys | FolderLinkKeys, shareId: string, linkId: string) => {
        const links = cacheRef.current[shareId].links;
        links[linkId].keys = keys;
        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links
        };
    };

    const getShareIds = () => Object.keys(cacheRef.current);
    const getShareMeta = (shareId: string) => cacheRef.current[shareId].meta;
    const getShareKeys = (shareId: string) => cacheRef.current[shareId].keys;
    const getDefaultShareMeta = () => {
        // Currently there is at most one share, so it's default one
        return Object.values(cacheRef.current)[0]?.meta;
    };
    const getLinkMeta = (shareId: string, linkId: string) => cacheRef.current[shareId].links[linkId]?.meta;
    const getLinkKeys = (shareId: string, linkId: string) => cacheRef.current[shareId].links[linkId]?.keys;
    const getTrashComplete = (shareId: string) => cacheRef.current[shareId].trash.complete;
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

    const getFoldersOnlyLinkMetas = (shareId: string, linkId: string) => {
        const links = getFoldersOnlyLinks(shareId, linkId);
        return links?.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const setShareKeys = (keys: ShareKeys, shareID: string) => {
        cacheRef.current[shareID] = {
            ...cacheRef.current[shareID],
            keys
        };
    };

    const setShareMeta = (meta: ShareMeta) => {
        const shareID = meta.ShareID;
        cacheRef.current[shareID] = {
            ...cacheRef.current[shareID],
            meta
        };
        setRerender((old) => ++old);
    };

    const setEmptyShares = (ids: string[]) => {
        ids.forEach((id) => {
            cacheRef.current[id] = {
                links: {},
                trash: { complete: false, list: [], unlisted: [] }
            };
        });
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
                const trash = cacheRef.current[shareId].trash;

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

                trash.list = trash.list.filter((id) => meta.LinkID !== id);
                trash.unlisted = trash.unlisted.filter((id) => meta.LinkID !== id);

                if (!softDelete) {
                    const links = cacheRef.current[shareId].links;
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
            emptyShares: setEmptyShares
        },
        get: {
            trashMetas: getTrashMetas,
            trashComplete: getTrashComplete,
            trashChildLinks: getTrashChildLinks,
            defaultShareMeta: getDefaultShareMeta,
            childrenComplete: getChildrenComplete,
            childLinkMetas: getChildLinkMetas,
            childLinks: getChildLinks,
            listedChildLinks: getListedChildLinks,
            foldersOnlyLinkMetas: getFoldersOnlyLinkMetas,
            listedFoldersOnlyLinks: getListedFoldersOnlyLinks,
            foldersOnlyComplete: getfoldersOnlyComplete,
            linkMeta: getLinkMeta,
            linkKeys: getLinkKeys,
            shareMeta: getShareMeta,
            shareKeys: getShareKeys,
            shareIds: getShareIds
        },
        delete: {
            links: deleteLinks
        }
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

export default DriveCacheProvider;
