import type { IconName } from '@proton/components/components';

export enum PassIcon {
    ACTIVE = 'protonpass-icon-active',
    DISABLED = 'protonpass-icon-disabled',
    LOCKED = 'protonpass-icon-locked',
    LOCKED_DROPDOWN = 'protonpass-icon-locked-dropdown',
}

export type DropdownIcon = IconName | PassIcon;
