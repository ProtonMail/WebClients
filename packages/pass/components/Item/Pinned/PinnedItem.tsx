import { memo } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ItemTag } from '@proton/pass/components/Item/List/ItemTag';
import type { ItemRevision } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './PinnedItem.scss';

export const PINNED_ITEM_MAX_WIDTH_PX = 150;

type Props = ButtonLikeProps<any> & {
    item: ItemRevision;
    active?: boolean;
    className?: string;
    onClick: (item: ItemRevision) => void;
};

export const PinnedItem = memo(({ item, active = false, className, onClick, ...rest }: Props) => (
    <ButtonLike
        as="a"
        className={clsx('pass-pinned-list--item shrink-0 button-xs', className, active && 'is-active')}
        color="weak"
        shape="ghost"
        size="small"
        onClick={(e: Event) => {
            e.preventDefault();
            onClick(item);
        }}
        {...rest}
    >
        <ItemTag {...item} />
    </ButtonLike>
));

PinnedItem.displayName = 'PinnedItemMemo';
