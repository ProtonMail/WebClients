import fs from 'fs';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readDashlaneDataZIP } from './dashlane.zip.reader';

describe('Import Dashlane ZIP', () => {
    let sourceData: ArrayBuffer;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/dashlane.zip');
        payload = await readDashlaneDataZIP({ data: sourceData, importUsername: true });
    });

    test('should throw on invalid file content', async () => {
        await expect(readDashlaneDataZIP({ data: new ArrayBuffer(1), importUsername: true })).rejects.toThrow();
    });

    test('should correctly parse items', () => {
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(16);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login item with otp */
        const loginItem1 = deobfuscateItem(items[0] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem1.metadata.note).toEqual('');
        expect(loginItem1.metadata.name).toEqual('login with 2fa scanned from qr code');
        expect(loginItem1.content.itemEmail).toEqual('');
        expect(loginItem1.content.itemUsername).toEqual('john');
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
        const loginItem2 = deobfuscateItem(items[1] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2.metadata.name).toEqual('login with multiple lines');
        expect(loginItem2.metadata.note).toEqual('line 1\nline 2\nline 3');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('my name');
        expect(loginItem2.content.password).toEqual('pass');
        expect(loginItem2.content.urls.length).toEqual(0);
        expect(loginItem2.content.totpUri).toEqual('');
        expect(loginItem2.trashed).toEqual(false);
        expect(loginItem2.extraFields).toEqual([]);

        /* Login item with commas */
        const loginItem3 = deobfuscateItem(items[2] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem3.metadata.note).toEqual('comma 1, comma 2,');
        expect(loginItem3.metadata.name).toEqual('login with commas ,');
        expect(loginItem3.content.itemEmail).toEqual('');
        expect(loginItem3.content.itemUsername).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.urls.length).toEqual(0);
        expect(loginItem3.content.totpUri).toEqual('');
        expect(loginItem3.trashed).toEqual(false);
        expect(loginItem3.extraFields).toEqual([]);

        /* Login item with quote in name/note */
        const loginItem4 = deobfuscateItem(items[3] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem4.metadata.note).toEqual('note with "quote"');
        expect(loginItem4.metadata.name).toEqual('login with quotes "');
        expect(loginItem4.content.itemEmail).toEqual('');
        expect(loginItem4.content.itemUsername).toEqual('');
        expect(loginItem4.content.password).toEqual('');
        expect(loginItem4.content.urls.length).toEqual(0);
        expect(loginItem4.content.totpUri).toEqual('');
        expect(loginItem4.trashed).toEqual(false);
        expect(loginItem4.extraFields).toEqual([]);

        /* Login item with url */
        const loginItem5 = deobfuscateItem(items[4] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.metadata.name).toEqual('login with all preferences checked');
        expect(loginItem5.content.itemEmail).toEqual('');
        expect(loginItem5.content.itemUsername).toEqual('');
        expect(loginItem5.content.password).toEqual('');
        expect(loginItem5.content.urls.length).toEqual(1);
        expect(loginItem5.content.urls[0]).toEqual('https://example.com/');
        expect(loginItem5.content.totpUri).toEqual('');
        expect(loginItem5.trashed).toEqual(false);
        expect(loginItem5.extraFields).toEqual([]);

        /* Login item with weird URL */
        const loginItem6 = deobfuscateItem(items[5] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem6.type).toEqual('login');
        expect(loginItem6.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem6.metadata.note).toEqual('');
        expect(loginItem6.metadata.name).toEqual('test');
        expect(loginItem6.content.itemEmail).toEqual('test@example.com');
        expect(loginItem6.content.itemUsername).toEqual('');
        expect(loginItem6.content.password).toEqual('ndnndc');
        expect(loginItem6.content.urls.length).toEqual(1);
        expect(loginItem6.content.urls[0]).toEqual('https://test/');
        expect(loginItem6.content.totpUri).toEqual('');
        expect(loginItem6.trashed).toEqual(false);
        expect(loginItem6.extraFields).toEqual([]);

        /* Login item with weird password */
        const loginItem7 = deobfuscateItem(items[6] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem7.type).toEqual('login');
        expect(loginItem7.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem7.metadata.note).toEqual('');
        expect(loginItem7.metadata.name).toEqual('password with comma , and quote "');
        expect(loginItem7.content.itemEmail).toEqual('');
        expect(loginItem7.content.itemUsername).toEqual('john');
        expect(loginItem7.content.password).toEqual('password,"comma"');
        expect(loginItem7.content.urls.length).toEqual(1);
        expect(loginItem7.content.urls[0]).toEqual('https://example.com/comma,');
        expect(loginItem7.content.totpUri).toEqual('');
        expect(loginItem7.trashed).toEqual(false);
        expect(loginItem7.extraFields).toEqual([]);

        /* Login item with 2FA */
        const loginItem8 = deobfuscateItem(items[7] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem8.type).toEqual('login');
        expect(loginItem8.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem8.metadata.note).toEqual('');
        expect(loginItem8.metadata.name).toEqual('login with 2fa manually entered');
        expect(loginItem8.content.itemEmail).toEqual('');
        expect(loginItem8.content.itemUsername).toEqual('john');
        expect(loginItem8.content.password).toEqual('pass');
        expect(loginItem8.content.urls.length).toEqual(0);
        expect(loginItem8.content.totpUri).toEqual(
            'otpauth://totp/login%20with%202fa%20manually%20entered?secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem8.trashed).toEqual(false);
        expect(loginItem8.extraFields).toEqual([]);

        /* Note item with quotes */
        const noteItem1 = deobfuscateItem(items[8] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem1.metadata.name).toEqual('notes with quotes "');
        expect(noteItem1.metadata.note).toEqual('notes with "quotes"');
        expect(noteItem1.trashed).toEqual(false);
        expect(noteItem1.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem2 = deobfuscateItem(items[9] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem2.type).toEqual('note');
        expect(noteItem2.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem2.metadata.name).toEqual('notes with commas ,');
        expect(noteItem2.metadata.note).toEqual('comma 1, comma 2,');
        expect(noteItem2.trashed).toEqual(false);
        expect(noteItem2.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem3 = deobfuscateItem(items[10] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem3.type).toEqual('note');
        expect(noteItem3.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem3.metadata.name).toEqual('notes with multiple lines');
        expect(noteItem3.metadata.note).toEqual('line 1 line 2 line 3');
        expect(noteItem3.trashed).toEqual(false);
        expect(noteItem3.extraFields).toEqual([]);

        /* Credit card item */
        const creditCardItem1 = deobfuscateItem(items[11] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem1.type).toEqual('creditCard');
        expect(creditCardItem1.metadata.itemUuid).not.toBeUndefined();
        expect(creditCardItem1.metadata.name).toEqual('Unnamed Credit Card');
        expect(creditCardItem1.metadata.note).toEqual('');
        expect(creditCardItem1.content.cardholderName).toEqual('JOHN DOE');
        expect(creditCardItem1.content.number).toEqual('11111111111111111');
        expect(creditCardItem1.content.verificationNumber).toEqual('100');
        expect(creditCardItem1.content.expirationDate).toEqual('032023');
        expect(creditCardItem1.content.pin).toEqual('');
        expect(creditCardItem1.trashed).toEqual(false);
        expect(creditCardItem1.extraFields).toEqual([]);

        /* Credit card item with all fields filled */
        const creditCardItem2 = deobfuscateItem(items[12] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem2.type).toEqual('creditCard');
        expect(creditCardItem2.metadata.itemUuid).not.toBeUndefined();
        expect(creditCardItem2.metadata.name).toEqual('my cc');
        expect(creditCardItem2.metadata.note).toEqual('line1\nline2word1, line2word2');
        expect(creditCardItem2.content.cardholderName).toEqual('john');
        expect(creditCardItem2.content.number).toEqual('12345678901234567');
        expect(creditCardItem2.content.verificationNumber).toEqual('123');
        expect(creditCardItem2.content.expirationDate).toEqual('012024');
        expect(creditCardItem1.content.pin).toEqual('');
        expect(creditCardItem2.trashed).toEqual(false);
        expect(creditCardItem2.extraFields).toEqual([]);

        /* Credit card item with only 2 fields filled */
        const creditCardItem3 = deobfuscateItem(items[13] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem3.type).toEqual('creditCard');
        expect(creditCardItem3.metadata.itemUuid).not.toBeUndefined();
        expect(creditCardItem3.metadata.name).toEqual('Unnamed Credit Card');
        expect(creditCardItem3.metadata.note).toEqual('');
        expect(creditCardItem3.content.cardholderName).toEqual('');
        expect(creditCardItem3.content.number).toEqual('1');
        expect(creditCardItem3.content.verificationNumber).toEqual('1');
        expect(creditCardItem3.content.expirationDate).toEqual('');
        expect(creditCardItem3.content.pin).toEqual('');
        expect(creditCardItem3.trashed).toEqual(false);
        expect(creditCardItem3.extraFields).toEqual([]);
    });

    test('should correctly hydrate ignored and warnings arrays', () => {
        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
