import type { IconName } from '@proton/components';

export enum PassIconStatus {
    ACTIVE = 'protonpass-icon-active',
    DISABLED = 'protonpass-icon-disabled',
    LOCKED = 'protonpass-icon-locked',
    LOCKED_DROPDOWN = 'protonpass-icon-locked-dropdown',
}

const PassIconStatusValues = Object.values(PassIconStatus) as string[];

export const isPassIcon = (icon: PassIconStatus | string): icon is PassIconStatus =>
    PassIconStatusValues.includes(icon);

export type DropdownIcon = IconName | PassIconStatus;
