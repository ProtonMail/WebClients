import fs from 'fs';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemExtraField, ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readEnpassData } from './enpass.reader';

describe('Import Enpass json', () => {
    let sourceData: string;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/enpass.json', 'utf8');
        payload = readEnpassData({ data: sourceData, importUsername: true });
    });

    it('should throw on corrupted files', () => {
        expect(() => readEnpassData({ data: 'not-a-json-body', importUsername: true })).toThrow(
            'Enpass file could not be parsed.'
        );
        expect(() => readEnpassData({ data: '{ "items": null }', importUsername: true })).toThrow(
            'File does not match expected format'
        );
        expect(() => readEnpassData({ data: '{ "items": {} }', importUsername: true })).toThrow(
            'File does not match expected format'
        );
        expect(() => readEnpassData({ data: '{}', importUsername: true })).toThrow(
            'File does not match expected format'
        );
    });

    test('should correctly parse items', () => {
        expect(payload.vaults.length).toEqual(1);

        const [primary] = payload.vaults;
        expect(primary.name).not.toBeUndefined();
        expect(primary.items.length).toEqual(10);

        /* Login */
        const loginItem1 = deobfuscateItem(primary.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Twitter');
        expect(loginItem1.metadata.note).toEqual('');
        expect(loginItem1.content.itemEmail).toEqual('emily@enpass.io');
        expect(loginItem1.content.itemUsername).toEqual('');
        expect(loginItem1.content.password).toEqual('herbert nadia banal slag broken violin somber modern cdc posing');
        expect(loginItem1.content.urls[0]).toEqual('https://www.twitter.com/');
        expect(loginItem1.content.totpUri).toEqual(
            'otpauth://totp/Twitter?secret=QG4RPWYF4T23V62G4TA3NE4374&algorithm=SHA1&digits=6&period=30'
        );
        const loginItem1ExtraField1 = loginItem1.extraFields[0] as ItemExtraField<'text'>;
        expect(loginItem1ExtraField1.fieldName).toEqual('Security question');
        expect(loginItem1ExtraField1.data.content).toEqual('Example extra field, predefined');
        const loginItem1ExtraField2 = loginItem1.extraFields[1] as ItemExtraField<'hidden'>;
        expect(loginItem1ExtraField2.fieldName).toEqual('Custom field name');
        expect(loginItem1ExtraField2.data.content).toEqual('Example extra field, user-defined');
        expect(loginItem1ExtraField2.type).toEqual('hidden');

        /* Login with username and email, email should be extra field */
        const loginItem5 = deobfuscateItem(primary.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Twitter');
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.content.itemEmail).toEqual('emily@enpass.io');
        expect(loginItem5.content.itemUsername).toEqual('Emily');
        expect(loginItem5.content.password).toEqual('herbert nadia banal slag broken violin somber modern cdc posing');
        expect(loginItem5.content.urls[0]).toEqual('https://www.twitter.com/');
        expect(loginItem5.content.totpUri).toEqual(
            'otpauth://totp/Twitter?secret=QG4RPWYF4T23V62G4TA3NE4374&algorithm=SHA1&digits=6&period=30'
        );
        const loginItem5ExtraField1 = loginItem5.extraFields[0] as ItemExtraField<'text'>;
        expect(loginItem5ExtraField1.fieldName).toEqual('Security question');
        expect(loginItem5ExtraField1.data.content).toEqual('Example extra field, predefined');
        const loginItem5ExtraField2 = loginItem5.extraFields[1] as ItemExtraField<'hidden'>;
        expect(loginItem5ExtraField2.fieldName).toEqual('Custom field name');
        expect(loginItem5ExtraField2.data.content).toEqual('Example extra field, user-defined');
        expect(loginItem5ExtraField2.type).toEqual('hidden');
        const loginItem5ExtraField3 = loginItem5.extraFields[2] as ItemExtraField<'text'>;
        expect(loginItem5ExtraField3.fieldName).toEqual('E-mail');
        expect(loginItem5ExtraField3.data.content).toEqual('emily@enpass.io');

        /* Login with a username and no email */
        const loginItem2 = deobfuscateItem(primary.items[2]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Yahoo!');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('');
        expect(loginItem2.metadata.note).toEqual('example note');

        /* Trashed login */
        const loginItem3 = deobfuscateItem(primary.items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Trashed');
        expect(loginItem3.trashed).toEqual(true);

        /* Transhed login */
        const loginItem4 = deobfuscateItem(primary.items[4]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('Archived');
        expect(loginItem4.trashed).toEqual(true);

        /* Note */
        const noteItem1 = deobfuscateItem(primary.items[5]) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Note');
        expect(noteItem1.metadata.note).toEqual('Note text');

        /* Credit Card */
        const creditCardItem1 = deobfuscateItem(primary.items[6]) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem1.type).toEqual('creditCard');
        expect(creditCardItem1.metadata.name).toEqual('Credit Card');
        expect(creditCardItem1.metadata.note).toEqual('');
        expect(creditCardItem1.content.cardholderName).toEqual('Emily Sample');
        expect(creditCardItem1.content.number).toEqual('1234 123456 00000');
        expect(creditCardItem1.content.expirationDate).toEqual('03/27');
        expect(creditCardItem1.content.verificationNumber).toEqual('1234');
        expect(creditCardItem1.content.pin).toEqual('9874');

        /* Credit card - extracted login item */
        const creditCardLoginItem1 = deobfuscateItem(primary.items[7]) as unknown as ItemImportIntent<'login'>;
        expect(creditCardLoginItem1.type).toEqual('login');
        expect(creditCardLoginItem1.metadata.name).toEqual(creditCardItem1.metadata.name);
        expect(creditCardLoginItem1.content.itemEmail).toEqual('');
        expect(creditCardLoginItem1.content.itemUsername).toEqual('Emily_ENP');
        expect(creditCardLoginItem1.content.password).toEqual(
            'nnn tug shoot selfish bon liars convent dusty minnow uncheck'
        );
        expect(creditCardLoginItem1.content.totpUri).toEqual('');
        expect(creditCardLoginItem1.content.urls).toEqual(['http://global.americanexpress.com/']);

        /* Password */
        const passwordItem1 = deobfuscateItem(primary.items[8]) as unknown as ItemImportIntent<'login'>;
        expect(passwordItem1.metadata.name).toEqual('Password');
        expect(passwordItem1.content.itemEmail).toEqual('');
        expect(passwordItem1.content.itemUsername).toEqual('username');
        expect(passwordItem1.content.password).toEqual('password');

        /* Identity */
        const identityItem = deobfuscateItem(primary.items[9]) as unknown as ItemImportIntent<'identity'>;
        expect(identityItem.metadata.name).toEqual('Identity');
        expect(identityItem.content.firstName).toEqual('John');
        expect(identityItem.content.middleName).toEqual('Jay');
        expect(identityItem.content.lastName).toEqual('Doe');
    });

    test('correctly keeps a reference to ignored items', () => {
        expect(payload.ignored).not.toEqual([]);
        expect(payload.ignored.length).toEqual(5);
        expect(payload.ignored[0]).toEqual('[Travel] Passport Sample');
    });
});
