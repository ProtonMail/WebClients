import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemType } from '@proton/pass/types';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readLastPassData } from './lastpass.reader';

const sourceFiles = {
    'lastpass.csv': `${__dirname}/mocks/lastpass.csv`,
    'lastpass.crcrlf.terminated.csv': `${__dirname}/mocks/lastpass.crcrlf.terminated.csv`,
};

const data: Record<string, ImportPayload> = {};
const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

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

describe('Import LastPass CSV reader', () => {
    test.each([new File([], 'corrupted')])('should throw on corrupted files: %s', async (file) => {
        await expect(readLastPassData(file)).rejects.toThrow();
    });
});

describe('Import LastPass CSV → vault structure', () => {
    test('should correctly parses vaults', () => {
        const { vaults } = data['lastpass.csv'];
        expect(vaults).toHaveLength(2);
        expect(vaults[0].name).toBe('company services');
        expect(vaults[0].items.length).toEqual(4);
        expect(vaults[1].name).toBe('Import - 27 Apr 2023');
        expect(vaults[1].items.length).toEqual(8);
    });

    test('correctly handles CR CR LF line endings', () => {
        const { vaults } = data['lastpass.crcrlf.terminated.csv'];
        const [primary] = vaults;
        expect(primary.items.length).toEqual(3);
        expect(primary.items.filter((n) => n.type === 'note').length).toEqual(3);
    });

    test('does not ignore any item', () => {
        const { ignored } = data['lastpass.csv'];
        expect(ignored).toEqual([]);
    });
});

describe('Primary vault item parsing', () => {
    test('Login', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 0);
        expect(item.type).toBe('login');
        expect(item.metadata.name).toBe('Admin');
        expect(item.metadata.note).toBe('');
        expect(item.content.itemUsername).toBe('admin');
        expect(item.content.password).toBe('proton123');
        expect(item.content.urls).toEqual(['https://proton.me/']);
    });

    test('Login with TOTP and note', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 1);
        expect(item.type).toBe('login');
        expect(item.metadata.name).toBe('Twitter');
        expect(item.metadata.note).toBe('This is a twitter note');
        expect(item.content.itemUsername).toBe('@nobody');
        expect(item.content.password).toBe('proton123');
        expect(item.content.urls).toEqual(['https://twitter.com/login']);
        expect(item.content.totpUri).toContain('otpauth://totp/Twitter');
    });

    test('Login with TOTP', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 2);
        expect(item.metadata.name).toBe('fb.com');
        expect(item.content.urls).toEqual(['https://fb.com/login']);
        expect(item.content.totpUri).toContain('otpauth://totp/fb.com');
    });

    test('Login with broken URL', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 0, 3);
        expect(item.metadata.name).toBe('Unnamed item');
        expect(item.content.urls).toEqual([]);
        expect(item.content.password).toBe('');
    });
});

describe('Secondary vault item parsing', () => {
    test('Login', () => {
        const item = getLastPassItem<'login'>('lastpass.csv', 1, 0);
        expect(item.metadata.name).toBe('nobody');
        expect(item.metadata.note).toBe('Secure note');
        expect(item.content.itemEmail).toBe('nobody@proton.me');
        expect(item.content.password).toBe('proton123');
        expect(item.content.urls).toEqual(['https://account.proton.me/']);
    });

    test('Note', () => {
        const item = getLastPassItem<'note'>('lastpass.csv', 1, 1);
        expect(item.type).toBe('note');
        expect(item.metadata.name).toBe('Secure note');
        expect(item.metadata.note).toBe('This is a secure note');
    });

    test('Bank item', () => {
        const item = getLastPassItem<'custom'>('lastpass.csv', 1, 2);
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

    test('Identity', () => {
        const item = getLastPassItem<'identity'>('lastpass.csv', 1, 3);
        expect(item.type).toBe('identity');
        expect(item.metadata.name).toBe('TestID');
        expect(item.content.firstName).toBe('Test');
        expect(item.content.middleName).toBe('Joe');
    });

    test('Credit Card', () => {
        const item = getLastPassItem<'creditCard'>('lastpass.csv', 1, 4);
        expect(item.type).toBe('creditCard');
        expect(item.metadata.name).toBe('Credit Card Item with note');
        expect(item.metadata.note).toBe('this is a note for the credit card');
        expect(item.content.number).toBe('4242424242424242');
        expect(item.content.expirationDate).toBe('012025');
        expect(item.content.verificationNumber).toBe('123');
    });

    test('SSH item', () => {
        const item = getLastPassItem<'sshKey'>('lastpass.csv', 1, 5);
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

    test('custom item with custom fields', () => {
        const item = getLastPassItem<'custom'>('lastpass.csv', 1, 6);
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

    test('Wifi item', () => {
        const item = getLastPassItem<'wifi'>('lastpass.csv', 1, 7);
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
});
