import type { ItemRevision } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { searchItems } from './match-items';

const searchAndExpect = (items: ItemRevision[], expected: ItemRevision[]) => (search: string) => {
    const result = searchItems(items, search);
    expect(result).toEqual(expected);
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
    ] as ItemRevision[];

    it.each([
        { key: 'no search', search: [''], expected: items },
        { key: 'note', search: ['this is item'], expected: [items[0], items[1], items[2], items[3], items[4]] },
        {
            key: 'login item',
            search: ['Login item', 'user1@example.com', 'user1', 'example.com', 'text label', 'text value'],
            expected: [items[0]],
        },
        { key: 'card item', search: ['John Doe', '1234567890'], expected: [items[2]] },
        {
            key: 'identity item',
            search: [
                'full-name',
                'birthdate',
                'street-address',
                'city',
                'work-email',
                '::personal-detail-2::',
                '::work-detail-1::',
                'detail-2',
                'first-section-1::',
                'second-section',
            ],
            expected: [items[4]],
        },
    ])('should return matching items based on $key', ({ search, expected }) => {
        search.forEach(searchAndExpect(items, expected));
    });

    it.each([
        { key: 'query', search: 'db' },
        { key: 'otp fields', search: 'otpauth://totp/label?secret=secret&issuer=issuer' },
        { key: 'otp fields with extra fields', search: 'otpauth://totp/label?secret=extrafieldsecret&issuer=issuer' },
    ])('should return empty array when no match $key', ({ search }) => {
        searchAndExpect(items, [])(search);
    });
});
