import type { KeyMetadata } from '@proton/account/addressKeys/getKeyMetadata';
import type { Key } from '@proton/shared/lib/interfaces';

export interface KeyPermissions {
    canExportPublicKey: boolean;
    canExportPrivateKey: boolean;
    canSetPrimary: boolean;
    canSetObsolete: boolean;
    canSetNotObsolete: boolean;
    canSetCompromised: boolean;
    canSetNotCompromised: boolean;
    canDelete: boolean;
}

export interface KeyActions {
    onDeleteKey: (id: string) => void;
    onExportPrivateKey: (id: string) => void;
    onExportPublicKey: (id: string) => void;
    onSetPrimary: (id: string) => void;
    onSetCompromised: (id: string) => void;
    onSetNotCompromised: (id: string) => void;
    onSetObsolete: (id: string) => void;
    onSetNotObsolete: (id: string) => void;
}

export enum KeyType {
    User,
    Address,
}

export interface KeyStatus {
    isAddressDisabled: boolean;
    isPrimary: boolean;
    /** if a v6 primary key is present, the v4 primary key is marked as "compatibility" */
    isPrimaryCompatibility: boolean;
    isDecrypted: boolean;
    isCompromised: boolean;
    isObsolete: boolean;
    isLoading: boolean;
    isWeak: boolean;
    isForwarding: boolean;
}

export interface KeyDisplay
    extends Pick<KeyMetadata<Key>, 'invalidKeyError' | 'creationDate' | 'fingerprint' | 'version' | 'algorithmInfos'> {
    type: KeyType;
    ID: string;
    flags: number;
    primary: 0 | 1;
    algorithm: string;
    status: KeyStatus;
    permissions: KeyPermissions;
}
