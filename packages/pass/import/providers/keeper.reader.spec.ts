import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readKeeperData } from './keeper.reader';

jest.mock('@proton/pass/utils/time/get-epoch', () => ({
    getEpoch: jest.fn(() => 1682585156),
}));

describe('Import Keeper CSV', () => {
    let payload: ImportPayload;

    beforeAll(async () => {
        const sourceData = await fs.promises.readFile(__dirname + '/mocks/keeper.csv', 'utf8');
        payload = await readKeeperData(sourceData);
    });

    it('should handle corrupted files', async () => {
        await expect(readKeeperData('')).rejects.toThrow();
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
        const loginItem2FA = items[0] as ItemImportIntent<'login'>;
        expect(loginItem2FA.type).toEqual('login');
        expect(loginItem2FA.createTime).toBeUndefined();
        expect(loginItem2FA.modifyTime).toBeUndefined();
        expect(loginItem2FA.metadata.itemUuid).not.toBeUndefined();
        expect(loginItem2FA.metadata.name).toEqual('login with 2fa');
        expect(loginItem2FA.metadata.note).toEqual('');
        expect(loginItem2FA.content).toEqual({
            username: '2fa@example.com',
            password: 'pass',
            urls: ['https://example.com/'],
            totpUri:
                'otpauth://totp/account.proton.me:2fa-manually-entered-string%40example.com?issuer=account.proton.me&secret=RL3FRZ5V3EBM7T4ZMGJWGO43MQSTTMIT&algorithm=SHA1&digits=6&period=30',
        });
        expect(loginItem2FA.trashed).toEqual(false);
        expect(loginItem2FA.extraFields).toEqual([]);

        /* login with broken url */
        const loginItemBrokenUrl = items[1] as ItemImportIntent<'login'>;
        expect(loginItemBrokenUrl.type).toEqual('login');
        expect(loginItemBrokenUrl.createTime).toBeUndefined();
        expect(loginItemBrokenUrl.modifyTime).toBeUndefined();
        expect(loginItemBrokenUrl.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemBrokenUrl.metadata.name).toEqual('login with broken url');
        expect(loginItemBrokenUrl.metadata.note).toEqual('');
        expect(loginItemBrokenUrl.content).toEqual({
            username: 'john',
            password: 'pass',
            urls: [],
            totpUri: '',
        });
        expect(loginItemBrokenUrl.trashed).toEqual(false);
        expect(loginItemBrokenUrl.extraFields).toEqual([]);

        /* login with comma, quotes */
        const loginItemCommaQuotes = items[2] as ItemImportIntent<'login'>;
        expect(loginItemCommaQuotes.type).toEqual('login');
        expect(loginItemCommaQuotes.createTime).toBeUndefined();
        expect(loginItemCommaQuotes.modifyTime).toBeUndefined();
        expect(loginItemCommaQuotes.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCommaQuotes.metadata.name).toEqual('login with comma, quotes "');
        expect(loginItemCommaQuotes.metadata.note).toEqual('notes with commas, quotes "');
        expect(loginItemCommaQuotes.content).toEqual({
            username: 'username with comma, quotes "',
            password: 'password with comma, quotes "',
            urls: ['https://example.com/'],
            totpUri: '',
        });
        expect(loginItemCommaQuotes.trashed).toEqual(false);
        expect(loginItemCommaQuotes.extraFields).toEqual([]);

        /* login with custom fields */
        const loginItemCustomFields = items[3] as ItemImportIntent<'login'>;
        expect(loginItemCustomFields.type).toEqual('login');
        expect(loginItemCustomFields.createTime).toBeUndefined();
        expect(loginItemCustomFields.modifyTime).toBeUndefined();
        expect(loginItemCustomFields.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemCustomFields.metadata.name).toEqual('login with custom fields');
        expect(loginItemCustomFields.metadata.note).toEqual('');
        expect(loginItemCustomFields.content).toEqual({
            username: 'john',
            password: 'pass',
            urls: ['https://example.com/'],
            totpUri: '',
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
        const loginItemMultipleLines = items[4] as ItemImportIntent<'login'>;
        expect(loginItemMultipleLines.type).toEqual('login');
        expect(loginItemMultipleLines.createTime).toBeUndefined();
        expect(loginItemMultipleLines.modifyTime).toBeUndefined();
        expect(loginItemMultipleLines.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleLines.metadata.name).toEqual('login with multiple lines');
        expect(loginItemMultipleLines.metadata.note).toEqual('notes with\nmultiple\nlines');
        expect(loginItemMultipleLines.content).toEqual({
            username: 'john',
            password: 'pass',
            urls: ['https://example.com/'],
            totpUri: '',
        });
        expect(loginItemMultipleLines.trashed).toEqual(false);
        expect(loginItemMultipleLines.extraFields).toEqual([]);

        /* login with multiple urls */
        const loginItemMultipleUrls = items[5] as ItemImportIntent<'login'>;
        expect(loginItemMultipleUrls.type).toEqual('login');
        expect(loginItemMultipleUrls.createTime).toBeUndefined();
        expect(loginItemMultipleUrls.modifyTime).toBeUndefined();
        expect(loginItemMultipleUrls.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemMultipleUrls.metadata.name).toEqual('login with multiple urls');
        expect(loginItemMultipleUrls.metadata.note).toEqual('');
        expect(loginItemMultipleUrls.content).toEqual({
            username: '',
            password: '',
            urls: ['https://example.com/'],
            totpUri: '',
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
        const loginItemPaymentCard = items[6] as ItemImportIntent<'login'>;
        expect(loginItemPaymentCard.type).toEqual('login');
        expect(loginItemPaymentCard.createTime).toBeUndefined();
        expect(loginItemPaymentCard.modifyTime).toBeUndefined();
        expect(loginItemPaymentCard.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemPaymentCard.metadata.name).toEqual('paymentcard');
        expect(loginItemPaymentCard.metadata.note).toEqual('foo');
        expect(loginItemPaymentCard.content).toEqual({
            username: '',
            password: 'b5pIs[ISaru7@)44rn,xT',
            urls: ['https://example.com/'],
            totpUri: '',
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
        const loginItemSecureNote = items[7] as ItemImportIntent<'note'>;
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
        const loginItemSshKey = items[8] as ItemImportIntent<'login'>;
        expect(loginItemSshKey.type).toEqual('login');
        expect(loginItemSshKey.createTime).toBeUndefined();
        expect(loginItemSshKey.modifyTime).toBeUndefined();
        expect(loginItemSshKey.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSshKey.metadata.name).toEqual('ssh key item');
        expect(loginItemSshKey.metadata.note).toEqual('foo');
        expect(loginItemSshKey.content).toEqual({
            username: 'john',
            password: 'pass',
            urls: [],
            totpUri: '',
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

        const loginItemSecondVault = items[0] as ItemImportIntent<'login'>;
        expect(loginItemSecondVault.type).toEqual('login');
        expect(loginItemSecondVault.createTime).toBeUndefined();
        expect(loginItemSecondVault.modifyTime).toBeUndefined();
        expect(loginItemSecondVault.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecondVault.metadata.name).toEqual('login of folder1');
        expect(loginItemSecondVault.metadata.note).toEqual('');
        expect(loginItemSecondVault.content).toEqual({
            username: 'john',
            password: '',
            urls: [],
            totpUri: '',
        });
        expect(loginItemSecondVault.trashed).toEqual(false);
        expect(loginItemSecondVault.extraFields).toEqual([]);
    });

    it('should correctly parse items from 3rd vault', () => {
        const thirdVault = payload.vaults[2];
        expect(thirdVault.items.length).toEqual(1);
        const { items } = thirdVault;

        const loginItemSecondVault = items[0] as ItemImportIntent<'login'>;
        expect(loginItemSecondVault.type).toEqual('login');
        expect(loginItemSecondVault.createTime).toBeUndefined();
        expect(loginItemSecondVault.modifyTime).toBeUndefined();
        expect(loginItemSecondVault.metadata.itemUuid).not.toBeUndefined();
        expect(loginItemSecondVault.metadata.name).toEqual('login of subfolder1');
        expect(loginItemSecondVault.metadata.note).toEqual('');
        expect(loginItemSecondVault.content).toEqual({
            username: 'john',
            password: '',
            urls: [],
            totpUri: '',
        });
        expect(loginItemSecondVault.trashed).toEqual(false);
        expect(loginItemSecondVault.extraFields).toEqual([]);
    });

    test('should correctly hydrate ignored arrays', () => {
        expect(payload.ignored.length).toEqual(4);
        expect(payload.ignored[0]).toEqual('[Unsupported] address item');
        expect(payload.ignored[1]).toEqual('[Unsupported] contact item');
        expect(payload.ignored[2]).toEqual('[Unsupported] file attachment item');
        expect(payload.ignored[3]).toEqual('[Unsupported] general item');
    });
});
