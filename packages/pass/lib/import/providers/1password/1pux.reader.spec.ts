import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent, ItemType } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1.static';

import { read1Password1PuxData } from './1pux.reader';

const sourceFiles = { '1password.1pux': `${__dirname}/mocks/1password.1pux` };

const data: Record<string, ImportPayload> = {};

const get1PasswordData = (sourceKey: string) => data[sourceKey];
const get1PasswordItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]) as ItemImportIntent<T>;

describe('Import 1password 1pux', () => {
    beforeAll(async () => {
        for (const [key, path] of Object.entries(sourceFiles)) {
            const sourceData = fs.readFileSync(path);
            const file = new File([sourceData], path);
            data[key] = await read1Password1PuxData(file);
        }
    });

    test('should throw on invalid file content', async () => {
        await expect(read1Password1PuxData(new File([], 'corrupted'))).rejects.toThrow();
    });

    test('should correctly parse vaults', () => {
        const { vaults } = get1PasswordData('1password.1pux');

        expect(vaults.length).toEqual(5);
        expect(vaults[0].name).toEqual('Personal');
        expect(vaults[1].name).toEqual('Private');
        expect(vaults[2].name).toEqual('SecondaryVault');
        expect(vaults[3].name).toEqual('Shared');
        expect(vaults[4].name).toEqual('1pux reader test');
    });

    test('should support login items with multiple TOTPs [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 0);

        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1671029303);
        expect(item.modifyTime).toEqual(1688987066);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('john@wick.com');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('password');
        expect(item.content.urls).toEqual(['http://localhost:7777/dashboard/']);
        expect(item.trashed).toEqual(false);
        expect(item.content.totpUri).toEqual(
            'otpauth://totp/Login%20item%20with%20two%20TOTP%20and%20one%20text%20extra%20fields?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30'
        );
        expect(item.extraFields).toEqual([
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: { totpUri: 'otpauth://totp/generator?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30' },
            },
            {
                fieldName: 'text extra field label',
                type: 'text',
                data: { content: 'text extra field content' },
            },
        ]);
    });

    test('should support credit card items [vault 1]', () => {
        const item = get1PasswordItem<'creditCard'>('1password.1pux', 1, 1);
        expect(item.type).toEqual('creditCard');
        expect(item.metadata.note).toEqual('this is credit card item note');
        expect(item.content.number).toEqual('4242333342423333');
        expect(item.content.verificationNumber).toEqual('123');
        expect(item.content.pin).toEqual('1234');
        expect(item.content.cardType).toEqual(CardType.Unspecified);
        expect(item.content.cardholderName).toEqual('A B');
        expect(item.content.expirationDate).toEqual('012025');
    });

    test('should support login items with single TOTP [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 2);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1675849436);
        expect(item.modifyTime).toEqual(1688983719);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('this is a login item note');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('');
        expect(item.content.totpUri).toEqual('otpauth://totp/az?secret=QS&algorithm=SHA1&digits=6&period=30');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support login items with special characters [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 4);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1619085696);
        expect(item.modifyTime).toEqual(1688987656);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.metadata.note).toEqual('Item notes');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('somewhere');
        expect(item.content.password).toEqual('somepassword with " in it');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual(['https://slashdot.org/']);
    });

    test('should support password only items [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 5);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1655535022);
        expect(item.modifyTime).toEqual(1688983483);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('f@LGRHG7BEcByVy--xTV8X4U');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support generic login items [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 6);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1688035201);
        expect(item.modifyTime).toEqual(1688983572);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('Username test');
        expect(item.content.password).toEqual('password test');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support note items [vault 1]', () => {
        const item = get1PasswordItem<'note'>('1password.1pux', 1, 7);
        expect(item.type).toEqual('note');
        expect(item.createTime).toEqual(1619085236);
        expect(item.modifyTime).toEqual(1688982876);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.content).toEqual({});
        expect(item.trashed).toEqual(false);
        expect(item.extraFields.length).toEqual(14);
        expect(item.metadata.note).toEqual('Follow these steps to get started.');
    });

    test('should support empty login items [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 8);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1677234145);
        expect(item.modifyTime).toEqual(1688983124);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.trashed).toEqual(false);
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('');
        expect(item.content.totpUri).toEqual('');
        expect(item.extraFields).toEqual([]);
    });

    test('should support login items with malformed URLs [vault 1]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 1, 9);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1688987490);
        expect(item.modifyTime).toEqual(1688987490);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content.urls).toEqual([]);
    });

    test('should support generic login items [vault 2]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 2, 1);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1675777494);
        expect(item.modifyTime).toEqual(1675777506);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('username');
        expect(item.content.password).toEqual('password');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support archived login items [vault 2]', () => {
        const item = get1PasswordItem<'login'>('1password.1pux', 2, 2);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1683720664);
        expect(item.modifyTime).toEqual(1688990961);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('archived');
        expect(item.content.password).toEqual('password');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(true);
        expect(item.extraFields).toEqual([]);
    });

    test('should support wifi items [vault 2]', () => {
        const item = get1PasswordItem<'wifi'>('1password.1pux', 2, 0);
        expect(item.type).toEqual('wifi');
        expect(item.createTime).toEqual(1750229157);
        expect(item.modifyTime).toEqual(1750229686);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.ssid).toEqual('::network-name::');
        expect(item.content.password).toEqual('::wireless-password::');
        expect(item.content.security).toEqual(3);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([
            { fieldName: 'base station name', type: 'text', data: { content: '::base-station-name::' } },
            { fieldName: 'base station password', type: 'hidden', data: { content: '::base-station-password::' } },
            { fieldName: 'server / IP address', type: 'text', data: { content: '::server-address::' } },
            { fieldName: 'AirPort ID', type: 'text', data: { content: '::airport-id::' } },
            {
                fieldName: 'attached storage password',
                type: 'hidden',
                data: { content: '::wireless-storage-password::' },
            },
        ]);
    });

    test('should support SSH key items [vault 2]', () => {
        const item = get1PasswordItem<'sshKey'>('1password.1pux', 2, 3);
        expect(item.type).toEqual('sshKey');
        expect(item.createTime).toEqual(1750229079);
        expect(item.modifyTime).toEqual(1750229079);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
        expect(item.content.publicKey).toContain('ssh-rsa');
        expect(item.content.sections.length).toEqual(1);
        expect(item.content.sections[0].sectionName).toEqual('OpenSSH');
        expect(item.content.sections[0].sectionFields.length).toEqual(3);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support identity items [vault 3]', () => {
        const item = get1PasswordItem<'identity'>('1password.1pux', 3, 0);

        expect(item.type).toEqual('identity');
        expect(item.metadata.name).toEqual('Identity');
        expect(item.content.fullName).toStrictEqual('');
        expect(item.content.firstName).toStrictEqual(':first-name:');
        expect(item.content.lastName).toStrictEqual(':last-name:');
        expect(item.content.middleName).toStrictEqual('');
        expect(item.content.fullName).toStrictEqual('');
        expect(item.content.email).toStrictEqual(':email:');
        expect(item.content.phoneNumber).toStrictEqual(':default-phone:');
        expect(item.content.birthdate).toStrictEqual('Aug 12, 1995');
        expect(item.content.gender).toStrictEqual(':gender:');
        expect(item.content.organization).toStrictEqual(':company:');
        expect(item.content.streetAddress).toStrictEqual(':main-street:');
        expect(item.content.zipOrPostalCode).toStrictEqual(':main-zip-code:');
        expect(item.content.city).toStrictEqual(':main-city:');
        expect(item.content.stateOrProvince).toStrictEqual(':main-state:');
        expect(item.content.countryOrRegion).toStrictEqual(':main-country:');
        expect(item.content.floor).toStrictEqual('');
        expect(item.content.county).toStrictEqual('');
        expect(item.content.socialSecurityNumber).toStrictEqual('');
        expect(item.content.passportNumber).toStrictEqual('');
        expect(item.content.licenseNumber).toStrictEqual('');
        expect(item.content.website).toStrictEqual(':website:');
        expect(item.content.xHandle).toStrictEqual('');
        expect(item.content.secondPhoneNumber).toStrictEqual(':cell-phone:');
        expect(item.content.linkedin).toStrictEqual('');
        expect(item.content.reddit).toStrictEqual('');
        expect(item.content.facebook).toStrictEqual('');
        expect(item.content.yahoo).toStrictEqual(':yahoo:');
        expect(item.content.instagram).toStrictEqual('');
        expect(item.content.company).toStrictEqual('');
        expect(item.content.jobTitle).toStrictEqual(':job-title:');
        expect(item.content.personalWebsite).toStrictEqual('');
        expect(item.content.workPhoneNumber).toStrictEqual(':business-phone:');
        expect(item.content.workEmail).toStrictEqual('');
        expect(item.content.extraAddressDetails).toStrictEqual([]);
        expect(item.content.extraContactDetails).toStrictEqual([]);
        expect(item.content.extraPersonalDetails).toStrictEqual([]);
        expect(item.content.extraWorkDetails).toStrictEqual([]);
        expect(item.content.extraSections).toStrictEqual([]);
    });

    test('should replace empty section names with "Untitled" [vault 4]', () => {
        const item = get1PasswordItem<'custom'>('1password.1pux', 4, 0);
        expect(item.type).toEqual('custom');
        expect(item.metadata.name).toEqual('Passport');
        expect(item.content.sections).toBeDefined();
        expect(item.content.sections.length).toEqual(1);
        expect(item.content.sections[0].sectionName).toEqual('Untitled');
    });

    test('should handle all 1Password item types', () => {
        const { ignored } = get1PasswordData('1password.1pux');
        expect(ignored).toEqual([]);
    });
});
