import { Icon, useFolderColor } from '@proton/components';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import type { FolderInfo } from '../../helpers/labels';

interface Props {
    folderInfo: FolderInfo;
}

const ItemIcon = ({ folderInfo }: Props) => {
    const folder = { Name: folderInfo.name, Color: folderInfo.color, ParentID: folderInfo.parentID } as Folder;
    const color = useFolderColor(folder);

    if (folderInfo.icon !== 'folder') {
        return <Icon name={folderInfo.icon} alt={folderInfo.name} />;
    }

    return <Icon name={color ? 'folder-filled' : 'folder'} color={color} alt={folderInfo.name} />;
};

export default ItemIcon;
