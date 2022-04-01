import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { Icon } from '../../components';
import { useFolderColor } from '../../hooks';
import { IconProps, IconName } from '../../components/icon/Icon';

interface Props extends Omit<IconProps, 'name'> {
    folder: FolderWithSubFolders;
    name?: IconName;
}

const getIconName = (isParent: boolean, color?: string, name?: IconName) => {
    let iconName: IconName;

    if (isParent) {
        iconName = color ? 'folders-filled' : 'folders';
    } else {
        iconName = color ? 'folder-filled' : name || 'folder';
    }

    return iconName;
};

const FolderIcon = ({ folder, name, ...rest }: Props) => {
    const isParent = !!folder.subfolders?.length;
    const color = useFolderColor(folder);

    return <Icon name={getIconName(isParent, color, name)} color={color} alt={folder.Name} {...rest} />;
};

export default FolderIcon;
