import { type FC, memo } from 'react';
import { Link } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms';
import { ItemTag } from '@proton/pass/components/Item/List/ItemTag';
import type { ItemRevision } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './PinnedItem.scss';

export const PINNED_ITEM_MAX_WIDTH_PX = 150;

type Props = ButtonLikeProps<any> & {
    item: ItemRevision;
    active?: boolean;
    className?: string;
};

const PinnedItemRaw: FC<Props> = ({ item, active = false, className, ...rest }) => (
    <ButtonLike
        as={Link}
        to="#"
        className={clsx('pass-pinned-list--item shrink-0 button-xs', className, active && 'is-active')}
        color="weak"
        shape="ghost"
        size="small"
        {...rest}
    >
        <ItemTag {...item} />
    </ButtonLike>
);

export const PinnedItem = memo(PinnedItemRaw);
