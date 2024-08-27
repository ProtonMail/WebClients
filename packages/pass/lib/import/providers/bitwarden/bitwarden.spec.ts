import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemExtraField, ItemImportIntent } from '@proton/pass/types';

import { readBitwardenData } from './bitwarden.reader';

describe('Import bitwarden json', () => {
    let sourceFiles = [`${__dirname}/mocks/bitwarden.json`, `${__dirname}/mocks/bitwarden-b2b.json`];
    let payloads: Record<string, ImportPayload> = {};

    beforeAll(async () => {
        for (let sourceFile of sourceFiles) {
            const data = await fs.promises.readFile(sourceFile, 'utf-8');
            payloads[sourceFile] = await readBitwardenData({ data, importUsername: true });
        }
    });

    it('should throw on encrypted json payload', () => {
        expect(() =>
            readBitwardenData({ data: JSON.stringify({ encrypted: true, items: [] }), importUsername: true })
        ).toThrow();
    });

    it('should throw on corrupted files', () => {
        expect(() => readBitwardenData({ data: 'not-a-json-body', importUsername: true })).toThrow();
        expect(() => readBitwardenData({ data: JSON.stringify({ encrypted: false }), importUsername: true })).toThrow();
        expect(() =>
            readBitwardenData({ data: JSON.stringify({ encrypted: false, items: '[]' }), importUsername: true })
        ).toThrow();
    });

    it('should correctly parse items', () => {
        const [source] = sourceFiles;
        const { vaults } = payloads[source];
        const [primary, secondary] = vaults;

        expect(vaults.length).toEqual(2);

        expect(primary.items.length).toEqual(6);
        expect(primary.name).not.toBeUndefined();

        expect(secondary.items.length).toEqual(2);
        expect(secondary.name).toEqual('custom folder');

        /* Login */
        const loginItem1 = deobfuscateItem(primary.items[0]) as unknown as ItemImportIntent<'login'>;
        const allowedApp = loginItem1.platformSpecific?.android?.allowedApps[0];
        expect(loginItem1.type).toBe('login');
        expect(loginItem1.metadata.name).toBe('LoginItemMultipleWebsites');
        expect(loginItem1.metadata.note).toBe('login note');
        expect(loginItem1.content.itemEmail).toBe('');
        expect(loginItem1.content.itemUsername).toBe('username');
        expect(loginItem1.content.password).toBe('password');
        expect(loginItem1.content.urls[0]).toBe('https://test.url1/');
        expect(loginItem1.content.urls[1]).toBe('https://test.url2/');
        expect(loginItem1.content.totpUri).toBe(
            'otpauth://totp/test?issuer=proton&secret=PROTON333&algorithm=SHA1&digits=6&period=30'
        );
        const loginItem1ExtraField1 = loginItem1.extraFields[0] as ItemExtraField<'text'>;
        expect(loginItem1ExtraField1.fieldName).toBe('Text 1');
        expect(loginItem1ExtraField1.data.content).toBe('Text 1 content');
        const loginItem1ExtraField2 = loginItem1.extraFields[1] as ItemExtraField<'hidden'>;
        expect(loginItem1ExtraField2.fieldName).toBe('Hidden 1');
        expect(loginItem1ExtraField2.data.content).toBe('Hidden 1 content');
        expect(allowedApp?.packageName).toEqual('ch.protonmail.android');
        expect(allowedApp?.hashes).toContain('ch.protonmail.android');

        /* Identity */
        const identityItem = deobfuscateItem(primary.items[1]) as unknown as ItemImportIntent<'identity'>;
        expect(identityItem.type).toBe('identity');
        expect(identityItem.metadata.name).toBe('IdentityItem');
        expect(identityItem.content.fullName).toStrictEqual('');
        expect(identityItem.content.firstName).toStrictEqual('John');
        expect(identityItem.content.middleName).toStrictEqual('F');
        expect(identityItem.content.lastName).toStrictEqual('Kennedy');
        expect(identityItem.content.fullName).toStrictEqual('');
        expect(identityItem.content.email).toStrictEqual('');
        expect(identityItem.content.phoneNumber).toStrictEqual('');
        expect(identityItem.content.birthdate).toStrictEqual('');
        expect(identityItem.content.gender).toStrictEqual('');
        expect(identityItem.content.organization).toStrictEqual('');
        expect(identityItem.content.streetAddress).toStrictEqual('');
        expect(identityItem.content.zipOrPostalCode).toStrictEqual('');
        expect(identityItem.content.city).toStrictEqual('');
        expect(identityItem.content.stateOrProvince).toStrictEqual('');
        expect(identityItem.content.countryOrRegion).toStrictEqual('');
        expect(identityItem.content.floor).toStrictEqual('');
        expect(identityItem.content.county).toStrictEqual('');
        expect(identityItem.content.socialSecurityNumber).toStrictEqual('');
        expect(identityItem.content.passportNumber).toStrictEqual('');
        expect(identityItem.content.licenseNumber).toStrictEqual('');
        expect(identityItem.content.website).toStrictEqual('');
        expect(identityItem.content.xHandle).toStrictEqual('');
        expect(identityItem.content.secondPhoneNumber).toStrictEqual('');
        expect(identityItem.content.linkedin).toStrictEqual('');
        expect(identityItem.content.reddit).toStrictEqual('');
        expect(identityItem.content.facebook).toStrictEqual('');
        expect(identityItem.content.yahoo).toStrictEqual('');
        expect(identityItem.content.instagram).toStrictEqual('');
        expect(identityItem.content.company).toStrictEqual('');
        expect(identityItem.content.jobTitle).toStrictEqual('');
        expect(identityItem.content.personalWebsite).toStrictEqual('');
        expect(identityItem.content.workPhoneNumber).toStrictEqual('');
        expect(identityItem.content.workEmail).toStrictEqual('');
        expect(identityItem.content.extraAddressDetails).toStrictEqual([]);
        expect(identityItem.content.extraContactDetails).toStrictEqual([]);
        expect(identityItem.content.extraPersonalDetails).toStrictEqual([]);
        expect(identityItem.content.extraWorkDetails).toStrictEqual([]);
        expect(identityItem.content.extraSections).toStrictEqual([]);

        /* Note */
        const noteItem = deobfuscateItem(primary.items[2]) as unknown as ItemImportIntent<'note'>;
        expect(noteItem.type).toBe('note');
        expect(noteItem.metadata.name).toBe('NoteItem');
        expect(noteItem.metadata.note).toBe('note content');
        expect(noteItem.content).toStrictEqual({});

        /* Login empty */
        const loginItem2 = deobfuscateItem(primary.items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toBe('login');
        expect(loginItem2.metadata.name).toBe('LoginItemEmptyFields');
        expect(loginItem2.metadata.note).toBe('login note');
        expect(loginItem2.content.itemEmail).toStrictEqual('');
        expect(loginItem2.content.itemUsername).toStrictEqual('');
        expect(loginItem2.content.password).toStrictEqual('');
        expect(loginItem2.content.urls).toStrictEqual([]);
        expect(loginItem2.content.totpUri).toStrictEqual('');

        /* Login broken url */
        const loginItem3 = deobfuscateItem(primary.items[4]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toBe('login');
        expect(loginItem3.metadata.name).toBe('LoginItemBrokenUrl');
        expect(loginItem3.metadata.note).toBe('');
        expect(loginItem3.content.itemEmail).toStrictEqual('');
        expect(loginItem3.content.itemUsername).toStrictEqual('');
        expect(loginItem3.content.password).toStrictEqual('');
        expect(loginItem3.content.urls).toStrictEqual([]);
        expect(loginItem3.content.totpUri).toStrictEqual('');

        /* Credit Card */
        const ccItem1 = deobfuscateItem(primary.items[5]) as unknown as ItemImportIntent<'creditCard'>;
        expect(ccItem1.type).toBe('creditCard');
        expect(ccItem1.metadata.name).toBe('Credit Card Y');
        expect(ccItem1.metadata.note).toBe('Credit Card Y AMEX note');
        expect(ccItem1.content.cardholderName).toBe('A B');
        expect(ccItem1.content.number).toBe('374242424242424');
        expect(ccItem1.content.verificationNumber).toBe('123');
        expect(ccItem1.content.expirationDate).toBe('012025');
    });

    it('correctly keeps a reference to ignored items', () => {
        const [source] = sourceFiles;
        const payload = payloads[source];
        expect(payload.ignored).toEqual([]);
    });

    it('correctly parses b2b exports', () => {
        const [, source] = sourceFiles;
        const payload = payloads[source];
        const { vaults } = payload;
        const [primary, secondary] = vaults;

        expect(vaults.length).toBe(2);
        expect(primary.name).toBe('Collection 2');
        expect(secondary.name).toBe('collection 1');
    });
});
