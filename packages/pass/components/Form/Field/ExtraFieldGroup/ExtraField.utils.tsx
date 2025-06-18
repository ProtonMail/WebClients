import { c } from 'ttag';

import type { IconName } from '@proton/components';
import type { DeobfuscatedItemExtraField, ExtraFieldType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

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
    icon: IconName;
    label: string;
    placeholder?: string;
    onClick: () => void;
};

export const getExtraFieldOptions = (onClick?: (type: ExtraFieldType) => void): ExtraFieldOption[] => [
    {
        value: 'text',
        icon: 'text-align-left',
        label: c('Label').t`Text`,
        placeholder: c('Placeholder').t`Add text`,
        onClick: onClick?.bind(null, 'text') ?? noop,
    },
    {
        value: 'totp',
        icon: 'lock',
        label: c('Label').t`2FA secret key (TOTP)`,
        placeholder: c('Placeholder').t`Add 2FA secret key`,
        onClick: onClick?.bind(null, 'totp') ?? noop,
    },
    {
        value: 'hidden',
        icon: 'eye-slash',
        // translator: label for a field that is hidden. Singular only.
        label: c('Label').t`Hidden`,
        placeholder: c('Placeholder').t`Add hidden text`,
        onClick: onClick?.bind(null, 'hidden') ?? noop,
    },
    {
        value: 'timestamp',
        icon: 'calendar-grid',
        label: c('Label').t`Date`,
        onClick: onClick?.bind(null, 'timestamp') ?? noop,
    },
];

export const getExtraFieldOption = (type: ExtraFieldType) =>
    getExtraFieldOptions().find((field) => field.value === type)!;
