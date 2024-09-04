import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readFirefoxData } from './firefox.reader';

describe('Import Firefox CSV', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/firefox.csv', 'utf8');
        payload = await readFirefoxData({ data: sourceData });
    });

    it('should handle corrupted files', async () => {
        await expect(readFirefoxData({ data: 'not-a-csv-file' })).rejects.toThrow();
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
        expect(deobfuscate(loginItem.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem.content.itemEmail)).toEqual('nobody@example.com');
        expect(deobfuscate(loginItem.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem.content.password)).toEqual('proton123');
        expect(deobfuscate(loginItem.content.totpUri)).toEqual('');
        expect(loginItem.content.urls).toEqual(['https://account.proton.me/']);
        expect(loginItem.trashed).toEqual(false);
        expect(loginItem.extraFields).toEqual([]);

        /* Login with missing url */
        const loginItemMissingUrl = items[1] as ItemImportIntent<'login'>;
        expect(loginItemMissingUrl.type).toEqual('login');
        expect(loginItemMissingUrl.createTime).toEqual(1679064140);
        expect(loginItemMissingUrl.modifyTime).toEqual(1679064140);
        expect(loginItemMissingUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMissingUrl.metadata.name).toEqual('Unnamed item');
        expect(deobfuscate(loginItemMissingUrl.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemMissingUrl.content.itemEmail)).toEqual('missingurl@example.com');
        expect(deobfuscate(loginItemMissingUrl.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItemMissingUrl.content.password)).toEqual('proton123');
        expect(deobfuscate(loginItemMissingUrl.content.totpUri)).toEqual('');
        expect(loginItemMissingUrl.content.urls).toEqual([]);
        expect(loginItemMissingUrl.trashed).toEqual(false);
        expect(loginItemMissingUrl.extraFields).toEqual([]);

        /* Login with missing password */
        const loginItemMissingPassword = items[2] as ItemImportIntent<'login'>;
        expect(loginItemMissingPassword.type).toEqual('login');
        expect(loginItemMissingPassword.createTime).toEqual(1679064121);
        expect(loginItemMissingPassword.modifyTime).toEqual(1679064121);
        expect(loginItemMissingPassword.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMissingPassword.metadata.name).toEqual('account.proton.me');
        expect(deobfuscate(loginItemMissingPassword.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemMissingPassword.content.itemEmail)).toEqual('missingpw@example.com');
        expect(deobfuscate(loginItemMissingPassword.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItemMissingPassword.content.password)).toEqual('');
        expect(deobfuscate(loginItemMissingPassword.content.totpUri)).toEqual('');
        expect(loginItemMissingPassword.content.urls).toEqual(['https://account.proton.me/']);
        expect(loginItemMissingPassword.trashed).toEqual(false);
        expect(loginItemMissingPassword.extraFields).toEqual([]);

        /* Login with broken URL */
        const loginItemBrokedUrl = items[3] as ItemImportIntent<'login'>;
        expect(loginItemBrokedUrl.type).toEqual('login');
        expect(loginItemBrokedUrl.createTime).toEqual(1679080973);
        expect(loginItemBrokedUrl.modifyTime).toEqual(1679080973);
        expect(loginItemBrokedUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokedUrl.metadata.name).toEqual('Unnamed item');
        expect(deobfuscate(loginItemBrokedUrl.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemBrokedUrl.content.itemEmail)).toEqual('brokenurl@example.com');
        expect(deobfuscate(loginItemBrokedUrl.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItemBrokedUrl.content.password)).toEqual('');
        expect(deobfuscate(loginItemBrokedUrl.content.totpUri)).toEqual('');
        expect(loginItemBrokedUrl.content.urls).toEqual([]);
        expect(loginItemBrokedUrl.trashed).toEqual(false);
        expect(loginItemBrokedUrl.extraFields).toEqual([]);

        /* Login with localhost url */
        const loginItemLocalhost = items[4] as ItemImportIntent<'login'>;
        expect(loginItemLocalhost.type).toEqual('login');
        expect(loginItemLocalhost.createTime).toEqual(1679406099);
        expect(loginItemLocalhost.modifyTime).toEqual(1679406099);
        expect(loginItemLocalhost.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemLocalhost.metadata.name).toEqual('localhost');
        expect(deobfuscate(loginItemLocalhost.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemLocalhost.content.itemEmail)).toEqual('winston@example.com');
        expect(deobfuscate(loginItemLocalhost.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItemLocalhost.content.password)).toEqual('password');
        expect(deobfuscate(loginItemLocalhost.content.totpUri)).toEqual('');
        expect(loginItemLocalhost.content.urls).toEqual(['http://localhost:1234/']);
        expect(loginItemLocalhost.trashed).toEqual(false);
        expect(loginItemLocalhost.extraFields).toEqual([]);

        /* Login with comma and quote */
        const loginItemCommaQuote = items[5] as ItemImportIntent<'login'>;
        expect(loginItemCommaQuote.type).toEqual('login');
        expect(loginItemCommaQuote.createTime).toEqual(1679408193);
        expect(loginItemCommaQuote.modifyTime).toEqual(1684922497);
        expect(loginItemCommaQuote.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuote.metadata.name).toEqual('account.example.com');
        expect(deobfuscate(loginItemCommaQuote.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemCommaQuote.content.itemEmail)).toEqual('');
        expect(deobfuscate(loginItemCommaQuote.content.itemUsername)).toEqual('username with comma, quotes "');
        expect(deobfuscate(loginItemCommaQuote.content.password)).toEqual('password with comma, quotes "');
        expect(deobfuscate(loginItemCommaQuote.content.totpUri)).toEqual('');
        expect(loginItemCommaQuote.content.urls).toEqual(['https://account.example.com/']);
        expect(loginItemCommaQuote.trashed).toEqual(false);
        expect(loginItemCommaQuote.extraFields).toEqual([]);

        /* ignored & warnings  */
        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
