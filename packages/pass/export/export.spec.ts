import JSZip from 'jszip';

import { CryptoProxy } from '@proton/crypto';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../crypto/utils/testing';
import { CONTENT_FORMAT_VERSION, ItemState } from '../types';
import { getEpoch } from '../utils/time';
import { createExportZip, encryptZip } from './export';
import type { ExportPayload } from './types';

const EXPORT_TEST_VAULT_ID = 'vault-share-id';

const EXPORT_TEST_PAYLOAD: ExportPayload = {
    version: '5.0.0.99',
    encrypted: true,
    vaults: {
        [EXPORT_TEST_VAULT_ID]: {
            name: 'Default vault',
            description: 'This is my super secret test vault',
            display: {},
            items: [
                {
                    itemId: `itemId-${Math.random()}`,
                    shareId: `shareId-${Math.random()}`,
                    state: ItemState.Active,
                    data: {
                        type: 'note',
                        metadata: {
                            name: 'Note',
                            note: 'This is a test note',
                            itemUuid: 'r4nd0mUUID',
                        },
                        content: {},
                        platformSpecific: {},
                        extraFields: [],
                    },
                    contentFormatVersion: CONTENT_FORMAT_VERSION,
                    aliasEmail: null,
                    createTime: getEpoch(),
                    modifyTime: getEpoch() + 100,
                },
            ],
        },
    },
};
const EXPORT_TEST_PASSPHRASE = 'p4ssphr4se';

describe('Pass export', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('createExportZip should build unencrypted zip', async () => {
        const zip = await createExportZip(EXPORT_TEST_PAYLOAD);
        const unzip = await JSZip.loadAsync(zip);

        expect(unzip.file('export.json')).not.toBe(undefined);

        const rawData = await unzip.file(`${PASS_APP_NAME}/data.json`)?.async('string');
        const data = JSON.parse(rawData!);

        expect(data.version).toEqual(EXPORT_TEST_PAYLOAD.version);
        expect(data.vaults).toEqual(EXPORT_TEST_PAYLOAD.vaults);
    });

    test('encryptZip should encrypt zip file to binary format', async () => {
        const uint8Zip = crypto.getRandomValues(new Uint8Array(32));
        const armoredMessage = await encryptZip(uint8Zip, EXPORT_TEST_PASSPHRASE);

        const decrypted = await CryptoProxy.decryptMessage({
            armoredMessage,
            passwords: [EXPORT_TEST_PASSPHRASE],
            format: 'binary',
        });

        expect(decrypted.data.toString()).toEqual(uint8Zip.toString());
    });
});
