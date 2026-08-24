import type { FC } from 'react';

import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import type { ItemRevision } from '../../../types';
import { SafeItemIcon } from '../../Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '../../Layout/Theme/types';

export const ITEM_TAG_MAX_WIDTH = 150;

export const ItemTag: FC<ItemRevision> = (item) => (
    <div
        className="flex flex-nowrap items-center gap-2 max-w-custom"
        style={{ '--max-w-custom': `${ITEM_TAG_MAX_WIDTH / rootFontSize()}rem` }}
    >
        <SafeItemIcon
            className={clsx('shrink-0', itemTypeToSubThemeClassName[item.data.type])}
            item={item}
            pill={false}
            size={2.5}
        />
        <div className="text-ellipsis text-sm">{item.data.metadata.name}</div>
    </div>
);
