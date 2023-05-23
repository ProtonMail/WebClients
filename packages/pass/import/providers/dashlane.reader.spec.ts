import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readDashlaneData } from './dashlane.reader';

describe('Import Dashlane ZIP', () => {
    let sourceData: ArrayBuffer;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/dashlane.zip');
        payload = await readDashlaneData(sourceData);
    });

    test('should throw on invalid file content', async () => {
        await expect(readDashlaneData(new ArrayBuffer(1))).rejects.toThrow();
    });

    it('should correctly parse items', () => {
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(11);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.type).toEqual('new');
        expect(vaultData.type === 'new' && vaultData.vaultName).not.toBeUndefined();

        const { items } = vaultData;

        /* Login item with multiple lines */
        const loginItem1 = items[1] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem1.metadata.name).toEqual('login with multiple lines');
        expect(loginItem1.metadata.note).toEqual('line 1\nline 2\nline 3');
        expect(loginItem1.content.username).toEqual('my name');
        expect(loginItem1.content.password).toEqual('pass');
        expect(loginItem1.content.urls.length).toEqual(0);
        expect(loginItem1.content.totpUri).toEqual('');
        expect(loginItem1.trashed).toEqual(false);
        expect(loginItem1.extraFields).toEqual([]);

        /* Login item with commas */
        const loginItem2 = items[2] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2.metadata.note).toEqual('comma 1, comma 2,');
        expect(loginItem2.metadata.name).toEqual('login with commas ,');
        expect(loginItem2.content.username).toEqual('');
        expect(loginItem2.content.password).toEqual('');
        expect(loginItem2.content.urls.length).toEqual(0);
        expect(loginItem2.content.totpUri).toEqual('');
        expect(loginItem2.trashed).toEqual(false);
        expect(loginItem2.extraFields).toEqual([]);

        /* Login item with url */
        const loginItem3 = items[4] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem3.metadata.note).toEqual('');
        expect(loginItem3.metadata.name).toEqual('login with all preferences checked');
        expect(loginItem3.content.username).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.urls.length).toEqual(1);
        expect(loginItem3.content.urls[0]).toEqual('https://example.com');
        expect(loginItem3.content.totpUri).toEqual('');
        expect(loginItem3.trashed).toEqual(false);
        expect(loginItem3.extraFields).toEqual([]);

        /* Login item with otp */
        const loginItem4 = items[0] as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.metadata.name).toEqual('login with 2fa scanned from qr code');
        expect(loginItem4.content.username).toEqual('john');
        expect(loginItem4.content.password).toEqual('pass');
        expect(loginItem4.content.urls.length).toEqual(0);
        expect(loginItem4.content.totpUri).toEqual(
            'otpauth://totp/login%20with%202fa%20scanned%20from%20qr%20code?secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem4.trashed).toEqual(false);
        expect(loginItem4.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem1 = items[9] as ItemImportIntent<'note'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem1.metadata.name).toEqual('notes with commas ,');
        expect(noteItem1.metadata.note).toEqual('comma 1, comma 2,');
        expect(noteItem1.trashed).toEqual(false);
        expect(noteItem1.extraFields).toEqual([]);

        /* Note item with quotes */
        const noteItem2 = items[8] as ItemImportIntent<'note'>;
        expect(noteItem2.type).toEqual('note');
        expect(noteItem2.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem2.metadata.name).toEqual('notes with quotes "');
        expect(noteItem2.metadata.note).toEqual('notes with "quotes"');
        expect(noteItem2.trashed).toEqual(false);
        expect(noteItem2.extraFields).toEqual([]);
    });
});
