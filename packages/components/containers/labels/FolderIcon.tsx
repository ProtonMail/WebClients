import type { IconComponent, IconComponentProps } from '@proton/icons/component';
import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcFolderFilled } from '@proton/icons/icons/IcFolderFilled';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcFoldersFilled } from '@proton/icons/icons/IcFoldersFilled';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import useFolderColor from '../../hooks/useFolderColor';

interface Props extends IconComponentProps {
    folder: FolderWithSubFolders;
    icon?: IconComponent;
    alt?: string;
    dataColor?: string;
}

const FolderIcon = ({ folder, icon, alt = folder.Name, dataColor, style, ...rest }: Props) => {
    const isParent = !!folder.subfolders?.length;
    const color = useFolderColor(folder);
    const mergedStyle = color ? { color, ...style } : style;
    const commonProps = { alt, 'data-color': dataColor, style: mergedStyle, ...rest };

    if (isParent) {
        return color ? <IcFoldersFilled {...commonProps} /> : <IcFolders {...commonProps} />;
    }

    if (color) {
        return <IcFolderFilled {...commonProps} />;
    }

    if (icon) {
        const NamedIcon = icon;
        return <NamedIcon {...commonProps} />;
    }

    return <IcFolder {...commonProps} />;
};

export default FolderIcon;
