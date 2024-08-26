import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readLastPassData } from './lastpass.reader';

describe('Import LastPass csv', () => {
    let sourceFiles = [`${__dirname}/mocks/lastpass.csv`, `${__dirname}/mocks/lastpass.crcrlf.terminated.csv`];
    let payloads: Record<string, ImportPayload> = {};

    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        for (let sourceFile of sourceFiles) {
            const sourceData = await fs.promises.readFile(sourceFile, 'utf-8');
            payloads[sourceFile] = await readLastPassData({ data: sourceData, importUsername: true });
        }
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(readLastPassData({ data: 'not-a-csv-file', importUsername: true })).rejects.toThrow();
    });

    it('converts LastPass folders to vaults correctly', () => {
        const [source] = sourceFiles;
        const [primary, secondary] = payloads[source].vaults;
        expect(payloads[source].vaults.length).toEqual(2);
        expect(primary.name).toEqual('Import - 27 Apr 2023');
        expect(secondary.name).toEqual('company services');
    });

    it('parses primary `LastPass import` vault items correctly', () => {
        const [source] = sourceFiles;
        const [primary] = payloads[source].vaults;
        expect(primary.items.length).toEqual(4);

        /* Login */
        const loginItem1 = deobfuscateItem(primary.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('nobody');
        expect(loginItem1.metadata.note).toEqual('Secure note');
        expect(loginItem1.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem1.content.itemUsername).toEqual('');
        expect(loginItem1.content.password).toEqual('proton123');
        expect(loginItem1.content.urls[0]).toEqual('https://account.proton.me/');

        /* Note */
        const noteItem1 = deobfuscateItem(primary.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');

        /* Credit Card */
        const identityItem = deobfuscateItem(primary.items[2]) as unknown as ItemImportIntent<'identity'>;
        expect(identityItem.type).toEqual('identity');
        expect(identityItem.metadata.name).toEqual('TestID');
        expect(identityItem.metadata.note).toEqual('');
        expect(identityItem.content.firstName).toEqual('Test');
        expect(identityItem.content.middleName).toEqual('Joe');

        /* Credit Card */
        const creditCardItem1 = deobfuscateItem(primary.items[3]) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem1.type).toEqual('creditCard');
        expect(creditCardItem1.metadata.name).toEqual('Credit Card Item with note');
        expect(creditCardItem1.metadata.note).toEqual('this is a note for the credit card');
        expect(creditCardItem1.content.cardholderName).toEqual('A B');
        expect(creditCardItem1.content.number).toEqual('4242424242424242');
        expect(creditCardItem1.content.expirationDate).toEqual('012025');
        expect(creditCardItem1.content.verificationNumber).toEqual('123');
        expect(creditCardItem1.content.pin).toEqual('');
    });

    it('parses secondary vault items correctly', async () => {
        const [source] = sourceFiles;
        const [, secondary] = payloads[source].vaults;
        expect(secondary.items.length).toEqual(4);
        /* Login */
        const loginItem2 = deobfuscateItem(secondary.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('admin');
        expect(loginItem2.content.password).toEqual('proton123');
        expect(loginItem2.content.urls[0]).toEqual('https://proton.me/');

        /* Login */
        const loginItem3 = deobfuscateItem(secondary.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Twitter');
        expect(loginItem3.metadata.note).toEqual('This is a twitter note');
        expect(loginItem3.content.itemEmail).toEqual('');
        expect(loginItem3.content.itemUsername).toEqual('@nobody');
        expect(loginItem3.content.password).toEqual('proton123');
        expect(loginItem3.content.urls[0]).toEqual('https://twitter.com/login');
        expect(loginItem3.content.totpUri).toEqual(
            'otpauth://totp/Twitter?secret=BASE32SECRET&algorithm=SHA1&digits=6&period=30'
        );

        /* Login */
        const loginItem4 = deobfuscateItem(secondary.items[2]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('fb.com');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.itemEmail).toEqual('');
        expect(loginItem4.content.itemUsername).toEqual('@nobody');
        expect(loginItem4.content.password).toEqual('proton123');
        expect(loginItem4.content.urls[0]).toEqual('https://fb.com/login');
        expect(loginItem4.content.totpUri).toEqual(
            'otpauth://totp/fb.com?secret=BASE32SECRET&algorithm=SHA1&digits=6&period=30'
        );

        /* Login broken url */
        const loginItem5 = deobfuscateItem(secondary.items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Unnamed item');
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.content.itemEmail).toEqual('');
        expect(loginItem5.content.itemUsername).toEqual('');
        expect(loginItem5.content.password).toEqual('');
        expect(loginItem5.content.urls).toEqual([]);
    });

    test('correctly keeps a reference to ignored items', () => {
        const [source] = sourceFiles;
        expect(payloads[source].ignored).not.toEqual([]);
        expect(payloads[source].ignored[0]).toEqual('[Bank Account] test');
    });

    test('correctly handles CR CR LF line endings', () => {
        const [, source] = sourceFiles;
        const payload = payloads[source];
        const [primary] = payload.vaults;
        expect(primary.items.length).toEqual(3);
        expect(primary.items.filter((n) => n.type === 'note').length).toEqual(3);
    });
});
