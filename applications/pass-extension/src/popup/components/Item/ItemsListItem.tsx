import { type VFC, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, type LinkProps } from 'react-router-dom';

import { ButtonLike, type ButtonLikeProps } from '@proton/atoms/Button';
import { Marks } from '@proton/components/components';
import { selectShare } from '@proton/pass/store';
import type { ItemRevisionWithOptimistic, ShareType } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';
import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { ItemIcon } from '../../../shared/components/icon/ItemIcon';
import { presentListItem } from '../../../shared/items';
import { itemTypeToSubThemeClassName } from '../../../shared/theme/sub-theme';
import { VaultIcon } from '../Vault/VaultIcon';

import './ItemsListItem.scss';

const getItemNameSearchChunks = (itemName: string, search: string) => {
    if (!search) {
        return [];
    }

    const regex = new RegExp(escapeRegex(normalize(search)), 'gi');
    return getMatches(regex, normalize(itemName));
};

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
                'pass-item-list--item interactive-pseudo w100 relative',
                optimistic && !failed && 'opacity-50',
                active && 'is-active',
            ])}
            color={failed ? 'warning' : 'weak'}
            shape="ghost"
            {...rest}
        >
            <div className="flex-nowrap flex w100 px-3 py-2 flex-align-items-center">
                <ItemIcon
                    item={item}
                    size={20}
                    className={clsx('mr-3  flex-item-noshrink', itemTypeToSubThemeClassName[data.type])}
                />
                <div className="text-left">
                    <span className="flex flex-align-items-center">
                        {search && (
                            <VaultIcon size="small" icon={vault?.content.display.icon} className="color-weak mr-1" />
                        )}
                        <span className="flex-item-fluid text-ellipsis">
                            <Marks chunks={getItemNameSearchChunks(heading, search)}>{heading}</Marks>
                        </span>
                    </span>
                    <div
                        className={clsx([
                            'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                            item.data.type === 'note' && isEmptyString(item.data.metadata.note) && 'text-italic',
                        ])}
                    >
                        <Marks chunks={getItemNameSearchChunks(subheading, search)}>{subheading}</Marks>
                    </div>
                </div>
            </div>
        </ButtonLike>
    );
};

export const ItemsListItem = memo(ItemsListItemRaw);
