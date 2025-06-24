import type { MouseEvent } from 'react';
import { type FC, type RefObject, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import type { ContextMenuElement, ContextMenuItem } from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import { itemPinIntent, itemUnpinIntent } from '@proton/pass/store/actions';
import type { Item, ItemRevision, Maybe } from '@proton/pass/types';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';

const getItemId = (item: ItemRevision) => `item-${item.itemId}`;

const isEmpty = (value: Maybe<string | ObfuscatedItemProperty>) => {
    if (value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        return value.length === 0;
    }

    return value.m.length === 0 && value.v.length === 0;
};

const getItemCopyButtons = (item: Item): ContextMenuItem[] => {
    switch (item.type) {
        case 'login':
            return [
                {
                    type: 'button',
                    icon: 'user',
                    name: c('Action').t`Copy username`,
                    copy: item.content.itemUsername,
                },
                { type: 'button', icon: 'envelope', name: c('Action').t`Copy email`, copy: item.content.itemEmail },
                { type: 'button', icon: 'key', name: c('Action').t`Copy password`, copy: item.content.password },
            ];
        case 'creditCard':
            return [
                {
                    type: 'button',
                    icon: 'user',
                    name: c('Action').t`Copy name on card`,
                    copy: item.content.cardholderName,
                },
                {
                    type: 'button',
                    icon: 'credit-card',
                    name: c('Action').t`Copy card number`,
                    copy: item.content.number,
                },
                {
                    type: 'button',
                    icon: 'calendar-today',
                    name: c('Action').t`Copy expiration date`,
                    copy: item.content.expirationDate,
                },
                {
                    type: 'button',
                    icon: 'shield',
                    name: c('Action').t`Copy security code`,
                    copy: item.content.verificationNumber,
                },
            ];
        case 'note':
            return [{ type: 'button', icon: 'key', name: c('Action').t`Copy note content`, copy: item.metadata.note }];
        default:
            return [];
    }
};

const getItemActionButtons = (
    handleEdit: () => void,
    handleMove: () => void,
    handlePinClick: () => void,
    handleTrash: () => void
): ContextMenuItem[] => {
    return [
        {
            type: 'button',
            icon: 'pen',
            name: c('Action').t`Edit`,
            action: handleEdit,
        },
        {
            type: 'button',
            icon: 'folder-arrow-in',
            name: c('Action').t`Move to another vault`,
            action: handleMove,
        },
        {
            type: 'button',
            icon: 'pin-angled',
            name: c('Action').t`Pin`,
            action: handlePinClick,
        },
        {
            type: 'button',
            icon: 'pass-trash',
            name: c('Action').t`Move to trash`,
            action: handleTrash,
        },
    ];
};

type Props = { item: ItemRevision; anchorRef: RefObject<HTMLElement> };

export const ItemsListContextMenu: FC<Props> = ({ item, anchorRef }) => {
    const scope = useItemScope();
    const { selectItem } = useNavigationActions();
    const itemActions = useItemsActions();
    const dispatch = useDispatch();

    const { itemId, shareId } = item;
    const id = getItemId(item);

    if (!item) {
        return null;
    }

    const handleEdit = () => selectItem(shareId, itemId, { view: 'edit', scope });
    const handleMove = () => itemActions.move(item, VaultSelectMode.Writable);
    const handlePinClick = () => dispatch((item.pinned ? itemUnpinIntent : itemPinIntent)({ shareId, itemId }));
    const handleTrash = () => itemActions.trash(item);

    const elements: ContextMenuElement[] = getItemCopyButtons(item.data).filter(({ copy }) => !isEmpty(copy));

    if (elements.length > 0) {
        elements.push({ type: 'separator' });
    }

    elements.push(...getItemActionButtons(handleEdit, handleMove, handlePinClick, handleTrash));

    return (
        <ContextMenu
            key={id} // Force recreate on item change to recompute size
            id={id}
            anchorRef={anchorRef}
            elements={elements}
        />
    );
};

export const useItemContextMenu = () => {
    const [item, setItem] = useState<Maybe<ItemRevision>>(undefined);
    const { open, isOpen } = useContextMenu();

    useEffect(() => {
        // isOpen(undefined) means it's closed
        if (isOpen(undefined)) {
            setItem(undefined);
        }
    }, [isOpen]);

    const onContextMenu = (event: MouseEvent, item: ItemRevision) => {
        setItem(item);
        open(event, getItemId(item));
    };

    return { item, onContextMenu };
};
