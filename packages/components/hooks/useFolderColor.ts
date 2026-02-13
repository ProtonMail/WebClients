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

    const getParentFolderColor = ({ ParentID, Color }: Folder): string | undefined => {
        // ParentID is undefined for root folder
        if (!ParentID) {
            return Color;
        }

        const folder = folderMap[ParentID];

        if (folder) {
            return getParentFolderColor(folder);
        }

        return undefined;
    };

    return getParentFolderColor(folder);
};

export default useFolderColor;
