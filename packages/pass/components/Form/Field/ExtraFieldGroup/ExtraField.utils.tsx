import { c } from 'ttag';

import type { IconComponent } from '@proton/icons/component';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft';
import noop from '@proton/utils/noop';

import type { DeobfuscatedItemExtraField, ExtraFieldType } from '../../../../types';

export const createExtraField = <T extends ExtraFieldType>(type: T): DeobfuscatedItemExtraField => {
    switch (type) {
        case 'text':
        case 'hidden':
            return { type, fieldName: '', data: { content: '' } };
        case 'totp':
            return { type, fieldName: '', data: { totpUri: '' } };
        case 'timestamp':
            return { type, fieldName: '', data: { timestamp: '' } };
        default:
            throw new Error('Unsupported field type');
    }
};

type ExtraFieldOption = {
    value: ExtraFieldType;
    icon: IconComponent;
    label: string;
    placeholder?: string;
    onClick: () => void;
};

export const getExtraFieldOptions = (onClick?: (type: ExtraFieldType) => void): ExtraFieldOption[] => [
    {
        value: 'text',
        icon: IcTextAlignLeft,
        label: c('Label').t`Text`,
        placeholder: c('Placeholder').t`Add text`,
        onClick: onClick?.bind(null, 'text') ?? noop,
    },
    {
        value: 'totp',
        icon: IcLock,
        label: c('Label').t`2FA secret key (TOTP)`,
        placeholder: c('Placeholder').t`Add 2FA secret key`,
        onClick: onClick?.bind(null, 'totp') ?? noop,
    },
    {
        value: 'hidden',
        icon: IcEyeSlash,
        // translator: label for a field that is hidden. Singular only.
        label: c('Label').t`Hidden`,
        placeholder: c('Placeholder').t`Add hidden text`,
        onClick: onClick?.bind(null, 'hidden') ?? noop,
    },
    {
        value: 'timestamp',
        icon: IcCalendarGrid,
        label: c('Label').t`Date`,
        onClick: onClick?.bind(null, 'timestamp') ?? noop,
    },
];

export const getExtraFieldOption = (type: ExtraFieldType) =>
    getExtraFieldOptions().find((field) => field.value === type)!;
