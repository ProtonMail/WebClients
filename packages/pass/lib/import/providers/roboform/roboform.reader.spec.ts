import fs from 'fs';

import type { ItemImportIntent } from '../../../../types/data/items.dto';
import { AutofillMode } from '../../../../types/protobuf';
import * as epochUtils from '../../../../utils/time/epoch';
import { deobfuscateItem } from '../../../items/item.obfuscation';
import type { ImportPayload, ImportVault } from '../../types';
import { readRoboformData } from './roboform.reader';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

const getFolderPaths = (vault: ImportVault): Map<string, string> => {
    const paths = new Map<string, string>();

    for (const { id, name, parentId } of vault.folders) {
        const parentPath = parentId ? paths.get(parentId) : undefined;
        paths.set(id, parentPath ? `${parentPath}/${name}` : name);
    }

    return paths;
};

describe('Import Roboform csv', () => {
    let payload: ImportPayload;
    const dateMock = jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/roboform.csv');
        const file = new File([sourceData], 'roboform.csv');
        payload = await readRoboformData(file);
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(readRoboformData(new File([], 'corrupted'))).rejects.toThrow();
    });

    it('should import into a single vault', () => {
        const [vault] = payload.vaults;
        expect(payload.vaults.length).toEqual(1);
        expect(vault.name).toEqual('Import - Apr 27, 2023');
        expect(vault.items.length).toEqual(16);
    });

    it('should rebuild the folder hierarchy', () => {
        const [vault] = payload.vaults;
        expect([...getFolderPaths(vault).values()]).toEqual(['company services', 'folder', 'folder/subfolder']);
    });

    it('should place each item in its folder', () => {
        const [vault] = payload.vaults;
        const paths = getFolderPaths(vault);
        const foldered = vault.items.filter(({ folderId }) => folderId !== null);

        expect(foldered.map(({ metadata, folderId }) => [metadata.name, paths.get(folderId ?? '')])).toEqual([
            ['Admin', 'company services'],
            ['Bookmark', 'company services'],
            ['Bookmark - valid', 'company services'],
            ['Fb', 'company services'],
            ['Twitter', 'company services'],
            ['folder1', 'folder'],
            ['subfolder1', 'folder/subfolder'],
        ]);
    });

    it('should leave items without a folder at the vault root', () => {
        const [vault] = payload.vaults;
        const rootItems = vault.items.filter((item) => item.folderId === null);

        expect(rootItems.map(({ metadata }) => metadata.name)).toEqual([
            'Example',
            'Example - 1',
            'Google',
            'nobody',
            'Nonote',
            'Credit Card Item with note',
            'Secure note',
            'test',
            'TestID',
        ]);
    });

    it('parses folder items correctly', async () => {
        const [vault] = payload.vaults;
        /* Login */
        const loginItem2 = deobfuscateItem(vault.items[9]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Admin');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.content.itemEmail).toEqual('');
        expect(loginItem2.content.itemUsername).toEqual('admin');
        expect(loginItem2.content.password).toEqual("'@proton123");
        expect(loginItem2.content.autofillUrls[0]).toEqual({ url: 'https://proton.me/', mode: AutofillMode.Default });

        /* Bookmark - broken url */
        const loginItem3 = deobfuscateItem(vault.items[10]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem3.type).toEqual('login');
        expect(loginItem3.metadata.name).toEqual('Bookmark');
        expect(loginItem3.metadata.note).toEqual('');
        expect(loginItem3.content.itemEmail).toEqual('');
        expect(loginItem3.content.itemUsername).toEqual('');
        expect(loginItem3.content.password).toEqual('');
        expect(loginItem3.content.autofillUrls).toEqual([]);

        /* Bookmark - valid */
        const loginItem4 = deobfuscateItem(vault.items[11]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem4.type).toEqual('login');
        expect(loginItem4.metadata.name).toEqual('Bookmark - valid');
        expect(loginItem4.metadata.note).toEqual('');
        expect(loginItem4.content.itemEmail).toEqual('');
        expect(loginItem4.content.itemUsername).toEqual('');
        expect(loginItem4.content.password).toEqual('');
        expect(loginItem4.content.autofillUrls).toEqual([{ url: 'https://example.com/', mode: AutofillMode.Default }]);

        /* Login broken URL */
        const loginItem5 = deobfuscateItem(vault.items[12]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem5.type).toEqual('login');
        expect(loginItem5.metadata.name).toEqual('Fb');
        expect(loginItem5.metadata.note).toEqual('Facebook note\n');
        expect(loginItem5.content.itemEmail).toEqual('');
        expect(loginItem5.content.itemUsername).toEqual('nobody');
        expect(loginItem5.content.password).toEqual('@proton123');
        expect(loginItem5.content.autofillUrls).toEqual([{ url: 'https://fb.com/login', mode: AutofillMode.Default }]);
    });

    it('parses root items correctly', () => {
        const [vault] = payload.vaults;

        /* Login */
        const loginItem1 = deobfuscateItem(vault.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Example');
        expect(loginItem1.metadata.note).toEqual('cool note');
        expect(loginItem1.content.itemEmail).toEqual('');
        expect(loginItem1.content.itemUsername).toEqual('example');
        expect(loginItem1.content.password).toEqual('some@password');
        expect(loginItem1.content.autofillUrls[0]).toEqual({ url: 'http://example.com/', mode: AutofillMode.Default });
        expect(loginItem1.content.totpUri).toEqual(
            'otpauth://totp/Example:none?issuer=Example&secret=FDKJJKDSF&algorithm=SHA1&digits=6&period=30'
        );

        /* Note */
        const noteItem1 = deobfuscateItem(vault.items[6]) as unknown as ItemImportIntent<'login'>;
        expect(noteItem1.type).toEqual('note');
        expect(noteItem1.metadata.name).toEqual('Secure note');
        expect(noteItem1.metadata.note).toEqual('This is a secure note');
    });
});
