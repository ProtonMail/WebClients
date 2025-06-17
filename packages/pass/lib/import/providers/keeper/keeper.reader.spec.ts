import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent, ItemType } from '@proton/pass/types';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readKeeperData } from './keeper.reader';

const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);
let data: ImportPayload;

const getKeeperItem = <T extends ItemType>(vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data.vaults[vaultIndex].items[itemIndex]) as ItemImportIntent<T>;

describe('Import Keeper JSON', () => {
    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/keeper.json');
        const file = new File([sourceData], 'keeper.json');
        data = await readKeeperData(file);
    });

    afterAll(() => dateMock.mockRestore());

    test('should handle corrupted files', async () => {
        await expect(() => readKeeperData(new File([''], 'corrupted'))).rejects.toThrow();
    });

    test('should convert Keeper folders to vaults correctly', () => {
        expect(data.vaults.length).toEqual(4);

        expect(data.vaults[0].name).toEqual('folder2');
        expect(data.vaults[1].name).toEqual('folder1');
        expect(data.vaults[2].name).toEqual('subfolder1');
        expect(data.vaults[3].name).toEqual('Import - 27 Apr 2023');

        expect(data.vaults[0].items.length).toEqual(1);
    });

    test('should support identity items [vault 1]', () => {
        const item = getKeeperItem<'identity'>(0, 0);
        expect(item.type).toEqual('identity');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('id item');
        expect(item.metadata.note).toEqual('notes');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toMatchObject({
            email: 'email@custom-field.value',
            firstName: 'John',
            lastName: 'Doe',
            middleName: 'Middle',
            extraSections: [
                {
                    sectionName: 'Extra fields',
                    sectionFields: [
                        {
                            fieldName: 'accountNumber:identityNumber',
                            type: 'text',
                            data: { content: '123' },
                        },
                    ],
                },
            ],
        });
    });

    test('should support login items [vault 2]', () => {
        const item = getKeeperItem<'login'>(1, 0);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login of folder1');
        expect(item.metadata.note).toEqual('');
        expect(item.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support login items [vault 3]', () => {
        const item = getKeeperItem<'login'>(2, 0);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login of subfolder1');
        expect(item.metadata.note).toEqual('');
        expect(item.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support credit card items [vault 4]', () => {
        const item = getKeeperItem<'creditCard'>(3, 0);
        expect(item.type).toEqual('creditCard');
        expect(item.metadata.name).toEqual('a card');
        expect(item.metadata.note).toEqual('');
        expect(item.content.cardholderName).toEqual('First last');
        expect(item.content.number).toEqual('4242424242424242');
        expect(item.content.verificationNumber).toEqual('123');
        expect(item.content.pin).toEqual('1234');
        expect(item.content.expirationDate).toEqual('032027');
        expect(item.extraFields).toEqual([{ data: { content: 'custom value' }, fieldName: 'Text', type: 'text' }]);
    });

    test('should support custom file item [vault 4]', () => {
        const item = getKeeperItem<'custom'>(3, 1);
        expect(item.type).toEqual('custom');
        expect(item.metadata.name).toEqual('a file');
    });

    test('should support notes with custom fields [vault 4]', () => {
        const item = getKeeperItem<'note'>(3, 2);
        expect(item.type).toEqual('note');
        expect(item.metadata.name).toEqual('a note');
        expect(item.metadata.note).toEqual('custom note');
        expect(item.extraFields).toEqual([
            { data: { content: 'note content\nline 2' }, fieldName: 'note:', type: 'text' },
            { data: { content: 'custom field name' }, fieldName: 'Text', type: 'text' },
        ]);
    });

    test('should support custom address items [vault 4]', () => {
        const item = getKeeperItem<'custom'>(3, 3);
        expect(item.type).toEqual('custom');
        expect(item.metadata.name).toEqual('Address for bank card');
        expect(item.extraFields).toEqual([
            { fieldName: 'address: - country', data: { content: 'US' }, type: 'text' },
            { fieldName: 'address: - street1', data: { content: 'line 1' }, type: 'text' },
            { fieldName: 'address: - street2', data: { content: 'line 2' }, type: 'text' },
            { fieldName: 'address: - city', data: { content: 'City' }, type: 'text' },
            { fieldName: 'address: - state', data: { content: 'State' }, type: 'text' },
            { fieldName: 'address: - zip', data: { content: '00000' }, type: 'text' },
        ]);
    });

    test('should support identity items with custom fields [vault 4]', () => {
        const item = getKeeperItem<'identity'>(3, 4);
        expect(item.type).toEqual('identity');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('contact item');
        expect(item.metadata.note).toEqual('');
        expect(item.content).toMatchObject({
            firstName: 'first',
            lastName: 'last',
            company: 'company',
            email: 'email@example.com',
            extraSections: [
                {
                    sectionName: 'Extra fields',
                    sectionFields: [
                        { data: { content: '5555555555 Ext' }, fieldName: 'phone:', type: 'text' },
                        { data: { content: '5555555556 Ext2' }, fieldName: 'phone:', type: 'text' },
                        { data: { content: 'custom field' }, fieldName: 'Text', type: 'text' },
                    ],
                },
            ],
        });
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support generic items [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 5);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('general item');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support login with 2FA items [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 6);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with 2fa');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri:
                'otpauth://totp/account.proton.me:2fa-manually-entered-string%40example.com?issuer=account.proton.me&secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30',
            urls: ['https://example.com/'],
            itemEmail: '2fa@example.com',
            itemUsername: '',
        });
    });

    test('should support login with malformed urls [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 7);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with broken url');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
    });

    test('should support login with commas and quotes [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 8);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with comma, quotes "');
        expect(item.metadata.note).toEqual('notes with commas, quotes "');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'password with comma, quotes "',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'username with comma, quotes "',
        });
    });

    test('should support login with custom fields [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 9);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with custom fields');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });

        expect(item.extraFields).toEqual([
            {
                fieldName: 'Security Question & Answer',
                type: 'text',
                data: { content: 'this is custom field: security question? this is custom field: security answer' },
            },
            {
                fieldName: 'Website Address',
                type: 'text',
                data: { content: 'https://this-is-custom-field-url.example.com' },
            },
            {
                fieldName: 'Phone',
                type: 'text',
                data: { content: 'Mobile US (+1) (555) 555-5555 Ex' },
            },
            {
                fieldName: 'multiline:',
                type: 'text',
                data: { content: 'custom field with\nmultiple\nlines' },
            },
            {
                fieldName: 'custom Name fields - first',
                type: 'text',
                data: { content: 'custom field--first name' },
            },
            {
                fieldName: 'custom Name fields - middle',
                type: 'text',
                data: { content: 'custom field--middle name' },
            },
            {
                fieldName: 'custom Name fields - last',
                type: 'text',
                data: { content: 'custom field--last name' },
            },
            {
                fieldName: 'phone:custom Phone Number',
                type: 'text',
                data: { content: 'Mobile US 5555555555 ext' },
            },
            {
                fieldName: 'custom Hidden Field',
                type: 'hidden',
                data: { content: 'hidden vlue' },
            },
            {
                fieldName: 'second custom hidden field',
                type: 'hidden',
                data: { content: 'hidden value' },
            },
        ]);
    });

    test('should support login with multiple lines [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 10);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with multiple lines');
        expect(item.metadata.note).toEqual('notes with\nmultiple\nlines');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });
    });

    test('should support login with multiple urls [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 11);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with multiple urls');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: '',
        });

        expect(item.extraFields).toEqual([
            {
                fieldName: 'Website Address',
                type: 'text',
                data: { content: 'https://second.example.com' },
            },
            {
                fieldName: 'Website Address with edited label',
                type: 'text',
                data: { content: 'https://edited-label.example.com' },
            },
        ]);
    });

    test('should support login with secure notes [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 12);
        expect(item.type).toEqual('note');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('secure note item');
        expect(item.metadata.note).toEqual('foo');
        expect(item.content).toEqual({});
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([{ data: { content: 'secured note' }, fieldName: 'note:', type: 'text' }]);
    });

    test('should support SSH key items [vault 4]', () => {
        const item = getKeeperItem<'sshKey'>(3, 13);
        expect(item.type).toEqual('sshKey');
        expect(item.metadata.name).toEqual('ssh key item');
        expect(item.content.privateKey).toEqual('pri');
        expect(item.content.publicKey).toEqual('pub');
        expect(item.extraFields).toEqual([
            { data: { content: 'john' }, fieldName: 'Username', type: 'text' },
            { data: { content: 'abc' }, fieldName: 'Password', type: 'text' },
            { data: { content: 'example.com' }, fieldName: 'host: - hostName', type: 'text' },
            { data: { content: '1111' }, fieldName: 'host: - port', type: 'text' },
        ]);
    });

    test('should support general item types [vault 4]', () => {
        const item = getKeeperItem<'login'>(3, 14);
        expect(item.type).toEqual('login');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('general item login');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
        expect(item.content).toEqual({
            passkeys: [],
            password: 'password',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
    });

    test('should support WIFI item types [vault 4]', () => {
        const item = getKeeperItem<'wifi'>(3, 15);
        expect(item.type).toEqual('wifi');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('wifi');
        expect(item.metadata.note).toEqual('');
        expect(item.trashed).toEqual(false);
        expect(item.content.password).toEqual('password123');
        expect(item.content.ssid).toEqual('my-ssid');
        expect(item.content.security).toEqual(WifiSecurity.UnspecifiedWifiSecurity);
        expect(item.extraFields).toEqual([
            { data: { content: 'custom value' }, fieldName: 'custom field', type: 'text' },
        ]);
    });

    test('should not ignore any item', () => {
        expect(data.ignored.length).toEqual(0);
    });
});
