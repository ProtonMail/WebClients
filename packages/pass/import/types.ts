import type { ItemImportIntent } from '../types';

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

export const ImportProviderValues = Object.values(ImportProvider).sort((a, b) => a.localeCompare(b));

export type ImportReaderPayload = {
    file: File;
    provider: ImportProvider;
    userId?: string;
    passphrase?: string;
};

/* type: 'existing' => import items to existing vault
 * type: 'new'      => import items to new vault */
export type ImportVault = (
    | {
          type: 'existing';
          shareId: string;
      }
    | { type: 'new' }
) & {
    items: ItemImportIntent[];
    vaultName: string;
    id: string;
};

export type ImportPayload = { vaults: ImportVault[]; ignored: string[]; warnings: string[] };
