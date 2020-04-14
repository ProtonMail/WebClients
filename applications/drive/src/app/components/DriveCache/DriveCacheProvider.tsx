import React, { createContext, useContext, useRef, useState } from 'react';
import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { FolderLinkMeta, FileLinkMeta, LinkMeta, isFolderLinkMeta } from '../../interfaces/link';
import { ShareMeta } from '../../interfaces/share';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

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

interface CachedFolderLink {
    meta: FolderLinkMeta;
    children: {
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

    const setLinkMeta = (metas: LinkMeta | LinkMeta[], shareId: string) => {
        const links = cacheRef.current[shareId].links;
        const linkMetas = Array.isArray(metas) ? metas : [metas];

        linkMetas.forEach((meta) => {
            if (links[meta.LinkID]) {
                // Special case for active revision: children don't have active revision
                // So keep it if it's arlready loaded (until file edit at least)
                const revision = links[meta.LinkID].meta.FileProperties?.ActiveRevision;
                if (!isFolderLinkMeta(meta) && !meta.FileProperties.ActiveRevision && revision) {
                    meta.FileProperties.ActiveRevision = revision;
                }
                links[meta.LinkID].meta = meta;
            } else {
                links[meta.LinkID] = isFolderLinkMeta(meta)
                    ? {
                          meta,
                          children: { complete: false, list: [], unlisted: [] }
                      }
                    : { meta };
            }
        });

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            links
        };

        setRerender((old) => ++old);
    };

    const getChildLinks = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return [...link.children.list, ...link.children.unlisted];
        }

        return undefined;
    };

    const getTrashLinks = (shareId: string) => {
        const trash = cacheRef.current[shareId].trash;
        return [...trash.list, ...trash.unlisted];
    };

    const getListedChildLinks = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.list;
        }

        return undefined;
    };

    const setChildLinkMetas = (
        metas: LinkMeta[],
        shareId: string,
        linkId: string,
        method: 'unlisted' | 'complete' | 'incremental'
    ) => {
        const links = cacheRef.current[shareId].links;
        const parent = links[linkId];

        setLinkMeta(metas, shareId);

        if (isCachedFolderLink(parent)) {
            const existing = getChildLinks(shareId, linkId) || [];
            const linkIds = metas.map(({ LinkID }) => LinkID);

            if (method === 'unlisted') {
                parent.children.unlisted = [
                    ...parent.children.unlisted,
                    ...linkIds.filter((id) => !existing.includes(id))
                ];
            } else {
                parent.children.list = [...parent.children.list, ...linkIds];
                parent.children.unlisted = parent.children.unlisted.filter((id) => !linkIds.includes(id));
                parent.children.complete = method === 'complete' ?? parent.children.complete;
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

        setLinkMeta(metas, shareId);

        const existing = getTrashLinks(shareId);
        const linkIds = metas.map(({ LinkID }) => LinkID);

        if (method === 'unlisted') {
            trash.unlisted = [...trash.unlisted, ...linkIds.filter((id) => !existing.includes(id))];
        } else {
            trash.list = [...trash.list, ...linkIds];
            trash.unlisted = trash.unlisted.filter((id) => !linkIds.includes(id));
            trash.complete = method === 'complete' ?? trash.complete;
        }

        cacheRef.current[shareId] = {
            ...cacheRef.current[shareId],
            trash,
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
    const getChildrenComplete = (shareId: string, linkId: string) => {
        const link = cacheRef.current[shareId].links[linkId];

        if (link && isCachedFolderLink(link)) {
            return link.children.complete;
        }

        return undefined;
    };

    const getChildLinkMetas = (shareId: string, linkId: string) => {
        const links = getChildLinks(shareId, linkId);
        return links?.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
    };

    const getShareTrashMetas = (shareId: string) => {
        const links = getTrashLinks(shareId);
        return links.map((childLinkId) => getLinkMeta(shareId, childLinkId)).filter(isTruthy);
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

    const deleteLinks = (shareId: string, linkIds: string[], softDelete = false) => {
        linkIds.forEach((id) => {
            const meta = getLinkMeta(shareId, id);

            if (meta) {
                const parentLinkId = meta.ParentLinkID;
                const parent = cacheRef.current[shareId].links[parentLinkId];
                const trash = cacheRef.current[shareId].trash;

                if (parent && isCachedFolderLink(parent)) {
                    parent.children.list = parent.children.list.filter((id) => meta.LinkID !== id);
                    parent.children.unlisted = parent.children.unlisted.filter((id) => meta.LinkID !== id);
                }

                trash.list = trash.list.filter((id) => meta.LinkID !== id);
                trash.unlisted = trash.unlisted.filter((id) => meta.LinkID !== id);

                if (!softDelete) {
                    delete cacheRef.current[shareId].links[meta.LinkID];
                }
            }
        });
        setRerender((old) => ++old);
    };

    return {
        set: {
            trashLinkMetas: setTrashLinkMetas,
            childLinkMetas: setChildLinkMetas,
            linkMeta: setLinkMeta,
            linkKeys: setLinkKeys,
            shareMeta: setShareMeta,
            shareKeys: setShareKeys,
            emptyShares: setEmptyShares
        },
        get: {
            shareTrashMetas: getShareTrashMetas,
            trashComplete: getTrashComplete,
            defaultShareMeta: getDefaultShareMeta,
            childrenComplete: getChildrenComplete,
            childLinkMetas: getChildLinkMetas,
            childLinks: getChildLinks,
            listedChildLinks: getListedChildLinks,
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
