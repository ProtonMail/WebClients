import { c } from 'ttag';

import type { ItemImportIntent, MaybeNull } from '@proton/pass/types';
import type { TransferableFile } from '@proton/pass/utils/file/transferable-file';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export enum ImportProvider {
    BITWARDEN = 'bitwarden',
    BRAVE = 'brave',
    CHROME = 'chrome',
    EDGE = 'edge',
    FIREFOX = 'firefox',
    KEEPASS = 'keepass',
    LASTPASS = 'lastpass',
    ONEPASSWORD = '1password',
    PROTONPASS = 'protonpass',
    DASHLANE = 'dashlane',
    SAFARI = 'safari',
    KEEPER = 'keeper',
    ROBOFORM = 'roboform',
    NORDPASS = 'nordpass',
    ENPASS = 'enpass',
    KASPERSKY = 'kaspersky',
    CSV = 'csv',
}

export const PROVIDER_INFO_MAP: Record<ImportProvider, { title: string; fileExtension: string; tutorialUrl: string }> =
    {
        [ImportProvider.BITWARDEN]: {
            title: 'Bitwarden',
            fileExtension: 'json',
            tutorialUrl: 'https://proton.me/support/pass-import-bitwarden',
        },
        [ImportProvider.BRAVE]: {
            title: 'Brave',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-brave',
        },
        [ImportProvider.CHROME]: {
            title: 'Chrome',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-chrome',
        },
        [ImportProvider.EDGE]: {
            title: 'Edge',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-edge',
        },
        [ImportProvider.FIREFOX]: {
            title: 'Firefox',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-firefox',
        },
        [ImportProvider.KEEPASS]: {
            title: 'KeePass',
            fileExtension: 'xml',
            tutorialUrl: 'https://proton.me/support/pass-import-keepass',
        },
        [ImportProvider.LASTPASS]: {
            title: 'LastPass',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-lastpass',
        },
        [ImportProvider.ONEPASSWORD]: {
            title: '1Password',
            fileExtension: '1pux, 1pif',
            tutorialUrl: 'https://proton.me/support/pass-import-1password',
        },
        [ImportProvider.DASHLANE]: {
            title: 'Dashlane',
            fileExtension: 'zip, csv',
            tutorialUrl: 'https://proton.me/support/pass-import-dashlane',
        },
        [ImportProvider.PROTONPASS]: {
            title: PASS_APP_NAME,
            fileExtension: 'zip, pgp, csv',
            tutorialUrl: '',
        },
        [ImportProvider.SAFARI]: {
            title: 'Safari',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-safari',
        },
        [ImportProvider.KEEPER]: {
            title: 'Keeper',
            fileExtension: 'csv',
            tutorialUrl: 'https://proton.me/support/pass-import-keeper',
        },
        [ImportProvider.ROBOFORM]: {
            title: 'Roboform',
            fileExtension: 'csv',
            tutorialUrl: '',
        },
        [ImportProvider.NORDPASS]: {
            title: 'NordPass',
            fileExtension: 'csv',
            tutorialUrl: '',
        },
        [ImportProvider.ENPASS]: {
            title: 'Enpass',
            fileExtension: 'json',
            tutorialUrl: '',
        },
        [ImportProvider.KASPERSKY]: {
            title: 'Kaspersky',
            fileExtension: 'txt',
            tutorialUrl: '',
        },
        [ImportProvider.CSV]: {
            title: c('Label').t`Generic CSV`,
            fileExtension: 'csv',
            tutorialUrl: '',
        },
    };

/** Sort alphabetically, except for generic CSV which is last */
export const ImportProviderValues = Object.values(ImportProvider).sort((a, b) => {
    if (a === 'csv') return 1;
    if (b === 'csv') return -1;
    else return a.localeCompare(b);
});

export type ImportReaderPayload = {
    file: TransferableFile;
    provider: ImportProvider;
    userId?: string;
    passphrase?: string;
    options?: {
        importUsername?: boolean;
        currentAliases?: string[];
    };
};

export type ImportVault = {
    shareId: MaybeNull<string> /* `shareId: null` => new vault */;
    name: string;
    items: ItemImportIntent[];
};

export type ImportPayload = { vaults: ImportVault[]; ignored: string[]; warnings: string[] };
export type ImportDecryptPayload = { data: string; passphrase: string };
