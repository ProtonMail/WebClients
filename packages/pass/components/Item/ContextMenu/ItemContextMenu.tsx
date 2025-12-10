import type { FC, RefObject } from 'react';
import { useEffect, useMemo } from 'react';

import { pipe } from 'imask/esm/masked/pipe';
import { c } from 'ttag';

import type { CreateNotificationOptions } from '@proton/components/containers/notifications/interfaces';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import type { ContextMenuItemCopy } from '@proton/pass/components/ContextMenu/ContextMenuItems';
import {
    CONTEXT_MENU_SEPARATOR,
    type ContextMenuElement,
    type ContextMenuItem,
} from '@proton/pass/components/ContextMenu/ContextMenuItems';
import { useContextMenu } from '@proton/pass/components/ContextMenu/ContextMenuProvider';
import type { PassCoreContextValue } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { expDateMask } from '@proton/pass/components/Form/Field/masks/credit-card';
import type { ItemActions } from '@proton/pass/hooks/items/useItemActions';
import { useItemActions } from '@proton/pass/hooks/items/useItemActions';
import type { ItemState } from '@proton/pass/hooks/items/useItemState';
import { useItemState } from '@proton/pass/hooks/items/useItemState';
import { otpGenerationErrorNotifcation } from '@proton/pass/hooks/useOTPCode';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { Item, ItemRevisionWithOptimistic, Share } from '@proton/pass/types';
import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { formatExpirationDateMMYY } from '@proton/pass/utils/time/expiration-date';

/** Get context menu copy function when value is not obfuscated */
const getClear = (value: string): ContextMenuItemCopy => (value === '' ? undefined : () => value);

/** Get context menu copy function when value is obfuscated */
const getObfuscate = (value: ObfuscatedItemProperty) =>
    deobfuscate(value) === '' ? undefined : () => deobfuscate(value);

type GetTotp = (value: ObfuscatedItemProperty) => ContextMenuItemCopy;

/** Get context menu copy function for totp token */
const getTotpFactory =
    (
        generateOTP: PassCoreContextValue['generateOTP'],
        createNotification: (options: CreateNotificationOptions) => number
    ) =>
    (value: ObfuscatedItemProperty) =>
        deobfuscate(value) === ''
            ? undefined
            : async () => {
                  const otpCode = await generateOTP({ totpUri: deobfuscate(value), type: 'uri' });
                  if (otpCode === null) {
                      createNotification(otpGenerationErrorNotifcation());
                      return null;
                  }
                  return otpCode.token;
              };

/** Get context menu copy function when value is an expiration date */
const getExpiration = (content: string) =>
    content.length === 0 ? undefined : () => pipe(formatExpirationDateMMYY(content), expDateMask);

const conditionalItem = (condition: boolean, item: ContextMenuItem): ContextMenuItem[] => (condition ? [item] : []);

/** Returns context menu items to copy item fields depending on item type */
const getItemCopyButtons = (item: Item, getTotp: GetTotp): ContextMenuItem[] => {
    switch (item.type) {
        case 'login':
            return [
                {
                    type: 'button',
                    icon: 'user',
                    name: c('Action').t`Copy username`,
                    copy: getObfuscate(item.content.itemUsername),
                },
                {
                    type: 'button',
                    icon: 'envelope',
                    name: c('Action').t`Copy email`,
                    copy: getObfuscate(item.content.itemEmail),
                },
                {
                    type: 'button',
                    icon: 'key',
                    name: c('Action').t`Copy password`,
                    copy: getObfuscate(item.content.password),
                },
                {
                    type: 'button',
                    icon: 'lock',
                    name: c('Label').t`2FA token (TOTP)`,
                    copy: getTotp(item.content.totpUri),
                },
            ];
        case 'creditCard':
            return [
                {
                    type: 'button',
                    icon: 'user',
                    name: c('Action').t`Copy name on card`,
                    copy: getClear(item.content.cardholderName),
                },
                {
                    type: 'button',
                    icon: 'credit-card',
                    name: c('Action').t`Copy card number`,
                    copy: getObfuscate(item.content.number),
                },
                {
                    type: 'button',
                    icon: 'calendar-today',
                    name: c('Action').t`Copy expiration date`,
                    copy: getExpiration(item.content.expirationDate),
                },
                {
                    type: 'button',
                    icon: 'shield',
                    name: c('Action').t`Copy security code`,
                    copy: getObfuscate(item.content.verificationNumber),
                },
            ];
        case 'note':
            return [
                {
                    type: 'button',
                    icon: 'key',
                    name: c('Action').t`Copy note content`,
                    copy: getObfuscate(item.metadata.note),
                },
            ];
        default:
            return [];
    }
};

/** Returns context menu items about actions on the item */
const getItemActionButtons = (itemState: ItemState, itemActions: ItemActions): ContextMenuItem[] => {
    const monitorActions = conditionalItem(itemState.canMonitor, {
        type: 'button',
        icon: itemState.isMonitored ? 'eye-slash' : 'eye',
        name: itemState.isMonitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`,
        action: itemActions.onToggleFlags,
    });

    const leaveActions = conditionalItem(itemState.canLeave, {
        type: 'button',
        icon: 'arrow-out-from-rectangle',
        name: c('Action').t`Leave`,
        action: itemActions.onLeave,
    });

    return itemState.isTrashed
        ? [
              {
                  type: 'button',
                  icon: 'arrows-rotate',
                  name: c('Action').t`Restore item`,
                  action: itemActions.onRestore,
                  lock: itemState.isReadOnly,
              },
              {
                  type: 'button',
                  icon: 'trash-cross',
                  name: c('Action').t`Delete permanently`,
                  action: itemActions.onDelete,
                  lock: itemState.isReadOnly,
              },
              ...monitorActions,
              ...leaveActions,
          ]
        : [
              ...conditionalItem(!itemState.isReadOnly, {
                  type: 'button',
                  icon: 'pen',
                  name: c('Action').t`Edit`,
                  action: itemActions.onEdit,
              }),
              ...conditionalItem(!itemState.isReadOnly, {
                  type: 'button',
                  icon: 'folder-arrow-in',
                  name: c('Action').t`Move to another vault`,
                  action: itemActions.onMove,
              }),
              {
                  type: 'button',
                  icon: itemState.isPinned ? 'pin-angled-slash' : 'pin-angled',
                  name: itemState.isPinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`,
                  action: itemActions.onPin,
                  lock: !itemState.canTogglePinned,
              },
              {
                  type: 'button',
                  icon: 'clock-rotate-left',
                  name: c('Action').t`View history`,
                  action: itemActions.onHistory,
                  lock: !itemState.canHistory,
              },
              {
                  type: 'button',
                  icon: 'pass-trash',
                  name: c('Action').t`Move to trash`,
                  action: itemActions.onTrash,
                  lock: itemState.isReadOnly,
              },
              ...monitorActions,
              ...leaveActions,
          ];
};

type Props = { item: ItemRevisionWithOptimistic; share: Share; anchorRef: RefObject<HTMLElement> };

export const ItemContextMenu: FC<Props> = ({ item, share, anchorRef }) => {
    const id = getItemKey(item);

    const { generateOTP } = usePassCore();
    const { createNotification } = useNotifications();

    const { close, state } = useContextMenu();
    const itemState = useItemState(item, share);
    const itemActions = useItemActions(item);

    const elements: ContextMenuElement[] = useMemo(() => {
        if (item.failed) return [];

        const getTotp = getTotpFactory(generateOTP, createNotification);
        const copyBtns: ContextMenuElement[] = getItemCopyButtons(item.data, getTotp).filter(({ copy }) => !!copy);
        const actionBtns = getItemActionButtons(itemState, itemActions);
        const separator = copyBtns.length > 0 && actionBtns.length > 0 ? [CONTEXT_MENU_SEPARATOR] : [];

        return copyBtns.concat(separator, actionBtns);
    }, [item, itemState, itemActions]);

    const itemOpened = state?.id === getItemKey(item);
    const autoClose = elements.length === 0 && itemOpened;

    useEffect(() => {
        if (autoClose) close();
    }, [autoClose]);

    return (
        <ContextMenu
            key={id} // Force recreate on item change to recompute size
            id={id}
            anchorRef={anchorRef}
            elements={elements}
        />
    );
};
