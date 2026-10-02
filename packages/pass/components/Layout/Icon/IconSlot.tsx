import type { FC, ReactElement } from 'react';

import type { IconComponent, IconComponentProps } from '@proton/icons/component';

import type { Maybe } from '../../../types';

export type IconSlotValue = IconComponent | ReactElement;

export const isIconComponent = (icon: Maybe<IconSlotValue>): icon is IconComponent => typeof icon === 'function';

type Props = IconComponentProps & { icon: Maybe<IconSlotValue> };

/** Renders an icon component with the slot's props, or a pre-rendered element as is. */
export const IconSlot: FC<Props> = ({ icon: Icon, ...props }) => (isIconComponent(Icon) ? <Icon {...props} /> : Icon);
