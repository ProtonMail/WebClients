import fs from 'fs';

import type { ImportPayload } from '@proton/pass/lib/import/types';
import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { ItemImportIntent } from '@proton/pass/types';
import * as epochUtils from '@proton/pass/utils/time/epoch';

import { readKeeperData } from './keeper.reader';

describe('Import Keeper CSV', () => {
    let payload: ImportPayload;
    const dateMock = jest.spyOn(epochUtils, 'getEpoch').mockImplementation(() => 1682585156);

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/keeper.csv', 'utf8');
        payload = await readKeeperData({ data: sourceData });
    });

    afterAll(() => dateMock.mockRestore());

    it('should handle corrupted files', async () => {
        await expect(readKeeperData({ data: '' })).rejects.toThrow();
    });

    it('converts Keeper folders to vaults correctly', () => {
        expect(payload.vaults.length).toEqual(3);

        expect(payload.vaults[0].name).toEqual('Import - 27 Apr 2023');
        expect(payload.vaults[1].name).toEqual('folder1');
        expect(payload.vaults[2].name).toEqual('subfolder1');
    });

    it('should correctly parse items from 1st vault', () => {
        const firstVault = payload.vaults[0];
        expect(firstVault.items.length).toEqual(9);
        const { items } = firstVault;

        /* login with 2FA */
        const loginItem2FA = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItem2FA.type).toEqual('login');
        expect(loginItem2FA.createTime).toBeUndefined();
        expect(loginItem2FA.modifyTime).toBeUndefined();
        expect(loginItem2FA.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2FA.metadata.name).toEqual('login with 2fa');
        expect(loginItem2FA.metadata.note).toEqual('');
        expect(loginItem2FA.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri:
                'otpauth://totp/account.proton.me:2fa-manually-entered-string%40example.com?issuer=account.proton.me&secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30',
            urls: ['https://example.com/'],
            itemEmail: '2fa@example.com',
            itemUsername: '',
        });
        expect(loginItem2FA.trashed).toEqual(false);
        expect(loginItem2FA.extraFields).toEqual([]);

        /* login with broken url */
        const loginItemBrokenUrl = deobfuscateItem(items[1]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemBrokenUrl.type).toEqual('login');
        expect(loginItemBrokenUrl.createTime).toBeUndefined();
        expect(loginItemBrokenUrl.modifyTime).toBeUndefined();
        expect(loginItemBrokenUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokenUrl.metadata.name).toEqual('login with broken url');
        expect(loginItemBrokenUrl.metadata.note).toEqual('');
        expect(loginItemBrokenUrl.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemBrokenUrl.trashed).toEqual(false);
        expect(loginItemBrokenUrl.extraFields).toEqual([]);

        /* login with comma, quotes */
        const loginItemCommaQuotes = deobfuscateItem(items[2]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemCommaQuotes.type).toEqual('login');
        expect(loginItemCommaQuotes.createTime).toBeUndefined();
        expect(loginItemCommaQuotes.modifyTime).toBeUndefined();
        expect(loginItemCommaQuotes.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuotes.metadata.name).toEqual('login with comma, quotes "');
        expect(loginItemCommaQuotes.metadata.note).toEqual('notes with commas, quotes "');
        expect(loginItemCommaQuotes.content).toEqual({
            passkeys: [],
            password: 'password with comma, quotes "',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'username with comma, quotes "',
        });
        expect(loginItemCommaQuotes.trashed).toEqual(false);
        expect(loginItemCommaQuotes.extraFields).toEqual([]);

        /* login with custom fields */
        const loginItemCustomFields = deobfuscateItem(items[3]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemCustomFields.type).toEqual('login');
        expect(loginItemCustomFields.createTime).toBeUndefined();
        expect(loginItemCustomFields.modifyTime).toBeUndefined();
        expect(loginItemCustomFields.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCustomFields.metadata.name).toEqual('login with custom fields');
        expect(loginItemCustomFields.metadata.note).toEqual('');
        expect(loginItemCustomFields.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemCustomFields.trashed).toEqual(false);
        expect(loginItemCustomFields.extraFields).toEqual([
            {
                fieldName: 'Hidden Field',
                type: 'hidden',
                data: {
                    content: 'this is custom field: hidden',
                },
            },
            {
                fieldName: 'Security Question & Answer',
                type: 'text',
                data: {
                    content: 'this is custom field: security question? this is custom field: security answer',
                },
            },
            {
                fieldName: 'Website Address',
                type: 'text',
                data: {
                    content: 'https://this-is-custom-field-url.example.com',
                },
            },
            {
                fieldName: 'Phone',
                type: 'text',
                data: {
                    content: 'Mobile US (+1) (555) 555-5555 Ex',
                },
            },
            {
                fieldName: 'Hidden Field with edited label',
                type: 'text',
                data: {
                    content: 'this is custom field: hidden with edited label',
                },
            },
        ]);

        /* login with multiple lines */
        const loginItemMultipleLines = deobfuscateItem(items[4]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemMultipleLines.type).toEqual('login');
        expect(loginItemMultipleLines.createTime).toBeUndefined();
        expect(loginItemMultipleLines.modifyTime).toBeUndefined();
        expect(loginItemMultipleLines.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleLines.metadata.name).toEqual('login with multiple lines');
        expect(loginItemMultipleLines.metadata.note).toEqual('notes with\nmultiple\nlines');
        expect(loginItemMultipleLines.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemMultipleLines.trashed).toEqual(false);
        expect(loginItemMultipleLines.extraFields).toEqual([]);

        /* login with multiple urls */
        const loginItemMultipleUrls = deobfuscateItem(items[5]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemMultipleUrls.type).toEqual('login');
        expect(loginItemMultipleUrls.createTime).toBeUndefined();
        expect(loginItemMultipleUrls.modifyTime).toBeUndefined();
        expect(loginItemMultipleUrls.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleUrls.metadata.name).toEqual('login with multiple urls');
        expect(loginItemMultipleUrls.metadata.note).toEqual('');
        expect(loginItemMultipleUrls.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: '',
        });
        expect(loginItemMultipleUrls.trashed).toEqual(false);
        expect(loginItemMultipleUrls.extraFields).toEqual([
            {
                fieldName: 'Website Address',
                type: 'text',
                data: {
                    content: 'https://second.example.com',
                },
            },
            {
                fieldName: 'Website Address with edited label',
                type: 'text',
                data: {
                    content: 'https://edited-label.example.com',
                },
            },
        ]);

        /* login payment card */
        const loginItemPaymentCard = deobfuscateItem(items[6]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemPaymentCard.type).toEqual('login');
        expect(loginItemPaymentCard.createTime).toBeUndefined();
        expect(loginItemPaymentCard.modifyTime).toBeUndefined();
        expect(loginItemPaymentCard.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemPaymentCard.metadata.name).toEqual('paymentcard');
        expect(loginItemPaymentCard.metadata.note).toEqual('foo');
        expect(loginItemPaymentCard.content).toEqual({
            passkeys: [],
            password: 'b5pIs[ISaru7@)44rn,xT',
            totpUri: '',
            urls: ['https://example.com/'],
            itemEmail: '',
            itemUsername: '',
        });
        expect(loginItemPaymentCard.trashed).toEqual(false);
        expect(loginItemPaymentCard.extraFields).toEqual([
            {
                fieldName: 'Bank Account',
                type: 'text',
                data: {
                    content: 'Checking | 980',
                },
            },
            {
                fieldName: 'Hidden Field',
                type: 'hidden',
                data: {
                    content: 'this is custom field: hidden',
                },
            },
        ]);

        /* login secure note */
        const loginItemSecureNote = deobfuscateItem(items[7]) as unknown as ItemImportIntent<'note'>;
        expect(loginItemSecureNote.type).toEqual('note');
        expect(loginItemSecureNote.createTime).toBeUndefined();
        expect(loginItemSecureNote.modifyTime).toBeUndefined();
        expect(loginItemSecureNote.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecureNote.metadata.name).toEqual('secure note item');
        expect(loginItemSecureNote.metadata.note).toEqual('foo');
        expect(loginItemSecureNote.content).toEqual({});
        expect(loginItemSecureNote.trashed).toEqual(false);
        expect(loginItemSecureNote.extraFields).toEqual([]);

        /* login ssh key */
        const loginItemSshKey = deobfuscateItem(items[8]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemSshKey.type).toEqual('login');
        expect(loginItemSshKey.createTime).toBeUndefined();
        expect(loginItemSshKey.modifyTime).toBeUndefined();
        expect(loginItemSshKey.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSshKey.metadata.name).toEqual('ssh key item');
        expect(loginItemSshKey.metadata.note).toEqual('foo');
        expect(loginItemSshKey.content).toEqual({
            passkeys: [],
            password: 'pass',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemSshKey.trashed).toEqual(false);
        expect(loginItemSshKey.extraFields).toEqual([
            {
                fieldName: 'Key Pair',
                type: 'text',
                data: {
                    content: 'privatekey | publickey',
                },
            },
        ]);
    });

    it('should correctly parse items from 2nd vault', () => {
        const secondVault = payload.vaults[1];
        expect(secondVault.items.length).toEqual(1);
        const { items } = secondVault;

        const loginItemSecondVault = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemSecondVault.type).toEqual('login');
        expect(loginItemSecondVault.createTime).toBeUndefined();
        expect(loginItemSecondVault.modifyTime).toBeUndefined();
        expect(loginItemSecondVault.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecondVault.metadata.name).toEqual('login of folder1');
        expect(loginItemSecondVault.metadata.note).toEqual('');
        expect(loginItemSecondVault.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemSecondVault.trashed).toEqual(false);
        expect(loginItemSecondVault.extraFields).toEqual([]);
    });

    it('should correctly parse items from 3rd vault', () => {
        const thirdVault = payload.vaults[2];
        expect(thirdVault.items.length).toEqual(1);
        const { items } = thirdVault;

        const loginItemSecondVault = deobfuscateItem(items[0]) as unknown as ItemImportIntent<'login'>;
        expect(loginItemSecondVault.type).toEqual('login');
        expect(loginItemSecondVault.createTime).toBeUndefined();
        expect(loginItemSecondVault.modifyTime).toBeUndefined();
        expect(loginItemSecondVault.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecondVault.metadata.name).toEqual('login of subfolder1');
        expect(loginItemSecondVault.metadata.note).toEqual('');
        expect(loginItemSecondVault.content).toEqual({
            passkeys: [],
            password: '',
            totpUri: '',
            urls: [],
            itemEmail: '',
            itemUsername: 'john',
        });
        expect(loginItemSecondVault.trashed).toEqual(false);
        expect(loginItemSecondVault.extraFields).toEqual([]);
    });

    test('should correctly hydrate ignored arrays', () => {
        expect(payload.ignored.length).toEqual(4);
        expect(payload.ignored[0]).toEqual('[Other] address item');
        expect(payload.ignored[1]).toEqual('[Other] contact item');
        expect(payload.ignored[2]).toEqual('[Other] file attachment item');
        expect(payload.ignored[3]).toEqual('[Other] general item');
    });
});
