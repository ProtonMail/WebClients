import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readSafariData } from './safari.reader';

describe('Import Safari CSV', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/safari.csv', 'utf8');
        payload = await readSafariData({ data: sourceData, importUsername: true });
    });

    it('should handle corrupted files', async () => {
        await expect(readSafariData({ data: 'not-a-csv-file', importUsername: true })).rejects.toThrow();
    });

    it('should correctly parse items', async () => {
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login with broken url */
        const loginItemBrokenUrl = items[0] as ItemImportIntent<'login'>;
        expect(loginItemBrokenUrl.type).toEqual('login');
        expect(loginItemBrokenUrl.createTime).toBeUndefined();
        expect(loginItemBrokenUrl.modifyTime).toBeUndefined();
        expect(loginItemBrokenUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokenUrl.metadata.name).toEqual('ex:ample.com (brokenurl@example.com)');
        expect(deobfuscate(loginItemBrokenUrl.metadata.note)).toEqual('');
        expect(deobfuscate(loginItemBrokenUrl.content.itemEmail)).toEqual('brokenurl@example.com');
        expect(deobfuscate(loginItemBrokenUrl.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItemBrokenUrl.content.password)).toEqual('pass');
        expect(deobfuscate(loginItemBrokenUrl.content.totpUri)).toEqual('');
        expect(loginItemBrokenUrl.content.urls).toEqual([]);
        expect(loginItemBrokenUrl.trashed).toEqual(false);
        expect(loginItemBrokenUrl.extraFields).toEqual([]);

        /* Login with 2FA (scanned qr code) */
        const loginItem2faScanned = items[1] as ItemImportIntent<'login'>;
        expect(loginItem2faScanned.type).toEqual('login');
        expect(loginItem2faScanned.createTime).toBeUndefined();
        expect(loginItem2faScanned.modifyTime).toBeUndefined();
        expect(loginItem2faScanned.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2faScanned.metadata.name).toEqual('2fa.example.com (2fa-scanned)');
        expect(deobfuscate(loginItem2faScanned.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem2faScanned.content.itemEmail)).toEqual('');
        expect(deobfuscate(loginItem2faScanned.content.itemUsername)).toEqual('2fa-scanned');
        expect(deobfuscate(loginItem2faScanned.content.password)).toEqual('pass');
        expect(deobfuscate(loginItem2faScanned.content.totpUri)).toEqual(
            'otpauth://totp/db%40example.com?issuer=Proton&secret=OTDED5QZA64L6YRUWJLD65QQ3Z6PZ3A3&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem2faScanned.content.urls).toEqual(['https://2fa.example.com/']);
        expect(loginItem2faScanned.trashed).toEqual(false);
        expect(loginItem2faScanned.extraFields).toEqual([]);

        /* Login with comma and quote */
        const loginItemCommaQuote = items[2] as ItemImportIntent<'login'>;
        expect(loginItemCommaQuote.type).toEqual('login');
        expect(loginItemCommaQuote.createTime).toBeUndefined();
        expect(loginItemCommaQuote.modifyTime).toBeUndefined();
        expect(loginItemCommaQuote.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuote.metadata.name).toEqual('account.example.com (username with comma, quotes ")');
        expect(deobfuscate(loginItemCommaQuote.metadata.note)).toEqual('notes with commas, quotes "');
        expect(deobfuscate(loginItemCommaQuote.content.itemEmail)).toEqual('');
        expect(deobfuscate(loginItemCommaQuote.content.itemUsername)).toEqual('username with comma, quotes "');
        expect(deobfuscate(loginItemCommaQuote.content.password)).toEqual('password with comma, quotes "');
        expect(deobfuscate(loginItemCommaQuote.content.totpUri)).toEqual('');
        expect(loginItemCommaQuote.content.urls).toEqual(['https://account.example.com/']);
        expect(loginItemCommaQuote.trashed).toEqual(false);
        expect(loginItemCommaQuote.extraFields).toEqual([]);

        /* Login with multiple lines */
        const loginItemMultipleLines = items[3] as ItemImportIntent<'login'>;
        expect(loginItemMultipleLines.type).toEqual('login');
        expect(loginItemMultipleLines.createTime).toBeUndefined();
        expect(loginItemMultipleLines.modifyTime).toBeUndefined();
        expect(loginItemMultipleLines.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleLines.metadata.name).toEqual('localhost (login-with-multiple-lines)');
        expect(deobfuscate(loginItemMultipleLines.metadata.note)).toEqual('notes with\nmultiple\nlines');
        expect(deobfuscate(loginItemMultipleLines.content.itemEmail)).toEqual('');
        expect(deobfuscate(loginItemMultipleLines.content.itemUsername)).toEqual('login-with-multiple-lines');
        expect(deobfuscate(loginItemMultipleLines.content.password)).toEqual('pass');
        expect(deobfuscate(loginItemMultipleLines.content.totpUri)).toEqual('');
        expect(loginItemMultipleLines.content.urls).toEqual(['http://localhost:7777/']);
        expect(loginItemMultipleLines.trashed).toEqual(false);
        expect(loginItemMultipleLines.extraFields).toEqual([]);

        /* Login with 2FA (manually entered key) */
        const loginItem2faManuallyEntered = items[4] as ItemImportIntent<'login'>;
        expect(loginItem2faManuallyEntered.type).toEqual('login');
        expect(loginItem2faManuallyEntered.createTime).toBeUndefined();
        expect(loginItem2faManuallyEntered.modifyTime).toBeUndefined();
        expect(loginItem2faManuallyEntered.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2faManuallyEntered.metadata.name).toEqual(
            'account.proton.me (2fa-manually-entered-string@example.com)'
        );
        expect(deobfuscate(loginItem2faManuallyEntered.metadata.note)).toEqual('');
        expect(deobfuscate(loginItem2faManuallyEntered.content.itemEmail)).toEqual(
            '2fa-manually-entered-string@example.com'
        );
        expect(deobfuscate(loginItem2faManuallyEntered.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem2faManuallyEntered.content.password)).toEqual('proton123');
        expect(deobfuscate(loginItem2faManuallyEntered.content.totpUri)).toEqual(
            'otpauth://totp/account.proton.me:2fa-manually-entered-string%40example.com?issuer=account.proton.me&secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem2faManuallyEntered.content.urls).toEqual(['https://account.proton.me/']);
        expect(loginItem2faManuallyEntered.trashed).toEqual(false);
        expect(loginItem2faManuallyEntered.extraFields).toEqual([]);

        /* ignored & warnings  */
        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
