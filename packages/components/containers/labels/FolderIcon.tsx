import React from 'react';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { Icon } from '../../components';
import { useFolderColor } from '../../hooks';
import { Props as IconProps } from '../../components/icon/Icon';

interface Props extends Omit<IconProps, 'name'> {
    folder: FolderWithSubFolders;
    name?: string;
}

const getIconName = (isParent: boolean, color?: string) => {
    if (isParent) {
        return color ? 'parent-folder-filled' : 'parent-folder';
    }
    return color ? 'folder-filled' : 'folder';
};

const FolderIcon = ({ folder, name, ...rest }: Props) => {
    const isParent = !!folder.subfolders?.length;
    const color = useFolderColor(folder);

    return <Icon name={name || getIconName(isParent, color)} color={color} alt={folder.Name} {...rest} />;
};

export default FolderIcon;
