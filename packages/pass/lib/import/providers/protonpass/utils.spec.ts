import fs from 'fs';

import { ExportFormat } from '@proton/pass/lib/export/types';
import { getProtonPassImportPGPType } from '@proton/pass/lib/import/providers/protonpass/utils';

describe('Proton Pass import utils', () => {
    describe('`getProtonPassImportPGPType`', () => {
        test('Should detect raw PGP file', async () => {
            const json = JSON.stringify({});
            const encoder = new TextEncoder();
            const data = encoder.encode(json);

            const res = await getProtonPassImportPGPType(data);

            expect(res).toEqual(ExportFormat.JSON);
        });

        test('Should detect PGP encrypted zip files', async () => {
            const data = fs.readFileSync(__dirname + '/mocks/pgp-export.zip');
            const res = await getProtonPassImportPGPType(new Uint8Array(data));

            expect(res).toEqual(ExportFormat.ZIP);
        });
    });
});
