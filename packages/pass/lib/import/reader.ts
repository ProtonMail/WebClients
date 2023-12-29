import { c } from 'ttag';

import { transferableToFile } from '@proton/pass/utils/file/transferable-file';

import { read1Password1PifData } from './providers/1password.reader.1pif';
import { read1Password1PuxData } from './providers/1password.reader.1pux';
import { readBitwardenData } from './providers/bitwarden.reader';
import { readChromiumData } from './providers/chromium.reader';
import { readDashlaneData } from './providers/dashlane.reader';
import { readEnpassData } from './providers/enpass.reader';
import { readFirefoxData } from './providers/firefox.reader';
import { readKeePassData } from './providers/keepass.reader';
import { readKeeperData } from './providers/keeper.reader';
import { readLastPassData } from './providers/lastpass.reader';
import { readNordPassData } from './providers/nordpass.reader';
import { decryptProtonPassImport, readProtonPassData } from './providers/protonpass.reader';
import { readRoboformData } from './providers/roboform.reader';
import { readSafariData } from './providers/safari.reader';
import { type ImportPayload, ImportProvider, type ImportReaderPayload } from './types';

export const extractFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts[parts.length - 1];
};

export const prepareImport = async (payload: ImportReaderPayload): Promise<ImportReaderPayload> => {
    switch (payload.provider) {
        case ImportProvider.PROTONPASS: {
            const fileExtension = extractFileExtension(payload.file.name);
            if (fileExtension === 'pgp') return { ...payload, file: await decryptProtonPassImport(payload) };
        }
        default:
            return payload;
    }
};

export const fileReader = async (payload: ImportReaderPayload): Promise<ImportPayload> => {
    const file = transferableToFile(payload.file);
    const fileExtension = extractFileExtension(payload.file.name);

    switch (payload.provider) {
        case ImportProvider.BITWARDEN: {
            return readBitwardenData(await file.text());
        }

        case ImportProvider.BRAVE:
        case ImportProvider.CHROME:
        case ImportProvider.EDGE: {
            return readChromiumData(await file.text());
        }

        case ImportProvider.FIREFOX: {
            return readFirefoxData(await file.text());
        }

        case ImportProvider.KEEPASS: {
            return readKeePassData(await file.text());
        }

        case ImportProvider.LASTPASS: {
            return readLastPassData(await file.text());
        }

        case ImportProvider.ONEPASSWORD: {
            switch (fileExtension) {
                case '1pif':
                    return read1Password1PifData(await file.text());
                case '1pux':
                    return read1Password1PuxData(await file.arrayBuffer());
                default:
                    throw new Error(c('Error').t`Unsupported 1Password file format`);
            }
        }

        case ImportProvider.PROTONPASS: {
            return readProtonPassData({
                data: await file.arrayBuffer(),
                userId: payload.userId,
            });
        }

        case ImportProvider.DASHLANE: {
            return readDashlaneData(await file.arrayBuffer());
        }

        case ImportProvider.SAFARI: {
            return readSafariData(await file.text());
        }

        case ImportProvider.KEEPER: {
            return readKeeperData(await file.text());
        }

        case ImportProvider.ROBOFORM: {
            return readRoboformData(await file.text());
        }

        case ImportProvider.NORDPASS: {
            return readNordPassData(await file.text());
        }

        case ImportProvider.ENPASS: {
            return readEnpassData(await file.text());
        }

        default:
            throw new Error(c('Error').t`Invalid password manager`);
    }
};
