import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemType } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readNordPassData } from './nordpass.reader';

const sourceFiles = {
    'nordpass-legacy.csv': `${__dirname}/mocks/nordpass-legacy.csv`,
    'nordpass.csv': `${__dirname}/mocks/nordpass.csv`,
};

const data: Record<string, ImportPayload> = {};
const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

const getNordPassData = (sourceKey: string) => data[sourceKey];
const getNordPassItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]);

describe('NordPass CSV Importer', () => {
    beforeAll(async () => {
        for (const [key, sourceFile] of Object.entries(sourceFiles)) {
            const sourceData = fs.readFileSync(sourceFile);
            const file = new File([sourceData], sourceFile);
            data[key] = await readNordPassData(file);
        }
    });

    afterAll(() => dateMock.mockRestore());

    test('should throw on corrupted files', async () => {
        await expect(readNordPassData(new File([], 'corrupted'))).rejects.toThrow();
    });

    describe('Nordpass legacy CSV', () => {
        test('converts NordPass folders to vaults correctly', () => {
            const { vaults } = getNordPassData('nordpass-legacy.csv');
            const [primary, secondary] = vaults;
            expect(vaults.length).toEqual(2);
            expect(primary.name).toEqual('company services');
            expect(secondary.name).toEqual('Import - 27 Apr 2023');
            expect(primary.items.length).toEqual(4);
            expect(secondary.items.length).toEqual(5);
        });

        test('should support login items [vault 1]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 0);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Admin');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('admin');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.urls[0]).toEqual('https://proton.me/');
        });

        test('should support login items with notes [vault 1]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 1);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Twitter');
            expect(item.metadata.note).toEqual('This is a twitter note');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('@nobody');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.urls[0]).toEqual('https://twitter.com/login');
            expect(item.content.totpUri).toEqual('');
        });

        test('should support login items [vault 1]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 2);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('fb.com');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('@nobody');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.urls[0]).toEqual('https://fb.com/login');
            expect(item.content.totpUri).toEqual('');
        });

        test('should support login items with malformed urls [vault 1]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 3);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('htts');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('');
            expect(item.content.password).toEqual('');
            expect(item.content.urls).toEqual([]);
        });

        test('should support login items [vault 2]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 1, 0);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('nobody');
            expect(item.metadata.note).toEqual('Secure note');
            expect(item.content.itemEmail).toEqual('nobody@proton.me');
            expect(item.content.itemUsername).toEqual('');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.urls[0]).toEqual('https://account.proton.me/');
        });

        test('should support note items [vault 2]', () => {
            const item = getNordPassItem<'note'>('nordpass-legacy.csv', 1, 1);
            expect(item.type).toEqual('note');
            expect(item.metadata.name).toEqual('Secure note');
            expect(item.metadata.note).toEqual('This is a secure note');
        });

        test('should support multi-line note items [vault 2]', () => {
            const item = getNordPassItem<'note'>('nordpass-legacy.csv', 1, 2);
            expect(item.type).toEqual('note');
            expect(item.metadata.name).toEqual('test');
            expect(item.metadata.note).toEqual('Bank Name: test\n\nAccount Type: test\n\nAccount Number: 333333');
        });

        test('should support credit-card items [vault 2]', () => {
            const item = getNordPassItem<'creditCard'>('nordpass-legacy.csv', 1, 3);
            expect(item.type).toEqual('creditCard');
            expect(item.metadata.name).toEqual('Credit Card Item with note');
            expect(item.metadata.note).toEqual('this is a note for the credit card');
            expect(item.content.cardholderName).toEqual('A B');
            expect(item.content.number).toEqual('4242424242424242');
            expect(item.content.expirationDate).toEqual('012025');
            expect(item.content.verificationNumber).toEqual('123');
            expect(item.content.pin).toEqual('');
        });

        test('should support identity items [vault 2]', () => {
            const item = getNordPassItem<'identity'>('nordpass-legacy.csv', 1, 4);
            expect(item.type).toEqual('identity');
            expect(item.metadata.name).toEqual(':title:');
            expect(item.metadata.note).toEqual(':note:');
            expect(item.content.fullName).toEqual(':full-name:');
            expect(item.content.email).toEqual(':email:');
            expect(item.content.phoneNumber).toEqual(':phone-number:');
            expect(item.content.streetAddress).toEqual(':address-1:');
            expect(item.content.zipOrPostalCode).toEqual(':zip:');
            expect(item.content.city).toEqual(':city:');
            expect(item.content.stateOrProvince).toEqual(':state:');
            expect(item.content.countryOrRegion).toEqual("Côte d'Ivoire");
        });

        test('correctly keeps a reference to ignored items', () => {
            const { ignored } = getNordPassData('nordpass-legacy.csv');
            expect(ignored).not.toEqual([]);
            expect(ignored[0]).toEqual('[folder] company services');
        });
    });

    describe('Nordpass CSV', () => {
        test('converts NordPass folders to vaults correctly', () => {
            const { vaults } = getNordPassData('nordpass.csv');
            const [primary, secondary] = vaults;
            expect(vaults.length).toEqual(2);
            expect(primary.name).toEqual('sub-folder');
            expect(secondary.name).toEqual('Import - 27 Apr 2023');
            expect(primary.items.length).toEqual(1);
            expect(secondary.items.length).toEqual(2);
        });

        test('should support login items with multiple URLs and custom fields [vault 1]', () => {
            const item = getNordPassItem<'login'>('nordpass.csv', 0, 0);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Test[CustomFields]');
            expect(item.metadata.note).toEqual('note');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('CustomFields');
            expect(item.content.password).toEqual('CustomFields');
            expect(item.content.urls).toEqual(['https://hello.com/', 'https://test.me/lol', 'https://test.net/']);
            expect(item.extraFields).toEqual([
                { type: 'text', data: { content: 'VALUE' }, fieldName: '[TEXT]' },
                { type: 'hidden', data: { content: 'VALUE' }, fieldName: '[HIDDEN]' },
                { type: 'text', data: { content: '14/12/1990' }, fieldName: '[INVALID_DATE]' },
                { type: 'timestamp', data: { timestamp: '1990-12-14' }, fieldName: '[DATE]' },
            ]);
        });
    });
});
