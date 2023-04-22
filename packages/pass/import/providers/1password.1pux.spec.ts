import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import { read1Password1PuxData } from './1password.reader.1pux';

describe('Import 1password 1pux', () => {
    let sourceData: ArrayBuffer;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/1password.1pux');
    });

    it('transforms .1pux into ImportPayload', async () => {
        const payload = await read1Password1PuxData(sourceData);
        expect(payload.length).toEqual(3);

        const [main, secondary, shared] = payload;

        /* Private vault */
        {
            expect(main.type).toEqual('new');
            expect(main.type === 'new' && main.vaultName).toEqual('Private');

            /* Login item with multiple TOTP */
            const loginItemTOTP = main.items[0] as ItemImportIntent<'login'>;

            expect(loginItemTOTP.type).toEqual('login');
            expect(loginItemTOTP.createTime).toEqual(1671029303);
            expect(loginItemTOTP.modifyTime).toEqual(1675777403);
            expect(loginItemTOTP.metadata.name).toEqual('Login with TOTP');
            expect(loginItemTOTP.content).toEqual({
                username: 'john@wick.com',
                password: 'password',
                urls: ['http://localhost:7777'],
                totpUri: 'otpauth://totp/Login%20with%20TOTP?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
            });
            expect(loginItemTOTP.extraFields).toEqual([
                {
                    fieldName: 'totp',
                    content: {
                        oneofKind: 'totp',
                        totp: {
                            totpUri:
                                'otpauth://totp/Login%20with%20TOTP?secret=BASE32SECRET3232&algorithm=SHA1&digits=6&period=30',
                        },
                    },
                },
            ]);

            /* Login item created from password item */
            const passwordItem = main.items[1] as ItemImportIntent<'login'>;

            expect(passwordItem.type).toEqual('login');
            expect(passwordItem.createTime).toEqual(1655535022);
            expect(passwordItem.modifyTime).toEqual(1655535034);
            expect(passwordItem.metadata.name).toEqual('Password');
            expect(passwordItem.content).toEqual({
                username: '',
                password: 'f@LGRHG7BEcByVy--xTV8X4U',
                urls: [],
                totpUri: '',
            });
            expect(passwordItem.extraFields).toEqual([]);

            /* Note item */
            const noteItem = main.items[2] as ItemImportIntent<'login'>;

            expect(noteItem.type).toEqual('note');
            expect(noteItem.createTime).toEqual(1619085236);
            expect(noteItem.modifyTime).toEqual(1619085236);
            expect(noteItem.metadata.name).toEqual('🎉 Welcome to 1Password!');
            expect(noteItem.metadata.note).toEqual(
                'Follow these steps to get started.\n1️⃣ Get the apps\nhttps://1password.com/downloads\n2️⃣ Get 1Password in your browser\nhttps://1password.com/downloads/#browsers\n4️⃣ Fill passwords and more\nhttps://support.1password.com/explore/extension/\n📚 Learn 1Password\nWatch videos\nhttps://youtube.com/1PasswordVideos\nGet support\nhttps://support.1password.com/\nRead the blog\nhttps://blog.1password.com/\nContact us\nhttps://support.1password.com/contact-us/'
            );
            expect(noteItem.content).toEqual({});

            /* Login item created from password item */
            const autofillItem = main.items[3] as ItemImportIntent<'login'>;

            expect(autofillItem.type).toEqual('login');
            expect(autofillItem.createTime).toEqual(1675771315);
            expect(autofillItem.modifyTime).toEqual(1675771315);
            expect(autofillItem.metadata.name).toEqual('Autofill Sample');
            expect(autofillItem.content).toEqual({
                username: 'username test',
                password: 'password test',
                urls: [],
                totpUri: '',
            });
            expect(autofillItem.extraFields).toEqual([]);

            /* Login item with special chars */
            const specialCharItem = main.items[4] as ItemImportIntent<'login'>;

            expect(specialCharItem.type).toEqual('login');
            expect(specialCharItem.createTime).toEqual(1619085696);
            expect(specialCharItem.modifyTime).toEqual(1671040547);
            expect(specialCharItem.metadata.name).toEqual('Credential with " in the name');
            expect(specialCharItem.metadata.note).toEqual('Item notes');
            expect(specialCharItem.content).toEqual({
                username: 'somewhere',
                password: 'somepassword with " in it',
                urls: ['https://slashdot.org'],
                totpUri: '',
            });
            expect(specialCharItem.extraFields).toEqual([]);
        }

        /* Secondary vault */
        {
            expect(secondary.type).toEqual('new');
            expect(secondary.type === 'new' && secondary.vaultName).toEqual('SecondaryVault');

            const item = secondary.items[0] as ItemImportIntent<'login'>;
            expect(item.type).toEqual('login');
            expect(item.createTime).toEqual(1675777494);
            expect(item.modifyTime).toEqual(1675777506);
            expect(item.metadata.name).toEqual('Login item');
            expect(item.metadata.note).toEqual('');
            expect(item.content).toEqual({
                username: 'username',
                password: 'password',
                urls: [],
                totpUri: '',
            });
            expect(item.extraFields).toEqual([]);
        }

        /* Shared vault */
        {
            expect(shared.type).toEqual('new');
            expect(shared.type === 'new' && shared.vaultName).toEqual('Shared');
            expect(shared.items.length).toEqual(0);
        }
    });
});
