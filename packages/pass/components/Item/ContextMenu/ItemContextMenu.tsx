import type { FC, RefObject } from 'react';
import { useEffect, useMemo } from 'react';

import { pipe } from 'imask/esm/masked/pipe';
import { c } from 'ttag';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import { useNotifications } from '@proton/app-context/useNotifications';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCalendarToday } from '@proton/icons/icons/IcCalendarToday';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcEye } from '@proton/icons/icons/IcEye';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPassTrash } from '@proton/icons/icons/IcPassTrash';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPinAngled } from '@proton/icons/icons/IcPinAngled';
import { IcPinAngledSlash } from '@proton/icons/icons/IcPinAngledSlash';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';
import { IcUser } from '@proton/icons/icons/IcUser';

import type { ItemActions } from '../../../hooks/items/useItemActions';
import { useItemActions } from '../../../hooks/items/useItemActions';
import type { ItemState } from '../../../hooks/items/useItemState';
import { useItemState } from '../../../hooks/items/useItemState';
import { otpGenerationErrorNotifcation } from '../../../hooks/useOTPCode';
import { getItemKey } from '../../../lib/items/item.utils';
import type { Item, ItemRevisionWithOptimistic, Share } from '../../../types';
import type { ObfuscatedItemProperty } from '../../../types/data/obfuscation';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import { formatExpirationDateMMYY } from '../../../utils/time/expiration-date';
import { ContextMenu } from '../../ContextMenu/ContextMenu';
import type { ContextMenuItemCopy } from '../../ContextMenu/ContextMenuItems';
import {
    CONTEXT_MENU_SEPARATOR,
    type ContextMenuElement,
    type ContextMenuItem,
} from '../../ContextMenu/ContextMenuItems';
import { useContextMenu } from '../../ContextMenu/ContextMenuProvider';
import type { PassCoreContextValue } from '../../Core/PassCoreProvider';
import { usePassCore } from '../../Core/PassCoreProvider';
import { expDateMask } from '../../Form/Field/masks/credit-card';

/** Get context menu copy function when value is not obfuscated */
const fromPlainTextValue = (value: string): ContextMenuItemCopy => (value === '' ? undefined : () => value);

/** Get context menu copy function when value is obfuscated */
const fromObfuscatedValue = (value: ObfuscatedItemProperty) =>
    deobfuscate(value) === '' ? undefined : () => deobfuscate(value);

type GetTotp = (value: ObfuscatedItemProperty) => ContextMenuItemCopy;

/** Get context menu copy function for totp token */
const fromOTPValue =
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
const fromExpirationValue = (content: string) =>
    content.length === 0 ? undefined : () => pipe(formatExpirationDateMMYY(content), expDateMask);

const withItemCondition = (condition: boolean, item: ContextMenuItem): ContextMenuItem[] => (condition ? [item] : []);

/** Returns context menu items to copy item fields depending on item type */
const getItemCopyButtons = (item: Item, getTotp: GetTotp): ContextMenuItem[] => {
    switch (item.type) {
        case 'login':
            return [
                {
                    type: 'button',
                    icon: <IcUser />,
                    name: c('Action').t`Copy username`,
                    copy: fromObfuscatedValue(item.content.itemUsername),
                },
                {
                    type: 'button',
                    icon: <IcEnvelope />,
                    name: c('Action').t`Copy email`,
                    copy: fromObfuscatedValue(item.content.itemEmail),
                },
                {
                    type: 'button',
                    icon: <IcKey />,
                    name: c('Action').t`Copy password`,
                    copy: fromObfuscatedValue(item.content.password),
                },
                {
                    type: 'button',
                    icon: <IcLock />,
                    name: c('Label').t`2FA token (TOTP)`,
                    copy: getTotp(item.content.totpUri),
                },
            ];
        case 'creditCard':
            return [
                {
                    type: 'button',
                    icon: <IcUser />,
                    name: c('Action').t`Copy name on card`,
                    copy: fromPlainTextValue(item.content.cardholderName),
                },
                {
                    type: 'button',
                    icon: <IcCreditCard />,
                    name: c('Action').t`Copy card number`,
                    copy: fromObfuscatedValue(item.content.number),
                },
                {
                    type: 'button',
                    icon: <IcCalendarToday />,
                    name: c('Action').t`Copy expiration date`,
                    copy: fromExpirationValue(item.content.expirationDate),
                },
                {
                    type: 'button',
                    icon: <IcShield />,
                    name: c('Action').t`Copy security code`,
                    copy: fromObfuscatedValue(item.content.verificationNumber),
                },
            ];
        case 'note':
            return [
                {
                    type: 'button',
                    icon: <IcKey />,
                    name: c('Action').t`Copy note content`,
                    copy: fromObfuscatedValue(item.metadata.note),
                },
            ];
        default:
            return [];
    }
};

/** Returns context menu items about actions on the item */
const getItemActionButtons = (itemState: ItemState, itemActions: ItemActions): ContextMenuItem[] => {
    const monitorActions = withItemCondition(itemState.canMonitor, {
        type: 'button',
        icon: itemState.isMonitored ? <IcEyeSlash /> : <IcEye />,
        name: itemState.isMonitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`,
        action: itemActions.onToggleFlags,
    });

    const leaveActions = withItemCondition(itemState.canLeave, {
        type: 'button',
        icon: <IcArrowOutFromRectangle />,
        name: c('Action').t`Leave`,
        action: itemActions.onLeave,
    });

    return itemState.isTrashed
        ? [
              {
                  type: 'button',
                  icon: <IcArrowsRotate />,
                  name: c('Action').t`Restore item`,
                  action: itemActions.onRestore,
                  lock: itemState.isReadOnly,
              },
              {
                  type: 'button',
                  icon: <IcTrashCross />,
                  name: c('Action').t`Delete permanently`,
                  action: itemActions.onDelete,
                  lock: itemState.isReadOnly,
              },
              ...monitorActions,
              ...leaveActions,
          ]
        : [
              ...withItemCondition(!itemState.isReadOnly, {
                  type: 'button',
                  icon: <IcPen />,
                  name: c('Action').t`Edit`,
                  action: itemActions.onEdit,
              }),
              ...withItemCondition(!itemState.isReadOnly, {
                  type: 'button',
                  icon: <IcFolderArrowIn />,
                  name: c('Action').t`Move to another vault`,
                  action: itemActions.onMove,
              }),
              {
                  type: 'button',
                  icon: itemState.isPinned ? <IcPinAngledSlash /> : <IcPinAngled />,
                  name: itemState.isPinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`,
                  action: itemActions.onPin,
                  lock: !itemState.canTogglePinned,
              },
              {
                  type: 'button',
                  icon: <IcClockRotateLeft />,
                  name: c('Action').t`View history`,
                  action: itemActions.onHistory,
                  lock: !itemState.canHistory,
              },
              {
                  type: 'button',
                  icon: <IcPassTrash />,
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

        const getOTPCode = fromOTPValue(generateOTP, createNotification);
        const copyBtns: ContextMenuElement[] = getItemCopyButtons(item.data, getOTPCode).filter(({ copy }) => !!copy);
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
