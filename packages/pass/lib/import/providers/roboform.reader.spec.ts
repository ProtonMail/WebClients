import fs from 'fs';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import type { ImportPayload } from '../types';
import { readRoboformData } from './roboform.reader';

jest.mock('@proton/pass/utils/time/get-epoch', () => ({
    getEpoch: jest.fn(() => 1682585156),
}));

describe('Import Roboform csv', () => {
    let sourceData: string;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/roboform.csv', 'utf8');
        payload = await readRoboformData(sourceData);
    });

    afterAll(() => (getEpoch as jest.Mock).mockClear());

    it('should throw on corrupted files', async () => {
        await expect(readRoboformData('')).rejects.toThrow();
    });

    it('converts Roboform folders to vaults correctly', () => {
        const [primary, secondary] = payload.vaults;
        expect(payload.vaults.length).toEqual(2);
        expect(primary.name).toEqual('Import - 27 Apr 2023');
        expect(secondary.name).toEqual('company services');
    });

    it('parses primary `Roboform import` vault items correctly', () => {
        const [primary] = payload.vaults;
        expect(primary.items.length).toEqual(9);

        /* Login */
        const loginItem1 = deobfuscateItem(primary.items[0] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Example');
        expect(loginItem1.metadata.note).toEqual('cool note');
        expect(loginItem1.content.username).toEqual('example');
        expect(loginItem1.content.password).toEqual('some@password');
        expect(loginItem1.content.urls[0]).toEqual('http://example.com/');
        expect(loginItem1.content.totpUri).toEqual(
            'otpauth://totp/Example:none?issuer=Example&secret=FDKJJKDS&algorithm=SHA1&digits=6&period=30'
        );

        /* Note */
        const noteItem1 = deobfuscateItem(primary.items[6] as any) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');
    });

    it('parses secondary vault items correctly', async () => {
        const [, secondary] = payload.vaults;
        expect(secondary.items.length).toEqual(5);
        /* Login */
        const loginItem2 = deobfuscateItem(secondary.items[0] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.username).toEqual('admin');
        expect(loginItem2.content.password).toEqual("'@proton123");
        expect(loginItem2.content.urls[0]).toEqual('https://proton.me/');

        /* Bookmark - broken url */
        const loginItem3 = deobfuscateItem(secondary.items[1] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Bookmark');
        expect(loginItem3.metadata.note).toEqual('');
        expect(loginItem3.content.username).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.urls).toEqual([]);

        /* Bookmark - valid */
        const loginItem4 = deobfuscateItem(secondary.items[2] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('Bookmark - valid');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.username).toEqual('');
        expect(loginItem4.content.password).toEqual('');
        expect(loginItem4.content.urls).toEqual(['https://example.com/']);

        /* Login broken URL */
        const loginItem5 = deobfuscateItem(secondary.items[3] as any) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Fb');
        expect(loginItem5.metadata.note).toEqual('Facebook note\n');
        expect(loginItem5.content.username).toEqual('nobody');
        expect(loginItem5.content.password).toEqual('@proton123');
        expect(loginItem5.content.urls).toEqual(['https://fb.com/login']);
    });
});
