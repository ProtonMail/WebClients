import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time';

import type { ImportPayload } from '../types';
import { readKeePassData } from './keepass.reader';

jest.mock('@proton/pass/utils/time/get-epoch', () => ({
    getEpoch: jest.fn(() => 1682585156),
}));

describe('Import KeePass xml', () => {
    let sourceData: string;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/keepass.xml', 'utf8');
        payload = readKeePassData(sourceData);
    });

    afterAll(() => (getEpoch as jest.Mock).mockClear());

    it('should throw on corrupted files', async () => {
        expect(() => readKeePassData('not-an-xml-file')).toThrow();
    });

    it('extracts vaults from groups', () => {
        expect(payload.vaults.length).toEqual(4);
        expect(payload.vaults[0].type).toEqual('new');
        expect(payload.vaults[0].vaultName).toEqual('Group A');
        expect(payload.vaults[3].type).toEqual('new');
        expect(payload.vaults[3].vaultName).toEqual('Import (27 Apr 2023)');
    });

    it('extracts items from entries', () => {
        expect(payload.vaults[0].items.length).toEqual(1);

        /* Login */
        const itemA1 = payload.vaults[0].items[0] as ItemImportIntent<'login'>;
        expect(itemA1.type).toEqual('login');
        expect(itemA1.metadata.name).toEqual('Entry A1');
        expect(itemA1.content.username).toEqual('nobodyA@proton.me');
        expect(itemA1.content.password).toEqual('proton123');
        expect(itemA1.content.urls[0]).toEqual('https://account.proton.me');
        expect(itemA1.metadata.note).toEqual('Entry A1 note');
        const totpUri = new URL(itemA1.content.totpUri).searchParams;
        expect(totpUri.get('secret')).toEqual('VZKDI2A4UP2NG5BB');

        /* Login */
        const itemD1 = payload.vaults[3].items[0] as ItemImportIntent<'login'>;
        expect(itemD1.type).toEqual('login');
        expect(itemD1.metadata.name).toEqual('Entry D1');
        expect(itemD1.content.username).toEqual('nobodyD@proton.me');
        expect(itemD1.content.password).toEqual('proton123');
    });
});
