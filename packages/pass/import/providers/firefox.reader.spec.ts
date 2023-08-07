import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readFirefoxData } from './firefox.reader';

describe('Import Firefox CSV', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/firefox.csv', 'utf8');
        payload = await readFirefoxData(sourceData);
    });

    it('should handle corrupted files', async () => {
        await expect(readFirefoxData('not-a-csv-file')).rejects.toThrow();
    });

    it('should correctly parse items', async () => {
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login item */
        const loginItem = items[0] as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.createTime).toEqual(1679064121);
        expect(loginItem.modifyTime).toEqual(1679064121);
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.metadata.name).toEqual('account.proton.me');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.content).toEqual({
            username: 'nobody@example.com',
            password: 'proton123',
            urls: ['https://account.proton.me/'],
            totpUri: '',
        });
        expect(loginItem.trashed).toEqual(false);
        expect(loginItem.extraFields).toEqual([]);

        /* Login with missing url */
        const loginItemMissingUrl = items[1] as ItemImportIntent<'login'>;
        expect(loginItemMissingUrl.type).toEqual('login');
        expect(loginItemMissingUrl.createTime).toEqual(1679064140);
        expect(loginItemMissingUrl.modifyTime).toEqual(1679064140);
        expect(loginItemMissingUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMissingUrl.metadata.name).toEqual('Unnamed item');
        expect(loginItemMissingUrl.metadata.note).toEqual('');
        expect(loginItemMissingUrl.content).toEqual({
            username: 'missingurl@example.com',
            password: 'proton123',
            urls: [],
            totpUri: '',
        });
        expect(loginItemMissingUrl.trashed).toEqual(false);
        expect(loginItemMissingUrl.extraFields).toEqual([]);

        /* Login with missing password */
        const loginItemMissingPassword = items[2] as ItemImportIntent<'login'>;
        expect(loginItemMissingPassword.type).toEqual('login');
        expect(loginItemMissingPassword.createTime).toEqual(1679064121);
        expect(loginItemMissingPassword.modifyTime).toEqual(1679064121);
        expect(loginItemMissingPassword.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMissingPassword.metadata.name).toEqual('account.proton.me');
        expect(loginItemMissingPassword.metadata.note).toEqual('');
        expect(loginItemMissingPassword.content).toEqual({
            username: 'missingpw@example.com',
            password: '',
            urls: ['https://account.proton.me/'],
            totpUri: '',
        });
        expect(loginItemMissingPassword.trashed).toEqual(false);
        expect(loginItemMissingPassword.extraFields).toEqual([]);

        /* Login with broken url */
        const loginItemBrokedUrl = items[3] as ItemImportIntent<'login'>;
        expect(loginItemBrokedUrl.type).toEqual('login');
        expect(loginItemBrokedUrl.createTime).toEqual(1679080973);
        expect(loginItemBrokedUrl.modifyTime).toEqual(1679080973);
        expect(loginItemBrokedUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokedUrl.metadata.name).toEqual('Unnamed item');
        expect(loginItemBrokedUrl.metadata.note).toEqual('');
        expect(loginItemBrokedUrl.content).toEqual({
            username: 'brokenurl@example.com',
            password: '',
            urls: [],
            totpUri: '',
        });
        expect(loginItemBrokedUrl.trashed).toEqual(false);
        expect(loginItemBrokedUrl.extraFields).toEqual([]);

        /* Login with localhost url */
        const loginItemLocalhost = items[4] as ItemImportIntent<'login'>;
        expect(loginItemLocalhost.type).toEqual('login');
        expect(loginItemLocalhost.createTime).toEqual(1679406099);
        expect(loginItemLocalhost.modifyTime).toEqual(1679406099);
        expect(loginItemLocalhost.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemLocalhost.metadata.name).toEqual('localhost');
        expect(loginItemLocalhost.metadata.note).toEqual('');
        expect(loginItemLocalhost.content).toEqual({
            username: 'winston@example.com',
            password: 'password',
            urls: ['http://localhost:1234/'],
            totpUri: '',
        });
        expect(loginItemLocalhost.trashed).toEqual(false);
        expect(loginItemLocalhost.extraFields).toEqual([]);

        /* Login with comma and quote */
        const loginItemCommaQuote = items[5] as ItemImportIntent<'login'>;
        expect(loginItemCommaQuote.type).toEqual('login');
        expect(loginItemCommaQuote.createTime).toEqual(1679408193);
        expect(loginItemCommaQuote.modifyTime).toEqual(1684922497);
        expect(loginItemCommaQuote.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuote.metadata.name).toEqual('account.example.com');
        expect(loginItemCommaQuote.metadata.note).toEqual('');
        expect(loginItemCommaQuote.content).toEqual({
            username: 'username with comma, quotes "',
            password: 'password with comma, quotes "',
            urls: ['https://account.example.com/'],
            totpUri: '',
        });
        expect(loginItemCommaQuote.trashed).toEqual(false);
        expect(loginItemCommaQuote.extraFields).toEqual([]);

        /* ignored & warnings  */
        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
