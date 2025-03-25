import { c } from 'ttag';

import { ExportFormat } from '@proton/pass/lib/export/types';
import { readKasperskyData } from '@proton/pass/lib/import/providers/kaspersky/kaspersky.reader';
import { readProtonPassCSV } from '@proton/pass/lib/import/providers/protonpass/protonpass.csv.reader';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { read1Password1PifData } from './providers/1password/1pif.reader';
import { read1Password1PuxData } from './providers/1password/1pux.reader';
import { readBitwardenData } from './providers/bitwarden/bitwarden.reader';
import { readChromiumData } from './providers/chromium/chromium.reader';
import { readDashlaneDataCSV } from './providers/dashlane/dashlane.csv.reader';
import { readDashlaneDataZIP } from './providers/dashlane/dashlane.zip.reader';
import { readEnpassData } from './providers/enpass/enpass.reader';
import { readFirefoxData } from './providers/firefox/firefox.reader';
import { readKeePassData } from './providers/keepass/keepass.reader';
import { readKeeperData } from './providers/keeper/keeper.reader';
import { readLastPassData } from './providers/lastpass/lastpass.reader';
import { readNordPassData } from './providers/nordpass/nordpass.reader';
import { decryptProtonPassImport, readProtonPassZIP } from './providers/protonpass/protonpass.zip.reader';
import { readRoboformData } from './providers/roboform/roboform.reader';
import { readSafariData } from './providers/safari/safari.reader';
import type { ImportReaderResult } from './types';
import { ImportProvider, type ImportReaderPayload } from './types';

export const extractFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts[parts.length - 1];
};

export const importReader = async (payload: ImportReaderPayload): Promise<ImportReaderResult> => {
    const file = payload.file;
    const fileExtension = extractFileExtension(payload.file.name);

    switch (payload.provider) {
        case ImportProvider.BITWARDEN:
            return readBitwardenData(file);

        case ImportProvider.BRAVE:
        case ImportProvider.CHROME:
        case ImportProvider.EDGE:
            return readChromiumData(file);

        case ImportProvider.FIREFOX:
            return readFirefoxData(file);

        case ImportProvider.KEEPASS:
            return readKeePassData(file);

        case ImportProvider.LASTPASS:
            return readLastPassData(file);

        case ImportProvider.ONEPASSWORD:
            switch (fileExtension) {
                case '1pif':
                    return read1Password1PifData(file);
                case '1pux':
                    return read1Password1PuxData(file);
                default:
                    throw new Error(c('Error').t`Unsupported 1Password file format`);
            }

        case ImportProvider.PROTONPASS:
            const { passphrase, options, userId } = payload;
            const { currentAliases = [] } = options ?? {};

            switch (fileExtension) {
                case ExportFormat.CSV:
                    return readProtonPassCSV(file);
                case ExportFormat.PGP:
                    const decrypted = await decryptProtonPassImport(file, passphrase);
                    /** Legacy format: the whole ZIP file has been PGP encrypted.
                     * Decrypt it via the `prepare` function and extract the zip */
                    const zip = new File([decrypted], 'data.zip');
                    return readProtonPassZIP(zip, { userId, currentAliases });

                case ExportFormat.ZIP:
                    return readProtonPassZIP(file, { userId, currentAliases, passphrase });
                default:
                    throw new Error(c('Error').t`Unsupported ${PASS_APP_NAME} file format`);
            }

        case ImportProvider.CSV:
            return readProtonPassCSV(file, true);

        case ImportProvider.DASHLANE:
            switch (fileExtension) {
                case 'csv':
                    return readDashlaneDataCSV(file);
                case 'zip':
                    return readDashlaneDataZIP(file);
                default:
                    throw new Error(c('Error').t`Unsupported ${PASS_APP_NAME} file format`);
            }

        case ImportProvider.SAFARI:
            return readSafariData(file);

        case ImportProvider.KEEPER:
            return readKeeperData(file);

        case ImportProvider.ROBOFORM:
            return readRoboformData(file);

        case ImportProvider.NORDPASS:
            return readNordPassData(file);

        case ImportProvider.ENPASS:
            return readEnpassData(file);

        case ImportProvider.KASPERSKY:
            return readKasperskyData(file);

        default:
            throw new Error(c('Error').t`Invalid password manager`);
    }
};
