import type { FC } from 'react';
import { useMemo } from 'react';

import { presentListItem } from '@proton/pass/components/Item/List/utils';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectItem } from '@proton/pass/store/selectors';
import type { SelectedItem } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

export const ItemInviteHeader: FC<SelectedItem> = ({ shareId, itemId }) => {
    const item = useMemoSelector(selectItem, [shareId, itemId])!;
    const { heading, subheading } = useMemo(() => presentListItem(item), [item]);

    return (
        <div className="flex gap-3 flex-nowrap items-center py-3 w-full">
            <SafeItemIcon
                item={item}
                size={5}
                className={clsx('shrink-0 relative', itemTypeToSubThemeClassName[item.data.type])}
            />
            <div className="text-left flex-1">
                <div className="text-ellipsis">{heading}</div>
                <div
                    className={clsx([
                        'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                        item.data.type === 'note' && isEmptyString(item.data.metadata.note.v) && 'text-italic',
                    ])}
                >
                    {subheading}
                </div>
            </div>
        </div>
    );
};
