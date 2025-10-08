import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import type { IconProps } from '../../components/icon/Icon';
import useFolderColor from '../../hooks/useFolderColor';

interface Props extends Omit<IconProps, 'name'> {
    folder: FolderWithSubFolders;
    name?: IconName;
    alt?: string;
    dataColor?: string;
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

const FolderIcon = ({ folder, name, alt = folder.Name, dataColor, ...rest }: Props) => {
    const isParent = !!folder.subfolders?.length;
    const color = useFolderColor(folder);

    return <Icon name={getIconName(isParent, color, name)} color={color} alt={alt} {...rest} data-color={dataColor} />;
};

export default FolderIcon;
