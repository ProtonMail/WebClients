import type { ItemRevision } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { searchItems } from './match-items';

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
    ] as ItemRevision[];

    it('should return all items when search is empty', () => {
        const result = searchItems(items, '');
        expect(result).toEqual(items);
    });

    it('should return matching items based on title', () => {
        const result = searchItems(items, 'Login item');
        expect(result).toEqual([items[0]]);
    });

    it('should return matching items based on note', () => {
        const result = searchItems(items, 'this is item');
        expect(result).toEqual([items[0], items[1], items[2], items[3]]);
    });

    it('should return matching items based on itemEmail', () => {
        const result = searchItems(items, 'user1@example.com');
        expect(result).toEqual([items[0]]);
    });

    it('should return matching items based on itemUsername', () => {
        const result = searchItems(items, 'user1');
        expect(result).toEqual([items[0]]);
    });

    it('should return matching items based on URLs', () => {
        const result = searchItems(items, 'example.com');
        expect(result).toEqual([items[0]]);
    });

    it('should return matching items based on cardholder name', () => {
        const result = searchItems(items, 'John Doe');
        expect(result).toEqual([items[2]]);
    });

    it('should return matching items based on card number', () => {
        const result = searchItems(items, '1234567890');
        expect(result).toEqual([items[2]]);
    });

    it('should return matching items based on extra fields label and value', () => {
        const result = searchItems(items, 'text label');
        expect(result).toEqual([items[0]]);

        const result2 = searchItems(items, 'text value');
        expect(result2).toEqual([items[0]]);
    });

    it('should not match otp fields', () => {
        const result = searchItems(items, 'otpauth://totp/label?secret=secret&issuer=issuer');
        expect(result).toEqual([]);

        const result2 = searchItems(items, 'otpauth://totp/label?secret=extrafieldsecret&issuer=issuer');
        expect(result2).toEqual([]);
    });

    it('should return empty array when no match', () => {
        const result = searchItems(items, 'db');
        expect(result).toEqual([]);
    });
});
