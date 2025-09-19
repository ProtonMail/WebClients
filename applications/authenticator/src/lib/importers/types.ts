import type { MaybeArray } from '@proton/pass/types';

export enum ImportProvider {
    TWOFAS = '2FAS',
    AEGIS = 'Aegis',
    BITWARDEN = 'Bitwarden',
    ENTE = 'Ente',
    LAST_PASS = 'LastPass',
    GOOGLE = 'Google',
    PROTON_AUTHENTICATOR = 'Proton Authenticator',
    PROTON_PASS = 'Proton Pass',
    MICROSOFT = 'Microsoft',
    AUTHY = 'Authy',
}

export const ImportProviderValues: ImportProvider[] = Object.values(ImportProvider).sort((a, b) => a.localeCompare(b));
export const UnsupportedImportProviders: ImportProvider[] = [ImportProvider.AUTHY, ImportProvider.MICROSOFT];

type ImportProviderOptions = { extensions: string[]; multiple?: boolean };

export const SUPPORTED_IMPORTERS: Partial<Record<ImportProvider, ImportProviderOptions>> = {
    [ImportProvider.TWOFAS]: { extensions: ['2fas'] },
    [ImportProvider.AEGIS]: { extensions: ['txt', 'json'] },
    [ImportProvider.BITWARDEN]: { extensions: ['csv', 'json'] },
    [ImportProvider.ENTE]: { extensions: ['txt'] },
    [ImportProvider.LAST_PASS]: { extensions: ['json'] },
    [ImportProvider.GOOGLE]: { extensions: ['png', 'jpg', 'jpeg'], multiple: true },
    [ImportProvider.PROTON_AUTHENTICATOR]: { extensions: ['json'] },
    [ImportProvider.PROTON_PASS]: { extensions: ['zip'] },
};

export type ImportDTO = { provider: ImportProvider; password?: string; path?: MaybeArray<string> };
export type ImportResultDTO = { passwordRequired: true; path: MaybeArray<string> };
