import { c } from 'ttag';

import { readKasperskyData } from '@proton/pass/lib/import/providers/kaspersky/kaspersky.reader';
import { readProtonPassCSV } from '@proton/pass/lib/import/providers/protonpass/protonpass.csv.reader';
import { transferableToFile } from '@proton/pass/utils/file/transferable-file';
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
import { type ImportPayload, ImportProvider, type ImportReaderPayload } from './types';

export const extractFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts[parts.length - 1];
};

export const isProtonPassEncryptedImport = (payload: ImportReaderPayload): boolean =>
    payload.provider === ImportProvider.PROTONPASS && extractFileExtension(payload.file.name) === 'pgp';

export const prepareImport = async (payload: ImportReaderPayload): Promise<ImportReaderPayload> =>
    isProtonPassEncryptedImport(payload) ? { ...payload, file: await decryptProtonPassImport(payload) } : payload;

export const fileReader = async (payload: ImportReaderPayload): Promise<ImportPayload> => {
    const file = transferableToFile(payload.file);
    const fileExtension = extractFileExtension(payload.file.name);

    switch (payload.provider) {
        case ImportProvider.BITWARDEN: {
            return readBitwardenData({ data: await file.text() });
        }

        case ImportProvider.BRAVE:
        case ImportProvider.CHROME:
        case ImportProvider.EDGE: {
            return readChromiumData({ data: await file.text() });
        }

        case ImportProvider.FIREFOX: {
            return readFirefoxData({ data: await file.text() });
        }

        case ImportProvider.KEEPASS: {
            return readKeePassData({ data: await file.text() });
        }

        case ImportProvider.LASTPASS: {
            return readLastPassData({ data: await file.text() });
        }

        case ImportProvider.ONEPASSWORD: {
            switch (fileExtension) {
                case '1pif':
                    return read1Password1PifData({ data: await file.text() });
                case '1pux':
                    return read1Password1PuxData({ data: await file.arrayBuffer() });
                default:
                    throw new Error(c('Error').t`Unsupported 1Password file format`);
            }
        }

        case ImportProvider.PROTONPASS: {
            switch (fileExtension) {
                case 'csv':
                    return readProtonPassCSV({ data: await file.text() });
                case 'pgp':
                case 'zip':
                    return readProtonPassZIP({
                        data: await file.arrayBuffer(),
                        userId: payload.userId,
                        currentAliases: payload.options?.currentAliases ?? [],
                    });
                default:
                    throw new Error(c('Error').t`Unsupported ${PASS_APP_NAME} file format`);
            }
        }

        case ImportProvider.CSV: {
            return readProtonPassCSV({ data: await file.text(), isGenericCSV: true });
        }

        case ImportProvider.DASHLANE: {
            switch (fileExtension) {
                case 'csv':
                    return readDashlaneDataCSV({ data: await file.text() });
                case 'zip':
                    return readDashlaneDataZIP({ data: await file.arrayBuffer() });
                default:
                    throw new Error(c('Error').t`Unsupported ${PASS_APP_NAME} file format`);
            }
        }

        case ImportProvider.SAFARI: {
            return readSafariData({ data: await file.text() });
        }

        case ImportProvider.KEEPER: {
            return readKeeperData({ data: await file.text() });
        }

        case ImportProvider.ROBOFORM: {
            return readRoboformData({ data: await file.text() });
        }

        case ImportProvider.NORDPASS: {
            return readNordPassData({ data: await file.text() });
        }

        case ImportProvider.ENPASS: {
            return readEnpassData({ data: await file.text() });
        }

        case ImportProvider.KASPERSKY: {
            return readKasperskyData({ data: await file.text() });
        }

        default:
            throw new Error(c('Error').t`Invalid password manager`);
    }
};
