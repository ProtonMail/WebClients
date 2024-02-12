import type { ItemType, Maybe, UnsafeItemRevision, VaultShareContent } from '@proton/pass/types';

export type ExportedItem<T extends ItemType = ItemType> = Omit<
    UnsafeItemRevision<T>,
    'revision' | 'revisionTime' | 'lastUseTime'
>;

export type ExportedCsvItem = {
    type: ItemType;
    name: string;
    url: Maybe<string>;
    username: Maybe<string>;
    password: Maybe<string>;
    note: Maybe<string>;
    totp: Maybe<string>;
    createTime: Maybe<string>;
    modifyTime: Maybe<string>;
};

export type ExportedVault = VaultShareContent & { items: ExportedItem[] };

export type ExportDataDefault = {
    encrypted: boolean;
    userId?: string;
    vaults: Record<string, ExportedVault>;
    version: string;
};

export type ExportData<T extends ExportFormat | undefined = undefined> = T extends ExportFormat.CSV
    ? string
    : T extends ExportFormat
      ? ExportDataDefault
      : string | ExportDataDefault;

export enum ExportFormat {
    DEFAULT = 'default',
    ENCRYPTED = 'encrypted',
    CSV = 'csv',
}

export const EXPORT_FORMAT_MAP: Record<ExportFormat, string> = {
    [ExportFormat.DEFAULT]: 'zip',
    [ExportFormat.ENCRYPTED]: 'pgp',
    [ExportFormat.CSV]: 'csv',
};

export type ExportOptions =
    | { format: ExportFormat.ENCRYPTED; passphrase: string }
    | { format: Exclude<ExportFormat, ExportFormat.ENCRYPTED> };

export type ExportFormValues = { format: ExportFormat; passphrase: string };
