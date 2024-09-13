import Icon from '@proton/components/components/icon/Icon';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import type { IconName, IconProps } from '../../components/icon/Icon';
import { useFolderColor } from '../../hooks';

interface Props extends Omit<IconProps, 'name'> {
    folder: FolderWithSubFolders;
    name?: IconName;
    alt?: string;
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

const FolderIcon = ({ folder, name, alt = folder.Name, ...rest }: Props) => {
    const isParent = !!folder.subfolders?.length;
    const color = useFolderColor(folder);

    return <Icon name={getIconName(isParent, color, name)} color={color} alt={alt} {...rest} />;
};

export default FolderIcon;
