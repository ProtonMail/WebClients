import fs from 'fs';

import type { ItemImportIntent } from '@proton/pass/types';

import type { ImportPayload } from '../types';
import { readDashlaneData } from './dashlane.reader';

describe('Import Dashlane ZIP', () => {
    let sourceData: ArrayBuffer;
    let payload: ImportPayload;

    beforeAll(async () => {
        sourceData = await fs.promises.readFile(__dirname + '/mocks/dashlane.zip');
        payload = await readDashlaneData(sourceData);
    });

    test('should throw on invalid file content', async () => {
        await expect(readDashlaneData(new ArrayBuffer(1))).rejects.toThrow();
    });

    it('should correctly parse items', () => {
        const [vaultData] = payload.vaults;
        expect(vaultData.items.length).toEqual(6);

        expect(payload.vaults.length).toEqual(1);
        expect(vaultData.type).toEqual('new');
        expect(vaultData.type === 'new' && vaultData.vaultName).not.toBeUndefined();

        const { items } = vaultData;

        /* Login item with multiple lines */
        const loginItem1 = items[0] as ItemImportIntent<'login'>;
        expect(loginItem1.type).toEqual('login');
        expect(loginItem1.metadata.note).toEqual('line 1\nline 2\nline 3');
        expect(loginItem1.content.username).toEqual('my name');
        expect(loginItem1.content.password).toEqual('pass');
        expect(loginItem1.content.urls.length).toEqual(0);
    });
});
