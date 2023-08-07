import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';

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

        expect(main.name).toEqual('Private');
        expect(secondary.name).toEqual('SecondaryVault');
        expect(shared.name).toEqual('Shared');
    });

    test('should parse `private` vault items correctly', () => {
        const [main] = payload.vaults;

        expect(main.items.length).toEqual(11);

        /* Note item */
        const noteItemName = 'Note item';
        const noteItem = main.items.find((item) => item.metadata.name === noteItemName) as ItemImportIntent<'note'>;
        expect(noteItem.type).toEqual('note');
        expect(noteItem.createTime).toEqual(1619085236);
        expect(noteItem.modifyTime).toEqual(1688982876);
        expect(noteItem.metadata.itemUuid).not.toBeUndefined();
        expect(noteItem.metadata.note).toEqual(
            'Follow these steps to get started.\n\n1️⃣ Get the apps\nhttps://1password.com/downloads\nInstall 1Password everywhere you need your passwords.\n\n2️⃣ Get 1Password in your browser\nhttps://1password.com/downloads/#browsers\nInstall 1Password in your browser to save and fill passwords.\n\n3️⃣ Save your first password\n1. Sign in to your favorite website.\n2. 1Password will ask to save your username and password.\n3. Click Save Login.\n\n4️⃣ Fill passwords and more\nhttps://support.1password.com/explore/extension/\nSave and fill passwords, credit cards, and addresses.\n\n📚 Learn 1Password\nCheck out our videos and articles:\nWatch videos\nhttps://youtube.com/1PasswordVideos\nGet support\nhttps://support.1password.com/\nRead the blog\nhttps://blog.1password.com/\nContact us\nhttps://support.1password.com/contact-us/'
        );
        expect(noteItem.content).toEqual({});
        expect(noteItem.trashed).toEqual(false);
        expect(noteItem.extraFields).toEqual([]);

        /* Login item with multiple TOTP and text extra fields */
        const loginItemMultiTOTPName = 'Login item with two TOTP and one text extra fields';
        const loginItemMultiTOTP = main.items.find(
            (item) => item.metadata.name === loginItemMultiTOTPName
        ) as ItemImportIntent<'login'>;

        expect(loginItemMultiTOTP.type).toEqual('login');
        expect(loginItemMultiTOTP.createTime).toEqual(1671029303);
        expect(loginItemMultiTOTP.modifyTime).toEqual(1688987066);
        expect(loginItemMultiTOTP.metadata.note).toEqual('');
        expect(loginItemMultiTOTP.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultiTOTP.content).toEqual({
            username: 'john@wick.com',
            password: 'password',
            urls: ['http://localhost:7777/dashboard/'],
            totpUri:
                'otpauth://totp/Login%20item%20with%20two%20TOTP%20and%20one%20text%20extra%20fields?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
        });
        expect(loginItemMultiTOTP.trashed).toEqual(false);
        expect(loginItemMultiTOTP.extraFields).toEqual([
            {
                fieldName: 'one-time password',
                type: 'totp',
                data: {
                    totpUri: 'otpauth://totp/generator?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
                },
            },
            {
                fieldName: 'text extra field label',
                type: 'text',
                data: {
                    content: 'text extra field content',
                },
            },
        ]);

        /* Login item with empty credentials */
        const emptyLoginItemName = 'Login item with empty credentials';
        const emptyLoginItem = main.items.find(
            (item) => item.metadata.name === emptyLoginItemName
        ) as ItemImportIntent<'login'>;
        expect(emptyLoginItem.type).toEqual('login');
        expect(emptyLoginItem.createTime).toEqual(1677234145);
        expect(emptyLoginItem.modifyTime).toEqual(1688983124);
        expect(emptyLoginItem.metadata.itemUuid).not.toBeUndefined();
        expect(emptyLoginItem.metadata.note).toEqual('');
        expect(emptyLoginItem.trashed).toEqual(false);
        expect(emptyLoginItem.content.username).toEqual('');
        expect(emptyLoginItem.content.password).toEqual('');
        expect(emptyLoginItem.content.totpUri).toEqual('');
        expect(emptyLoginItem.extraFields).toEqual([]);

        /* Login item with single TOTP extra field */
        const loginItemSingleTOTPName = 'Login item with a note and single TOTP extra field';
        const loginItemSingleTOTP = main.items.find(
            (item) => item.metadata.name === loginItemSingleTOTPName
        ) as ItemImportIntent<'login'>;
        expect(loginItemSingleTOTP.type).toEqual('login');
        expect(loginItemSingleTOTP.createTime).toEqual(1675849436);
        expect(loginItemSingleTOTP.modifyTime).toEqual(1688983719);
        expect(loginItemSingleTOTP.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSingleTOTP.metadata.note).toEqual('this is a login item note');
        expect(loginItemSingleTOTP.content.totpUri).toEqual(
            'otpauth://totp/az?secret=QQ&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItemSingleTOTP.trashed).toEqual(false);
        expect(loginItemSingleTOTP.extraFields).toEqual([]);

        /* Login item with special chars in password */
        const specialCharItemName = 'Login item with " in password';
        const specialCharItem = main.items.find(
            (item) => item.metadata.name === specialCharItemName
        ) as ItemImportIntent<'login'>;
        expect(specialCharItem.type).toEqual('login');
        expect(specialCharItem.createTime).toEqual(1619085696);
        expect(specialCharItem.modifyTime).toEqual(1688987656);
        expect(specialCharItem.metadata.itemUuid).not.toBeUndefined();
        expect(specialCharItem.metadata.note).toEqual('Item notes');
        expect(specialCharItem.trashed).toEqual(false);
        expect(specialCharItem.extraFields).toEqual([]);
        expect(specialCharItem.content).toEqual({
            username: 'somewhere',
            password: 'somepassword with " in it',
            urls: ['https://slashdot.org/'],
            totpUri: '',
        });

        /* login item with broken url */
        const brokenUrlItemName = 'Login item with broken URL';
        const brokenUrlItem = main.items.find(
            (item) => item.metadata.name === brokenUrlItemName
        ) as ItemImportIntent<'login'>;
        expect(brokenUrlItem.type).toEqual('login');
        expect(brokenUrlItem.createTime).toEqual(1688987490);
        expect(brokenUrlItem.modifyTime).toEqual(1688987490);
        expect(brokenUrlItem.metadata.itemUuid).not.toBeUndefined();
        expect(brokenUrlItem.trashed).toEqual(false);
        expect(brokenUrlItem.extraFields).toEqual([]);
        expect(brokenUrlItem.content.urls).toEqual([]);

        const passwordItemName = 'Login item with Password only';
        const passwordItem = main.items.find(
            (item) => item.metadata.name === passwordItemName
        ) as ItemImportIntent<'login'>;
        expect(passwordItem.type).toEqual('login');
        expect(passwordItem.createTime).toEqual(1655535022);
        expect(passwordItem.modifyTime).toEqual(1688983483);
        expect(passwordItem.metadata.itemUuid).not.toBeUndefined();
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
        const autofillItemName = 'Login item Autofill Sample';
        const autofillItem = main.items.find(
            (item) => item.metadata.name === autofillItemName
        ) as ItemImportIntent<'login'>;
        expect(autofillItem.type).toEqual('login');
        expect(autofillItem.createTime).toEqual(1688035201);
        expect(autofillItem.modifyTime).toEqual(1688983572);
        expect(autofillItem.metadata.itemUuid).not.toBeUndefined();
        expect(autofillItem.metadata.note).toEqual('');
        expect(autofillItem.content).toEqual({
            username: 'Username test',
            password: 'password test',
            urls: [],
            totpUri: '',
        });
        expect(autofillItem.trashed).toEqual(false);
        expect(autofillItem.extraFields).toEqual([]);

        /* Credit Card item */
        const creditCardItemName = 'Credit Card item with note';
        const creditCardItem = main.items.find(
            (item) => item.metadata.name === creditCardItemName
        ) as ItemImportIntent<'creditCard'>;
        expect(creditCardItem.type).toEqual('creditCard');
        expect(creditCardItem.metadata.note).toEqual('this is credit card item note');
        expect(creditCardItem.content).toEqual({
            cardType: CardType.Unspecified,
            cardholderName: 'A B',
            expirationDate: '012025',
            number: '4242333342423333',
            pin: '',
            verificationNumber: '123',
        });
    });

    test('should parse `secondary` vault items correctly', () => {
        const [, secondary] = payload.vaults;
        expect(secondary.items.length).toEqual(2); /* deleted items not included */

        const archivedItemName = 'Login item archived';
        const archivedItem = secondary.items.find(
            (item) => item.metadata.name === archivedItemName
        ) as ItemImportIntent<'login'>;
        expect(archivedItem.type).toEqual('login');
        expect(archivedItem.createTime).toEqual(1683720664);
        expect(archivedItem.modifyTime).toEqual(1688990961);
        expect(archivedItem.metadata.itemUuid).not.toBeUndefined();
        expect(archivedItem.metadata.note).toEqual('');
        expect(archivedItem.content).toEqual({
            username: 'archived',
            password: 'password',
            urls: [],
            totpUri: '',
        });
        expect(archivedItem.trashed).toEqual(true);
        expect(archivedItem.extraFields).toEqual([]);

        const loginItemName = 'Login item';
        const loginItem = secondary.items.find(
            (item) => item.metadata.name === loginItemName
        ) as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.createTime).toEqual(1675777494);
        expect(loginItem.modifyTime).toEqual(1675777506);
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
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
