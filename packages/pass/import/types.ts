import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { ItemImportIntent, MaybeNull } from '../types';

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
            fileExtension: 'zip, pgp',
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
    };

export const ImportProviderValues = Object.values(ImportProvider).sort((a, b) => a.localeCompare(b));

export type ImportReaderPayload = {
    file: File;
    provider: ImportProvider;
    userId?: string;
    passphrase?: string;
};

export type ImportVault = {
    shareId: MaybeNull<string> /* `shareId: null` => new vault */;
    name: string;
    items: ItemImportIntent[];
};

export type ImportPayload = { vaults: ImportVault[]; ignored: string[]; warnings: string[] };
