import { useCallback, useEffect, useMemo, useState } from 'react';
import { c } from 'ttag';

import useDrive from '../../../../hooks/drive/useDrive';
import { useDriveCache } from '../../../DriveCache/DriveCacheProvider';

export interface Folder {
    shareId: string;
    linkId: string;
    name: string;
    expanded: boolean;
    loaded: boolean;
    subfolders: Folder[];
}

export default function useFolders(shareId: string, rootLinkId: string) {
    const cache = useDriveCache();
    const { getFoldersOnlyMetas } = useDrive();

    const [rootFolder, setFolderTree] = useState<Folder>({
        shareId,
        linkId: rootLinkId,
        name: c('Title').t`My files`,
        expanded: false,
        loaded: false,
        subfolders: [],
    });

    // Reset the whole tree when share info changed.
    useEffect(() => {
        setFolderTree({
            shareId,
            linkId: rootLinkId,
            name: c('Title').t`My files`,
            expanded: false,
            loaded: false,
            subfolders: [],
        });
    }, [shareId, rootLinkId]);

    // Update local folder tree when cache updated.
    useEffect(() => {
        const syncFolderWithCache = (folder: Folder): Folder => {
            const children = cache.get.foldersOnlyLinkMetas(shareId, folder.linkId);
            const complete = cache.get.foldersOnlyComplete(shareId, folder.linkId);
            folder.loaded = !!complete;
            if (!children) {
                folder.subfolders = [];
            } else {
                const newIds = children.map(({ LinkID }) => LinkID);
                const prevItems = folder.loaded
                    ? folder.subfolders
                          .filter(({ linkId }) => newIds.includes(linkId))
                          .map((subfolder) => {
                              const item = children.find((item) => item.LinkID === subfolder.linkId);
                              if (item && item.Name !== subfolder.name) {
                                  return { ...subfolder, name: item.Name };
                              }
                              return subfolder;
                          })
                    : folder.subfolders;

                const currentIds = folder.subfolders.map(({ linkId }) => linkId);
                const newItems = children
                    .filter((item) => !currentIds.includes(item.LinkID) && !item.Trashed)
                    .map((item) => ({
                        shareId,
                        linkId: item.LinkID,
                        name: item.Name,
                        expanded: false,
                        loaded: false,
                        subfolders: [],
                    }));

                folder.subfolders = [...prevItems, ...newItems].map(syncFolderWithCache);
                folder.subfolders.sort((a, b) => {
                    const nameA = a.name.toUpperCase();
                    const nameB = b.name.toUpperCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    return nameA > nameB ? 1 : 0;
                });
            }
            return { ...folder };
        };

        setFolderTree((state: Folder) => syncFolderWithCache(state));
    }, [shareId, cache]);

    const loadSubfolders = useCallback(
        (linkId: string) => {
            const recursiveLoader = async () => {
                await getFoldersOnlyMetas(shareId, linkId, true);
                const complete = cache.get.foldersOnlyComplete(shareId, linkId);
                if (!complete) {
                    recursiveLoader().catch(console.error);
                }
            };
            recursiveLoader().catch(console.error);
        },
        [shareId]
    );

    // Load root childs automatically so its clear whether to show expand button or not.
    useEffect(() => {
        if (!rootFolder.loaded) {
            loadSubfolders(rootLinkId);
        }
    }, [rootFolder, rootLinkId, loadSubfolders]);

    const toggleExpand = useCallback(
        (linkId: string) => {
            setFolderTree((state: Folder) => {
                const updateFolder = (folder: Folder) => {
                    if (folder.linkId === linkId) {
                        if (!folder.expanded && !folder.loaded) {
                            loadSubfolders(folder.linkId);
                        }
                        folder.expanded = !folder.expanded;
                    }
                    folder.subfolders = folder.subfolders.map(updateFolder);
                    return { ...folder };
                };
                return updateFolder(state);
            });
        },
        [loadSubfolders]
    );

    const deepestOpenedLevel = useMemo(() => getDeepestOpenedLevel(rootFolder), [rootFolder]);

    return {
        deepestOpenedLevel,
        rootFolder,
        toggleExpand,
    };
}

function getDeepestOpenedLevel(folder: Folder, level = 0): number {
    if (!folder.expanded || !folder.subfolders.length) {
        return level;
    }
    const levels = folder.subfolders.map((subfolder) => getDeepestOpenedLevel(subfolder, level + 1));
    return Math.max(...levels);
}
