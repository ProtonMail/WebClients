import fs from 'fs';

import type { ItemExtraField, ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readBitwardenData } from './bitwarden.reader';

describe('Import bitwarden json', () => {
    let sourceData: string;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/bitwarden.json', 'utf8');
        payload = readBitwardenData(sourceData);
    });

    it('should throw on encrypted json payload', () => {
        expect(() => readBitwardenData(JSON.stringify({ encrypted: true, items: [] }))).toThrow();
    });

    it('should throw on corrupted files', () => {
        expect(() => readBitwardenData('not-a-json-body')).toThrow();
        expect(() => readBitwardenData(JSON.stringify({ encrypted: false }))).toThrow();
        expect(() => readBitwardenData(JSON.stringify({ encrypted: false, items: '[]' }))).toThrow();
    });

    it('should correctly parse items', () => {
        const [vaultData] = payload.vaults;

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login */
        const loginItem1 = items[0] as ItemImportIntent<'login'>;
        const allowedApp = loginItem1.platformSpecific?.android?.allowedApps[0];
        expect(loginItem1.type).toBe('login');
        expect(loginItem1.metadata.name).toBe('LoginItemMultipleWebsites');
        expect(loginItem1.metadata.note).toBe('login note');
        expect(loginItem1.content.username).toBe('username');
        expect(loginItem1.content.password).toBe('password');
        expect(loginItem1.content.urls[0]).toBe('https://test.url1/');
        expect(loginItem1.content.urls[1]).toBe('https://test.url2/');
        expect(loginItem1.content.totpUri).toBe(
            'otpauth://totp/proton:test?issuer=proton&secret=PROTON33&algorithm=SHA1&digits=6&period=30'
        );
        const loginItem1ExtraField1 = loginItem1.extraFields[0] as ItemExtraField<'text'>;
        expect(loginItem1ExtraField1.fieldName).toBe('Text 1');
        expect(loginItem1ExtraField1.data.content).toBe('Text 1 content');
        const loginItem1ExtraField2 = loginItem1.extraFields[1] as ItemExtraField<'hidden'>;
        expect(loginItem1ExtraField2.fieldName).toBe('Hidden 1');
        expect(loginItem1ExtraField2.data.content).toBe('Hidden 1 content');
        expect(allowedApp?.packageName).toEqual('ch.protonmail.android');
        expect(allowedApp?.hashes).toContain('ch.protonmail.android');

        /* Note */
        const noteItem = items[1] as ItemImportIntent<'note'>;
        expect(noteItem.type).toBe('note');
        expect(noteItem.metadata.name).toBe('NoteItem');
        expect(noteItem.metadata.note).toBe('note content');
        expect(noteItem.content).toStrictEqual({});

        /* Login empty */
        const loginItem2 = items[2] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toBe('login');
        expect(loginItem2.metadata.name).toBe('LoginItemEmptyFields');
        expect(loginItem2.metadata.note).toBe('login note');
        expect(loginItem2.content.username).toStrictEqual('');
        expect(loginItem2.content.password).toStrictEqual('');
        expect(loginItem2.content.urls).toStrictEqual([]);
        expect(loginItem2.content.totpUri).toStrictEqual('');

        /* Login broken url */
        const loginItem3 = items[3] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toBe('login');
        expect(loginItem3.metadata.name).toBe('LoginItemBrokenUrl');
        expect(loginItem3.metadata.note).toBe('');
        expect(loginItem3.content.username).toStrictEqual('');
        expect(loginItem3.content.password).toStrictEqual('');
        expect(loginItem3.content.urls).toStrictEqual([]);
        expect(loginItem3.content.totpUri).toStrictEqual('');

        /* Credit Card */
        const ccItem1 = items[4] as ItemImportIntent<'creditCard'>;
        expect(ccItem1.type).toBe('creditCard');
        expect(ccItem1.metadata.name).toBe('Credit Card Y');
        expect(ccItem1.metadata.note).toBe('Credit Card Y AMEX note');
        expect(ccItem1.content.cardholderName).toBe('A B');
        expect(ccItem1.content.number).toBe('374242424242424');
        expect(ccItem1.content.verificationNumber).toBe('123');
        expect(ccItem1.content.expirationDate).toBe('012025');
    });

    test('correctly keeps a reference to ignored items', () => {
        expect(payload.ignored).not.toEqual([]);
        expect(payload.ignored[0]).toEqual('[Identification] IdentityItem');
    });
});
