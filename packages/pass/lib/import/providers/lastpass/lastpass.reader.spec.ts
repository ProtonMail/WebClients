import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemType } from '@proton/pass/types';
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
        expect(vaults[1].items.length).toEqual(4);
    });

    test('correctly handles CR CR LF line endings', () => {
        const { vaults } = data['lastpass.crcrlf.terminated.csv'];
        const [primary] = vaults;
        expect(primary.items.length).toEqual(3);
        expect(primary.items.filter((n) => n.type === 'note').length).toEqual(3);
    });

    test('ignored items are displayed', () => {
        const { ignored } = data['lastpass.csv'];
        expect(ignored).not.toHaveLength(0);
        expect(ignored[0]).toBe('[Bank Account] test');
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

    test('Identity', () => {
        const item = getLastPassItem<'identity'>('lastpass.csv', 1, 2);
        expect(item.type).toBe('identity');
        expect(item.metadata.name).toBe('TestID');
        expect(item.content.firstName).toBe('Test');
        expect(item.content.middleName).toBe('Joe');
    });

    test('Credit Card', () => {
        const item = getLastPassItem<'creditCard'>('lastpass.csv', 1, 3);
        expect(item.type).toBe('creditCard');
        expect(item.metadata.name).toBe('Credit Card Item with note');
        expect(item.metadata.note).toBe('this is a note for the credit card');
        expect(item.content.number).toBe('4242424242424242');
        expect(item.content.expirationDate).toBe('012025');
        expect(item.content.verificationNumber).toBe('123');
    });
});
