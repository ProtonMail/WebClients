import fs from 'fs';

import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readKeePassData } from './keepass.reader';

describe('Import KeePass xml', () => {
    let sourceData: string;
    let payload: ImportPayload;

    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/keepass.xml', 'utf8');
        payload = readKeePassData({ data: sourceData, importUsername: true });
    });

    afterAll(() => dateMock.mockRestore());

    it('should throw on corrupted files', async () => {
        expect(() => readKeePassData({ data: 'not-an-xml-file', importUsername: true })).toThrow();
    });

    it('should extract vaults from groups', () => {
        expect(payload.vaults.length).toEqual(5);

        expect(payload.vaults[0].name).toEqual('Group A');
        expect(payload.vaults[1].name).toEqual('Group B');
        expect(payload.vaults[2].name).toEqual('Group C');
        expect(payload.vaults[3].name).toEqual('Import - 27 Apr 2023');
        expect(payload.vaults[4].name).toEqual('TOTP definitions');
    });

    it('should extract items from `Group A`', () => {
        const groupA = payload.vaults[0];
        expect(groupA.items.length).toEqual(1);

        const loginItem = deobfuscateItem(groupA.items[0]) as unknown as ItemImportIntent<'login'>;

        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Login item with note');
        expect(loginItem.metadata.note).toEqual('Login item');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('nobodyA@proton.me');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('proton123');
        expect(loginItem.content.urls).toEqual(['https://account.proton.me/']);
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
        const groupB = payload.vaults[1];
        expect(groupB.items.length).toEqual(1);

        const loginItem = deobfuscateItem(groupB.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Broken URL');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('');
        expect(loginItem.content.urls).toEqual([]);
        expect(loginItem.content.totpUri).toEqual('');
        expect(loginItem.extraFields).toEqual([]);
        expect(loginItem.platformSpecific).toBeUndefined();
        expect(loginItem.trashed).toEqual(false);
    });

    it('should extract items from `Group C and not trim spaces`', () => {
        const groupC = payload.vaults[2];
        expect(groupC.items.length).toEqual(1);

        const loginItem = deobfuscateItem(groupC.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem.type).toEqual('login');
        expect(loginItem.metadata.name).toEqual('Login item');
        expect(loginItem.metadata.note).toEqual('');
        expect(loginItem.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem.content.itemUsername).toEqual('');
        expect(loginItem.content.password).toEqual('a bbbb c ');
        expect(loginItem.content.urls).toEqual([]);
        expect(loginItem.content.totpUri).toEqual('');
        expect(loginItem.extraFields).toEqual([]);
        expect(loginItem.platformSpecific).toBeUndefined();
        expect(loginItem.trashed).toEqual(false);
    });

    it('should extract items from `Group D`', () => {
        const groupD = payload.vaults[3];
        expect(groupD.items.length).toEqual(2);

        const loginItem1 = deobfuscateItem(groupD.items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.name).toEqual('Login item');
        expect(loginItem1.metadata.note).toEqual('some note');
        expect(loginItem1.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem1.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem1.content.itemUsername).toEqual('');
        expect(loginItem1.content.password).toEqual('proton123');
        expect(loginItem1.content.urls).toEqual(['https://account.proton.me/']);
        expect(loginItem1.content.totpUri).toEqual('');
        expect(loginItem1.extraFields).toEqual([]);
        expect(loginItem1.platformSpecific).toBeUndefined();
        expect(loginItem1.trashed).toEqual(false);

        const loginItem2 = deobfuscateItem(groupD.items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2.type).toEqual('login');
        expect(loginItem2.metadata.name).toEqual('Broken URL');
        expect(loginItem2.metadata.note).toEqual('');
        expect(loginItem2.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2.content.itemEmail).toEqual('nobody@proton.me');
        expect(loginItem2.content.itemUsername).toEqual('');
        expect(loginItem2.content.password).toEqual('proton123');
        expect(loginItem2.content.urls).toEqual([]);
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
        let group: ImportVault;

        beforeAll(async () => {
            group = payload.vaults[4];
        });

        it('should have 2 items in group', () => {
            expect(group.items.length).toEqual(2);
        });

        it('should extract modern TOTP definition', () => {
            const item = deobfuscateItem(group.items[0]) as unknown as ItemImportIntent<'login'>;
            expect(item.metadata.name).toEqual('Modern TOTP definition');
            expect(item.content.totpUri).toEqual(
                'otpauth://totp/Modern%20TOTP%20definition:none?issuer=Modern%20TOTP%20definition&secret=5KO67YMS2FHKA627&algorithm=SHA1&digits=8&period=42'
            );
        });

        it('should extract legacy TOTP definition', () => {
            const item = deobfuscateItem(group.items[1]) as unknown as ItemImportIntent<'login'>;
            expect(item.metadata.name).toEqual('Legacy TOTP definition');
            expect(item.content.totpUri).toEqual(
                'otpauth://totp/Legacy%20TOTP%20definition:none?issuer=Legacy%20TOTP%20definition&secret=AU2HMGCJYPNI2WZT&algorithm=SHA1&digits=8&period=42'
            );
        });
    });
});
