import fs from 'fs';

import type { ItemImportIntent, Maybe, MaybeNull } from '../../../../types';
import { AutofillMode } from '../../../../types/protobuf';
import * as epochUtils from '../../../../utils/time/epoch';
import { deobfuscateItem } from '../../../items/item.obfuscation';
import type { ImportPayload, ImportVault } from '../../types';
import { readKeePassData } from './keepass.reader';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

describe('Import KeePass xml', () => {
    let payload: ImportPayload;
    let vault: ImportVault;

    const dateMock = jest.mocked(epochUtils.getEpoch).mockImplementation(() => 1682585156);

    beforeAll(async () => {
        const sourceData = fs.readFileSync(__dirname + '/mocks/keepass.xml');
        const file = new File([sourceData], 'keepass.xml');
        payload = await readKeePassData(file);
        [vault] = payload.vaults;
    });

    const getFolderPath = (folderId: MaybeNull<string>): string[] => {
        const folder = vault.folders.find(({ id }) => id === folderId);
        if (!folder) return [];
        return [...getFolderPath(folder.parentId), folder.name];
    };

    const getFolderName = (folderId: Maybe<MaybeNull<string>>) =>
        vault.folders.find(({ id }) => id === folderId)?.name ?? null;

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        await expect(() => readKeePassData(new File([' '], 'corrupted'))).rejects.toThrow();
    });

    it('should import into a single vault named after the root group', () => {
        expect(payload.vaults.length).toEqual(1);
        expect(vault.name).toEqual('Group A');
        expect(vault.items.length).toEqual(11);
    });

    it('should rebuild the folder hierarchy', () => {
        expect(vault.folders.map(({ id }) => getFolderPath(id))).toEqual([
            ['Group B'],
            ['Group C'],
            ['TOTP definitions'],
            ['folder1'],
            ['folder1', 'subfolder1'],
        ]);
    });

    it('should place each item in its folder', () => {
        const foldered = vault.items.filter(({ folderId }) => folderId !== null);

        expect(foldered.map(({ metadata, folderId }) => [metadata.name, getFolderName(folderId)])).toEqual([
            ['Broken URL', 'Group B'],
            ['Login item', 'Group C'],
            ['Login item', 'Group C'],
            ['Broken URL', 'Group C'],
            ['Modern TOTP definition', 'TOTP definitions'],
            ['Legacy TOTP definition', 'TOTP definitions'],
            ['folder1 item', 'folder1'],
            ['subfolder1 item', 'subfolder1'],
        ]);
    });

    it('should place entries of a group without name in its parent folder', () => {
        expect(getFolderName(vault.items[3].folderId)).toEqual('Group C');
        expect(getFolderName(vault.items[4].folderId)).toEqual('Group C');
    });

    it('should leave items without a folder at the vault root', () => {
        const rootItems = vault.items.filter(({ folderId }) => folderId === null);
        expect(rootItems.map(({ metadata }) => metadata.name)).toEqual([
            'Login item with note',
            'trashed item',
            'trashed item 2.0',
        ]);
    });

    it('should import recycle bin entries as trashed items at the vault root', () => {
        const trashed = vault.items.filter((item) => item.trashed);
        expect(trashed.map(({ metadata, folderId }) => [metadata.name, folderId])).toEqual([
            ['trashed item', null],
            ['trashed item 2.0', null],
        ]);
    });

    it('should extract items from `Group A`', () => {
        const loginItem = deobfuscateItem(vault.items[0]) as unknown as ItemImportIntent<'login'>;

        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Login item with note');
        expect(loginItem.metadata.note).toEqual('Login item');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('nobodyA@proton.me');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('proton123');
        expect(loginItem.content.autofillUrls).toEqual([
            { url: 'https://account.proton.me/', mode: AutofillMode.Default },
        ]);
        expect(loginItem.content.totpUri).toEqual(
            'otpauth://totp/Entry%20A:nobodyA%40proton.me?issuer=Entry%20A&secret=VZKDI2A4UP2NG5BB&algorithm=SHA1&digits=6&period=30'
        );
        expect(loginItem.extraFields).toEqual([
            {
                fieldName: 'Hidden 1',
                type: 'hidden',
                data: {
                    content: 'Hidden 1 content',
                },
            },
            {
                fieldName: 'Text 1',
                type: 'text',
                data: {
                    content: 'Text 1 content',
                },
            },
            {
                fieldName: 'TimeOtp-Secret-Base32',
                type: 'text',
                data: {
                    content: 'VZKDI2A4UP2NG5BB',
                },
            },
        ]);
        expect(loginItem.platformSpecific).toBeUndefined();
        expect(loginItem.trashed).toEqual(false);
    });

    it('should extract items from `Group B`', () => {
        const loginItem = deobfuscateItem(vault.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Broken URL');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('');
        expect(loginItem.content.autofillUrls).toEqual([]);
        expect(loginItem.content.totpUri).toEqual('');
        expect(loginItem.extraFields).toEqual([]);
        expect(loginItem.platformSpecific).toBeUndefined();
        expect(loginItem.trashed).toEqual(false);
    });

    it('should extract items from `Group C and not trim spaces`', () => {
        const loginItem = deobfuscateItem(vault.items[2]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Login item');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('a bbbb c ');
        expect(loginItem.content.autofillUrls).toEqual([]);
        expect(loginItem.content.totpUri).toEqual('');
        expect(loginItem.extraFields).toEqual([]);
        expect(loginItem.platformSpecific).toBeUndefined();
        expect(loginItem.trashed).toEqual(false);
    });

    it('should extract items from `Group D`', () => {
        const loginItem1 = deobfuscateItem(vault.items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Login item');
        expect(loginItem1.metadata.note).toEqual('some note');
        expect(loginItem1.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem1.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem1.content.itemUsername).toEqual('');
        expect(loginItem1.content.password).toEqual('proton123');
        expect(loginItem1.content.autofillUrls).toEqual([
            { url: 'https://account.proton.me/', mode: AutofillMode.Default },
        ]);
        expect(loginItem1.content.totpUri).toEqual('');
        expect(loginItem1.extraFields).toEqual([]);
        expect(loginItem1.platformSpecific).toBeUndefined();
        expect(loginItem1.trashed).toEqual(false);

        const loginItem2 = deobfuscateItem(vault.items[4]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Broken URL');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem2.content.itemUsername).toEqual('');
        expect(loginItem2.content.password).toEqual('proton123');
        expect(loginItem2.content.autofillUrls).toEqual([]);
        expect(loginItem2.content.totpUri).toEqual('');
        expect(loginItem2.extraFields).toEqual([
            {
                fieldName: 'Custom',
                type: 'hidden',
                data: {
                    content: 'ABCDEF',
                },
            },
        ]);
        expect(loginItem2.platformSpecific).toBeUndefined();
        expect(loginItem2.trashed).toEqual(false);
    });

    describe('TOTP definition', () => {
        it('should have 2 items in group', () => {
            const items = vault.items.filter(({ folderId }) => getFolderName(folderId) === 'TOTP definitions');
            expect(items.length).toEqual(2);
        });

        it('should extract modern TOTP definition', () => {
            const item = deobfuscateItem(vault.items[7]) as unknown as ItemImportIntent<'login'>;
            expect(item.metadata.name).toEqual('Modern TOTP definition');
            expect(item.content.totpUri).toEqual(
                'otpauth://totp/Modern%20TOTP%20definition:none?issuer=Modern%20TOTP%20definition&secret=5KO67YMS2FHKA627&algorithm=SHA1&digits=8&period=42'
            );
        });

        it('should extract legacy TOTP definition', () => {
            const item = deobfuscateItem(vault.items[8]) as unknown as ItemImportIntent<'login'>;
            expect(item.metadata.name).toEqual('Legacy TOTP definition');
            expect(item.content.totpUri).toEqual(
                'otpauth://totp/Legacy%20TOTP%20definition:none?issuer=Legacy%20TOTP%20definition&secret=AU2HMGCJYPNI2WZT&algorithm=SHA1&digits=8&period=42'
            );
        });
    });
});
