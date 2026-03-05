import type { ItemRevision } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1.static';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { searchItems } from './match-items';

const searchAndExpect = (items: ItemRevision[], expected: ItemRevision[]) => (search: string) => {
    const result = searchItems(items, search);
    try {
        expect(result).toEqual(expected);
    } catch {
        throw new Error(`Search mismatch failed, "${search}" should have matched ${JSON.stringify(expected, null, 2)}`);
    }
};

describe('searchItems', () => {
    const items = [
        {
            data: {
                type: 'login',

                metadata: {
                    name: 'Login item',
                    note: obfuscate('This is item 1'),
                    itemUuid: '1',
                },
                content: {
                    itemEmail: obfuscate('user1@example.com'),
                    itemUsername: obfuscate('user1'),
                    urls: ['https://example.com'],
                    password: obfuscate(''),
                    totpUri: obfuscate('otpauth://totp/label?secret=secret&issuer=issuer'),
                },
                extraFields: [
                    {
                        fieldName: 'hidden label',
                        type: 'hidden',
                        data: {
                            content: obfuscate('hidden value'),
                        },
                    },
                    {
                        fieldName: 'text label',
                        type: 'text',
                        data: {
                            content: obfuscate('text value'),
                        },
                    },
                    {
                        fieldName: 'totp label',
                        type: 'totp',
                        data: {
                            totpUri: obfuscate('otpauth://totp/label?secret=extrafieldsecret&issuer=issuer'),
                        },
                    },
                ],
            },
        },
        {
            data: {
                type: 'note',
                metadata: {
                    name: 'Item 3',
                    note: obfuscate('This is item 2'),
                    itemUuid: '2',
                },
                content: {},
                extraFields: [],
            },
        },
        {
            data: {
                type: 'creditCard',
                metadata: {
                    name: 'Credit card item',
                    note: obfuscate('This is item 3'),
                    itemUuid: '3',
                },
                content: {
                    cardholderName: 'John Doe',
                    number: obfuscate('1234567890'),
                    verificationNumber: obfuscate(''),
                    pin: obfuscate(''),
                    cardType: CardType.Unspecified,
                    expirationDate: '',
                },
                extraFields: [],
            },
        },
        {
            data: {
                type: 'alias',
                metadata: {
                    name: 'Alias item',
                    note: obfuscate('This is item 4'),
                    itemUuid: '4',
                },
                content: {},
                extraFields: [],
            },
        },
        {
            data: {
                type: 'identity',
                metadata: {
                    name: 'Identity item',
                    note: obfuscate('This is item 5'),
                    itemUuid: '4',
                },
                content: {
                    fullName: '::full-name::',
                    birthdate: '::birthdate::',
                    extraPersonalDetails: [
                        { fieldName: '::field::', type: 'text', data: { content: '::personal-detail-1::' } },
                        { fieldName: '::field::', type: 'hidden', data: { content: '::personal-detail-2::' } },
                    ],
                    streetAddress: '::street-address::',
                    city: '::city::',
                    workEmail: '::work-email::',
                    extraWorkDetails: [
                        { fieldName: '::field::', type: 'hidden', data: { content: '::work-detail-1::' } },
                        { fieldName: '::field::', type: 'text', data: { content: '::work-detail-2::' } },
                    ],
                    extraSections: [
                        {
                            sectionName: '::section-1::',
                            sectionFields: [
                                { fieldName: '::field::', type: 'text', data: { content: '::first-section-1::' } },
                                { fieldName: '::field::', type: 'hidden', data: { content: '::first-section-2::' } },
                            ],
                        },
                        {
                            sectionName: '::section-2::',
                            sectionFields: [
                                { fieldName: '::field::', type: 'hidden', data: { content: '::second-section-1::' } },
                                { fieldName: '::field::', type: 'text', data: { content: '::second-section-2::' } },
                            ],
                        },
                    ],
                },
                extraFields: [],
            },
        },
        {
            data: {
                type: 'custom',
                metadata: {
                    name: 'Custom item',
                    note: obfuscate('This is item 6'),
                    itemUuid: '5',
                },
                extraFields: [
                    {
                        fieldName: 'custom-hidden-name',
                        type: 'hidden',
                        data: { content: obfuscate('custom-hidden-content') },
                    },
                    {
                        fieldName: 'custom-text-name',
                        type: 'text',
                        data: { content: obfuscate('custom-text-content') },
                    },
                    {
                        fieldName: 'custom-totp-name',
                        type: 'totp',
                        data: { content: obfuscate('custom-totp-content') },
                    },
                    {
                        fieldName: 'custom-timestamp-name',
                        type: 'timestamp',
                        data: { content: obfuscate('custom-timestamp-content') },
                    },
                ],
                content: {
                    sections: [
                        {
                            sectionName: 'custom-section-name',
                            sectionFields: [
                                {
                                    fieldName: 'custom-section-hidden-name',
                                    type: 'hidden',
                                    data: { content: 'custom-section-hidden-content' },
                                },
                                {
                                    fieldName: 'custom-section-text-name',
                                    type: 'text',
                                    data: { content: 'custom-section-text-content' },
                                },
                                {
                                    fieldName: 'custom-section-totp-name',
                                    type: 'totp',
                                    data: { content: 'custom-section-totp-content' },
                                },
                                {
                                    fieldName: 'custom-section-timestamp-name',
                                    type: 'timestamp',
                                    data: { content: 'custom-section-timestamp-content' },
                                },
                            ],
                        },
                    ],
                },
            },
        },
        {
            data: {
                type: 'wifi',
                metadata: {
                    name: 'Wifi item',
                    note: obfuscate('This is item 7'),
                    itemUuid: '6',
                },
                extraFields: [
                    {
                        fieldName: 'wifi-text-name',
                        type: 'text',
                        data: { content: obfuscate('wifi-text-content') },
                    },
                ],
            },
        },
        {
            data: {
                type: 'sshKey',
                metadata: {
                    name: 'SSH key item',
                    note: obfuscate('This is item 8'),
                    itemUuid: '7',
                },
                content: {
                    sections: [
                        {
                            sectionName: 'ssh-section-name',
                            sectionFields: [
                                {
                                    fieldName: 'ssh-text-name',
                                    type: 'text',
                                    data: { content: 'ssh-text-content' },
                                },
                            ],
                        },
                    ],
                },
            },
        },
    ] as ItemRevision[];

    it.each([
        { key: 'no search', search: [''], expected: items },
        { key: 'note', search: ['this is item'], expected: [items[0], items[1], items[2], items[3], items[4]] },
        {
            key: 'login item',
            search: ['Login item', 'user1@example.com', 'user1', 'example.com', 'text label', 'text value'],
            expected: [items[0]],
        },
        { key: 'card item', search: ['John Doe'], expected: [items[2]] },
        {
            key: 'identity item',
            search: [
                'full-name',
                'birthdate',
                'street-address',
                'city',
                'work-email',
                'detail-2',
                'first-section-1::',
                'second-section',
            ],
            expected: [items[4]],
        },
        {
            key: 'custom item',
            search: [
                'Custom item',
                'custom-hidden-name',
                'custom-text-name',
                'custom-text-content',
                'custom-totp-name',
                'custom-timestamp-name',
                'custom-section-name',
                'custom-section-hidden-name',
                'custom-section-text-name',
                'custom-section-text-content',
                'custom-section-totp-name',
                'custom-section-timestamp-name',
            ],
            expected: [items[5]],
        },
        {
            key: 'wifi item',
            search: ['Wifi item', 'wifi-text-name', 'wifi-text-content'],
            expected: [items[6]],
        },
        {
            key: 'ssh item',
            search: ['SSH key item', 'ssh-section-name', 'ssh-text-name', 'ssh-text-content'],
            expected: [items[7]],
        },
    ])('should return matching items based on $key', ({ search, expected }) => {
        search.forEach(searchAndExpect(items, expected));
    });

    it.each([
        { key: 'query', search: ['db'] },
        {
            key: 'otp fields',
            search: [
                'otpauth://totp/label?secret=secret&issuer=issuer',
                'otpauth://totp/label?secret=extrafieldsecret&issuer=issuer',
            ],
        },
        { key: 'extra idendity details hidden', search: ['::personal-detail-2::', '::work-detail-1::'] },
        {
            key: 'custom non text details',
            search: [
                'custom-hidden-content',
                'custom-totp-content',
                'custom-timestamp-content',
                'custom-section-hidden-content',
                'custom-section-totp-content',
                'custom-section-timestamp-content',
            ],
        },
    ])('should return empty array when no match $key', ({ search }) => {
        search.forEach(searchAndExpect(items, []));
    });
});
