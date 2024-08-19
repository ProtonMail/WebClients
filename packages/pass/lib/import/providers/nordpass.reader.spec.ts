import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readNordPassData } from './nordpass.reader';

describe('Import NordPass csv', () => {
    let sourceData: string;
    let payload: ImportPayload;

    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/nordpass.csv', 'utf8');
        payload = await readNordPassData({ data: sourceData, importUsername: true });
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(readNordPassData({ data: 'not-a-csv-file', importUsername: true })).rejects.toThrow();
    });

    it('converts NordPass folders to vaults correctly', () => {
        const [primary, secondary] = payload.vaults;
        expect(payload.vaults.length).toEqual(2);
        expect(primary.name).toEqual('Import - 27 Apr 2023');
        expect(secondary.name).toEqual('company services');
    });

    it('parses primary `NordPass import` vault items correctly', () => {
        const [primary] = payload.vaults;
        expect(primary.items.length).toEqual(5);

        /* Login */
        const loginItem1 = deobfuscateItem(primary.items[0] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('nobody');
        expect(loginItem1.metadata.note).toEqual('Secure note');
        expect(loginItem1.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem1.content.itemUsername).toEqual('');
        expect(loginItem1.content.password).toEqual('proton123');
        expect(loginItem1.content.urls[0]).toEqual('https://account.proton.me/');

        /* Note */
        const noteItem1 = deobfuscateItem(primary.items[1] as any) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');

        /* Credit Card */
        const creditCardItem1 = deobfuscateItem(primary.items[3] as any) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem1.type).toEqual('creditCard');
        expect(creditCardItem1.metadata.name).toEqual('Credit Card Item with note');
        expect(creditCardItem1.metadata.note).toEqual('this is a note for the credit card');
        expect(creditCardItem1.content.cardholderName).toEqual('A B');
        expect(creditCardItem1.content.number).toEqual('4242424242424242');
        expect(creditCardItem1.content.expirationDate).toEqual('012025');
        expect(creditCardItem1.content.verificationNumber).toEqual('123');
        expect(creditCardItem1.content.pin).toEqual('');

        /* Identity */
        const identityItem = deobfuscateItem(primary.items[4] as any) as unknown as ItemImportIntent<'identity'>;
        expect(identityItem.type).toEqual('identity');
        expect(identityItem.metadata.name).toEqual(':title:');
        expect(identityItem.metadata.note).toEqual(':note:');
        expect(identityItem.content.fullName).toEqual(':full-name:');
        expect(identityItem.content.email).toEqual(':email:');
        expect(identityItem.content.phoneNumber).toEqual(':phone-number:');
        expect(identityItem.content.streetAddress).toEqual(':address-1:');
        expect(identityItem.content.zipOrPostalCode).toEqual(':zip:');
        expect(identityItem.content.city).toEqual(':city:');
        expect(identityItem.content.stateOrProvince).toEqual(':state:');
        expect(identityItem.content.countryOrRegion).toEqual("Côte d'Ivoire");
    });

    it('parses secondary vault items correctly', async () => {
        const [, secondary] = payload.vaults;
        expect(secondary.items.length).toEqual(4);
        /* Login */
        const loginItem2 = deobfuscateItem(secondary.items[0] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('admin');
        expect(loginItem2.content.password).toEqual('proton123');
        expect(loginItem2.content.urls[0]).toEqual('https://proton.me/');

        /* Login */
        const loginItem3 = deobfuscateItem(secondary.items[1] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Twitter');
        expect(loginItem3.metadata.note).toEqual('This is a twitter note');
        expect(loginItem3.content.itemEmail).toEqual('');
        expect(loginItem3.content.itemUsername).toEqual('@nobody');
        expect(loginItem3.content.password).toEqual('proton123');
        expect(loginItem3.content.urls[0]).toEqual('https://twitter.com/login');
        expect(loginItem3.content.totpUri).toEqual('');

        /* Login */
        const loginItem4 = deobfuscateItem(secondary.items[2] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('fb.com');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.itemEmail).toEqual('');
        expect(loginItem4.content.itemUsername).toEqual('@nobody');
        expect(loginItem4.content.password).toEqual('proton123');
        expect(loginItem4.content.urls[0]).toEqual('https://fb.com/login');
        expect(loginItem4.content.totpUri).toEqual('');

        /* Login broken url */
        const loginItem5 = deobfuscateItem(secondary.items[3] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('htts');
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.content.itemEmail).toEqual('');
        expect(loginItem5.content.itemUsername).toEqual('');
        expect(loginItem5.content.password).toEqual('');
        expect(loginItem5.content.urls).toEqual([]);
    });

    test('correctly keeps a reference to ignored items', () => {
        expect(payload.ignored).not.toEqual([]);
        expect(payload.ignored[0]).toEqual('[folder] company services');
    });
});
