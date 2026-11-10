import { type FC, type ReactElement, isValidElement } from 'react';

import type { IconComponent, IconComponentProps } from '@proton/icons/component';

import type { Maybe } from '../../../types/utils';

export type IconSlotValue = IconComponent | ReactElement;

// Not `typeof icon === 'function'`: generated Ic* icons are forwardRef objects.
export const isIconComponent = (icon: Maybe<IconSlotValue>): icon is IconComponent =>
    icon != null && !isValidElement(icon);

type Props = IconComponentProps & { icon: Maybe<IconSlotValue> };

/** Renders an icon component with the slot's props, or a pre-rendered element as is. */
export const IconSlot: FC<Props> = ({ icon: Icon, ...props }) => (isIconComponent(Icon) ? <Icon {...props} /> : Icon);
