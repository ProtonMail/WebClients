import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

const useFolderColor = (folder: Folder) => {
    const [folders] = useFolders();
    const [mailSettings] = useMailSettings();

    if (!mailSettings.EnableFolderColor) {
        return undefined;
    }

    if (!mailSettings.InheritParentFolderColor) {
        return folder.Color;
    }

    const folderMap = toMap(folders);

    const visitedParentIDs = new Set<string | number>();
    let current = folder;

    // ParentID is undefined for root folder
    while (current.ParentID) {
        // A cycle in the parent chain would never reach a root folder
        if (visitedParentIDs.has(current.ParentID)) {
            return undefined;
        }
        visitedParentIDs.add(current.ParentID);

        const parent = folderMap[current.ParentID];

        if (!parent) {
            return undefined;
        }

        current = parent;
    }

    return current.Color;
};

export default useFolderColor;
