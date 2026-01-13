import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readRoboformData } from './roboform.reader';

describe('Import Roboform csv', () => {
    let payload: ImportPayload;
    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/roboform.csv');
        const file = new File([sourceData], 'roboform.csv');
        payload = await readRoboformData(file);
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(readRoboformData(new File([], 'corrupted'))).rejects.toThrow();
    });

    it('converts Roboform folders to vaults correctly', () => {
        const [primary, secondary] = payload.vaults;
        expect(payload.vaults.length).toEqual(2);
        expect(primary.name).toEqual('company services');
        expect(secondary.name).toEqual('Import - Apr 27, 2023');
    });

    it('parses primary vault items correctly', async () => {
        const [primary] = payload.vaults;
        expect(primary.items.length).toEqual(5);
        /* Login */
        const loginItem2 = deobfuscateItem(primary.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('admin');
        expect(loginItem2.content.password).toEqual("'@proton123");
        expect(loginItem2.content.urls[0]).toEqual('https://proton.me/');

        /* Bookmark - broken url */
        const loginItem3 = deobfuscateItem(primary.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Bookmark');
        expect(loginItem3.metadata.note).toEqual('');
        expect(loginItem3.content.itemEmail).toEqual('');
        expect(loginItem3.content.itemUsername).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.urls).toEqual([]);

        /* Bookmark - valid */
        const loginItem4 = deobfuscateItem(primary.items[2]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('Bookmark - valid');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.itemEmail).toEqual('');
        expect(loginItem4.content.itemUsername).toEqual('');
        expect(loginItem4.content.password).toEqual('');
        expect(loginItem4.content.urls).toEqual(['https://example.com/']);

        /* Login broken URL */
        const loginItem5 = deobfuscateItem(primary.items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Fb');
        expect(loginItem5.metadata.note).toEqual('Facebook note\n');
        expect(loginItem5.content.itemEmail).toEqual('');
        expect(loginItem5.content.itemUsername).toEqual('nobody');
        expect(loginItem5.content.password).toEqual('@proton123');
        expect(loginItem5.content.urls).toEqual(['https://fb.com/login']);
    });

    it('parses secondary vault items correctly', () => {
        const [, secondary] = payload.vaults;
        expect(secondary.items.length).toEqual(9);

        /* Login */
        const loginItem1 = deobfuscateItem(secondary.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Example');
        expect(loginItem1.metadata.note).toEqual('cool note');
        expect(loginItem1.content.itemEmail).toEqual('');
        expect(loginItem1.content.itemUsername).toEqual('example');
        expect(loginItem1.content.password).toEqual('some@password');
        expect(loginItem1.content.urls[0]).toEqual('http://example.com/');
        expect(loginItem1.content.totpUri).toEqual(
            'otpauth://totp/Example:none?issuer=Example&secret=FDKJJKDSF&algorithm=SHA1&digits=6&period=30'
        );

        /* Note */
        const noteItem1 = deobfuscateItem(secondary.items[6]) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');
    });
});
