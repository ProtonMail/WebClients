import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';

import type { ImportPayload } from '../types';
import { read1Password1PifData } from './1password.reader.1pif';

describe('Import 1password 1pif', () => {
    let sourceData: string;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/1password.private.1pif', 'utf8');
        payload = await read1Password1PifData(sourceData);
    });

    test('should throw on invalid file content', async () => {
        await expect(read1Password1PifData('not-a-1pif-file')).rejects.toThrow();
    });

    it('should correctly parse items', () => {
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(8);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.name).not.toBeUndefined();

        const { items } = vaultData;

        /* Login */
        const loginItem1 = items[1] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');

        expect(loginItem1.metadata.note).toEqual('Item notes');
        expect(loginItem1.content.username).toEqual('somewhere');
        expect(loginItem1.content.password).toEqual('somepassword with " in it');
        expect(loginItem1.content.urls[0]).toEqual('https://slashdot.org/');
        expect(loginItem1.content.urls.length).toEqual(1);

        /* Note item */
        const noteItem = items[2] as ItemImportIntent<'note'>;
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

        /* Password item */
        const passwordItem = items[0];
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

        /* Login item with TOTP extra field */
        const loginItemSingleTOTP = items[6] as ItemImportIntent<'login'>;
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

        /* Login item with multiple TOTP extra fields */
        const loginItemMultiTOTP = items[5] as ItemImportIntent<'login'>;
        expect(loginItemMultiTOTP.type).toEqual('login');
        expect(loginItemMultiTOTP.createTime).toEqual(1671029303);
        expect(loginItemMultiTOTP.modifyTime).toEqual(1676038895);
        expect(loginItemMultiTOTP.metadata.name).toEqual('Login with TOTP');
        expect(loginItemMultiTOTP.metadata.note).toEqual('');
        expect(loginItemMultiTOTP.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultiTOTP.content).toEqual({
            username: 'john@wick.com',
            password: 'password',
            urls: ['http://localhost:7777/dashboard/'],
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

        /* Login item with special chars and text extra field */
        const specialCharItem = items[1] as ItemImportIntent<'login'>;
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
            urls: ['https://slashdot.org/'],
            totpUri: '',
        });

        /* Login item created from password item */
        const autofillItem = items[3] as ItemImportIntent<'login'>;
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

        /* Credit Card item */
        const creditCardItemName = 'Credit Card item with note';
        const creditCardItem = items.find(
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
});
