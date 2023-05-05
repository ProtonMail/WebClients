import { c } from 'ttag';

import { read1Password1PuxData } from './providers/1password.reader.1pux';
import { readBitwardenData } from './providers/bitwarden.reader';
import { readChromiumData } from './providers/chromium.reader';
import { readKeePassData } from './providers/keepass.reader';
import { readLastPassData } from './providers/lastpass.reader';
import { readProtonPassData } from './providers/protonpass.reader';
import { type ImportPayload, ImportProvider, type ImportReaderPayload } from './types';

export const fileReader = async (payload: ImportReaderPayload): Promise<ImportPayload> => {
    switch (payload.provider) {
        case ImportProvider.BITWARDEN:
            return readBitwardenData(await payload.file.text());
        case ImportProvider.BRAVE:
        case ImportProvider.CHROME:
        case ImportProvider.EDGE:
            return readChromiumData(await payload.file.text());
        case ImportProvider.KEEPASS:
            return readKeePassData(await payload.file.text());
        case ImportProvider.LASTPASS:
            return readLastPassData(await payload.file.text());
        case ImportProvider.ONEPASSWORD:
            return read1Password1PuxData(await payload.file.arrayBuffer());
        case ImportProvider.PROTONPASS:
            return readProtonPassData({ data: await payload.file.arrayBuffer(), encrypted: false });
        case ImportProvider.PROTONPASS_PGP:
            return readProtonPassData({
                data: await payload.file.text(),
                encrypted: true,
                passphrase: payload.passphrase,
            });
        default:
            throw new Error(c('Error').t`Invalid provider`);
    }
};
