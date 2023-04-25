import { ItemImportIntent } from '../types';

export enum ImportProvider {
    BITWARDEN = 'bitwarden',
    CHROME = 'chrome',
    LASTPASS = 'lastpass',
    ONEPASSWORD = '1password',
    PROTONPASS = 'protonpass',
    PROTONPASS_PGP = 'protonpass-pgp',
}

export type ImportReaderPayload = {
    file: File;
} & (
    | { provider: Exclude<ImportProvider, ImportProvider.PROTONPASS_PGP> }
    | { provider: ImportProvider.PROTONPASS_PGP; passphrase: string }
);

/**
 * type: 'existing' => import items to existing vault
 * type: 'new'      => import items to new vault
 */
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

export type ImportPayload = { vaults: ImportVault[]; ignored: string[] };
