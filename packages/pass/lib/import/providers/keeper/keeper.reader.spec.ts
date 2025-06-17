import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readKeeperData } from './keeper.reader';

describe('Import Keeper JSON', () => {
    let payload: ImportPayload;
    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/keeper.json');
        const file = new File([sourceData], 'keeper.json');
        payload = await readKeeperData(file);
    });

    afterAll(() => dateMock.mockRestore());

    it('should handle corrupted files', async () => {
        await expect(() => readKeeperData(new File([''], 'corrupted'))).rejects.toThrow();
    });

    it('converts Keeper folders to vaults correctly', () => {
        expect(payload.vaults.length).toEqual(4);

        expect(payload.vaults[0].name).toEqual('folder2');
        expect(payload.vaults[1].name).toEqual('folder1');
        expect(payload.vaults[2].name).toEqual('subfolder1');
        expect(payload.vaults[3].name).toEqual('Import - 27 Apr 2023');
    });

    it('should correctly parse items from 1st vault', () => {
        const firstVault = payload.vaults[0];
        expect(firstVault.items.length).toEqual(1);
        const { items } = firstVault;

        const identityItem = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'identity'>;
        expect(identityItem.type).toEqual('identity');
        expect(identityItem.createTime).toBeUndefined();
        expect(identityItem.modifyTime).toBeUndefined();
        expect(identityItem.metadata.itemUuid).not.toBeUndefined();
        expect(identityItem.metadata.name).toEqual('id item');
        expect(identityItem.metadata.note).toEqual('notes');
        expect(identityItem.content).toEqual({
            birthdate: '',
            city: '',
            company: '',
            countryOrRegion: '',
            county: '',
            email: 'email@custom-field.value',
            extraAddressDetails: [],
            extraContactDetails: [],
            extraPersonalDetails: [],
            extraSections: [
                {
                    sectionName: 'Extra fields',
                    sectionFields: [
                        {
                            fieldName: 'accountNumber:identityNumber',
                            type: 'text',
                            data: {
                                content: '123',
                            },
                        },
                    ],
                },
            ],
            extraWorkDetails: [],
            facebook: '',
            firstName: 'John',
            floor: '',
            fullName: '',
            gender: '',
            instagram: '',
            jobTitle: '',
            lastName: 'Doe',
            licenseNumber: '',
            linkedin: '',
            middleName: 'Middle',
            organization: '',
            passportNumber: '',
            personalWebsite: '',
            phoneNumber: '',
            reddit: '',
            secondPhoneNumber: '',
            socialSecurityNumber: '',
            stateOrProvince: '',
            streetAddress: '',
            website: '',
            workEmail: '',
            workPhoneNumber: '',
            xHandle: '',
            yahoo: '',
            zipOrPostalCode: '',
        });
        expect(identityItem.trashed).toEqual(false);
        expect(identityItem.extraFields).toEqual([]);
    });

    it('should correctly parse items from 2nd vault', () => {
        const secondVault = payload.vaults[1];
        expect(secondVault.items.length).toEqual(1);
        const { items } = secondVault;

        const loginItemSubfolder = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemSubfolder.type).toEqual('login');
        expect(loginItemSubfolder.createTime).toBeUndefined();
        expect(loginItemSubfolder.modifyTime).toBeUndefined();
        expect(loginItemSubfolder.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSubfolder.metadata.name).toEqual('login of folder1');
        expect(loginItemSubfolder.metadata.note).toEqual('');
        expect(loginItemSubfolder.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemSubfolder.trashed).toEqual(false);
        expect(loginItemSubfolder.extraFields).toEqual([]);
    });

    it('should correctly parse items from 3rd vault', () => {
        const thirdVault = payload.vaults[2];
        expect(thirdVault.items.length).toEqual(1);
        const { items } = thirdVault;

        const loginItem = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.createTime).toBeUndefined();
        expect(loginItem.modifyTime).toBeUndefined();
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.metadata.name).toEqual('login of subfolder1');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItem.trashed).toEqual(false);
        expect(loginItem.extraFields).toEqual([]);
    });

    it('should correctly parse items from 4th vault', () => {
        const fourthVault = payload.vaults[3];
        expect(fourthVault.items.length).toEqual(16);
        const { items } = fourthVault;

        /* credit card item */
        const creditCardItem = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'creditCard'>;
        expect(creditCardItem.type).toEqual('creditCard');
        expect(creditCardItem.metadata.name).toEqual('a card');
        expect(creditCardItem.metadata.note).toEqual('');
        expect(creditCardItem.content.cardholderName).toEqual('First last');
        expect(creditCardItem.content.number).toEqual('4242424242424242');
        expect(creditCardItem.content.verificationNumber).toEqual('123');
        expect(creditCardItem.content.pin).toEqual('1234');
        expect(creditCardItem.content.expirationDate).toEqual('032027');

        /* custom file item */
        const fileItem = deobfuscateItem(items[1]) as unknown as ItemImportIntent<'custom'>;
        expect(fileItem.type).toEqual('custom');
        expect(fileItem.metadata.name).toEqual('a file');

        /* note with custom field */
        const noteWithCustomField = deobfuscateItem(items[2]) as unknown as ItemImportIntent<'note'>;
        expect(noteWithCustomField.type).toEqual('note');
        expect(noteWithCustomField.metadata.name).toEqual('a note');
        expect(noteWithCustomField.metadata.note).toEqual('note content\nline 2\ncustom note');

        const addressItem = deobfuscateItem(items[3]) as unknown as ItemImportIntent<'custom'>;
        expect(addressItem.type).toEqual('custom');
        expect(addressItem.metadata.name).toEqual('Address for bank card');
        expect(addressItem.extraFields).toEqual([
            {
                fieldName: 'address: - country',
                data: {
                    content: 'US',
                },
                type: 'text',
            },
            {
                fieldName: 'address: - street1',
                data: {
                    content: 'line 1',
                },
                type: 'text',
            },
            {
                fieldName: 'address: - street2',
                data: {
                    content: 'line 2',
                },
                type: 'text',
            },
            {
                fieldName: 'address: - city',
                data: {
                    content: 'City',
                },
                type: 'text',
            },
            {
                fieldName: 'address: - state',
                data: {
                    content: 'State',
                },
                type: 'text',
            },
            {
                fieldName: 'address: - zip',
                data: {
                    content: '00000',
                },
                type: 'text',
            },
        ]);

        /* contact item */
        const contactItem = deobfuscateItem(items[4]) as unknown as ItemImportIntent<'identity'>;
        expect(contactItem.type).toEqual('identity');
        expect(contactItem.createTime).toBeUndefined();
        expect(contactItem.modifyTime).toBeUndefined();
        expect(contactItem.metadata.itemUuid).not.toBeUndefined();
        expect(contactItem.metadata.name).toEqual('contact item');
        expect(contactItem.metadata.note).toEqual('');
        expect(contactItem.content).toEqual({
            birthdate: '',
            city: '',
            company: 'company',
            countryOrRegion: '',
            county: '',
            email: 'email@example.com',
            extraAddressDetails: [],
            extraContactDetails: [],
            extraPersonalDetails: [],
            extraSections: [
                {
                    sectionFields: [
                        {
                            data: {
                                content: '5555555555 Ext',
                            },
                            fieldName: 'phone:',
                            type: 'text',
                        },
                        {
                            data: {
                                content: '5555555556 Ext2',
                            },
                            fieldName: 'phone:',
                            type: 'text',
                        },
                        {
                            data: {
                                content: 'custom field',
                            },
                            fieldName: 'Text',
                            type: 'text',
                        },
                    ],
                    sectionName: 'Extra fields',
                },
            ],
            extraWorkDetails: [],
            facebook: '',
            firstName: 'first',
            floor: '',
            fullName: '',
            gender: '',
            instagram: '',
            jobTitle: '',
            lastName: 'last',
            licenseNumber: '',
            linkedin: '',
            middleName: '',
            organization: '',
            passportNumber: '',
            personalWebsite: '',
            phoneNumber: '',
            reddit: '',
            secondPhoneNumber: '',
            socialSecurityNumber: '',
            stateOrProvince: '',
            streetAddress: '',
            website: '',
            workEmail: '',
            workPhoneNumber: '',
            xHandle: '',
            yahoo: '',
            zipOrPostalCode: '',
        });
        expect(contactItem.trashed).toEqual(false);
        expect(contactItem.extraFields).toEqual([]);

        /* general item */
        const generalItem = deobfuscateItem(items[5]) as unknown as ItemImportIntent<'login'>;
        expect(generalItem.type).toEqual('login');
        expect(generalItem.createTime).toBeUndefined();
        expect(generalItem.modifyTime).toBeUndefined();
        expect(generalItem.metadata.itemUuid).not.toBeUndefined();
        expect(generalItem.metadata.name).toEqual('general item');
        expect(generalItem.metadata.note).toEqual('');
        expect(generalItem.trashed).toEqual(false);
        expect(generalItem.extraFields).toEqual([]);

        /* login with 2FA */
        const loginItem2FA = deobfuscateItem(items[6]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2FA.type).toEqual('login');
        expect(loginItem2FA.createTime).toBeUndefined();
        expect(loginItem2FA.modifyTime).toBeUndefined();
        expect(loginItem2FA.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2FA.metadata.name).toEqual('login with 2fa');
        expect(loginItem2FA.metadata.note).toEqual('');
        expect(loginItem2FA.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri:
                'otpauth://totp/account.proton.me:2fa-manually-entered-string%40example.com?issuer=account.proton.me&secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30',
            urls: ['https://example.com/'],
            itemEmail: '2fa@example.com',
            itemUsername: '',
        });
        expect(loginItem2FA.trashed).toEqual(false);
        expect(loginItem2FA.extraFields).toEqual([]);

        /* login with broken url */
        const loginItemBrokenUrl = deobfuscateItem(items[7]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemBrokenUrl.type).toEqual('login');
        expect(loginItemBrokenUrl.createTime).toBeUndefined();
        expect(loginItemBrokenUrl.modifyTime).toBeUndefined();
        expect(loginItemBrokenUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokenUrl.metadata.name).toEqual('login with broken url');
        expect(loginItemBrokenUrl.metadata.note).toEqual('');
        expect(loginItemBrokenUrl.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemBrokenUrl.trashed).toEqual(false);
        expect(loginItemBrokenUrl.extraFields).toEqual([]);

        /* login with comma, quotes */
        const loginItemCommaQuotes = deobfuscateItem(items[8]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemCommaQuotes.type).toEqual('login');
        expect(loginItemCommaQuotes.createTime).toBeUndefined();
        expect(loginItemCommaQuotes.modifyTime).toBeUndefined();
        expect(loginItemCommaQuotes.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuotes.metadata.name).toEqual('login with comma, quotes "');
        expect(loginItemCommaQuotes.metadata.note).toEqual('notes with commas, quotes "');
        expect(loginItemCommaQuotes.content).toEqual({
            passkeys: [],
            password: 'password with comma, quotes "',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'username with comma, quotes "',
        });
        expect(loginItemCommaQuotes.trashed).toEqual(false);
        expect(loginItemCommaQuotes.extraFields).toEqual([]);

        /* login with custom fields */
        const loginItemCustomFields = deobfuscateItem(items[9]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemCustomFields.type).toEqual('login');
        expect(loginItemCustomFields.createTime).toBeUndefined();
        expect(loginItemCustomFields.modifyTime).toBeUndefined();
        expect(loginItemCustomFields.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCustomFields.metadata.name).toEqual('login with custom fields');
        expect(loginItemCustomFields.metadata.note).toEqual('');
        expect(loginItemCustomFields.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemCustomFields.trashed).toEqual(false);
        expect(loginItemCustomFields.extraFields).toEqual([
            {
                fieldName: 'Security Question & Answer',
                type: 'text',
                data: {
                    content: 'this is custom field: security question? this is custom field: security answer',
                },
            },
            {
                fieldName: 'Website Address',
                type: 'text',
                data: {
                    content: 'https://this-is-custom-field-url.example.com',
                },
            },
            {
                fieldName: 'Phone',
                type: 'text',
                data: {
                    content: 'Mobile US (+1) (555) 555-5555 Ex',
                },
            },
            {
                fieldName: 'multiline:',
                type: 'text',
                data: {
                    content: 'custom field with\nmultiple\nlines',
                },
            },
            {
                fieldName: 'custom Name fields - first',
                type: 'text',
                data: {
                    content: 'custom field--first name',
                },
            },
            {
                fieldName: 'custom Name fields - middle',
                type: 'text',
                data: {
                    content: 'custom field--middle name',
                },
            },
            {
                fieldName: 'custom Name fields - last',
                type: 'text',
                data: {
                    content: 'custom field--last name',
                },
            },
            {
                fieldName: 'phone:custom Phone Number',
                type: 'text',
                data: {
                    content: 'Mobile US 5555555555 ext',
                },
            },
            {
                fieldName: 'custom Hidden Field',
                type: 'hidden',
                data: {
                    content: 'hidden vlue',
                },
            },
            {
                fieldName: 'second custom hidden field',
                type: 'hidden',
                data: {
                    content: 'hidden value',
                },
            },
        ]);

        /* login with multiple lines */
        const loginItemMultipleLines = deobfuscateItem(items[10]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemMultipleLines.type).toEqual('login');
        expect(loginItemMultipleLines.createTime).toBeUndefined();
        expect(loginItemMultipleLines.modifyTime).toBeUndefined();
        expect(loginItemMultipleLines.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleLines.metadata.name).toEqual('login with multiple lines');
        expect(loginItemMultipleLines.metadata.note).toEqual('notes with\nmultiple\nlines');
        expect(loginItemMultipleLines.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemMultipleLines.trashed).toEqual(false);
        expect(loginItemMultipleLines.extraFields).toEqual([]);

        /* login with multiple urls */
        const loginItemMultipleUrls = deobfuscateItem(items[11]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemMultipleUrls.type).toEqual('login');
        expect(loginItemMultipleUrls.createTime).toBeUndefined();
        expect(loginItemMultipleUrls.modifyTime).toBeUndefined();
        expect(loginItemMultipleUrls.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleUrls.metadata.name).toEqual('login with multiple urls');
        expect(loginItemMultipleUrls.metadata.note).toEqual('');
        expect(loginItemMultipleUrls.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: '',
        });
        expect(loginItemMultipleUrls.trashed).toEqual(false);
        expect(loginItemMultipleUrls.extraFields).toEqual([
            {
                fieldName: 'Website Address',
                type: 'text',
                data: {
                    content: 'https://second.example.com',
                },
            },
            {
                fieldName: 'Website Address with edited label',
                type: 'text',
                data: {
                    content: 'https://edited-label.example.com',
                },
            },
        ]);

        /* login secure note */
        const loginItemSecureNote = deobfuscateItem(items[12]) as unknown as ItemImportIntent<'note'>;
        expect(loginItemSecureNote.type).toEqual('note');
        expect(loginItemSecureNote.createTime).toBeUndefined();
        expect(loginItemSecureNote.modifyTime).toBeUndefined();
        expect(loginItemSecureNote.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecureNote.metadata.name).toEqual('secure note item');
        expect(loginItemSecureNote.metadata.note).toEqual('secured note\nfoo');
        expect(loginItemSecureNote.content).toEqual({});
        expect(loginItemSecureNote.trashed).toEqual(false);
        expect(loginItemSecureNote.extraFields).toEqual([]);

        /* SSH key item */
        const sshItem = deobfuscateItem(items[13]) as unknown as ItemImportIntent<'custom'>;
        expect(sshItem.type).toEqual('custom');
        expect(sshItem.metadata.name).toEqual('ssh key item');
        expect(sshItem.extraFields).toEqual([
            { data: { content: 'john' }, fieldName: 'Username', type: 'text' },
            { data: { content: 'abc' }, fieldName: 'Password', type: 'text' },
            { data: { content: 'pub' }, fieldName: 'keyPair: - publicKey', type: 'text' },
            { data: { content: 'pri' }, fieldName: 'keyPair: - privateKey', type: 'text' },
            { data: { content: 'example.com' }, fieldName: 'host: - hostName', type: 'text' },
            { data: { content: '1111' }, fieldName: 'host: - port', type: 'text' },
        ]);

        /* login as "general" item type */
        const loginItemGeneral = deobfuscateItem(items[14]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemGeneral.type).toEqual('login');
        expect(loginItemGeneral.createTime).toBeUndefined();
        expect(loginItemGeneral.modifyTime).toBeUndefined();
        expect(loginItemGeneral.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemGeneral.metadata.name).toEqual('general item login');
        expect(loginItemGeneral.metadata.note).toEqual('');
        expect(loginItemGeneral.content).toEqual({
            passkeys: [],
            password: 'password',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemGeneral.trashed).toEqual(false);
        expect(loginItemGeneral.extraFields).toEqual([]);

        /* wifi item */
        const wifiItem = deobfuscateItem(items[15]) as unknown as ItemImportIntent<'custom'>;
        expect(wifiItem.type).toEqual('custom');
        expect(wifiItem.createTime).toBeUndefined();
        expect(wifiItem.modifyTime).toBeUndefined();
        expect(wifiItem.metadata.itemUuid).not.toBeUndefined();
        expect(wifiItem.metadata.name).toEqual('wifi');
        expect(wifiItem.metadata.note).toEqual('');
        expect(wifiItem.trashed).toEqual(false);
        expect(wifiItem.extraFields).toEqual([
            { data: { content: 'password123' }, fieldName: 'Password', type: 'text' },
            { data: { content: 'my-ssid' }, fieldName: 'SSID', type: 'text' },
            { data: { content: 'custom value' }, fieldName: 'custom field', type: 'text' },
        ]);
    });

    test('should correctly hydrate ignored arrays', () => {
        expect(payload.ignored.length).toEqual(1);
        expect(payload.ignored[0]).toEqual('[encryptedNotes] a note: item was imported without custom fields');
    });
});
