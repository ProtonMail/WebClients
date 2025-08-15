import { c } from 'ttag';

import { decryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { ExportFormat } from '@proton/pass/lib/export/types';
import { ImportReaderError } from '@proton/pass/lib/import/helpers/error';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getProtonPassImportPGPType = async (buffer: Uint8Array<ArrayBuffer>): Promise<ExportFormat> => {
    const head = buffer.slice(0, 5);
    if (new TextDecoder().decode(head).startsWith('{')) return ExportFormat.JSON;
    else return ExportFormat.ZIP;
};

export const decryptProtonPassImport = async (file: File, passphrase?: string): Promise<Uint8Array<ArrayBuffer>> => {
    try {
        return await decryptPassExport(await file.text(), passphrase ?? '');
    } catch (err: unknown) {
        if (err instanceof Error) {
            const errorDetail = err.message.includes('Error decrypting message')
                ? c('Error').t`Passphrase is incorrect`
                : c('Error').t`File could not be parsed`;

            throw new ImportReaderError(
                c('Error').t`Decrypting your ${PASS_APP_NAME} export file failed. ${errorDetail}`
            );
        }

        throw err;
    }
};
