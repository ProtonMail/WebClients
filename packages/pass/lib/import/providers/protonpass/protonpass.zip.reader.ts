import { decryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { archivePath } from '@proton/pass/lib/export/archive';
import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import { readZIP } from '@proton/pass/lib/import/helpers/zip.reader';
import { readProtonPassJSON } from '@proton/pass/lib/import/providers/protonpass/protonpass.json.reader';
import type { ImportReaderResult } from '@proton/pass/lib/import/types';
import { logger } from '@proton/pass/utils/logger';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type ProtonPassReaderPayload = {
    /** list of current email aliases so we don't import
     * them again if they are present in the data file,
     * otherwise BE will throw an error. */
    currentAliases: string[];
    passphrase?: string;
    userId?: string;
    onPassphrase: () => Promise<string>;
};

export const readProtonPassZIP = async (file: File, payload: ProtonPassReaderPayload): Promise<ImportReaderResult> => {
    try {
        const fileReader = await readZIP(file);

        const exportData = await (async () => {
            if (fileReader.files.has(archivePath('data.pgp'))) {
                const passphrase = await payload.onPassphrase();
                const encrypted = (await fileReader.getFile(archivePath('data.pgp')))!;
                const armored = await encrypted.text();
                const decrypted = await decryptPassExport(armored, passphrase);
                const decoder = new TextDecoder();
                return decoder.decode(decrypted);
            }

            if (fileReader.files.has(archivePath('data.json'))) {
                const data = (await fileReader.getFile(archivePath('data.json')))!;
                return data.text();
            }

            return '';
        })();

        return {
            ...readProtonPassJSON(exportData, payload, true),
            fileReader,
        };
    } catch (e) {
        logger.warn('[Importer::Proton]', e);
        throw new ImportProviderError(PASS_APP_NAME, e);
    }
};
