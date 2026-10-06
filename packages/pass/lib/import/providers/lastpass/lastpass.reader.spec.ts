import fs from 'fs';

import type { ItemType } from '../../../../types';
import { AutofillMode, WifiSecurity } from '../../../../types/protobuf';
import * as epochUtils from '../../../../utils/time/epoch';
import { deobfuscateItem } from '../../../items/item.obfuscation';
import type { ImportFolder, ImportPayload, ImportVault } from '../../types';
import { readLastPassData } from './lastpass.reader';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

const sourceFiles = {
    'lastpass.csv': `${__dirname}/mocks/lastpass.csv`,
    'lastpass.crcrlf.terminated.csv': `${__dirname}/mocks/lastpass.crcrlf.terminated.csv`,
    'lastpass.corrupted.items.csv': `${__dirname}/mocks/lastpass.corrupted.items.csv`,
    'lastpass.corrupted.rows.csv': `${__dirname}/mocks/lastpass.corrupted.rows.csv`,
};

const data: Record<string, ImportPayload> = {};
const dateMock = jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);

const getLastPassData = (sourceKey: string) => data[sourceKey];
const getLastPassItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]);

beforeAll(async () => {
    for (const [key, path] of Object.entries(sourceFiles)) {
        const sourceData = fs.readFileSync(path);
        const file = new File([sourceData], path);
        data[key] = await readLastPassData(file);
    }
});

afterAll(() => dateMock.mockRestore());

const getFolderPaths = (vault: ImportVault): string[] => {
    const byId = new Map(vault.folders.map((folder) => [folder.id, folder]));
    const pathOf = (folder: ImportFolder): string => {
        const parent = folder.parentId ? byId.get(folder.parentId) : undefined;
        return parent ? `${pathOf(parent)}/${folder.name}` : folder.name;
    };

    return vault.folders.map(pathOf);
};

describe('LastPass CSV importer', () => {
    test('should throw on corrupted files', async () => {
        await expect(readLastPassData(new File([], 'corrupted'))).rejects.toThrow();
    });

    test('should support corrupted rows', () => {
        const { vaults, warnings, ignored } = getLastPassData('lastpass.corrupted.items.csv');
        expect(warnings.length).toBeGreaterThan(0);
        expect(vaults.length).toBe(1);
        expect(ignored.length).toBe(0);

        /** corrupted note on second item */
        const corrupted = getLastPassItem<'login'>('lastpass.corrupted.items.csv', 0, 1);
        expect(corrupted.type).toEqual('login');
        expect(corrupted.content.itemUsername).toEqual('admin');
        expect(corrupted.content.password).toEqual('proton123');
        expect(corrupted.metadata.name).toEqual('Admin');
        expect(corrupted.metadata.note).toEqual(''); // <-- corrupted

        const correct = getLastPassItem<'note'>('lastpass.corrupted.items.csv', 0, 2);
        expect(correct.type).toEqual('note');
        expect(correct.metadata.name).toEqual('Secure note');
        expect(correct.metadata.note).toEqual('This is a secure note');
    });

    test('should support corrupted items', () => {
        const { vaults, warnings, ignored } = getLastPassData('lastpass.corrupted.rows.csv');
        expect(warnings.length).toBeGreaterThan(0);
        expect(vaults.length).toBe(1);
        expect(ignored.length).toBe(0);

        const corrupted = getLastPassItem<'identity'>('lastpass.corrupted.rows.csv', 0, 6);
        expect(corrupted.content.birthdate).toEqual(''); // <-- corrupted
        expect(corrupted.content.email).toEqual('test@proton.me'); // <-- after corruption
    });

    test('correctly handles `CR CR LF` line endings', () => {
        const { vaults } = getLastPassData('lastpass.crcrlf.terminated.csv');
        const [primary] = vaults;
        expect(primary.items.length).toEqual(3);
        expect(primary.items.filter((n) => n.type === 'note').length).toEqual(3);
        expect(getFolderPaths(primary)).toEqual(['Personal']);
    });

    test('should import into a single vault', () => {
        const { vaults } = data['lastpass.csv'];
        expect(vaults).toHaveLength(1);
        expect(vaults[0].name).toBe('Import - Apr 27, 2023');
        expect(vaults[0].items.length).toEqual(14);
    });

    test('should rebuild the folder hierarchy', () => {
        const [vault] = data['lastpass.csv'].vaults;

        expect(getFolderPaths(vault)).toEqual([
            'company services',
            'folder not empty',
            'folder not empty/subfolder not empty',
        ]);
    });

    test('should place each item in its folder', () => {
        const [vault] = data['lastpass.csv'].vaults;
        const byId = new Map(vault.folders.map(({ id, name }) => [id, name]));
        const foldered = vault.items.filter(({ folderId }) => folderId !== null);

        expect(foldered.map(({ metadata, folderId }) => [metadata.name, byId.get(folderId ?? '')])).toEqual([
            ['Admin', 'company services'],
            ['Twitter', 'company services'],
            ['fb.com', 'company services'],
            ['Unnamed item', 'company services'],
            ['folder login', 'folder not empty'],
            ['subfolder login', 'subfolder not empty'],
        ]);
    });

    test('should leave items without a folder at the vault root', () => {
        const [vault] = data['lastpass.csv'].vaults;
        const rootItems = vault.items.filter((item) => item.folderId === null);

        expect(rootItems.map(({ metadata }) => metadata.name)).toEqual([
            'nobody',
            'Secure note',
            'test',
            'TestID',
            'Credit Card Item with note',
            'ssh',
            'new custom item',
            'wifi',
        ]);
    });

    test('should support login items', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 1);
        expect(item.type).toBe('login');
        expect(item.metadata.name).toBe('Admin');
        expect(item.metadata.note).toBe('');
        expect(item.content.itemUsername).toBe('admin');
        expect(item.content.password).toBe('proton123');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://proton.me/', mode: AutofillMode.Default }]);
    });

    test('should support login with TOTP', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 2);
        expect(item.type).toBe('login');
        expect(item.metadata.name).toBe('Twitter');
        expect(item.metadata.note).toBe('This is a twitter note');
        expect(item.content.itemUsername).toBe('@nobody');
        expect(item.content.password).toBe('proton123');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://twitter.com/login', mode: AutofillMode.Default }]);
        expect(item.content.totpUri).toContain('otpauth://totp/Twitter');
    });

    test('should support OTP items', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 3);
        expect(item.metadata.name).toBe('fb.com');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://fb.com/login', mode: AutofillMode.Default }]);
        expect(item.content.totpUri).toContain('otpauth://totp/fb.com');
    });

    test('should support malformed URLs', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 5);
        expect(item.metadata.name).toBe('Unnamed item');
        expect(item.content.autofillUrls).toEqual([]);
        expect(item.content.password).toBe('');
    });

    test('should support generic login item', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 0);
        expect(item.metadata.name).toBe('nobody');
        expect(item.metadata.note).toBe('Secure note');
        expect(item.content.itemEmail).toBe('nobody@proton.me');
        expect(item.content.password).toBe('proton123');
        expect(item.content.autofillUrls).toEqual([{ url: 'https://account.proton.me/', mode: AutofillMode.Default }]);
    });

    test('should support note item', () => {
        const item = getLastPassItem<'note'>('lastpass.csv', 0, 4);
        expect(item.type).toBe('note');
        expect(item.metadata.name).toBe('Secure note');
        expect(item.metadata.note).toBe('This is a secure note');
    });

    test('should support custom bank items', () => {
        const item = getLastPassItem<'custom'>('lastpass.csv', 0, 6);
        expect(item.type).toBe('custom');
        expect(item.metadata.name).toBe('test');
        expect(item.extraFields).toEqual([
            { data: { content: 'test' }, fieldName: 'Bank Name', type: 'text' },
            { data: { content: 'test' }, fieldName: 'Account Type', type: 'text' },
            { data: { content: '' }, fieldName: 'Routing Number', type: 'text' },
            { data: { content: '333333' }, fieldName: 'Account Number', type: 'text' },
            { data: { content: '' }, fieldName: 'SWIFT Code', type: 'text' },
            { data: { content: '' }, fieldName: 'IBAN Number', type: 'text' },
            { data: { content: '' }, fieldName: 'Pin', type: 'text' },
            { data: { content: '' }, fieldName: 'Branch Address', type: 'text' },
            { data: { content: '' }, fieldName: 'Branch Phone', type: 'text' },
        ]);
    });

    test('should support identity item', () => {
        const item = getLastPassItem<'identity'>('lastpass.csv', 0, 7);
        expect(item.type).toBe('identity');
        expect(item.metadata.name).toBe('TestID');
        expect(item.content.firstName).toBe('Test');
        expect(item.content.middleName).toBe('Joe');
    });

    test('should support credit-card item', () => {
        const item = getLastPassItem<'creditCard'>('lastpass.csv', 0, 8);
        expect(item.type).toBe('creditCard');
        expect(item.metadata.name).toBe('Credit Card Item with note');
        expect(item.metadata.note).toBe('this is a note for the credit card');
        expect(item.content.number).toBe('4242424242424242');
        expect(item.content.expirationDate).toBe('012025');
        expect(item.content.verificationNumber).toBe('123');
    });

    test('should support SSH item', () => {
        const item = getLastPassItem<'sshKey'>('lastpass.csv', 0, 9);
        expect(item.type).toBe('sshKey');
        expect(item.metadata.name).toBe('ssh');
        expect(item.content.privateKey).toEqual('ab');
        expect(item.content.publicKey).toEqual('cd');
        expect(item.extraFields).toEqual([
            { data: { content: '1' }, fieldName: 'Bit Strength', type: 'text' },
            { data: { content: 'format' }, fieldName: 'Format', type: 'text' },
            { data: { content: 'password123' }, fieldName: 'Passphrase', type: 'text' },
            { data: { content: 'example.com' }, fieldName: 'Hostname', type: 'text' },
            { data: { content: 'January,31,2001' }, fieldName: 'Date', type: 'text' },
        ]);
    });

    test('should support custom field items', () => {
        const item = getLastPassItem<'custom'>('lastpass.csv', 0, 10);
        expect(item.type).toBe('custom');
        expect(item.metadata.name).toBe('new custom item');
        expect(item.extraFields).toEqual([
            { data: { content: 'value' }, fieldName: 'text', type: 'text' },
            { data: { content: 'value' }, fieldName: 'text with copy', type: 'text' },
            { data: { content: 'January,31,2001' }, fieldName: 'date', type: 'text' },
            { data: { content: 'January,31' }, fieldName: 'date no day', type: 'text' },
            { data: { content: 'password123' }, fieldName: 'my password', type: 'hidden' },
        ]);
    });

    test('should support wifi item', () => {
        const item = getLastPassItem<'wifi'>('lastpass.csv', 0, 11);
        expect(item.type).toBe('wifi');
        expect(item.metadata.name).toBe('wifi');
        expect(item.content.ssid).toEqual('my-ssid');
        expect(item.content.password).toEqual('password123');
        expect(item.content.security).toEqual(WifiSecurity.UnspecifiedWifiSecurity);
        expect(item.extraFields).toEqual([
            { data: { content: 'type' }, fieldName: 'Connection Type', type: 'text' },
            { data: { content: 'mode' }, fieldName: 'Connection Mode', type: 'text' },
            { data: { content: '' }, fieldName: 'Authentication', type: 'text' },
            { data: { content: '' }, fieldName: 'Encryption', type: 'text' },
            { data: { content: '' }, fieldName: 'Use 802.1X', type: 'text' },
            { data: { content: '' }, fieldName: 'FIPS Mode', type: 'text' },
            { data: { content: '' }, fieldName: 'Key Type', type: 'text' },
            { data: { content: 'hope so' }, fieldName: 'Protected', type: 'text' },
            { data: { content: '' }, fieldName: 'Key Index', type: 'text' },
        ]);
    });

    test('should handle all LastPass item types', () => {
        const { ignored } = data['lastpass.csv'];
        expect(ignored).toEqual([]);
    });
});
