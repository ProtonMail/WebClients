import { type FC, memo } from 'react';
import { Link } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms/Button';
import { SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import type { ItemRevision } from '@proton/pass/types';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import './PinnedItem.scss';

export const PINNED_ITEM_MAX_WIDTH_PX = 150;

type Props = ButtonLikeProps<any> & {
    item: ItemRevision;
    active?: boolean;
    className?: string;
};

const PinnedItemRaw: FC<Props> = ({ item, active = false, className, ...rest }) => {
    const { data } = item;

    return (
        <ButtonLike
            as={Link}
            to="#"
            className={clsx('pass-pinned-list--item max-w-custom shrink-0 button-xs', className, active && 'is-active')}
            color="weak"
            shape="ghost"
            size="small"
            style={{ '--max-w-custom': `${PINNED_ITEM_MAX_WIDTH_PX / rootFontSize()}rem` }}
            {...rest}
        >
            <div className="flex flex-nowrap items-center gap-2">
                <SafeItemIcon
                    className={clsx('shrink-0', itemTypeToSubThemeClassName[data.type])}
                    item={item}
                    pill={false}
                    size={10}
                />
                <div className="text-ellipsis text-sm">{data.metadata.name}</div>
            </div>
        </ButtonLike>
    );
};

export const PinnedItem = memo(PinnedItemRaw);
