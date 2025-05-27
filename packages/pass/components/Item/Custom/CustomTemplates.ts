import { c } from 'ttag';

import { type IconName } from '@proton/components/components/icon/Icon';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import type { CustomExtraFieldType, DeobfuscatedItemExtraField, ItemCustomType } from '@proton/pass/types';

export type CustomTemplate = {
    label: string;
    icon: IconName;
    type: ItemCustomType;
    fields: { label: string; type: CustomExtraFieldType }[];
};

export type CustomTemplateGroup = {
    label: string;
    theme: SubTheme;
    templates: CustomTemplate[];
};

export const getGroupedTemplates = (): CustomTemplateGroup[] => [
    {
        label: c('Label').t`Technology`,
        theme: SubTheme.VIOLET,
        templates: [
            {
                type: 'custom',
                label: c('Label').t`API Credential`,
                icon: 'code',
                fields: [
                    { label: c('Label').t`API Key`, type: 'hidden' },
                    { label: c('Label').t`Secret`, type: 'hidden' },
                    { label: c('Label').t`Expiry Date`, type: 'timestamp' },
                    { label: c('Label').t`Permissions`, type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Database`,
                icon: 'storage',
                fields: [
                    { label: c('Label').t`Host`, type: 'text' },
                    { label: c('Label').t`Port`, type: 'text' },
                    { label: c('Label').t`Username`, type: 'text' },
                    { label: c('Label').t`Password`, type: 'hidden' },
                    { label: c('Label').t`Database Type`, type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Server`,
                icon: 'servers',
                fields: [
                    { label: c('Label').t`IP Address`, type: 'text' },
                    { label: c('Label').t`Hostname`, type: 'text' },
                    { label: c('Label').t`Operating System`, type: 'text' },
                    { label: c('Label').t`Username`, type: 'text' },
                    { label: c('Label').t`Password`, type: 'hidden' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Software license`,
                icon: 'file-lines',
                fields: [
                    { label: c('Label').t`License Key`, type: 'hidden' },
                    { label: c('Label').t`Product`, type: 'text' },
                    { label: c('Label').t`Expiry Date`, type: 'timestamp' },
                    { label: c('Label').t`Owner`, type: 'text' },
                ],
            },
            /**
             * SSH key and WiFi network need to appear in the template list,
             * but are their own item type under the hood. Instead of
             * custom/extra fields, their data properties are defined
             * on ItemSSHKey and ItemWifi respectively.
             */
            {
                label: c('Label').t`SSH key`,
                icon: 'filing-cabinet',
                type: 'sshKey',
                fields: [
                    { label: c('Label').t`Username`, type: 'text' },
                    { label: c('Label').t`Host`, type: 'text' },
                ],
            },
            {
                label: c('Label').t`WiFi network`,
                icon: 'shield-2-bolt',
                type: 'wifi',
                fields: [],
            },
        ],
    },
    {
        label: c('Label').t`Finance`,
        theme: SubTheme.ORANGE,
        templates: [
            {
                type: 'custom',
                label: c('Label').t`Bank Account`,
                icon: 'bank',
                fields: [
                    { label: c('Label').t`Bank Name`, type: 'text' },
                    { label: c('Label').t`Account Number`, type: 'text' },
                    { label: c('Label').t`Routing Number`, type: 'text' },
                    { label: c('Label').t`Account Type`, type: 'text' },
                    { label: c('Label').t`IBAN`, type: 'hidden' },
                    { label: c('Label').t`SWIFT/BIC`, type: 'text' },
                    { label: c('Label').t`Holder Name`, type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Crypto Wallet`,
                icon: 'brand-bitcoin',
                fields: [
                    { label: c('Label').t`Wallet Name`, type: 'text' },
                    { label: c('Label').t`Address`, type: 'text' },
                    { label: c('Label').t`Private Key`, type: 'hidden' },
                    { label: c('Label').t`Seed Phrase`, type: 'hidden' },
                    { label: c('Label').t`Network`, type: 'text' },
                ],
            },
        ],
    },
    {
        label: c('Label').t`Personal`,
        theme: SubTheme.TEAL,
        templates: [
            {
                type: 'custom',
                label: c('Label').t`Driver License`,
                icon: 'card-identity',
                fields: [
                    { label: 'Full Name', type: 'text' },
                    { label: 'License Number', type: 'text' },
                    { label: 'Issuing State/Country', type: 'text' },
                    { label: 'Expiry Date', type: 'timestamp' },
                    { label: 'Date of Birth', type: 'timestamp' },
                    { label: 'Class', type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Medical Record`,
                icon: 'heart',
                fields: [
                    { label: 'Patient Name', type: 'text' },
                    { label: 'Record Number', type: 'hidden' },
                    { label: 'Medical Conditions', type: 'hidden' },
                    { label: 'Medications', type: 'hidden' },
                    { label: 'Doctor', type: 'text' },
                    { label: 'Hospital', type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Membership`,
                icon: 'user-circle',
                fields: [
                    { label: 'Organization Name', type: 'text' },
                    { label: 'Membership ID', type: 'text' },
                    { label: 'Member Name', type: 'text' },
                    { label: 'Expiry Date', type: 'timestamp' },
                    { label: 'Tier/Level', type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Passport`,
                icon: 'card-identity',
                fields: [
                    { label: c('Label').t`Full Name`, type: 'text' },
                    { label: c('Label').t`Passport Number`, type: 'hidden' },
                    { label: c('Label').t`Country,`, type: 'text' },
                    { label: c('Label').t`Expiry Date`, type: 'timestamp' },
                    { label: c('Label').t`Date of Birth`, type: 'timestamp' },
                    { label: c('Label').t`Issuing Authority`, type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Reward Program`,
                icon: 'bag-percent',
                fields: [
                    { label: c('Label').t`Program Name`, type: 'text' },
                    { label: c('Label').t`Member ID`, type: 'text' },
                    { label: c('Label').t`Points Balance`, type: 'text' },
                    { label: c('Label').t`Expiry Date`, type: 'timestamp' },
                    { label: c('Label').t`Tier/Status`, type: 'text' },
                ],
            },
            {
                type: 'custom',
                label: c('Label').t`Social Security`,
                icon: 'users',
                fields: [
                    { label: c('Label').t`Full Name`, type: 'text' },
                    { label: c('Label').t`SSN`, type: 'hidden' },
                    { label: c('Label').t`Issuing Country`, type: 'text' },
                ],
            },
        ],
    },
];

export const customTemplateToFormFields = (template: CustomTemplate): DeobfuscatedItemExtraField[] =>
    template.fields.map((field) => {
        const { label: fieldName } = field;

        const value = ((): DeobfuscatedItemExtraField => {
            switch (field.type) {
                case 'hidden':
                case 'text':
                    return { fieldName, type: field.type, data: { content: '' } };
                case 'timestamp':
                    return { fieldName, type: field.type, data: { timestamp: '' } };
            }
        })();

        return value;
    });
