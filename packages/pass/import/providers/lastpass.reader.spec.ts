import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import { readLastPassData } from './lastpass.reader';

describe('Import LastPass csv', () => {
    let sourceData: string;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/lastpass.csv', 'utf8');
    });

    it('should handle corrupted files', async () => {
        await expect(readLastPassData('not-a-csv-file')).rejects.toThrow();
    });

    it('transforms lastpass csv into ImportPayload', async () => {
        const payload = await readLastPassData(sourceData);
        const [vault1, vault2] = payload;

        expect(payload.length).toEqual(2);
        expect(vault1.type).toEqual('new');
        expect(vault1.type === 'new' && vault1.vaultName).toEqual('LastPass import');

        expect(vault2.type).toEqual('new');
        expect(vault2.type === 'new' && vault2.vaultName).toEqual('company services');

        /* Login */
        const loginItem1 = vault1.items[0] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('nobody');
        expect(loginItem1.metadata.note).toEqual('Secure note');
        expect(loginItem1.content.username).toEqual('nobody@proton.me');
        expect(loginItem1.content.password).toEqual('proton123');
        expect(loginItem1.content.urls[0]).toEqual('https://account.proton.me');

        /* Note */
        const noteItem1 = vault1.items[1] as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');

        /* Login */
        const loginItem2 = vault2.items[0] as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.username).toEqual('admin');
        expect(loginItem2.content.password).toEqual('proton123');
        expect(loginItem2.content.urls[0]).toEqual('https://proton.me');

        /* Login */
        const loginItem3 = vault2.items[1] as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Twitter');
        expect(loginItem3.metadata.note).toEqual('This is a twitter note');
        expect(loginItem3.content.username).toEqual('@nobody');
        expect(loginItem3.content.password).toEqual('proton123');
        expect(loginItem3.content.urls[0]).toEqual('https://twitter.com');
        expect(loginItem3.content.totpUri).toEqual(
            'otpauth://totp/Twitter?secret=BASE32SECREQ&algorithm=SHA1&digits=6&period=30'
        );

        /* Login */
        const loginItem4 = vault2.items[2] as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('fb.com');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.username).toEqual('@nobody');
        expect(loginItem4.content.password).toEqual('proton123');
        expect(loginItem4.content.urls[0]).toEqual('https://fb.com');
        expect(loginItem4.content.totpUri).toEqual(
            'otpauth://totp/fb.com?secret=BASE32SECREQ&algorithm=SHA1&digits=6&period=30'
        );

        /* Login broken url */
        const loginItem5 = vault2.items[3] as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Unnamed LastPass item');
        expect(loginItem5.metadata.note).toEqual('');
        expect(loginItem5.content.username).toEqual('');
        expect(loginItem5.content.password).toEqual('');
        expect(loginItem5.content.urls).toEqual([]);
    });
});
