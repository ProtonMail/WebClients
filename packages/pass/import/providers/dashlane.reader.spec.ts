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

    test('should correctly parse items', () => {
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(11);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login item with otp */
        const loginItem1 = items[0] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem1.metadata.note).toEqual('');
        expect(loginItem1.metadata.name).toEqual('login with 2fa scanned from qr code');
        expect(loginItem1.content.username).toEqual('john');
        expect(loginItem1.content.password).toEqual('pass');
        expect(loginItem1.content.urls.length).toEqual(0);
        expect(loginItem1.content.totpUri).toEqual(
            'otpauth://totp/login%20with%202fa%20scanned%20from%20qr%20code?secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem1.trashed).toEqual(false);
        expect(loginItem1.extraFields).toEqual([
            {
                fieldName: 'username1',
                type: 'text',
                data: {
                    content: 'john2',
                },
            },
        ]);

        /* Login item with multiple lines */
        const loginItem2 = items[1] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2.metadata.name).toEqual('login with multiple lines');
        expect(loginItem2.metadata.note).toEqual('line 1\nline 2\nline 3');
        expect(loginItem2.content.username).toEqual('my name');
        expect(loginItem2.content.password).toEqual('pass');
        expect(loginItem2.content.urls.length).toEqual(0);
        expect(loginItem2.content.totpUri).toEqual('');
        expect(loginItem2.trashed).toEqual(false);
        expect(loginItem2.extraFields).toEqual([]);

        /* Login item with commas */
        const loginItem3 = items[2] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem3.metadata.note).toEqual('comma 1, comma 2,');
        expect(loginItem3.metadata.name).toEqual('login with commas ,');
        expect(loginItem3.content.username).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.urls.length).toEqual(0);
        expect(loginItem3.content.totpUri).toEqual('');
        expect(loginItem3.trashed).toEqual(false);
        expect(loginItem3.extraFields).toEqual([]);

        /* Login item with quote in name/note */
        const loginItem4 = items[3] as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem4.metadata.note).toEqual('note with "quote"');
        expect(loginItem4.metadata.name).toEqual('login with quotes "');
        expect(loginItem4.content.username).toEqual('');
        expect(loginItem4.content.password).toEqual('');
        expect(loginItem4.content.urls.length).toEqual(0);
        expect(loginItem4.content.totpUri).toEqual('');
        expect(loginItem4.trashed).toEqual(false);
        expect(loginItem4.extraFields).toEqual([]);

        /* Login item with url */
        const loginItem5 = items[4] as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.metadata.name).toEqual('login with all preferences checked');
        expect(loginItem5.content.username).toEqual('');
        expect(loginItem5.content.password).toEqual('');
        expect(loginItem5.content.urls.length).toEqual(1);
        expect(loginItem5.content.urls[0]).toEqual('https://example.com/');
        expect(loginItem5.content.totpUri).toEqual('');
        expect(loginItem5.trashed).toEqual(false);
        expect(loginItem5.extraFields).toEqual([]);

        /* Login item with weird URL */
        const loginItem6 = items[5] as ItemImportIntent<'login'>;
        expect(loginItem6.type).toEqual('login');
        expect(loginItem6.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem6.metadata.note).toEqual('');
        expect(loginItem6.metadata.name).toEqual('test');
        expect(loginItem6.content.username).toEqual('test@example.com');
        expect(loginItem6.content.password).toEqual('ndnndc');
        expect(loginItem6.content.urls.length).toEqual(1);
        expect(loginItem6.content.urls[0]).toEqual('https://test/');
        expect(loginItem6.content.totpUri).toEqual('');
        expect(loginItem6.trashed).toEqual(false);
        expect(loginItem6.extraFields).toEqual([]);

        /* Login item with weird password */
        const loginItem7 = items[6] as ItemImportIntent<'login'>;
        expect(loginItem7.type).toEqual('login');
        expect(loginItem7.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem7.metadata.note).toEqual('');
        expect(loginItem7.metadata.name).toEqual('password with comma , and quote "');
        expect(loginItem7.content.username).toEqual('john');
        expect(loginItem7.content.password).toEqual('password,"comma"');
        expect(loginItem7.content.urls.length).toEqual(1);
        expect(loginItem7.content.urls[0]).toEqual('https://example.com/comma,');
        expect(loginItem7.content.totpUri).toEqual('');
        expect(loginItem7.trashed).toEqual(false);
        expect(loginItem7.extraFields).toEqual([]);

        /* Login item with 2FA */
        const loginItem8 = items[7] as ItemImportIntent<'login'>;
        expect(loginItem8.type).toEqual('login');
        expect(loginItem8.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem8.metadata.note).toEqual('');
        expect(loginItem8.metadata.name).toEqual('login with 2fa manually entered');
        expect(loginItem8.content.username).toEqual('john');
        expect(loginItem8.content.password).toEqual('pass');
        expect(loginItem8.content.urls.length).toEqual(0);
        expect(loginItem8.content.totpUri).toEqual(
            'otpauth://totp/login%20with%202fa%20manually%20entered?secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem8.trashed).toEqual(false);
        expect(loginItem8.extraFields).toEqual([]);

        /* Note item with quotes */
        const noteItem1 = items[8] as ItemImportIntent<'note'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem1.metadata.name).toEqual('notes with quotes "');
        expect(noteItem1.metadata.note).toEqual('notes with "quotes"');
        expect(noteItem1.trashed).toEqual(false);
        expect(noteItem1.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem2 = items[9] as ItemImportIntent<'note'>;
        expect(noteItem2.type).toEqual('note');
        expect(noteItem2.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem2.metadata.name).toEqual('notes with commas ,');
        expect(noteItem2.metadata.note).toEqual('comma 1, comma 2,');
        expect(noteItem2.trashed).toEqual(false);
        expect(noteItem2.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem3 = items[10] as ItemImportIntent<'note'>;
        expect(noteItem3.type).toEqual('note');
        expect(noteItem3.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem3.metadata.name).toEqual('notes with multiple lines');
        expect(noteItem3.metadata.note).toEqual('line 1 line 2 line 3');
        expect(noteItem3.trashed).toEqual(false);
        expect(noteItem3.extraFields).toEqual([]);
    });

    test('should correctly hydrate ignored and warnings arrays', () => {
        expect(payload.ignored.length).toEqual(2);
        expect(payload.ignored[0]).toEqual('[Personal Info] Unnamed');
        expect(payload.ignored[1]).toEqual('[Payment] JOHN DOE');

        expect(payload.warnings.length).toEqual(0);
    });
});
