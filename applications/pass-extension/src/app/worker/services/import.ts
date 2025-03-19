import { c } from 'ttag';

import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { decryptProtonPassImport } from '@proton/pass/lib/import/providers/protonpass/protonpass.zip.reader';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

export const createImportService = () => {
    WorkerMessageBroker.registerMessage(WorkerMessageType.IMPORT_DECRYPT, async ({ payload }) => {
        const { filename } = payload;
        /** Read the encrypted import file that was stored
         * before sending this `IMPORT_DECRYPT` message */
        const encryptedFile = await fileStorage.readFile(filename);
        if (!encryptedFile) throw new Error(c('Error').t`Could not find file to import.`);

        /** Overwrite the encrypted file with the decrypted data */
        const decryptedFile = await decryptProtonPassImport(encryptedFile, payload.passphrase);
        await fileStorage.writeFile(filename, new Blob([decryptedFile]));

        return true;
    });

    return {};
};

export type ImportService = ReturnType<typeof createImportService>;
