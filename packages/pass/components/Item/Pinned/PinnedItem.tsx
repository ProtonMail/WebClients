import { memo } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

import type { ItemRevision } from '../../../types';
import { ItemTag } from '../List/ItemTag';

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
        className={clsx('pass-pinned-list--item shrink-0', className, active && 'is-active')}
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
