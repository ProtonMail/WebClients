import { c } from 'ttag';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { read1Password1PifData } from './providers/1password.reader.1pif';
import { read1Password1PuxData } from './providers/1password.reader.1pux';
import { readBitwardenData } from './providers/bitwarden.reader';
import { readChromiumData } from './providers/chromium.reader';
import { readDashlaneData } from './providers/dashlane.reader';
import { readFirefoxData } from './providers/firefox.reader';
import { readKeePassData } from './providers/keepass.reader';
import { readKeeperData } from './providers/keeper.reader';
import { readLastPassData } from './providers/lastpass.reader';
import { readProtonPassData } from './providers/protonpass.reader';
import { readSafariData } from './providers/safari.reader';
import { type ImportPayload, ImportProvider, type ImportReaderPayload } from './types';

export const extractFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts[parts.length - 1];
};

export const fileReader = async (payload: ImportReaderPayload): Promise<ImportPayload> => {
    const fileExtension = extractFileExtension(payload.file.name);

    switch (payload.provider) {
        case ImportProvider.BITWARDEN: {
            return readBitwardenData(await payload.file.text());
        }

        case ImportProvider.BRAVE:
        case ImportProvider.CHROME:
        case ImportProvider.EDGE: {
            return readChromiumData(await payload.file.text());
        }

        case ImportProvider.FIREFOX: {
            return readFirefoxData(await payload.file.text());
        }

        case ImportProvider.KEEPASS: {
            return readKeePassData(await payload.file.text());
        }

        case ImportProvider.LASTPASS: {
            return readLastPassData(await payload.file.text());
        }

        case ImportProvider.ONEPASSWORD: {
            switch (fileExtension) {
                case '1pif':
                    return read1Password1PifData(await payload.file.text());
                case '1pux':
                    return read1Password1PuxData(await payload.file.arrayBuffer());
                default:
                    throw new Error(c('Error').t`Unsupported 1Password file format`);
            }
        }

        case ImportProvider.PROTONPASS: {
            switch (fileExtension) {
                case 'zip':
                    return readProtonPassData({
                        data: await payload.file.arrayBuffer(),
                        encrypted: false,
                        userId: payload.userId,
                    });
                case 'pgp':
                    return readProtonPassData({
                        data: await payload.file.text(),
                        encrypted: true,
                        userId: payload.userId,
                        passphrase: payload.passphrase ?? '',
                    });
                default:
                    throw new Error(c('Error').t`Unsupported ${PASS_APP_NAME} file format`);
            }
        }

        case ImportProvider.DASHLANE: {
            return readDashlaneData(await payload.file.arrayBuffer());
        }

        case ImportProvider.SAFARI: {
            return readSafariData(await payload.file.text());
        }

        case ImportProvider.KEEPER: {
            return readKeeperData(await payload.file.text());
        }

        default:
            throw new Error(c('Error').t`Invalid provider`);
    }
};
