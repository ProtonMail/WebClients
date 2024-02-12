import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readProtonPassCsvData } from './protonpass.csv.reader';

describe('Import Proton Pass CSV', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/protonpass.csv', 'utf8');
        payload = await readProtonPassCsvData(sourceData);
    });

    it('should handle corrupted files', async () => {
        await expect(readProtonPassCsvData('not-a-csv-file')).rejects.toThrow();
    });

    it('should correctly parse items', async () => {
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Note */
        const noteItem = items[0] as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.metadata.name).toEqual('note title');
        expect(deobfuscate(noteItem.metadata.note)).toEqual('this is my note');
        expect(noteItem.content).toEqual({});
        expect(noteItem.createTime).toEqual(1706621831);
        expect(noteItem.modifyTime).toEqual(1707735222);

        /* Login */
        const loginItem = items[1] as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('login title');
        expect(deobfuscate(loginItem.metadata.note)).toEqual('login note');
        expect(deobfuscate(loginItem.content.username)).toEqual('john');
        expect(deobfuscate(loginItem.content.password)).toEqual('password123');
        expect(loginItem.content.urls).toEqual(['https://example.com/', 'https://proton.me/']);
        expect(deobfuscate(loginItem.content.totpUri)).toEqual(
            'otpauth://totp/login%20title:john?issuer=login%20title&secret=ABCDEF&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem.createTime).toEqual(1707735320);
        expect(loginItem.modifyTime).toEqual(1707735349);

        /* Credit Card */
        const creditCardItem = items[2] as ItemImportIntent<'creditCard'>;
        expect(creditCardItem.type).toEqual('creditCard');
        expect(creditCardItem.metadata.name).toEqual('credit card title');
        expect(deobfuscate(creditCardItem.metadata.note)).toEqual('credit card note');
        expect(deobfuscate(creditCardItem.content.number)).toEqual('4242424242424242');
        expect(deobfuscate(creditCardItem.content.pin)).toEqual('1234');
        expect(deobfuscate(creditCardItem.content.verificationNumber)).toEqual('123');
        expect(creditCardItem.content.cardType).toEqual(0);
        expect(creditCardItem.content.cardholderName).toEqual('John Doe');
        expect(creditCardItem.content.expirationDate).toEqual('2024-02');
        expect(creditCardItem.createTime).toEqual(1707735447);
        expect(creditCardItem.modifyTime).toEqual(1707735447);
    });
});
