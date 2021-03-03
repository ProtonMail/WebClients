import React from 'react';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

import { Icon } from '../../components';
import { useFolderColor } from '../../hooks';
import { Props as IconProps } from '../../components/icon/Icon';

interface Props extends Omit<IconProps, 'name'> {
    folder: Folder;
    name?: string;
}

const getIconName = (isRoot?: boolean, color?: string) => {
    if (isRoot) {
        return color ? 'parent-folder-filled' : 'parent-folder';
    }
    return color ? 'folder-filled' : 'folder';
};

const FolderIcon = ({ folder, name, ...rest }: Props) => {
    const isRoot = !folder.ParentID;
    const color = useFolderColor(folder);

    return <Icon name={name || getIconName(isRoot, color)} color={color} alt={folder.Name} {...rest} />;
};

export default FolderIcon;
