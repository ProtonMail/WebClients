// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import Icon from '@proton/components/components/icon/Icon';
import useFolderColor from '@proton/components/hooks/useFolderColor';
import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcFolderFilled } from '@proton/icons/icons/IcFolderFilled';
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

    return color ? (
        <IcFolderFilled color={color} alt={folderInfo.name} />
    ) : (
        <IcFolder color={color} alt={folderInfo.name} />
    );
};

export default ItemIcon;
