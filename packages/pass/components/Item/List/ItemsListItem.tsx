import type { DragEvent, DragEventHandler } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import Marks from '@proton/components/components/text/Marks';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { ItemIcon, ItemIconIndicators, SafeItemIcon } from '@proton/pass/components/Layout/Icon/ItemIcon';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useItemOptimisticState } from '@proton/pass/hooks/useItem';
import type { DraggableItem } from '@proton/pass/hooks/useItemDrag';
import { useItemLoading } from '@proton/pass/hooks/useItemLoading';
import { isDisabledAliasItem } from '@proton/pass/lib/items/item.predicates';
import { matchChunks } from '@proton/pass/lib/search/match-chunks';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectShare } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';

import { presentListItem } from './utils';

import './ItemsListItem.scss';

type Props = {
    active?: boolean;
    bulk?: boolean;
    draggable?: boolean;
    id: string;
    item: ItemRevision;
    search?: string;
    selected?: boolean;
    onDragEnd?: DragEventHandler;
    onDragStart?: (event: DragEvent, item: DraggableItem) => void;
    onSelect: (item: ItemRevision, metaKey: boolean) => void;
};

export const ItemsListItem = memo(
    ({
        id,
        bulk,
        item,
        active = false,
        search = '',
        draggable = false,
        selected,
        onDragStart,
        onDragEnd,
        onSelect,
    }: Props) => {
        const { data, shareId, itemId } = item;
        const { heading, subheading } = presentListItem(item);

        const share = useSelector(selectShare(shareId));
        const { failed, optimistic } = useItemOptimisticState(shareId, itemId);

        const loading = useItemLoading(item) || optimistic;
        const writable = (share && isWritableVault(share)) ?? false;
        const aliasDisabled = isDisabledAliasItem(item);
        const shared = Boolean(item.shareCount);
        const isVault = share && isVaultShare(share);

        const canDrag = draggable && !loading && !failed;

        return (
            <div className={clsx(bulk && 'px-1 py-0.5')}>
                <ButtonLike
                    as="a"
                    href="#"
                    id={id}
                    draggable={canDrag}
                    className={clsx([
                        'pass-item-list--item interactive-pseudo w-full',
                        bulk && 'pass-item-list--item-bulk',
                        bulk && selected && 'pass-item-list--item-bulk-selected',
                        bulk && (!writable || loading) && 'pointer-events-none opacity-50',
                        active && 'is-active',
                    ])}
                    color={failed ? 'warning' : 'weak'}
                    shape="ghost"
                    style={{ '--anime-opacity': loading ? '0.5' : '1' }}
                    onClick={(e) => {
                        e.preventDefault();
                        onSelect(item, e.ctrlKey || e.metaKey);
                    }}
                    onDragStart={(evt: DragEvent) => canDrag && onDragStart?.(evt, { ID: id })}
                    onDragEnd={onDragEnd}
                >
                    <div className={clsx('flex-nowrap flex w-full items-center', bulk ? 'px-2 py-1.5' : 'px-3 py-2')}>
                        <SafeItemIcon
                            item={item}
                            size={5}
                            className={clsx(
                                'mr-3 shrink-0 relative',
                                itemTypeToSubThemeClassName[data.type],
                                aliasDisabled && 'pass-item-icon--disabled'
                            )}
                            iconClassName={clsx(loading && 'opacity-50')}
                            renderIndicators={(size) => (
                                <>
                                    {bulk ? (
                                        <ItemIcon
                                            alt=""
                                            className={
                                                'ui-standard absolute bulk-select-check pass-item-list--checkmark'
                                            }
                                            icon={'checkmark'}
                                            loadImage={false}
                                            normColor={false}
                                            pill
                                            size={5}
                                        />
                                    ) : (
                                        <ItemIconIndicators size={size} loading={loading} error={failed} />
                                    )}

                                    {item.pinned && (
                                        <IconBox
                                            size={2.5}
                                            mode="transparent"
                                            className={clsx(
                                                'pass-item-list--item--pin absolute bottom-custom right-custom flex items-center justify-center',
                                                itemTypeToSubThemeClassName[data.type]
                                            )}
                                            style={{ '--bottom-custom': '-6px', '--right-custom': '-6px' }}
                                        >
                                            <Icon
                                                name="pin-angled-filled"
                                                size={2.75}
                                                className="absolute inset-center"
                                            />
                                        </IconBox>
                                    )}
                                </>
                            )}
                        />

                        <div className={clsx('text-left', loading && !failed && 'opacity-50')}>
                            <span className="flex items-center gap-x-1 flex-nowrap">
                                {search && isVault && (
                                    <VaultIcon
                                        size={3}
                                        icon={share?.content.display.icon}
                                        className="color-weak shrink-0"
                                    />
                                )}
                                <span className="text-ellipsis">
                                    <Marks chunks={matchChunks(heading, search)}>{heading}</Marks>
                                </span>
                                {shared && <Icon name="users-filled" size={3.5} className="shrink-0" />}
                            </span>
                            <div
                                className={clsx([
                                    'pass-item-list--subtitle block color-weak text-sm text-ellipsis',
                                    item.data.type === 'note' &&
                                        isEmptyString(item.data.metadata.note.v) &&
                                        'text-italic',
                                ])}
                            >
                                <Marks chunks={matchChunks(subheading, search)}>{subheading}</Marks>
                            </div>
                        </div>
                    </div>
                </ButtonLike>
            </div>
        );
    }
);

ItemsListItem.displayName = 'ItemsListItemMemo';
