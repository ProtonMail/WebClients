import FolderIcon from '@proton/components/containers/labels/FolderIcon';
import { IcCircleFilled } from '@proton/icons/icons/IcCircleFilled';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import clsx from '@proton/utils/clsx';

import { isCustomFolder, isDefaultFolder, isLabel } from './advancesSearchFieldHelpers';
import type { Item } from './useLocationFieldOptions';

interface Props {
    value: string;
    item: Item;
}

export const LocationFieldDropdownItemIcon = ({ value, item }: Props) => {
    if (isDefaultFolder(item)) {
        const ItemIcon = item.icon;

        if (isCategoryLabel(item.value)) {
            return (
                <ItemIcon
                    // This is here to avoid having the folder color when the item is selected
                    data-color={item.value === value ? undefined : item.color}
                    className={clsx('shrink-0 mr-2', item.className)}
                />
            );
        }

        return <ItemIcon className={'shrink-0 mr-2'} />;
    }

    if (isCustomFolder(item)) {
        return <FolderIcon folder={item.folderEntity} className="shrink-0 mr-2" />;
    }

    if (isLabel(item)) {
        return <IcCircleFilled color={item.color} className="shrink-0 mr-2" />;
    }

    return null;
};
