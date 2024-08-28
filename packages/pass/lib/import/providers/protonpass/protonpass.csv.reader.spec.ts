import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { readProtonPassCSV } from './protonpass.csv.reader';

describe('Import Proton Pass CSV', () => {
    let payload: ImportPayload;
    let oldPayloadBeforeVault: ImportPayload;
    let oldPayloadBeforeEmailUsername: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/protonpass.csv', 'utf8');
        payload = await readProtonPassCSV({ data: sourceData });

        const oldSourceData = await fs.promises.readFile(__dirname + '/mocks/protonpass-old-before-vault.csv', 'utf8');
        oldPayloadBeforeVault = await readProtonPassCSV({ data: oldSourceData });

        const oldSourceDataBeforeEmailUsername = await fs.promises.readFile(
            __dirname + '/mocks/protonpass-old-before-email-username.csv',
            'utf8'
        );
        oldPayloadBeforeEmailUsername = await readProtonPassCSV({
            data: oldSourceDataBeforeEmailUsername,
        });
    });

    it('should handle corrupted files', async () => {
        await expect(readProtonPassCSV({ data: 'not-a-csv-file' })).rejects.toThrow();
    });

    it('should correctly parse items', async () => {
        const [firstVault, secondVault] = payload.vaults;

        expect(payload.vaults.length).toEqual(2);
        expect(firstVault.name).toEqual('Personal');
        expect(secondVault.name).toEqual('Second vault');

        const { items: firstVaultItems } = firstVault;
        const { items: secondVaultItems } = secondVault;

        /* Note */
        const noteItem = firstVaultItems[0] as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.metadata.name).toEqual('note title');
        expect(deobfuscate(noteItem.metadata.note)).toEqual('this is my note');
        expect(noteItem.content).toEqual({});
        expect(noteItem.createTime).toEqual(1706621831);
        expect(noteItem.modifyTime).toEqual(1707735222);

        /* Login */
        const loginItem = firstVaultItems[1] as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('login title');
        expect(deobfuscate(loginItem.metadata.note)).toEqual('login note');
        expect(deobfuscate(loginItem.content.itemEmail)).toEqual('example@example.com');
        expect(deobfuscate(loginItem.content.itemUsername)).toEqual('john');
        expect(deobfuscate(loginItem.content.password)).toEqual('password123');
        expect(loginItem.content.urls).toEqual(['https://example.com/', 'https://proton.me/']);
        expect(deobfuscate(loginItem.content.totpUri)).toEqual(
            'otpauth://totp/login%20title:example%40example.com?issuer=login%20title&secret=ABCDEF&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem.createTime).toEqual(1707735320);
        expect(loginItem.modifyTime).toEqual(1707735349);

        /* Identity */
        const identityItem = firstVaultItems[2] as ItemImportIntent<'identity'>;
        expect(identityItem.type).toStrictEqual('identity');
        expect(identityItem.metadata.name).toStrictEqual(':identity-title:');
        expect(identityItem.content.fullName).toStrictEqual(':full-name:');
        expect(identityItem.content.email).toStrictEqual(':email:');
        expect(identityItem.content.phoneNumber).toStrictEqual(':phone-number:');
        expect(identityItem.content.firstName).toStrictEqual(':first-name:');
        expect(identityItem.content.middleName).toStrictEqual(':middle-name:');
        expect(identityItem.content.lastName).toStrictEqual(':last-name:');
        expect(identityItem.content.birthdate).toStrictEqual(':birthdate:');
        expect(identityItem.content.gender).toStrictEqual(':gender:');
        expect(identityItem.content.extraPersonalDetails.length).toStrictEqual(2);
        expect(identityItem.content.organization).toStrictEqual(':organization:');
        expect(identityItem.content.streetAddress).toStrictEqual(':street:');
        expect(identityItem.content.zipOrPostalCode).toStrictEqual(':zip:');
        expect(identityItem.content.city).toStrictEqual(':city:');
        expect(identityItem.content.stateOrProvince).toStrictEqual(':state:');
        expect(identityItem.content.countryOrRegion).toStrictEqual(':country:');
        expect(identityItem.content.floor).toStrictEqual(':floor:');
        expect(identityItem.content.county).toStrictEqual(':county:');
        expect(identityItem.content.extraAddressDetails.length).toStrictEqual(2);
        expect(identityItem.content.socialSecurityNumber).toStrictEqual(':social-security-number:');
        expect(identityItem.content.passportNumber).toStrictEqual(':passport-number:');
        expect(identityItem.content.licenseNumber).toStrictEqual(':license-number:');
        expect(identityItem.content.xHandle).toStrictEqual(':x-handle:');
        expect(identityItem.content.secondPhoneNumber).toStrictEqual(':phone-number:');
        expect(identityItem.content.company).toStrictEqual(':company:');
        expect(identityItem.content.jobTitle).toStrictEqual(':job-title:');
        expect(identityItem.content.extraSections).toStrictEqual([
            {
                sectionName: ':custom-section:',
                sectionFields: [
                    { data: { content: ':text-value:' }, fieldName: ':field-section:', type: 'text' },
                    { data: { content: ':hidden-value:' }, fieldName: ':hidden-section:', type: 'hidden' },
                ],
            },
        ]);

        /* Credit Card */
        const creditCardItem = secondVaultItems[0] as ItemImportIntent<'creditCard'>;
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

    it('should be backward compatible with the old Pass CSV export format before vault column', async () => {
        const [firstVault] = oldPayloadBeforeVault.vaults;

        expect(oldPayloadBeforeVault.vaults.length).toEqual(1);
        expect(firstVault.name).not.toBeUndefined();

        const { items } = firstVault;

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
        expect(deobfuscate(loginItem.content.itemEmail)).toEqual('example@example.com');
        expect(deobfuscate(loginItem.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem.content.password)).toEqual('password123');
        expect(loginItem.content.urls).toEqual(['https://example.com/', 'https://proton.me/']);
        expect(deobfuscate(loginItem.content.totpUri)).toEqual(
            'otpauth://totp/login%20title:example%40example.com?issuer=login%20title&secret=ABCDEF&algorithm=SHA1&digits=6&period=30'
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

    it('should backward compatible with the old Pass CSV export format before email&username columns', async () => {
        const [firstVault, secondVault] = oldPayloadBeforeEmailUsername.vaults;

        expect(payload.vaults.length).toEqual(2);
        expect(firstVault.name).toEqual('Personal');
        expect(secondVault.name).toEqual('Second vault');

        const { items: firstVaultItems } = firstVault;
        const { items: secondVaultItems } = secondVault;

        /* Note */
        const noteItem = firstVaultItems[0] as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.metadata.name).toEqual('note title');
        expect(deobfuscate(noteItem.metadata.note)).toEqual('this is my note');
        expect(noteItem.content).toEqual({});
        expect(noteItem.createTime).toEqual(1706621831);
        expect(noteItem.modifyTime).toEqual(1707735222);

        /* Login */
        const loginItem = firstVaultItems[1] as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('login title');
        expect(deobfuscate(loginItem.metadata.note)).toEqual('login note');
        expect(deobfuscate(loginItem.content.itemEmail)).toEqual('example@example.com');
        expect(deobfuscate(loginItem.content.itemUsername)).toEqual('');
        expect(deobfuscate(loginItem.content.password)).toEqual('password123');
        expect(loginItem.content.urls).toEqual(['https://example.com/', 'https://proton.me/']);
        expect(deobfuscate(loginItem.content.totpUri)).toEqual(
            'otpauth://totp/login%20title:example%40example.com?issuer=login%20title&secret=ABCDEF&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem.createTime).toEqual(1707735320);
        expect(loginItem.modifyTime).toEqual(1707735349);

        /* Credit Card */
        const creditCardItem = secondVaultItems[0] as ItemImportIntent<'creditCard'>;
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
