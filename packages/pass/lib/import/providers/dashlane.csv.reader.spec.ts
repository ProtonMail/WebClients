import fs from 'fs';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readDashlaneDataCSV } from './dashlane.csv.reader';

const readCSVData = async (filename: string): Promise<ImportPayload> => {
    const sourceData = await fs.promises.readFile(__dirname + `/mocks/${filename}`, 'utf8');
    return readDashlaneDataCSV({ data: sourceData, importUsername: true });
};

describe('Import Dashlane CSV', () => {
    test('should throw on invalid file content', async () => {
        await expect(readDashlaneDataCSV({ data: 'not-a-csv-file', importUsername: true })).rejects.toThrow();
    });

    test('should correctly parse login items', async () => {
        const payload = await readCSVData('dashlane-credentials.csv');
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(8);

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
    });

    test('should correctly parse note items', async () => {
        const payload = await readCSVData('dashlane-secure-notes.csv');
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(3);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Note item with quotes */
        const noteItem1 = deobfuscateItem(items[0] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem1.metadata.name).toEqual('notes with quotes "');
        expect(noteItem1.metadata.note).toEqual('notes with "quotes"');
        expect(noteItem1.trashed).toEqual(false);
        expect(noteItem1.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem2 = deobfuscateItem(items[1] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem2.type).toEqual('note');
        expect(noteItem2.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem2.metadata.name).toEqual('notes with commas ,');
        expect(noteItem2.metadata.note).toEqual('comma 1, comma 2,');
        expect(noteItem2.trashed).toEqual(false);
        expect(noteItem2.extraFields).toEqual([]);

        /* Note item with commas */
        const noteItem3 = deobfuscateItem(items[2] as any) as unknown as ItemImportIntent<'note'>;
        expect(noteItem3.type).toEqual('note');
        expect(noteItem3.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem3.metadata.name).toEqual('notes with multiple lines');
        expect(noteItem3.metadata.note).toEqual('line 1 line 2 line 3');
        expect(noteItem3.trashed).toEqual(false);
        expect(noteItem3.extraFields).toEqual([]);
    });

    test('should correctly parse payments items', async () => {
        const payload = await readCSVData('dashlane-payments.csv');
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(3);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Payment item */
        const paymentItem1 = deobfuscateItem(items[0] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(paymentItem1.type).toEqual('creditCard');
        expect(paymentItem1.metadata.itemUuid).not.toBeUndefined();
        expect(paymentItem1.metadata.name).toEqual('Unnamed Credit Card');
        expect(paymentItem1.metadata.note).toEqual('');
        expect(paymentItem1.content.cardholderName).toEqual('JOHN DOE');
        expect(paymentItem1.content.number).toEqual('11111111111111111');
        expect(paymentItem1.content.verificationNumber).toEqual('100');
        expect(paymentItem1.content.expirationDate).toEqual('032023');
        expect(paymentItem1.content.pin).toEqual('');
        expect(paymentItem1.trashed).toEqual(false);
        expect(paymentItem1.extraFields).toEqual([]);

        /* Credit card item with all fields filled */
        const paymentItem2 = deobfuscateItem(items[1] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(paymentItem2.type).toEqual('creditCard');
        expect(paymentItem2.metadata.itemUuid).not.toBeUndefined();
        expect(paymentItem2.metadata.name).toEqual('my cc');
        expect(paymentItem2.metadata.note).toEqual('line1\nline2word1, line2word2');
        expect(paymentItem2.content.cardholderName).toEqual('john');
        expect(paymentItem2.content.number).toEqual('12345678901234567');
        expect(paymentItem2.content.verificationNumber).toEqual('123');
        expect(paymentItem2.content.expirationDate).toEqual('012024');
        expect(paymentItem1.content.pin).toEqual('');
        expect(paymentItem2.trashed).toEqual(false);
        expect(paymentItem2.extraFields).toEqual([]);

        /* Credit card item with only 2 fields filled */
        const paymentItem3 = deobfuscateItem(items[2] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(paymentItem3.type).toEqual('creditCard');
        expect(paymentItem3.metadata.itemUuid).not.toBeUndefined();
        expect(paymentItem3.metadata.name).toEqual('Unnamed Credit Card');
        expect(paymentItem3.metadata.note).toEqual('');
        expect(paymentItem3.content.cardholderName).toEqual('');
        expect(paymentItem3.content.number).toEqual('1');
        expect(paymentItem3.content.verificationNumber).toEqual('1');
        expect(paymentItem3.content.expirationDate).toEqual('');
        expect(paymentItem3.content.pin).toEqual('');
        expect(paymentItem3.trashed).toEqual(false);
        expect(paymentItem3.extraFields).toEqual([]);
    });

    test('should correctly hydrate ignored and warnings arrays', async () => {
        const payload = await readCSVData('dashlane-personal-info.csv');
        expect(payload.ignored.length).toEqual(0);
        expect(payload.warnings.length).toEqual(0);
    });
});
