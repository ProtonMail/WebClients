import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readChromiumData } from './chromium.reader';

describe('Import Chrome CSV', () => {
    it('should handle corrupted files', async () => {
        await expect(readChromiumData(new File([], 'corrupted'))).rejects.toThrow();
    });

    it('should correctly parse items', async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/chrome.csv');
        const file = new File([sourceData], 'chrome.csv');
        const payload = await readChromiumData(file);
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login */
        const loginItem1 = items[0] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('proton.me');
        expect(deobfuscate(loginItem1.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem1.content.itemEmail)).toEqual('nobody@proton.me');
        expect(deobfuscate(loginItem1.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem1.content.password)).toEqual('proton123');
        expect(loginItem1.content.urls[0]).toEqual('https://account.proton.me/switch');

        /* Login */
        const loginItem2 = items[1] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('missing url');
        expect(deobfuscate(loginItem2.metadata.note)).toEqual('somenote');
        expect(deobfuscate(loginItem2.content.itemEmail)).toEqual('missingurl@proton.me');
        expect(deobfuscate(loginItem2.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem2.content.password)).toEqual('proton123');
        expect(loginItem2.content.urls).toStrictEqual([]);

        /* Login */
        const loginItem3 = items[2] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('missing password');
        expect(deobfuscate(loginItem3.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem3.content.itemEmail)).toEqual('missingpw@proton.me');
        expect(deobfuscate(loginItem3.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem3.content.password)).toEqual('');
        expect(loginItem3.content.urls[0]).toEqual('https://account.proton.me/switch');

        /* Login broken url */
        const loginItem4 = items[3] as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('broken url');
        expect(deobfuscate(loginItem4.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem4.content.itemEmail)).toEqual('brokenurl@proton.me');
        expect(deobfuscate(loginItem4.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem4.content.password)).toEqual('');
        expect(loginItem4.content.urls).toEqual([]);
    });

    it('correctly parse items if .csv has `notes` column', async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/chrome-windows.csv');
        const file = new File([sourceData], 'chrome.csv');
        const payload = await readChromiumData(file);
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login */
        const loginItem1 = items[0] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('proton.me');
        expect(deobfuscate(loginItem1.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem1.content.itemEmail)).toEqual('nobody@proton.me');
        expect(deobfuscate(loginItem1.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem1.content.password)).toEqual('proton123');
        expect(loginItem1.content.urls[0]).toEqual('https://account.proton.me/switch');

        /* Login */
        const loginItem2 = items[1] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('missing url');
        expect(deobfuscate(loginItem2.metadata.note)).toEqual('somenote');
        expect(deobfuscate(loginItem2.content.itemEmail)).toEqual('missingurl@proton.me');
        expect(deobfuscate(loginItem2.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem2.content.password)).toEqual('proton123');
        expect(loginItem2.content.urls).toStrictEqual([]);

        /* Login */
        const loginItem3 = items[2] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('missing password');
        expect(deobfuscate(loginItem3.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem3.content.itemEmail)).toEqual('missingpw@proton.me');
        expect(deobfuscate(loginItem3.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem3.content.password)).toEqual('');
        expect(loginItem3.content.urls[0]).toEqual('https://account.proton.me/switch');
    });
});
