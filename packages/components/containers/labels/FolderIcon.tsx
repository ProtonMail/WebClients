import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { Icon } from '../../components';
import { useFolderColor } from '../../hooks';
import { Props as IconProps } from '../../components/icon/Icon';

interface Props extends Omit<IconProps, 'name'> {
    folder: FolderWithSubFolders;
    name?: string;
}

const getIconName = (isParent: boolean, color?: string, name?: string) => {
    let iconName;
    if (isParent) {
        iconName = color ? 'parent-folder-filled' : 'parent-folder';
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
