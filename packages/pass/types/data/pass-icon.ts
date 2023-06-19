import type { IconName } from '@proton/components/components';

export enum PassIcon {
    ACTIVE = 'protonpass-icon-active',
    INACTIVE = 'protonpass-icon-inactive',
    LOCKED_DARK = 'protonpass-icon-locked-dark',
    LOCKED_LIGHT = 'protonpass-icon-locked-light',
}

export type DropdownIcon = IconName | PassIcon;
