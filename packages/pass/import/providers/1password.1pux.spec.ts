import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { read1Password1PuxData } from './1password.reader.1pux';

describe('Import 1password 1pux', () => {
    let sourceData: ArrayBuffer;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/1password.1pux');
        payload = await read1Password1PuxData(sourceData);
    });

    test('should throw on invalid file content', async () => {
        await expect(read1Password1PuxData(new ArrayBuffer(1))).rejects.toThrow();
    });

    test('result should contain the correct number of vaults', () => {
        const [main, secondary, shared] = payload.vaults;
        expect(payload.vaults.length).toEqual(3);

        expect(main.type).toEqual('new');
        expect(main.type === 'new' && main.vaultName).toEqual('Private');

        expect(secondary.type).toEqual('new');
        expect(secondary.type === 'new' && secondary.vaultName).toEqual('SecondaryVault');

        expect(shared.type).toEqual('new');
        expect(shared.type === 'new' && shared.vaultName).toEqual('Shared');
    });

    test('should parse `private` vault items correctly', () => {
        const [main] = payload.vaults;
        expect(main.items.length).toEqual(8);

        /* Note item */
        const noteItem = main.items[0] as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.createTime).toEqual(1619085236);
        expect(noteItem.modifyTime).toEqual(1619085236);
        expect(noteItem.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem.metadata.name).toEqual('🎉 Welcome to 1Password!');
        expect(noteItem.metadata.note).toEqual(
            'Follow these steps to get started.\n\n1️⃣ Get the apps\nhttps://1password.com/downloads\nInstall 1Password everywhere you need your passwords.\n\n2️⃣ Get 1Password in your browser\nhttps://1password.com/downloads/#browsers\nInstall 1Password in your browser to save and fill passwords.\n\n3️⃣ Save your first password\n1. Sign in to your favorite website.\n2. 1Password will ask to save your username and password.\n3. Click Save Login.\n\n4️⃣ Fill passwords and more\nhttps://support.1password.com/explore/extension/\nSave and fill passwords, credit cards, and addresses.\n\n📚 Learn 1Password\nCheck out our videos and articles:\nWatch videos\nhttps://youtube.com/1PasswordVideos\nGet support\nhttps://support.1password.com/\nRead the blog\nhttps://blog.1password.com/\nContact us\nhttps://support.1password.com/contact-us/'
        );
        expect(noteItem.content).toEqual({});
        expect(noteItem.trashed).toEqual(false);
        expect(noteItem.extraFields).toEqual([]);

        /* Login item with multiple TOTP extra fields */
        const loginItemMultiTOTP = main.items[1] as ItemImportIntent<'login'>;
        expect(loginItemMultiTOTP.type).toEqual('login');
        expect(loginItemMultiTOTP.createTime).toEqual(1671029303);
        expect(loginItemMultiTOTP.modifyTime).toEqual(1676038895);
        expect(loginItemMultiTOTP.metadata.name).toEqual('Login with TOTP');
        expect(loginItemMultiTOTP.metadata.note).toEqual('');
        expect(loginItemMultiTOTP.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultiTOTP.content).toEqual({
            username: 'john@wick.com',
            password: 'password',
            urls: ['http://localhost:7777'],
            totpUri: '',
        });
        expect(loginItemMultiTOTP.trashed).toEqual(false);
        expect(loginItemMultiTOTP.extraFields).toEqual([
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: {
                    totpUri:
                        'otpauth://totp/Login%20with%20TOTP?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
                },
            },
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: {
                    totpUri: 'otpauth://totp/generator?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
                },
            },
        ]);

        /* Login item with empty credentials */
        const emptyLoginItem = main.items[2];
        expect(emptyLoginItem.type).toEqual('login');
        expect(emptyLoginItem.createTime).toEqual(1677234145);
        expect(emptyLoginItem.modifyTime).toEqual(1677234158);
        expect(emptyLoginItem.metadata.itemUuid).not.toBeUndefined();
        expect(emptyLoginItem.metadata.name).toEqual('Inicio de sesión');
        expect(emptyLoginItem.metadata.note).toEqual('');
        expect(emptyLoginItem.trashed).toEqual(false);
        expect(emptyLoginItem.extraFields).toEqual([
            {
                fieldName: 'contraseña de un solo uso',
                type: 'totp',
                data: {
                    totpUri: '',
                },
            },
        ]);

        /* Login item with single TOTP extra field */
        const loginItemSingleTOTP = main.items[3] as ItemImportIntent<'login'>;
        expect(loginItemSingleTOTP.type).toEqual('login');
        expect(loginItemSingleTOTP.createTime).toEqual(1675849436);
        expect(loginItemSingleTOTP.modifyTime).toEqual(1676455597);
        expect(loginItemSingleTOTP.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSingleTOTP.metadata.name).toEqual('login with 2fa');
        expect(loginItemSingleTOTP.metadata.note).toEqual('');
        expect(loginItemSingleTOTP.trashed).toEqual(false);
        expect(loginItemSingleTOTP.extraFields).toEqual([
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: {
                    totpUri: 'otpauth://totp/az?secret=QQ&algorithm=SHA1&digits=6&period=30',
                },
            },
        ]);

        /* Login item with special chars and text extra field */
        const specialCharItem = main.items[4] as ItemImportIntent<'login'>;
        expect(specialCharItem.type).toEqual('login');
        expect(specialCharItem.createTime).toEqual(1619085696);
        expect(specialCharItem.modifyTime).toEqual(1671040547);
        expect(specialCharItem.metadata.itemUuid).not.toBeUndefined();
        expect(specialCharItem.metadata.name).toEqual('Credential with " in the name');
        expect(specialCharItem.metadata.note).toEqual('Item notes');
        expect(specialCharItem.trashed).toEqual(false);
        expect(specialCharItem.extraFields).toEqual([
            {
                fieldName: 'text section',
                type: 'text',
                data: {
                    content: 'value of the text section',
                },
            },
        ]);
        expect(specialCharItem.content).toEqual({
            username: 'somewhere',
            password: 'somepassword with " in it',
            urls: ['https://slashdot.org'],
            totpUri: '',
        });

        /* login item with broken urls and text extra field */
        const brokenUrlItem = main.items[5] as ItemImportIntent<'login'>;
        expect(brokenUrlItem.type).toEqual('login');
        expect(brokenUrlItem.createTime).toEqual(1619085696);
        expect(brokenUrlItem.modifyTime).toEqual(1671040547);
        expect(brokenUrlItem.metadata.itemUuid).not.toBeUndefined();
        expect(brokenUrlItem.metadata.name).toEqual('Broken url');
        expect(brokenUrlItem.metadata.note).toEqual('Item notes');
        expect(brokenUrlItem.trashed).toEqual(false);
        expect(brokenUrlItem.extraFields).toEqual([
            {
                fieldName: 'text section',
                type: 'text',
                data: {
                    content: 'value of the text section',
                },
            },
        ]);
        expect(brokenUrlItem.content.urls).toEqual([]);

        const passwordItem = main.items[6];
        expect(passwordItem.type).toEqual('login');
        expect(passwordItem.createTime).toEqual(1655535022);
        expect(passwordItem.modifyTime).toEqual(1655535034);
        expect(passwordItem.metadata.itemUuid).not.toBeUndefined();
        expect(passwordItem.metadata.name).toEqual('Password');
        expect(passwordItem.metadata.note).toEqual('');
        expect(passwordItem.content).toEqual({
            username: '',
            password: 'f@LGRHG7BEcByVy--xTV8X4U',
            urls: [],
            totpUri: '',
        });
        expect(passwordItem.trashed).toEqual(false);
        expect(passwordItem.extraFields).toEqual([]);

        /* Login item created from password item */
        const autofillItem = main.items[7] as ItemImportIntent<'login'>;
        expect(autofillItem.type).toEqual('login');
        expect(autofillItem.createTime).toEqual(1675771315);
        expect(autofillItem.modifyTime).toEqual(1675771315);
        expect(autofillItem.metadata.itemUuid).not.toBeUndefined();
        expect(autofillItem.metadata.name).toEqual('Autofill Sample');
        expect(autofillItem.metadata.note).toEqual('');
        expect(autofillItem.content).toEqual({
            username: 'username test',
            password: 'password test',
            urls: [],
            totpUri: '',
        });
        expect(autofillItem.trashed).toEqual(false);
        expect(autofillItem.extraFields).toEqual([]);
    });

    test('should parse `secondary` vault items correctly', () => {
        const [, secondary] = payload.vaults;
        expect(secondary.items.length).toEqual(2); /* deleted items not included */

        const archivedItem = secondary.items[0] as ItemImportIntent<'login'>;
        expect(archivedItem.type).toEqual('login');
        expect(archivedItem.createTime).toEqual(1682409974);
        expect(archivedItem.modifyTime).toEqual(1682409991);
        expect(archivedItem.metadata.itemUuid).not.toBeUndefined();
        expect(archivedItem.metadata.name).toEqual('test');
        expect(archivedItem.metadata.note).toEqual('');
        expect(archivedItem.content).toEqual({
            username: 'archived',
            password: '',
            urls: [],
            totpUri: '',
        });
        expect(archivedItem.trashed).toEqual(true);
        expect(archivedItem.extraFields).toEqual([]);

        const loginItem = secondary.items[1] as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.createTime).toEqual(1675777494);
        expect(loginItem.modifyTime).toEqual(1675777506);
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.metadata.name).toEqual('Login item');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.content).toEqual({
            username: 'username',
            password: 'password',
            urls: [],
            totpUri: '',
        });
        expect(loginItem.trashed).toEqual(false);
        expect(loginItem.extraFields).toEqual([]);
    });

    test('should parse `shared` vault items correctly', () => {
        const [, , shared] = payload.vaults;
        expect(shared.items.length).toEqual(0);
    });
});
