import { NodeType, useDrive } from '@proton/drive/index';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { useSidebarStore } from './useSidebar.store';

export const useSidebarFolders = () => {
    const { drive } = useDrive();
    const { setItem, getItem, updateItem } = useSidebarStore();

    const loadFolderChildren = async (folderUid: string) => {
        const parent = getItem(folderUid);
        if (!parent) {
            console.error(`Cannot load children for folder ${folderUid} since it's not in the store`);
            return;
        }

        updateItem(folderUid, { hasLoadedChildren: false, isLoading: true });
        try {
            for await (const maybeNode of drive.iterateFolderChildren(folderUid)) {
                const { node } = getNodeEntity(maybeNode);
                if (node.type === NodeType.Folder) {
                    setItem({
                        uid: node.uid,
                        name: node.name,
                        parentUid: folderUid,
                        isLoading: false,
                        isExpanded: false,
                        level: parent.level + 1,
                        hasLoadedChildren: false,
                    });
                }
            }
        } catch (error) {
            // TODO:WIP handle error
            console.error(`Failed to load children for folder ${folderUid}:`, error);
        } finally {
            updateItem(folderUid, { hasLoadedChildren: true, isLoading: false });
        }
    };

    return {
        loadFolderChildren,
    };
};
