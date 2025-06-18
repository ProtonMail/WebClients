import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent, ItemType } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1.static';

import { read1Password1PifData } from './1pif.reader';

const sourceFiles = { '1password.private.1pif': `${__dirname}/mocks/1password.private.1pif` };

const data: Record<string, ImportPayload> = {};

const get1PasswordData = (sourceKey: string) => data[sourceKey];
const get1PasswordItem = <T extends ItemType>(sourceKey: string, vaultIndex: number = 0, itemIndex: number = 0) =>
    deobfuscateItem<T>(data[sourceKey].vaults[vaultIndex].items[itemIndex]) as ItemImportIntent<T>;

describe('Import 1password 1pif', () => {
    beforeAll(async () => {
        for (const [key, path] of Object.entries(sourceFiles)) {
            const sourceData = fs.readFileSync(path);
            const file = new File([sourceData], path);
            data[key] = await read1Password1PifData(file);
        }
    });

    test('should throw on invalid file content', async () => {
        await expect(() => read1Password1PifData(new File([], 'corrupted'))).rejects.toThrow();
    });

    test('should correctly parse vaults', () => {
        const { vaults } = get1PasswordData('1password.private.1pif');
        expect(vaults.length).toEqual(1);
        expect(vaults[0].items.length).toEqual(10);
        expect(vaults[0].name).not.toBeUndefined();
    });

    test('should support password items', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 0);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1655535022);
        expect(item.modifyTime).toEqual(1655535034);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('Password');
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('f@LGRHG7BEcByVy--xTV8X4U');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support login items with special characters', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 1);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1619085696);
        expect(item.modifyTime).toEqual(1671040547);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('Credential with " in the name');
        expect(item.metadata.note).toEqual('Item notes');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('somewhere');
        expect(item.content.password).toEqual('somepassword with " in it');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual(['https://slashdot.org/']);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([
            {
                fieldName: 'text section',
                type: 'text',
                data: {
                    content: 'value of the text section',
                },
            },
        ]);
    });

    test('should support note items', () => {
        const item = get1PasswordItem<'note'>('1password.private.1pif', 0, 2);
        expect(item.type).toEqual('note');
        expect(item.createTime).toEqual(1619085236);
        expect(item.modifyTime).toEqual(1619085236);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('🎉 Welcome to 1Password!');
        expect(item.metadata.note).toEqual(
            'Follow these steps to get started.\n\n1️⃣ Get the apps\nhttps://1password.com/downloads\nInstall 1Password everywhere you need your passwords.\n\n2️⃣ Get 1Password in your browser\nhttps://1password.com/downloads/#browsers\nInstall 1Password in your browser to save and fill passwords.\n\n3️⃣ Save your first password\n1. Sign in to your favorite website.\n2. 1Password will ask to save your username and password.\n3. Click Save Login.\n\n4️⃣ Fill passwords and more\nhttps://support.1password.com/explore/extension/\nSave and fill passwords, credit cards, and addresses.\n\n📚 Learn 1Password\nCheck out our videos and articles:\nWatch videos\nhttps://youtube.com/1PasswordVideos\nGet support\nhttps://support.1password.com/\nRead the blog\nhttps://blog.1password.com/\nContact us\nhttps://support.1password.com/contact-us/'
        );
        expect(item.content).toEqual({});
        expect(item.trashed).toEqual(false);
        expect(item.extraFields.length).toEqual(14);
    });

    test('should support generic login items', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 3);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1675771315);
        expect(item.modifyTime).toEqual(1675771315);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('Autofill Sample');
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('');
        expect(item.content.itemUsername).toEqual('username test');
        expect(item.content.password).toEqual('password test');
        expect(item.content.totpUri).toEqual('');
        expect(item.content.urls).toEqual([]);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([]);
    });

    test('should support login items with special characters', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 4);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1677234145);
        expect(item.modifyTime).toEqual(1677234158);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('Inicio de sesión');
        expect(item.trashed).toEqual(false);
    });

    test('should support login items with multiple TOTPs', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 5);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1671029303);
        expect(item.modifyTime).toEqual(1676038895);
        expect(item.metadata.name).toEqual('Login with TOTP');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.itemEmail).toEqual('john@wick.com');
        expect(item.content.itemUsername).toEqual('');
        expect(item.content.password).toEqual('password');
        expect(item.content.totpUri).toEqual(
            'otpauth://totp/Login%20with%20TOTP?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30'
        );
        expect(item.content.urls).toEqual(['http://localhost:7777/dashboard/']);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: {
                    totpUri: 'otpauth://totp/generator?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
                },
            },
        ]);
    });

    test('should support login items with single TOTP', () => {
        const item = get1PasswordItem<'login'>('1password.private.1pif', 0, 6);
        expect(item.type).toEqual('login');
        expect(item.createTime).toEqual(1675849436);
        expect(item.modifyTime).toEqual(1676455597);
        expect(item.trashed).toEqual(false);
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.name).toEqual('login with 2fa');
        expect(item.metadata.note).toEqual('');
        expect(item.content.totpUri).toEqual('otpauth://totp/az?secret=QS&algorithm=SHA1&digits=6&period=30');
        expect(item.extraFields).toEqual([]);
    });

    test('should support credit card items', () => {
        const item = get1PasswordItem<'creditCard'>('1password.private.1pif', 0, 7);
        expect(item.type).toEqual('creditCard');
        expect(item.metadata.note).toEqual('this is credit card item note');
        expect(item.content.number).toEqual('4242333342423333');
        expect(item.content.pin).toEqual('1234');
        expect(item.content.verificationNumber).toEqual('123');
        expect(item.content.cardType).toEqual(CardType.Unspecified);
        expect(item.content.cardholderName).toEqual('A B');
        expect(item.content.expirationDate).toEqual('012025');
    });

    test('should support wifi items', () => {
        const item = get1PasswordItem<'wifi'>('1password.private.1pif', 0, 8);
        expect(item.type).toEqual('wifi');
        expect(item.metadata.name).toEqual('Wireless Router');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.ssid).toEqual('::network-name::');
        expect(item.content.password).toEqual('::wireless-network-password::');
        expect(item.content.security).toEqual(3);
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([
            { fieldName: 'base station name', type: 'text', data: { content: '::base-station-name::' } },
            { fieldName: 'base station password', type: 'hidden', data: { content: '::base-station-password::' } },
            { fieldName: 'server / IP address', type: 'text', data: { content: '::base-server-address::' } },
            { fieldName: 'AirPort ID', type: 'text', data: { content: '::airport-id::' } },
            {
                fieldName: 'attached storage password',
                type: 'hidden',
                data: { content: '::attached-storage-password::' },
            },
            { fieldName: '::custom-field::', type: 'text', data: { content: '::custom-field-value::' } },
        ]);
    });

    test('should support SSH key items', () => {
        const item = get1PasswordItem<'sshKey'>('1password.private.1pif', 0, 9);
        expect(item.type).toEqual('sshKey');
        expect(item.metadata.name).toEqual('SSH Key');
        expect(item.metadata.itemUuid).not.toBeUndefined();
        expect(item.metadata.note).toEqual('');
        expect(item.content.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
        expect(item.content.publicKey).toContain('ssh-ed25519');
        expect(item.trashed).toEqual(false);
        expect(item.extraFields).toEqual([
            { fieldName: 'fingerprint', type: 'text', data: { content: 'SHA256:000000000' } },
            { fieldName: 'key type', type: 'text', data: { content: 'Ed25519' } },
            { fieldName: 'url', type: 'text', data: { content: 'asdsad.com' } },
            { fieldName: 'text-field', type: 'text', data: { content: 'asdasd' } },
        ]);
    });

    test('should handle all 1Password item types', () => {
        const { ignored } = get1PasswordData('1password.private.1pif');
        expect(ignored).toEqual([]);
    });
});
