import { type VFC, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, type LinkProps } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms/Button';
import { Marks } from '@proton/components/components';
import { ItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemRevisionWithOptimistic, ShareType } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { presentListItem } from './utils';

import './ItemsList.Item.scss';

type Props = Partial<LinkProps> &
    ButtonLikeProps<any> & {
        item: ItemRevisionWithOptimistic;
        search?: string;
        active?: boolean;
    };

const ItemsListItemRaw: VFC<Props> = ({ item, search = '', active = false, ...rest }) => {
    const { data, optimistic, failed, shareId } = item;
    const { heading, subheading } = presentListItem(item);
    const vault = useSelector(selectShare<ShareType.Vault>(shareId));

    return (
        <ButtonLike
            as={Link}
            to="#"
            className={clsx([
                'pass-item-list--item interactive-pseudo w-full relative',
                optimistic && !failed && 'opacity-50',
                active && 'is-active',
            ])}
            color={failed ? 'warning' : 'weak'}
            shape="ghost"
            {...rest}
        >
            <div className="flex-nowrap flex w-full px-3 py-2 flex-align-items-center">
                <ItemIcon
                    item={item}
                    size={20}
                    className={clsx('mr-3  flex-item-noshrink', itemTypeToSubThemeClassName[data.type])}
                />
                <div className="text-left">
                    <span className="flex flex-align-items-center">
                        {search && (
                            <VaultIcon size={12} icon={vault?.content.display.icon} className="color-weak mr-1" />
                        )}
                        <span className="flex-item-fluid text-ellipsis">
                            <Marks chunks={matchChunks(heading, search)}>{heading}</Marks>
                        </span>
                    </span>
                    <div
                        className={clsx([
                            'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                            item.data.type === 'note' && isEmptyString(item.data.metadata.note.v) && 'text-italic',
                        ])}
                    >
                        <Marks chunks={matchChunks(subheading, search)}>{subheading}</Marks>
                    </div>
                </div>
            </div>
        </ButtonLike>
    );
};

export const ItemsListItem = memo(ItemsListItemRaw);
