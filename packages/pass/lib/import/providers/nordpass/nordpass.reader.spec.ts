import fs from 'fs';

import type { ItemType } from '../../../../types';
import { AutofillMode } from '../../../../types/protobuf';
import * as epochUtils from '../../../../utils/time/epoch';
import { deobfuscateItem } from '../../../items/item.obfuscation';
import type { ImportPayload } from '../../types';
import { readNordPassData } from './nordpass.reader';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

const sourceFiles = {
    'nordpass-legacy.csv': `${__dirname}/mocks/nordpass-legacy.csv`,
    'nordpass.csv': `${__dirname}/mocks/nordpass.csv`,
};

const data: Record<string, ImportPayload> = {};
const dateMock = jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);

const getNordPassData = (sourceKey: string) => data[sourceKey];
const getNordPassItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]);

const getItemFolders = (sourceKey: string) => {
    const [vault] = data[sourceKey].vaults;
    const folderNames = new Map(vault.folders.map(({ id, name }) => [id, name]));
    return vault.items.map(({ metadata, folderId }) => [metadata.name, folderNames.get(folderId ?? '') ?? null]);
};

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
        test('should import into a single vault', () => {
            const { vaults } = getNordPassData('nordpass-legacy.csv');
            const [vault] = vaults;
            expect(vaults.length).toEqual(1);
            expect(vault.name).toEqual('Import - Apr 27, 2023');
            expect(vault.items.length).toEqual(9);
        });

        test('should create NordPass folders', () => {
            const [vault] = getNordPassData('nordpass-legacy.csv').vaults;
            expect(vault.folders.map(({ name, parentId }) => ({ name, parentId }))).toEqual([
                { name: 'company services', parentId: null },
            ]);
        });

        test('should place each item in its folder', () => {
            expect(getItemFolders('nordpass-legacy.csv')).toEqual([
                ['nobody', null],
                ['Secure note', null],
                ['test', null],
                ['Credit Card Item with note', null],
                [':title:', null],
                ['Admin', 'company services'],
                ['Twitter', 'company services'],
                ['fb.com', 'company services'],
                ['htts', 'company services'],
            ]);
        });

        test('should leave items without a folder at the vault root', () => {
            const [vault] = getNordPassData('nordpass-legacy.csv').vaults;
            const rootItems = vault.items.filter((item) => item.folderId === null);
            expect(rootItems.length).toEqual(5);
        });

        test('should support login items [folder]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 5);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Admin');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('admin');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.autofillUrls[0]).toEqual({ url: 'https://proton.me/', mode: AutofillMode.Default });
        });

        test('should support login items with notes [folder]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 6);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Twitter');
            expect(item.metadata.note).toEqual('This is a twitter note');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('@nobody');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.autofillUrls[0]).toEqual({
                url: 'https://twitter.com/login',
                mode: AutofillMode.Default,
            });
            expect(item.content.totpUri).toEqual('');
        });

        test('should support login items [folder]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 7);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('fb.com');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('@nobody');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.autofillUrls[0]).toEqual({ url: 'https://fb.com/login', mode: AutofillMode.Default });
            expect(item.content.totpUri).toEqual('');
        });

        test('should support login items with malformed urls [folder]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 8);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('htts');
            expect(item.metadata.note).toEqual('');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('');
            expect(item.content.password).toEqual('');
            expect(item.content.autofillUrls).toEqual([]);
        });

        test('should support login items [root]', () => {
            const item = getNordPassItem<'login'>('nordpass-legacy.csv', 0, 0);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('nobody');
            expect(item.metadata.note).toEqual('Secure note');
            expect(item.content.itemEmail).toEqual('nobody@proton.me');
            expect(item.content.itemUsername).toEqual('');
            expect(item.content.password).toEqual('proton123');
            expect(item.content.autofillUrls[0]).toEqual({
                url: 'https://account.proton.me/',
                mode: AutofillMode.Default,
            });
        });

        test('should support note items [root]', () => {
            const item = getNordPassItem<'note'>('nordpass-legacy.csv', 0, 1);
            expect(item.type).toEqual('note');
            expect(item.metadata.name).toEqual('Secure note');
            expect(item.metadata.note).toEqual('This is a secure note');
        });

        test('should support multi-line note items [root]', () => {
            const item = getNordPassItem<'note'>('nordpass-legacy.csv', 0, 2);
            expect(item.type).toEqual('note');
            expect(item.metadata.name).toEqual('test');
            expect(item.metadata.note).toEqual('Bank Name: test\n\nAccount Type: test\n\nAccount Number: 333333');
        });

        test('should support credit-card items [root]', () => {
            const item = getNordPassItem<'creditCard'>('nordpass-legacy.csv', 0, 3);
            expect(item.type).toEqual('creditCard');
            expect(item.metadata.name).toEqual('Credit Card Item with note');
            expect(item.metadata.note).toEqual('this is a note for the credit card');
            expect(item.content.cardholderName).toEqual('A B');
            expect(item.content.number).toEqual('4242424242424242');
            expect(item.content.expirationDate).toEqual('012025');
            expect(item.content.verificationNumber).toEqual('123');
            expect(item.content.pin).toEqual('');
        });

        test('should support identity items [root]', () => {
            const item = getNordPassItem<'identity'>('nordpass-legacy.csv', 0, 4);
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

        test('should not report folders as ignored items', () => {
            const { ignored } = getNordPassData('nordpass-legacy.csv');
            expect(ignored).toEqual([]);
        });
    });

    describe('Nordpass CSV', () => {
        test('should import into a single vault', () => {
            const { vaults } = getNordPassData('nordpass.csv');
            const [vault] = vaults;
            expect(vaults.length).toEqual(1);
            expect(vault.name).toEqual('Import - Apr 27, 2023');
            expect(vault.items.length).toEqual(3);
        });

        test('should keep slashes in folder names instead of nesting', () => {
            const [vault] = getNordPassData('nordpass.csv').vaults;
            expect(vault.folders.map(({ name, parentId }) => ({ name, parentId }))).toEqual([
                { name: 'folder1/folder2', parentId: null },
                { name: 'folder1', parentId: null },
                { name: 'sub-folder', parentId: null },
            ]);
        });

        test('should create folders holding no items', () => {
            const [vault] = getNordPassData('nordpass.csv').vaults;
            const usedFolderIds = new Set(vault.items.map(({ folderId }) => folderId));
            const emptyFolders = vault.folders.filter(({ id }) => !usedFolderIds.has(id));
            expect(emptyFolders.map(({ name }) => name)).toEqual(['folder1/folder2', 'folder1']);
        });

        test('should place each item in its folder', () => {
            expect(getItemFolders('nordpass.csv')).toEqual([
                ['nobody', null],
                ['simplelogin.io', null],
                ['Test[CustomFields]', 'sub-folder'],
            ]);
        });

        test('should leave items without a folder at the vault root', () => {
            const [vault] = getNordPassData('nordpass.csv').vaults;
            const rootItems = vault.items.filter((item) => item.folderId === null);
            expect(rootItems.length).toEqual(2);
        });

        test('should not report folders as ignored items', () => {
            const { ignored } = getNordPassData('nordpass.csv');
            expect(ignored).toEqual([]);
        });

        test('should support login items with multiple URLs and custom fields [folder]', () => {
            const item = getNordPassItem<'login'>('nordpass.csv', 0, 2);
            expect(item.type).toEqual('login');
            expect(item.metadata.name).toEqual('Test[CustomFields]');
            expect(item.metadata.note).toEqual('note');
            expect(item.content.itemEmail).toEqual('');
            expect(item.content.itemUsername).toEqual('CustomFields');
            expect(item.content.password).toEqual('CustomFields');
            expect(item.content.autofillUrls).toEqual([
                { url: 'https://hello.com/', mode: AutofillMode.Default },
                { url: 'https://test.me/lol', mode: AutofillMode.Default },
                { url: 'https://test.net/', mode: AutofillMode.Default },
            ]);
            expect(item.extraFields).toEqual([
                { type: 'text', data: { content: 'VALUE' }, fieldName: '[TEXT]' },
                { type: 'hidden', data: { content: 'VALUE' }, fieldName: '[HIDDEN]' },
                { type: 'text', data: { content: '14/12/1990' }, fieldName: '[INVALID_DATE]' },
                { type: 'timestamp', data: { timestamp: '1990-12-14' }, fieldName: '[DATE]' },
            ]);
        });
    });
});
